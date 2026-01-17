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
async function syncAsset(name, type, cacheDir) {
    const isIcon = type === 'icon';
    const sourceUrl = `${SOURCE_BASE_URL}/img/${isIcon ? 'icons' : 'banners'}/${name}.png`;
    const r2Key = isIcon ? getStoryIconKey(name) : getStoryBannerKey(name);
    const localFile = path.join(cacheDir, `${name}.png`);

    try {
        // Check if exists in R2
        try {
            await client.send(new HeadObjectCommand({
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Key: r2Key,
            }));
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

        console.log(`Uploaded ${type}: ${name}`);
        return 'uploaded';
    } catch (error) {
        console.error(`Failed ${type}: ${name} - ${error.message}`);
        return 'failed';
    }
}

/**
 * Main function with wave-based processing
 */
async function main() {
    console.log("Starting story icons and banners sync with wave processing...\n");

    const { icons, banners } = await discoverStoryAssets();
    const cacheDir = path.resolve(__dirname, "../../.cache/story-assets");
    ensureDir(cacheDir);

    const allAssets = [
        ...icons.map(name => ({ name, type: 'icon' })),
        ...banners.map(name => ({ name, type: 'banner' }))
    ];

    console.log(`Scan complete: ${icons.length} icons, ${banners.length} banners (${allAssets.length} total)\n`);

    const WAVE_UPLOAD_LIMIT = 100;
    const WAVE_DELAY = 2000;
    
    let totalUploaded = 0, totalSkipped = 0, totalFailed = 0;
    let waveNumber = 1;
    let uploadedInWave = 0;

    for (let i = 0; i < allAssets.length; i++) {
        const asset = allAssets[i];
        const result = await syncAsset(asset.name, asset.type, cacheDir);
        
        if (result === 'uploaded') {
            totalUploaded++;
            uploadedInWave++;
        } else if (result === 'skipped') {
            totalSkipped++;
        } else {
            totalFailed++;
        }

        // Check if wave limit reached (only count uploads, not skips)
        if (uploadedInWave >= WAVE_UPLOAD_LIMIT && i < allAssets.length - 1) {
            console.log(`\nWave ${waveNumber} complete: ${uploadedInWave} uploads`);
            console.log(`Waiting ${WAVE_DELAY}ms before next wave...\n`);
            await new Promise(resolve => setTimeout(resolve, WAVE_DELAY));
            waveNumber++;
            uploadedInWave = 0;
        }
    }

    console.log(`\nAll waves complete!`);
    console.log(`  Waves: ${waveNumber}`);
    console.log(`  Uploaded: ${totalUploaded}`);
    console.log(`  Skipped: ${totalSkipped}`);
    console.log(`  Failed: ${totalFailed}`);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };