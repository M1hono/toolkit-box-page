/**
 * @fileoverview Sync JSON Data to R2
 * @description Upload all JSON data files to data/global/arknights/ and data/{lang}/arknights/
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
async function syncJsonFile(localPath, filename, lang = null, game = 'arknights') {
    const r2Key = getDataFileKey(filename, lang, game);

    try {
        if (!fs.existsSync(localPath)) {
            console.warn(`File not found: ${localPath}`);
            return false;
        }

        const fileContent = fs.readFileSync(localPath);
        
        // Always upload, data must be fresh
        await client.send(
            new PutObjectCommand({
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Key: r2Key,
                Body: fileContent,
                ContentType: "application/json",
                CacheControl: "public, max-age=3600",
            })
        );

        console.log(`Uploaded: ${r2Key}`);
        return true;
    } catch (error) {
        console.error(`Failed: ${r2Key} - ${error.message}`);
        return false;
    }
}

/**
 * Main function with parallel processing
 */
async function main() {
    console.log("Starting JSON data sync with parallel processing...\n");

    const baseDir = path.resolve(__dirname, "../../src/public/data");
    const allFiles = [];

    // Collect global files
    const globalDir = path.join(baseDir, "global/arknights");
    if (fs.existsSync(globalDir)) {
        const globalFiles = fs.readdirSync(globalDir).filter(f => f.endsWith('.json'));
        globalFiles.forEach(filename => {
            allFiles.push({
                localPath: path.join(globalDir, filename),
                filename,
                lang: null,
                game: 'arknights'
            });
        });
    }

    // Collect language files
    const languages = PROJECT_CONFIG.GAMES.arknights.supported_langs;
    for (const langCode of languages) {
        const localeCode = PROJECT_CONFIG.getLocaleCode(langCode);
        const langDir = path.join(baseDir, `${localeCode}/arknights`);
        
        if (fs.existsSync(langDir)) {
            const langFiles = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));
            langFiles.forEach(filename => {
                allFiles.push({
                    localPath: path.join(langDir, filename),
                    filename,
                    lang: localeCode,
                    game: 'arknights'
                });
            });
        }
    }

    console.log(`Scan complete: ${allFiles.length} data files\n`);

    // Upload all files in parallel
    const results = await Promise.all(
        allFiles.map(file => syncJsonFile(file.localPath, file.filename, file.lang, file.game))
    );
    
    const uploaded = results.filter(r => r === true).length;
    const failed = results.filter(r => r === false).length;

    console.log(`\nSync complete:`);
    console.log(`  Uploaded: ${uploaded}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total: ${allFiles.length}`);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };