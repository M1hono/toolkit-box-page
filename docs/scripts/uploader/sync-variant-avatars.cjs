/**
 * @fileoverview Sync Variant Avatars to R2
 * @description Download variant avatar WebPs and upload to arknights/variantavatars/
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const R2_CONFIG = require("../r2-config.cjs");
const { ensureDir } = require("../shared/file-utils.cjs");
const { getVariantAvatarKey } = require("./r2-path-manager.cjs");

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
 * Sync single variant avatar
 */
async function syncVariantAvatar(variant, cacheDir) {
    const variantLower = variant.toLowerCase();
    const baseId = variantLower.split('#')[0].split('$')[0];
    const sourceUrl = `${AVATAR_SOURCE_URL}/${encodeURIComponent(baseId)}.png`;
    
    const r2Key = getVariantAvatarKey(variantLower);
    const localFile = path.join(cacheDir, `${variantLower}.webp`);

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

        // Download as PNG first then convert to WebP
        const pngFile = path.join(cacheDir, `${variantLower}.png`);
        if (!fs.existsSync(pngFile)) {
            const response = await axios.get(sourceUrl, { responseType: "arraybuffer", timeout: 30000 });
            fs.writeFileSync(pngFile, Buffer.from(response.data));
        }

        // Convert to WebP using sharp
        const sharp = require('sharp');
        await sharp(pngFile).webp({ quality: 85 }).toFile(localFile);

        // Upload
        const fileContent = fs.readFileSync(localFile);
        await client.send(
            new PutObjectCommand({
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Key: r2Key,
                Body: fileContent,
                ContentType: "image/webp",
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
 * Main function with parallel wave processing
 */
async function main() {
    console.log("Starting variant avatar sync with parallel processing...\n");

    const characters = loadCharacters();
    const cacheDir = path.resolve(__dirname, "../../.cache/variant-avatars");
    ensureDir(cacheDir);

    const variantAvatars = [];
    Object.values(characters).forEach(char => {
        if (char.validVariants && char.validVariants.length > 0) {
            // Only variants with # or $ need variant avatars
            const variants = char.validVariants.filter(v => v.includes('#') || v.includes('$'));
            variantAvatars.push(...variants);
        }
    });

    console.log(`Scan complete: ${variantAvatars.length} variant avatars\n`);

    const BATCH_SIZE = 20;
    const MAX_UPLOADS_PER_WAVE = 300;
    const MAX_UPLOADS_PER_RUN = 1000;
    const WAVE_DELAY = 1000;
    
    let totalUploaded = 0, totalSkipped = 0, totalFailed = 0;
    let waveNumber = 1;
    let uploadedInWave = 0;

    for (let i = 0; i < variantAvatars.length; i += BATCH_SIZE) {
        // Stop if reached max uploads for this run
        if (totalUploaded >= MAX_UPLOADS_PER_RUN) {
            console.log(`\nReached max upload limit (${MAX_UPLOADS_PER_RUN}), stopping`);
            console.log(`Remaining: ${variantAvatars.length - i} variants`);
            break;
        }

        const batch = variantAvatars.slice(i, i + BATCH_SIZE);
        
        // Process batch in parallel
        const results = await Promise.all(
            batch.map(variant => syncVariantAvatar(variant, cacheDir))
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
        if (uploadedInWave >= MAX_UPLOADS_PER_WAVE && i + BATCH_SIZE < variantAvatars.length && totalUploaded < MAX_UPLOADS_PER_RUN) {
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