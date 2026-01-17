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
async function syncCharacterVariant(variant, cacheDir) {
    const variantLower = variant.toLowerCase();
    const encodedVariant = encodeURIComponent(variantLower);
    const sourceUrl = `${R2_CONFIG.SOURCE_BASE_URL}${encodedVariant}.png`;
    const backupUrl = `${R2_CONFIG.BACKUP_SOURCE_URL}${encodedVariant}.png`;
    
    const r2Key = getCharacterVariantKey(variantLower);
    const localFile = path.join(cacheDir, `${variantLower}.png`);

    try {
        // Check if exists in R2
        try {
            await client.send(new HeadObjectCommand({
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Key: r2Key,
            }));
            console.log(`Skipped: ${variantLower}`);
            return 'skipped';
        } catch (e) {
            // Doesn't exist, continue
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

        console.log(`Uploaded: ${variantLower}`);
        return 'uploaded';
    } catch (error) {
        console.error(`Failed: ${variantLower} - ${error.message}`);
        return 'failed';
    }
}

/**
 * Main function with wave-based processing
 */
async function main() {
    console.log("Starting character variant sync with wave processing...\n");

    const characters = loadCharacters();
    const cacheDir = path.resolve(__dirname, "../../.cache/characters");
    ensureDir(cacheDir);

    const allVariants = [];
    Object.values(characters).forEach(char => {
        if (char.validVariants && char.validVariants.length > 0) {
            allVariants.push(...char.validVariants);
        }
    });

    console.log(`Scan complete: ${allVariants.length} character variants\n`);

    const WAVE_UPLOAD_LIMIT = 300;
    const WAVE_DELAY = 2000;
    
    let totalUploaded = 0, totalSkipped = 0, totalFailed = 0;
    let waveNumber = 1;
    let uploadedInWave = 0;

    for (let i = 0; i < allVariants.length; i++) {
        const variant = allVariants[i];
        const result = await syncCharacterVariant(variant, cacheDir);
        
        if (result === 'uploaded') {
            totalUploaded++;
            uploadedInWave++;
        } else if (result === 'skipped') {
            totalSkipped++;
        } else {
            totalFailed++;
        }

        // Check if wave limit reached (only count uploads, not skips)
        if (uploadedInWave >= WAVE_UPLOAD_LIMIT && i < allVariants.length - 1) {
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