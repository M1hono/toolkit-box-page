/**
 * @fileoverview Sync JSON Data to R2
 * @description Upload JSON data files for both Arknights and FGO
 */

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const R2_CONFIG = require("../r2-config.cjs");
const PROJECT_CONFIG = require("../project-config.cjs");
const { getDataFileKey } = require("./r2-path-manager.cjs");

const client = new S3Client({
    region: "auto",
    endpoint: R2_CONFIG.R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_CONFIG.R2_ACCESS_KEY_ID,
        secretAccessKey: R2_CONFIG.R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Sync single JSON file (always uploads, no skip logic)
 */
async function syncJsonFile(localPath, r2Key) {
    try {
        if (!fs.existsSync(localPath)) {
            console.warn(`File not found: ${localPath}`);
            return false;
        }

        const fileContent = fs.readFileSync(localPath);
        
        await client.send(
            new PutObjectCommand({
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Key: r2Key,
                Body: fileContent,
                ContentType: "application/json",
                CacheControl: "public, max-age=3600",
            })
        );

        return true;
    } catch (error) {
        console.error(`Failed: ${r2Key} - ${error.message}`);
        return false;
    }
}

/**
 * Sync Arknights JSON data
 */
async function syncArknightsData() {
    console.log("📊 Syncing Arknights JSON data...");
    
    const baseDir = path.resolve(__dirname, "../../src/public/data");
    const allFiles = [];

    const globalDir = path.join(baseDir, "global/arknights");
    if (fs.existsSync(globalDir)) {
        const globalFiles = fs.readdirSync(globalDir).filter(f => f.endsWith('.json'));
        globalFiles.forEach(filename => {
            allFiles.push({
                localPath: path.join(globalDir, filename),
                r2Key: getDataFileKey(filename, null, 'arknights'),
                isDataFile: true
            });
        });
    }

    const languages = PROJECT_CONFIG.GAMES.arknights.supported_langs;
    for (const langCode of languages) {
        const localeCode = PROJECT_CONFIG.getLocaleCode(langCode);
        const langDir = path.join(baseDir, `${localeCode}/arknights`);
        
        if (fs.existsSync(langDir)) {
            const langFiles = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));
            langFiles.forEach(filename => {
                allFiles.push({
                    localPath: path.join(langDir, filename),
                    r2Key: getDataFileKey(filename, localeCode, 'arknights'),
                    isDataFile: true
                });
            });
        }
    }

    const results = await Promise.all(
        allFiles.map(file => syncFile(file.localPath, file.r2Key, file.isDataFile))
    );
    
    const uploaded = results.filter(r => r === true).length;
    const failed = results.filter(r => r === false).length;

    console.log(`   📤 Arknights data: ${uploaded} uploaded, ${failed} failed`);
    return { uploaded, failed };
}

/**
 * Sync FGO JSON data only
 */
async function syncFGOData() {
    console.log("🎮 Syncing FGO JSON data...");
    
    const baseDir = path.resolve(__dirname, "../../src/public");
    let uploaded = 0;
    let failed = 0;
    
    const fgoDataDir = path.join(baseDir, "data/global/fgo");
    if (fs.existsSync(fgoDataDir)) {
        const dataFiles = fs.readdirSync(fgoDataDir).filter(f => f.endsWith('.json'));
        for (const filename of dataFiles) {
            const r2Key = `data/global/fgo/${filename}`;
            const success = await syncJsonFile(path.join(fgoDataDir, filename), r2Key);
            if (success) uploaded++; else failed++;
        }
    }
    
    console.log(`   📤 FGO data: ${uploaded} uploaded, ${failed} failed`);
    return { uploaded, failed };
}

/**
 * Main function - sync JSON data only
 */
async function main() {
    console.log("🚀 Starting JSON data sync...\n");

    const arknightsResult = await syncArknightsData();
    console.log();
    
    const fgoResult = await syncFGOData();
    console.log();

    console.log("🎉 JSON data sync finished!");
    console.log(`   Arknights: ${arknightsResult.uploaded} uploaded, ${arknightsResult.failed} failed`);
    console.log(`   FGO: ${fgoResult.uploaded} uploaded, ${fgoResult.failed} failed`);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };