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
async function syncStoryAvatar(charId, cacheDir) {
    const sourceUrl = `${AVATAR_SOURCE_URL}/${encodeURIComponent(charId)}.png`;
    const r2Key = getStoryAvatarKey(charId, false);
    const localFile = path.join(cacheDir, `${charId}.png`);

    try {
        // Check if exists in R2
        try {
            await client.send(new HeadObjectCommand({
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Key: r2Key,
            }));
            console.log(`Skipped: ${charId}`);
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

        console.log(`Uploaded: ${charId}`);
        return 'uploaded';
    } catch (error) {
        console.error(`Failed: ${charId} - ${error.message}`);
        return 'failed';
    }
}

/**
 * Main function with parallel wave processing
 */
async function main() {
    console.log("Starting story avatar sync with parallel processing...\n");

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
            batch.map(charId => syncStoryAvatar(charId, cacheDir))
        );
        
        // Count results
        results.forEach(result => {
            if (result === 'uploaded') {
                totalUploaded++;
                uploadedInWave++;
            } else if (result === 'skipped') {
                totalSkipped++;
            } else {
                totalFailed++;
            }
        });

        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${results.filter(r => r === 'uploaded').length} uploaded, ${results.filter(r => r === 'skipped').length} skipped`);

        // Check if wave limit reached (only count uploads)
        if (uploadedInWave >= MAX_UPLOADS_PER_WAVE && i + BATCH_SIZE < operators.length && totalUploaded < MAX_UPLOADS_PER_RUN) {
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