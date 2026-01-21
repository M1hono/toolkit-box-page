/**
 * @fileoverview Sync Character Variant Images to R2
 * @description Download character variant PNGs and upload to arknights/characters/
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const R2_CONFIG = require("../r2-config.cjs");
const { ensureDir } = require("../shared/file-utils.cjs");
const { getCharacterVariantKey } = require("./r2-path-manager.cjs");
const { loadUploaded, saveUploaded, loadFailures, saveFailures, getLogPaths } = require("./upload-tracker.cjs");

const WORK_TYPE = 'characters';

const client = new S3Client({
    region: "auto",
    endpoint: R2_CONFIG.R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_CONFIG.R2_ACCESS_KEY_ID,
        secretAccessKey: R2_CONFIG.R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Load characters from characters.json
 */
function loadCharacters() {
    const globalCharPath = path.resolve(__dirname, "../../src/public/data/global/arknights/characters.json");
    if (!fs.existsSync(globalCharPath)) {
        console.error("characters.json not found");
        return {};
    }
    return JSON.parse(fs.readFileSync(globalCharPath, "utf8"));
}

/**
 * Sync single character variant
 */
async function syncCharacterVariant(variant, cacheDir, uploadedFiles, failures) {
    const variantLower = variant.toLowerCase();
    const encodedVariant = encodeURIComponent(variantLower);
    const sourceUrl = `${R2_CONFIG.SOURCE_BASE_URL}${encodedVariant}.png`;
    const backupUrl = `${R2_CONFIG.BACKUP_SOURCE_URL}${encodedVariant}.png`;
    
    const r2Key = getCharacterVariantKey(variantLower);
    const localFile = path.join(cacheDir, `${variantLower}.png`);

    try {
        // Check if already processed in this work type
        if (uploadedFiles[r2Key] && uploadedFiles[r2Key].status === 'uploaded') {
            return 'skipped';
        }

        // Check if exists in R2
        try {
            await client.send(new HeadObjectCommand({
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Key: r2Key,
            }));
            uploadedFiles[r2Key] = { status: 'skipped', timestamp: Date.now() };
            return 'skipped';
        } catch (e) {
            // Doesn't exist, continue to upload
        }

        // Download
        if (!fs.existsSync(localFile)) {
            let response;
            try {
                response = await axios.get(sourceUrl, { responseType: "arraybuffer", timeout: 30000 });
            } catch (err) {
                response = await axios.get(backupUrl, { responseType: "arraybuffer", timeout: 30000 });
            }
            fs.writeFileSync(localFile, Buffer.from(response.data));
        }

        // Upload
        const fileContent = fs.readFileSync(localFile);
        await client.send(
            new PutObjectCommand({
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Key: r2Key,
                Body: fileContent,
                ContentType: "image/png",
            })
        );

        uploadedFiles[r2Key] = { status: 'uploaded', timestamp: Date.now(), variant: variantLower };
        return 'uploaded';
    } catch (error) {
        // Skip 404s (variant doesn't exist in source)
        if (error.response?.status === 404 || error.message.includes('404')) {
            uploadedFiles[r2Key] = { status: 'skipped', timestamp: Date.now(), reason: '404' };
            return 'skipped';
        }
        console.error(`Failed: ${variantLower} - ${error.message}`);
        failures.uploadFailures.push({ key: r2Key, variant: variantLower, error: error.message, timestamp: Date.now() });
        uploadedFiles[r2Key] = { status: 'failed', timestamp: Date.now(), error: error.message };
        return 'failed';
    }
}

/**
 * Filter out already processed variants
 */
function filterUnprocessedVariants(allVariants, uploadedFiles) {
    const unprocessed = [];
    const processed = { uploaded: 0, skipped: 0, failed: 0 };

    for (const variant of allVariants) {
        const variantLower = variant.toLowerCase();
        const r2Key = getCharacterVariantKey(variantLower);
        
        if (uploadedFiles[r2Key]) {
            const status = uploadedFiles[r2Key].status;
            if (status === 'uploaded') processed.uploaded++;
            else if (status === 'skipped') processed.skipped++;
            else if (status === 'failed') processed.failed++;
        } else {
            unprocessed.push(variant);
        }
    }

    return { unprocessed, processed };
}

/**
 * Main function with smart filtering and fast processing
 */
async function main() {
    console.log("Starting character variant sync with smart filtering...\n");

    const uploadedFiles = loadUploaded(WORK_TYPE);
    const failures = loadFailures(WORK_TYPE);
    
    const characters = loadCharacters();
    const cacheDir = path.resolve(__dirname, "../../.cache/characters");
    ensureDir(cacheDir);

    const allVariants = [];
    Object.values(characters).forEach(char => {
        if (char.validVariants && char.validVariants.length > 0) {
            allVariants.push(...char.validVariants);
        }
    });

    const { unprocessed, processed } = filterUnprocessedVariants(allVariants, uploadedFiles);
    
    console.log(`Total variants: ${allVariants.length}`);
    console.log(`Already processed: ${processed.uploaded + processed.skipped + processed.failed} (uploaded: ${processed.uploaded}, skipped: ${processed.skipped}, failed: ${processed.failed})`);
    console.log(`Remaining to process: ${unprocessed.length}\n`);

    if (unprocessed.length === 0) {
        console.log("🎉 All character variants are already processed!");
        return;
    }

    // Optimized batch size for efficiency vs stability
    const BATCH_SIZE = 15; // Increased for better throughput
    const MAX_UPLOADS_PER_WAVE = 100;
    const MAX_UPLOADS_PER_RUN = 150; // Slightly increased since waves are more efficient
    const WAVE_DELAY = 1000; // Reduced delay since batches are larger
    
    let totalUploaded = 0, totalSkipped = 0, totalFailed = 0;
    let waveNumber = 1;
    let uploadedInWave = 0;

    for (let i = 0; i < unprocessed.length; i += BATCH_SIZE) {
        // Stop if reached max uploads for this run
        if (totalUploaded >= MAX_UPLOADS_PER_RUN) {
            console.log(`\nReached max upload limit (${MAX_UPLOADS_PER_RUN}), stopping`);
            console.log(`Remaining: ${unprocessed.length - i} variants`);
            break;
        }

        const batch = unprocessed.slice(i, i + BATCH_SIZE);
        
        // Process batch in parallel
        const results = await Promise.all(
            batch.map(variant => syncCharacterVariant(variant, cacheDir, uploadedFiles, failures))
        );
        
        // Save logs after each batch
        saveUploaded(WORK_TYPE, uploadedFiles);
        saveFailures(WORK_TYPE, failures);
        
        // Count results (failed counts towards wave limit, only skipped doesn't)
        results.forEach(result => {
            if (result === 'uploaded') {
                totalUploaded++;
                uploadedInWave++;
            } else if (result === 'skipped') {
                totalSkipped++;
            } else {
                totalFailed++;
                uploadedInWave++; // Failed also counts towards wave
            }
        });

        const uploaded = results.filter(r => r === 'uploaded').length;
        const skipped = results.filter(r => r === 'skipped').length;
        const failed = results.filter(r => r === 'failed').length;
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);

        // Check if wave limit reached (only count uploads)
        if (uploadedInWave >= MAX_UPLOADS_PER_WAVE && i + BATCH_SIZE < unprocessed.length && totalUploaded < MAX_UPLOADS_PER_RUN) {
            console.log(`\nWave ${waveNumber} complete: ${uploadedInWave} uploads`);
            console.log(`Waiting ${WAVE_DELAY}ms before next wave...\n`);
            await new Promise(resolve => setTimeout(resolve, WAVE_DELAY));
            waveNumber++;
            uploadedInWave = 0;
        }
    }

    // Final save
    saveUploaded(WORK_TYPE, uploadedFiles);
    saveFailures(WORK_TYPE, failures);

    console.log(`\nAll waves complete!`);
    console.log(`  Waves: ${waveNumber}`);
    console.log(`  Uploaded: ${totalUploaded}`);
    console.log(`  Skipped: ${totalSkipped}`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`\nLogs saved to:`);
    const logs = getLogPaths(WORK_TYPE);
    console.log(`  Uploaded: ${path.basename(logs.uploaded)}`);
    console.log(`  Failures: ${path.basename(logs.failures)}`);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };