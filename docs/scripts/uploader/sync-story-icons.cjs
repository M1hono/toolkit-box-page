/**
 * @fileoverview Sync Story Icons and Banners to R2
 * @description Download story icons and banners and upload to arknights/icons/ and arknights/banners/
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const R2_CONFIG = require("../r2-config.cjs");
const PROJECT_CONFIG = require("../project-config.cjs");
const { ensureDir } = require("../shared/file-utils.cjs");
const { getStoryIconKey, getStoryBannerKey } = require("./r2-path-manager.cjs");
const { loadUploaded, saveUploaded, loadFailures, saveFailures, getLogPaths } = require("./upload-tracker.cjs");

const WORK_TYPE = 'story-icons';

const client = new S3Client({
    region: "auto",
    endpoint: R2_CONFIG.R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_CONFIG.R2_ACCESS_KEY_ID,
        secretAccessKey: R2_CONFIG.R2_SECRET_ACCESS_KEY,
    },
});

const SOURCE_BASE_URL = "https://r2.m31ns.top";

/**
 * Discover icons and banners from story_review_table.json
 */
async function discoverStoryAssets() {
    const icons = new Set();
    const banners = new Set();
    const languages = PROJECT_CONFIG.GAMES.arknights.supported_langs;
    
    for (const lang of languages) {
        try {
            const dataUrl = PROJECT_CONFIG.getArknightsDataUrl(lang);
            const response = await axios.get(`${dataUrl}/gamedata/excel/story_review_table.json`, { timeout: 30000 });
            const storyReview = response.data;

            for (const [actId, actData] of Object.entries(storyReview)) {
                if (!actData?.infoUnlockDatas) continue;

                // Banners for activities
                if (actId.startsWith("act")) {
                    // Special case: act1 -> 1stact
                    if (actId === "act1") {
                        banners.add("1stact");
                    } else {
                        banners.add(actId);
                    }
                } else if (actId === "1stact") {
                    banners.add("1stact");
                }

                // Icons for main stories
                if (actId.startsWith("main_")) {
                    const chapterMatch = actId.match(/main_(\d+)/);
                    if (chapterMatch) {
                        const chapterNum = parseInt(chapterMatch[1], 10);
                        icons.add(`main_${chapterNum}`);
                    }
                }

                // Generic icons for other types
                if (!actId.startsWith("story_") && !actId.startsWith("main_") && !actId.startsWith("act") && actId !== "1stact") {
                    icons.add(actId);
                }
            }
        } catch (error) {
            console.warn(`Failed to load story data for ${lang}: ${error.message}`);
        }
    }
    
    // Add fallback icons
    icons.add("404");
    icons.add("default");
    
    return { icons: Array.from(icons), banners: Array.from(banners) };
}

/**
 * Sync single icon or banner
 */
async function syncAsset(name, type, cacheDir, uploadedFiles, failures) {
    const isIcon = type === 'icon';
    const sourceUrl = `${SOURCE_BASE_URL}/img/${isIcon ? 'icons' : 'banners'}/${name}.png`;
    const r2Key = isIcon ? getStoryIconKey(name) : getStoryBannerKey(name);
    const localFile = path.join(cacheDir, `${name}.png`);

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

        uploadedFiles[r2Key] = { status: 'uploaded', timestamp: Date.now(), name: name, type: type };
        return 'uploaded';
    } catch (error) {
        // Skip 404s (icon/banner doesn't exist in source)
        if (error.response?.status === 404 || error.message.includes('404')) {
            uploadedFiles[r2Key] = { status: 'skipped', timestamp: Date.now(), reason: '404' };
            return 'skipped';
        }
        console.error(`Failed ${type}: ${name} - ${error.message}`);
        failures.uploadFailures.push({ key: r2Key, name: name, type: type, error: error.message, timestamp: Date.now() });
        uploadedFiles[r2Key] = { status: 'failed', timestamp: Date.now(), error: error.message };
        return 'failed';
    }
}

/**
 * Filter out already processed story assets
 */
function filterUnprocessedAssets(allAssets, uploadedFiles) {
    const unprocessed = [];
    const processed = { uploaded: 0, skipped: 0, failed: 0 };

    for (const asset of allAssets) {
        const isIcon = asset.type === 'icon';
        const r2Key = isIcon ? getStoryIconKey(asset.name) : getStoryBannerKey(asset.name);
        
        if (uploadedFiles[r2Key]) {
            const status = uploadedFiles[r2Key].status;
            if (status === 'uploaded') processed.uploaded++;
            else if (status === 'skipped') processed.skipped++;
            else if (status === 'failed') processed.failed++;
        } else {
            unprocessed.push(asset);
        }
    }

    return { unprocessed, processed };
}

/**
 * Main function with smart filtering and fast processing
 */
async function main() {
    console.log("Starting story icons and banners sync with smart filtering...\n");

    const uploadedFiles = loadUploaded(WORK_TYPE);
    const failures = loadFailures(WORK_TYPE);
    
    const { icons, banners } = await discoverStoryAssets();
    const cacheDir = path.resolve(__dirname, "../../.cache/story-assets");
    ensureDir(cacheDir);

    const allAssets = [
        ...icons.map(name => ({ name, type: 'icon' })),
        ...banners.map(name => ({ name, type: 'banner' }))
    ];

    const { unprocessed, processed } = filterUnprocessedAssets(allAssets, uploadedFiles);
    
    console.log(`Total story assets: ${allAssets.length} (icons: ${icons.length}, banners: ${banners.length})`);
    console.log(`Already processed: ${processed.uploaded + processed.skipped + processed.failed} (uploaded: ${processed.uploaded}, skipped: ${processed.skipped}, failed: ${processed.failed})`);
    console.log(`Remaining to process: ${unprocessed.length}\n`);

    if (unprocessed.length === 0) {
        console.log("🎉 All story icons and banners are already processed!");
        return;
    }

    // Optimized batch size for efficiency vs stability
    const BATCH_SIZE = 12; // Increased for better throughput
    const MAX_UPLOADS_PER_WAVE = 80; // Proportional increase
    const MAX_UPLOADS_PER_RUN = 120; // Slightly increased since batches are more efficient
    const WAVE_DELAY = 1000; // Reduced delay since batches are larger
    
    let totalUploaded = 0, totalSkipped = 0, totalFailed = 0;
    let waveNumber = 1;
    let uploadedInWave = 0;

    for (let i = 0; i < unprocessed.length; i += BATCH_SIZE) {
        // Stop if reached max uploads for this run
        if (totalUploaded >= MAX_UPLOADS_PER_RUN) {
            console.log(`\nReached max upload limit (${MAX_UPLOADS_PER_RUN}), stopping`);
            console.log(`Remaining: ${unprocessed.length - i} assets`);
            break;
        }

        const batch = unprocessed.slice(i, i + BATCH_SIZE);
        
        // Process batch in parallel
        const results = await Promise.all(
            batch.map(asset => syncAsset(asset.name, asset.type, cacheDir, uploadedFiles, failures))
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