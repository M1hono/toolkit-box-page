/**
 * @fileoverview R2 Data Synchronization Script
 * @description Uploads JSON data files (names.json, storys.json, etc.) to Cloudflare R2
 */

const fs = require("fs");
const path = require("path");
const {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const PROJECT_CONFIG = require("./project-config.cjs");
const R2_CONFIG = require("./r2-config.cjs");

const client = new S3Client({
    region: "auto",
    endpoint: R2_CONFIG.R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_CONFIG.R2_ACCESS_KEY_ID,
        secretAccessKey: R2_CONFIG.R2_SECRET_ACCESS_KEY,
    },
    requestHandler: {
        connectionTimeout: 30000,
        socketTimeout: 30000,
    },
    maxAttempts: 3,
});

/**
 * Upload a JSON file to R2
 */
async function uploadJsonFile(localPath, r2Key) {
    try {
        if (!fs.existsSync(localPath)) {
            console.warn(`File not found: ${localPath}`);
            return false;
        }

        const fileContent = fs.readFileSync(localPath);
        try {
        await client.send(
            new HeadObjectCommand({
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Key: r2Key,
            })
        );
        } catch (error) {}

        await client.send(
            new PutObjectCommand({
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Key: r2Key,
                Body: fileContent,
                ContentType: "application/json",
                CacheControl: "public, max-age=300",
            })
        );

        console.log(` Uploaded: ${r2Key}`);
        return true;
    } catch (error) {
        console.error(` Failed to upload ${r2Key}:`, error.message);
        return false;
    }
}

/**
 * Sync all JSON data files to R2
 */
async function syncDataToR2() {
    console.log("Starting R2 data synchronization...\n");

    const publicDataRoot = PROJECT_CONFIG.PUBLIC_DATA_ROOT;
    const filesToUpload = [];
    const languages = ["en_us", "ja_jp", "zh_cn"];
    const games = ["arknights", "fgo"];
    for (const game of games) {
        const globalDir = path.join(publicDataRoot, "global", game);
        if (fs.existsSync(globalDir)) {
            const files = fs
                .readdirSync(globalDir)
                .filter((f) => f.endsWith(".json"));
            for (const file of files) {
                filesToUpload.push({
                    local: path.join(globalDir, file),
                    r2Key: `global/${game}/${file}`,
                });
            }
        }
    }
    for (const lang of languages) {
        for (const game of games) {
            const langDir = path.join(publicDataRoot, lang, game);
            if (fs.existsSync(langDir)) {
                const files = fs
                    .readdirSync(langDir)
                    .filter((f) => f.endsWith(".json"));
                for (const file of files) {
                    filesToUpload.push({
                        local: path.join(langDir, file),
                        r2Key: `${lang}/${game}/${file}`,
                    });
                }
            }
        }
    }

    console.log(`Found ${filesToUpload.length} JSON files to sync\n`);

    let uploaded = 0;
    let failed = 0;

    for (const file of filesToUpload) {
        const success = await uploadJsonFile(file.local, file.r2Key);
        if (success) uploaded++;
        else failed++;
    }

    console.log("\n📊 R2 Data Sync Summary:");
    console.log(`   ✅ Uploaded: ${uploaded}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📁 Total: ${filesToUpload.length}`);
}

if (require.main === module) {
    syncDataToR2().catch((error) => {
        console.error("ERROR: R2 data sync failed:", error);
        process.exit(1);
    });
}

module.exports = { syncDataToR2, uploadJsonFile };
