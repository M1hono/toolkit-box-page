/**
 * @fileoverview Sync FGO Assets to R2
 * @description Upload FGO fonts and UI assets (excluding JSON data)
 */

const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { loadUploaded, saveUploaded } = require("./upload-tracker.cjs");
const R2_CONFIG = require("../r2-config.cjs");

const WORK_TYPE = 'fgo-assets';

const s3Client = new S3Client({
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
async function syncAssetFile(localPath, r2Key, uploadedFiles) {
    try {
        if (uploadedFiles[r2Key]) {
            return { result: "skipped" };
        }

        const fileContent = fs.readFileSync(localPath);
        const contentType = getContentType(path.basename(localPath));

        await s3Client.send(
            new PutObjectCommand({
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Key: r2Key,
                Body: fileContent,
                ContentType: contentType,
                CacheControl: "public, max-age=86400",
            })
        );

        uploadedFiles[r2Key] = true;
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

    const uploadedFiles = loadUploaded(WORK_TYPE);

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
                uploadedFiles
            );

            if (result.result === "uploaded") totalUploaded++;
            else if (result.result === "skipped") totalSkipped++;
            else totalFailed++;
        }

        console.log(`   Fonts: ${fontFiles.length} processed`);
    }

    // 2. Sync UI Assets (smart filtering and fast processing)
    console.log("🎨 Syncing UI assets...");
    const fgoImgsDir = path.join(PUBLIC_DIR, "imgs/fgo");
    const uiFiles = getAllFiles(fgoImgsDir, [".png"]);

    if (uiFiles.length > 0) {
        // Filter out already processed files
        const unprocessedFiles = [];
        const processedCount = { uploaded: 0, skipped: 0, failed: 0 };

        for (const file of uiFiles) {
            const r2Key = `fgo/servantcardui/${file.relativePath}`;
            if (uploadedFiles[r2Key]) {
                const status = uploadedFiles[r2Key].result || uploadedFiles[r2Key].status;
                if (status === 'uploaded') processedCount.uploaded++;
                else if (status === 'skipped') processedCount.skipped++;
                else if (status === 'failed') processedCount.failed++;
            } else {
                unprocessedFiles.push(file);
            }
        }

        console.log(`   Total UI files: ${uiFiles.length}`);
        console.log(`   Already processed: ${processedCount.uploaded + processedCount.skipped + processedCount.failed} (uploaded: ${processedCount.uploaded}, skipped: ${processedCount.skipped}, failed: ${processedCount.failed})`);
        console.log(`   Remaining to process: ${unprocessedFiles.length}\n`);

        if (unprocessedFiles.length === 0) {
            console.log("   🎉 All FGO UI assets are already processed!");
        } else {
            // Optimized batch size for efficiency vs stability  
            const BATCH_SIZE = 15; // Increased for better throughput
            const MAX_UPLOADS_PER_WAVE = 100; // Match other scripts
            const MAX_UPLOADS_PER_RUN = 150; // Slightly increased since batches are more efficient
            const WAVE_DELAY = 1000; // Reduced delay since batches are larger
            
            let waveNumber = 1;
            let uploadedInWave = 0;

            for (let i = 0; i < unprocessedFiles.length; i += BATCH_SIZE) {
                // Stop if reached max uploads for this run
                if (totalUploaded >= MAX_UPLOADS_PER_RUN) {
                    console.log(`\n   Reached max upload limit (${MAX_UPLOADS_PER_RUN}), stopping`);
                    console.log(`   Remaining: ${unprocessedFiles.length - i} files`);
                    break;
                }

                const wave = unprocessedFiles.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;

            console.log(
                `   Batch ${batchNum}: Processing ${wave.length} files...`
            );

            const promises = wave.map(async (file) => {
                const r2Key = `fgo/servantcardui/${file.relativePath}`;
                return await syncAssetFile(file.localPath, r2Key, uploadedFiles);
            });

            const results = await Promise.all(promises);

            results.forEach((result) => {
                if (result.result === "uploaded") {
                    totalUploaded++;
                    uploadedInWave++;
                } else if (result.result === "skipped") {
                    totalSkipped++;
                } else {
                    totalFailed++;
                    uploadedInWave++; // Failed also counts towards wave
                }
            });

            const uploaded = results.filter(r => r.result === "uploaded").length;
            const skipped = results.filter(r => r.result === "skipped").length;
            const failed = results.filter(r => r.result === "failed").length;
            console.log(`     ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);

                // Check if wave limit reached
                if (uploadedInWave >= MAX_UPLOADS_PER_WAVE && i + BATCH_SIZE < unprocessedFiles.length && totalUploaded < MAX_UPLOADS_PER_RUN) {
                    console.log(`\n   Wave ${waveNumber} complete: ${uploadedInWave} uploads`);
                    console.log(`   Waiting ${WAVE_DELAY}ms before next wave...\n`);
                    await new Promise(resolve => setTimeout(resolve, WAVE_DELAY));
                    waveNumber++;
                    uploadedInWave = 0;
                } else if (i + BATCH_SIZE < unprocessedFiles.length) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

            console.log(`   UI Assets: ${Math.min(unprocessedFiles.length, totalUploaded + totalSkipped + totalFailed)} processed`);
        }
    }

    saveUploaded(WORK_TYPE, uploadedFiles);

    console.log(`\n🎉 FGO assets sync complete!`);
    console.log(`   📤 Uploaded: ${totalUploaded}`);
    console.log(`   ⏭️  Skipped: ${totalSkipped}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
