/**
 * @fileoverview Sync FGO Assets to R2
 * @description Upload FGO fonts and UI assets (excluding JSON data)
 */

const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { loadUploadTracker } = require("./upload-tracker.cjs");
const { getR2Config } = require("../r2-config.cjs");

const r2Config = getR2Config();
const s3Client = new S3Client({
    region: "auto",
    endpoint: r2Config.endpoint,
    credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
    },
    requestHandler: {
        connectionTimeout: 30000,
        socketTimeout: 30000,
    },
    maxAttempts: 3,
});

const PUBLIC_DIR = path.resolve(__dirname, "../../src/public");

/**
 * Get content type for asset files
 */
function getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case ".woff":
            return "font/woff";
        case ".woff2":
            return "font/woff2";
        case ".ttf":
            return "font/ttf";
        case ".otf":
            return "font/otf";
        case ".png":
            return "image/png";
        default:
            return "application/octet-stream";
    }
}

/**
 * Sync single asset file
 */
async function syncAssetFile(localPath, r2Key, tracker) {
    try {
        if (tracker.isUploaded(r2Key)) {
            return { result: "skipped" };
        }

        const fileContent = fs.readFileSync(localPath);
        const contentType = getContentType(path.basename(localPath));

        await s3Client.send(
            new PutObjectCommand({
                Bucket: r2Config.bucketName,
                Key: r2Key,
                Body: fileContent,
                ContentType: contentType,
                CacheControl: "public, max-age=86400",
            })
        );

        tracker.markUploaded(r2Key);
        return { result: "uploaded" };
    } catch (error) {
        console.error(`❌ Failed: ${r2Key} - ${error.message}`);
        return { result: "failed" };
    }
}

/**
 * Recursively get all files in directory
 */
function getAllFiles(dir, extensions, baseDir = dir) {
    const files = [];

    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...getAllFiles(fullPath, extensions, baseDir));
        } else if (extensions.some((ext) => item.endsWith(ext))) {
            const relativePath = path.relative(baseDir, fullPath);
            files.push({
                localPath: fullPath,
                relativePath: relativePath.replace(/\\/g, "/"),
            });
        }
    }

    return files;
}

/**
 * Main sync function
 */
async function main() {
    console.log("🚀 Starting FGO assets sync to R2...\n");

    const tracker = loadUploadTracker("fgo-assets");

    let totalUploaded = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    // 1. Sync Fonts
    console.log("🔤 Syncing fonts...");
    const fontDir = path.join(PUBLIC_DIR, "Font");
    if (fs.existsSync(fontDir)) {
        const fontFiles = fs
            .readdirSync(fontDir)
            .filter((f) => /\.(woff|woff2|ttf|otf)$/i.test(f));

        for (const filename of fontFiles) {
            const r2Key = `fgo/font/${filename}`;
            const result = await syncAssetFile(
                path.join(fontDir, filename),
                r2Key,
                tracker
            );

            if (result.result === "uploaded") totalUploaded++;
            else if (result.result === "skipped") totalSkipped++;
            else totalFailed++;
        }

        console.log(`   Fonts: ${fontFiles.length} processed`);
    }

    // 2. Sync UI Assets (wave processing)
    console.log("🎨 Syncing UI assets...");
    const fgoImgsDir = path.join(PUBLIC_DIR, "imgs/fgo");
    const uiFiles = getAllFiles(fgoImgsDir, [".png"]);

    if (uiFiles.length > 0) {
        const WAVE_SIZE = 20;
        const WAVE_DELAY = 2000;

        for (let i = 0; i < uiFiles.length; i += WAVE_SIZE) {
            const wave = uiFiles.slice(i, i + WAVE_SIZE);
            const waveNum = Math.floor(i / WAVE_SIZE) + 1;

            console.log(
                `   Wave ${waveNum}: Processing ${wave.length} files...`
            );

            const promises = wave.map(async (file) => {
                const r2Key = `fgo/servantcardui/${file.relativePath}`;
                return await syncAssetFile(file.localPath, r2Key, tracker);
            });

            const results = await Promise.all(promises);

            results.forEach((result) => {
                if (result.result === "uploaded") totalUploaded++;
                else if (result.result === "skipped") totalSkipped++;
                else totalFailed++;
            });

            if (i + WAVE_SIZE < uiFiles.length) {
                await new Promise((resolve) => setTimeout(resolve, WAVE_DELAY));
            }
        }

        console.log(`   UI Assets: ${uiFiles.length} processed`);
    }

    tracker.save();

    console.log(`\n🎉 FGO assets sync complete!`);
    console.log(`   📤 Uploaded: ${totalUploaded}`);
    console.log(`   ⏭️  Skipped: ${totalSkipped}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
