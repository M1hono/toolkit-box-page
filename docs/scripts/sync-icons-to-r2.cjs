/**
 * @fileoverview R2 Story Icons Synchronization Script
 * @module r2/icon-sync
 * @description
 * Downloads story icons and banners from r2.m31ns.top and uploads to arkimage.top.
 * Includes main story icons, activity banners, and fallback icons.
 *
 * @example
 * const { syncIcons } = require('./sync-icons-to-r2');
 * await syncIcons();
 */

const {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const R2_CONFIG = require("./r2-config.cjs");
const { ensureDir } = require("./shared/file-utils.cjs");

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
 * Download and upload single icon to R2
 * @param {string} iconPath - Icon path (e.g., 'img/icons/main_14.png')
 * @param {string} cacheDir - Local cache directory
 * @returns {Promise<boolean|string>} Success status or 'skipped'
 */
async function syncIcon(iconPath, cacheDir) {
    const filename = path.basename(iconPath);
    const sourceUrl = `${SOURCE_BASE_URL}/${iconPath}`;
    const r2Key = `arknights/${iconPath.replace("img/", "")}`;
    const localPath = path.join(cacheDir, filename);

    try {
        // Check if already exists in R2
        try {
            await client.send(
                new HeadObjectCommand({
                    Bucket: R2_CONFIG.R2_BUCKET_NAME,
                    Key: r2Key,
                })
            );
            console.log(`Skipped: ${filename} (already exists)`);
            return "skipped";
        } catch (e) {
            // File doesn't exist, continue with upload
        }

        // Download to local cache if not exists
        if (!fs.existsSync(localPath)) {
            const response = await axios.get(sourceUrl, {
                responseType: "arraybuffer",
                timeout: 30000,
            });
            fs.writeFileSync(localPath, Buffer.from(response.data));
        }

        // Upload from local cache
        const fileContent = fs.readFileSync(localPath);
        await client.send(
            new PutObjectCommand({
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Key: r2Key,
                Body: fileContent,
                ContentType: "image/png",
                CacheControl: "public, max-age=86400",
            })
        );

        console.log(`Uploaded: ${filename}`);
        return true;
    } catch (error) {
        console.error(`Failed: ${filename} - ${error.message}`);
        return false;
    }
}

/**
 * Get list of story icons to sync dynamically from story data
 * @returns {Promise<string[]>} Array of icon paths
 */
async function getIconPaths() {
    const icons = new Set();
    const PROJECT_CONFIG = require("./project-config.cjs");

    // Get icons from actual story data
    const languages = PROJECT_CONFIG.GAMES.arknights.supported_langs;
    
    for (const lang of languages) {
        try {
            const dataUrl = PROJECT_CONFIG.getArknightsDataUrl(lang);
            const response = await axios.get(`${dataUrl}/gamedata/excel/story_review_table.json`, { timeout: 30000 });
            const storyReview = response.data;

            for (const [actId, actData] of Object.entries(storyReview)) {
                if (!actData?.infoUnlockDatas) continue;

                // Add banner for activities
                if (actId.startsWith('act')) {
                    icons.add(`img/banners/${actId}.png`);
                }

                // Extract chapter numbers from main stories
                if (actId.startsWith('main_')) {
                    const chapterMatch = actId.match(/main_(\d+)/);
                    if (chapterMatch) {
                        const chapterNum = parseInt(chapterMatch[1], 10);
                        icons.add(`img/icons/main_${chapterNum}.png`);
                    }
                }

                // Add generic icons for other types
                if (!actId.startsWith('story_') && !actId.startsWith('main_') && !actId.startsWith('act')) {
                    icons.add(`img/icons/${actId}.png`);
                }
            }
        } catch (error) {
            console.warn(`Failed to load story data for ${lang}: ${error.message}`);
        }
    }

    // Always add essential fallback icons
    icons.add("img/icons/404.png");
    icons.add("img/icons/default.png");

    return Array.from(icons);
}

/**
 * Main icon synchronization function
 * @returns {Promise<void>}
 */
async function main() {
    console.log("Starting story icons sync to R2...\n");

    const iconPaths = await getIconPaths();
    console.log(`Found ${iconPaths.length} icons to sync\n`);

    // Setup cache directory
    const cacheDir = path.resolve(__dirname, "../.temp/icons");
    ensureDir(cacheDir);

    let uploaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const iconPath of iconPaths) {
        const result = await syncIcon(iconPath, cacheDir);
        if (result === true) uploaded++;
        else if (result === "skipped") skipped++;
        else failed++;

        // Rate limiting
        if ((uploaded + skipped + failed) % 20 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }

    console.log("\nIcon Sync Summary:");
    console.log(`   Uploaded: ${uploaded}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${iconPaths.length}`);

    // Clean cache
    if (fs.existsSync(cacheDir)) {
        fs.rmSync(cacheDir, { recursive: true, force: true });
        console.log("Cache cleaned");
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error("ERROR: Icon sync failed:", error);
        process.exit(1);
    });
}

/**
 * @exports r2/icon-sync
 * @property {Function} main - Main sync function
 * @property {Function} syncIcon - Sync single icon
 * @property {Function} getIconPaths - Get all icon paths
 */
module.exports = { main, syncIcon, getIconPaths };
