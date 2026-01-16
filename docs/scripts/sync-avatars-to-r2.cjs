/**
 * @fileoverview R2 Avatar Synchronization Script
 * @module r2/avatar-sync
 * @description
 * Downloads character avatars from GitHub and uploads to R2 for story icons.
 * Discovers characters from story_variables.json across all languages.
 *
 * @example
 * const { syncAvatars } = require('./sync-avatars-to-r2');
 * await syncAvatars();
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const PROJECT_CONFIG = require("./project-config.cjs");
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

const AVATAR_BASE_URL =
    "https://raw.githubusercontent.com/akgcc/arkdata/refs/heads/main/assets/torappu/dynamicassets/arts/charavatars";

/**
 * Download and upload single avatar to R2 (with local caching and skip logic)
 * @param {string} charId - Character ID
 * @param {string} cacheDir - Local cache directory
 * @returns {Promise<boolean>} Success status
 */
async function syncAvatar(charId, cacheDir) {
    const filename = `${charId}.png`;
    const sourceUrl = `${AVATAR_BASE_URL}/${filename}`;
    const r2Key = `arknights/avatars/${filename}`;
    const localPath = path.join(cacheDir, filename);

    try {
        // Check if already exists in R2
        try {
            await client.send(new HeadObjectCommand({
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Key: r2Key,
            }));
            console.log(`Skipped: ${charId} (already exists)`);
            return 'skipped';
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

        console.log(`Uploaded: ${charId}`);
        return true;
    } catch (error) {
        console.error(`Failed: ${charId} - ${error.message}`);
        return false;
    }
}

/**
 * Collect all character IDs from story_variables.json
 * @returns {Promise<string[]>} Array of character IDs
 */
async function getAllCharacterIds() {
    const langMap = { 'zh_CN': 'cn', 'en_US': 'en', 'ja_JP': 'jp' };
    const languages = PROJECT_CONFIG.GAMES.arknights.supported_langs.map(lang => langMap[lang]);
    const allCharIds = new Set();

    for (const lang of languages) {
        try {
            const dataUrl = PROJECT_CONFIG.getArknightsDataUrl(
                lang === "cn" ? "zh_CN" : lang === "en" ? "en_US" : "ja_JP"
            );
            const url = `${dataUrl}/gamedata/story/story_variables.json`;
            const response = await axios.get(url, { timeout: 30000 });
            const variables = response.data;

            for (const [key, value] of Object.entries(variables)) {
                if (key.startsWith("avatar_") && typeof value === "string") {
                    allCharIds.add(value);
                }
            }
        } catch (error) {
            console.warn(
                `Failed to load story_variables for ${lang}: ${error.message}`
            );
        }
    }

    return Array.from(allCharIds);
}

/**
 * Main avatar synchronization function
 * @returns {Promise<void>}
 */
async function main() {
    console.log("Collecting character IDs from story_variables.json...\n");

    const charIds = await getAllCharacterIds();
    console.log(`Found ${charIds.length} unique character avatars\n`);

    // Setup cache directory
    const cacheDir = path.resolve(__dirname, '../.temp/avatars');
    ensureDir(cacheDir);

    let uploaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const charId of charIds) {
        const success = await syncAvatar(charId, cacheDir);
        if (success) {
            if (success === 'skipped') skipped++;
            else uploaded++;
        } else {
            failed++;
        }

        if ((uploaded + skipped + failed) % 50 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    console.log("\nAvatar Sync Summary:");
    console.log(`   Uploaded: ${uploaded}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${charIds.length}`);
    
    // Clean cache
    if (fs.existsSync(cacheDir)) {
        fs.rmSync(cacheDir, { recursive: true, force: true });
        console.log("Cache cleaned");
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error("ERROR: Avatar sync failed:", error);
        process.exit(1);
    });
}

/**
 * @exports r2/avatar-sync
 * @property {Function} main - Main sync function
 * @property {Function} syncAvatar - Sync single avatar
 * @property {Function} getAllCharacterIds - Get all character IDs
 */
module.exports = { main, syncAvatar, getAllCharacterIds };
