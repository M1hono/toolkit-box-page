/**
 * @fileoverview Sync Story Avatars to R2
 * @description Download operator avatar PNGs for story tracker and upload to arknights/avatars/
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const R2_CONFIG = require("../r2-config.cjs");
const PROJECT_CONFIG = require("../project-config.cjs");
const { ensureDir } = require("../shared/file-utils.cjs");
const { getStoryAvatarKey } = require("./r2-path-manager.cjs");
const { loadUploaded, saveUploaded, loadFailures, saveFailures, getLogPaths } = require("./upload-tracker.cjs");

const WORK_TYPE = 'story-avatars';

const client = new S3Client({
    region: "auto",
    endpoint: R2_CONFIG.R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_CONFIG.R2_ACCESS_KEY_ID,
        secretAccessKey: R2_CONFIG.R2_SECRET_ACCESS_KEY,
    },
});

const AVATAR_SOURCE_URL = "https://raw.githubusercontent.com/akgcc/arkdata/refs/heads/main/assets/torappu/dynamicassets/arts/charavatars";

/**
 * Discover operator IDs from story_variables.json
 */
async function discoverOperators() {
    const operators = new Set();
    const languages = PROJECT_CONFIG.GAMES.arknights.supported_langs;
    
    for (const lang of languages) {
        try {
            const dataUrl = PROJECT_CONFIG.getArknightsDataUrl(lang);
            const response = await axios.get(`${dataUrl}/gamedata/story/story_variables.json`, { timeout: 30000 });
            const variables = response.data;
            
            for (const key in variables) {
                if (key.startsWith('avatar_')) {
                    const charId = variables[key];
                    if (charId && !charId.includes('#') && !charId.includes('$')) {
                        operators.add(charId.toLowerCase());
                    }
                }
            }
        } catch (error) {
            console.warn(`Failed to load story variables for ${lang}: ${error.message}`);
        }
    }
    
    return Array.from(operators);
}

/**
 * Sync single story avatar
 */
async function syncStoryAvatar(charId, cacheDir, uploadedFiles, failures) {
    const sourceUrl = `${AVATAR_SOURCE_URL}/${encodeURIComponent(charId)}.png`;
    const r2Key = getStoryAvatarKey(charId, false);
    const localFile = path.join(cacheDir, `${charId}.png`);

    try {
        // Check if already processed
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
            // Doesn't exist, continue
        }

        // Download
        if (!fs.existsSync(localFile)) {
            const response = await axios.get(sourceUrl, { responseType: "arraybuffer", timeout: 30000 });
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

        uploadedFiles[r2Key] = { status: 'uploaded', timestamp: Date.now(), charId: charId };
        return 'uploaded';
    } catch (error) {
        // Skip 404s (avatar doesn't exist in source)
        if (error.response?.status === 404 || error.message.includes('404')) {
            uploadedFiles[r2Key] = { status: 'skipped', timestamp: Date.now(), reason: '404' };
            return 'skipped';
        }
        console.error(`Failed: ${charId} - ${error.message}`);
        failures.uploadFailures.push({ key: r2Key, charId: charId, error: error.message, timestamp: Date.now() });
        uploadedFiles[r2Key] = { status: 'failed', timestamp: Date.now(), error: error.message };
        return 'failed';
    }
}

/**
 * Main function with parallel wave processing
 */
async function main() {
    console.log("Starting story avatar sync with parallel processing...\n");

    const uploadedFiles = loadUploaded(WORK_TYPE);
    const failures = loadFailures(WORK_TYPE);
    
    const operators = await discoverOperators();
    const cacheDir = path.resolve(__dirname, "../../.cache/story-avatars");
    ensureDir(cacheDir);

    console.log(`Scan complete: ${operators.length} story avatars\n`);

    const BATCH_SIZE = 20;
    const MAX_UPLOADS_PER_WAVE = 200;
    const MAX_UPLOADS_PER_RUN = 500;
    const WAVE_DELAY = 1000;
    
    let totalUploaded = 0, totalSkipped = 0, totalFailed = 0;
    let waveNumber = 1;
    let uploadedInWave = 0;

    for (let i = 0; i < operators.length; i += BATCH_SIZE) {
        // Stop if reached max uploads for this run
        if (totalUploaded >= MAX_UPLOADS_PER_RUN) {
            console.log(`\nReached max upload limit (${MAX_UPLOADS_PER_RUN}), stopping`);
            console.log(`Remaining: ${operators.length - i} avatars`);
            break;
        }

        const batch = operators.slice(i, i + BATCH_SIZE);
        
        // Process batch in parallel
        const results = await Promise.all(
            batch.map(charId => syncStoryAvatar(charId, cacheDir, uploadedFiles, failures))
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
        if (uploadedInWave >= MAX_UPLOADS_PER_WAVE && i + BATCH_SIZE < operators.length && totalUploaded < MAX_UPLOADS_PER_RUN) {
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