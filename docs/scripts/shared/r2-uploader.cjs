/**
 * @fileoverview Cloudflare R2 Upload Manager
 * @description Handles batch image uploads to R2 storage with progress tracking and failure recovery
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const { ensureDir } = require('./file-utils.cjs');
const R2_CONFIG = require('../r2-config.cjs');

const LOGS_DIR = path.resolve(__dirname, '../../.vitepress/logs');
const UPLOADED_LOG = path.resolve(LOGS_DIR, 'uploaded.json');
const FAILURES_LOG = path.resolve(LOGS_DIR, 'r2-sync-failures.json');

/**
 * Initialize R2 client with configuration
 * @returns {S3Client}
 */
function createR2Client() {
    return new S3Client({
        region: 'auto',
        endpoint: R2_CONFIG.R2_ENDPOINT,
        credentials: {
            accessKeyId: R2_CONFIG.R2_ACCESS_KEY_ID,
            secretAccessKey: R2_CONFIG.R2_SECRET_ACCESS_KEY,
        },
    });
}

/**
 * Load upload progress tracking data
 * @returns {Object}
 */
function loadUploadedFiles() {
    ensureDir(LOGS_DIR);
    return fs.existsSync(UPLOADED_LOG) ? JSON.parse(fs.readFileSync(UPLOADED_LOG, 'utf8')) : {};
}

/**
 * Save upload progress tracking data
 * @param {Object} uploadedFiles
 */
function saveUploadedFiles(uploadedFiles) {
    ensureDir(LOGS_DIR);
    fs.writeFileSync(UPLOADED_LOG, JSON.stringify(uploadedFiles, null, 2), 'utf8');
}

/**
 * Load failure tracking data
 * @returns {Object}
 */
function loadFailures() {
    ensureDir(LOGS_DIR);
    return fs.existsSync(FAILURES_LOG) 
        ? JSON.parse(fs.readFileSync(FAILURES_LOG, 'utf8')) 
        : { downloadFailures: [], uploadFailures: [], lastUpdate: Date.now() };
}

/**
 * Save failure tracking data
 * @param {Object} failures
 */
function saveFailures(failures) {
    ensureDir(LOGS_DIR);
    failures.lastUpdate = Date.now();
    fs.writeFileSync(FAILURES_LOG, JSON.stringify(failures, null, 2), 'utf8');
}

/**
 * Download image from URL with retry logic
 * @param {string} url
 * @param {string} localPath
 * @returns {Promise<boolean>}
 */
async function downloadImage(url, localPath) {
    return new Promise((resolve) => {
        const file = fs.createWriteStream(localPath);
        const request = https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            } else {
                file.close();
                fs.unlink(localPath, () => {});
                resolve(false);
            }
        });
        
        request.on('error', () => {
            file.close();
            fs.unlink(localPath, () => {});
            resolve(false);
        });
        
        request.setTimeout(10000, () => {
            request.destroy();
            file.close();
            fs.unlink(localPath, () => {});
            resolve(false);
        });
    });
}

/**
 * Convert image to WebP format if enabled
 * @param {string} inputPath
 * @param {string} outputPath
 * @returns {Promise<boolean>}
 */
async function convertToWebP(inputPath, outputPath) {
    if (!R2_CONFIG.ENABLE_WEBP_CONVERSION) return false;
    
    try {
        await sharp(inputPath)
            .webp({ quality: 85 })
            .toFile(outputPath);
        return true;
    } catch (error) {
        console.warn(`WARNING: WebP conversion failed for ${inputPath}:`, error.message);
        return false;
    }
}

/**
 * Check if object exists in R2
 * @param {S3Client} client
 * @param {string} key
 * @returns {Promise<boolean>}
 */
async function objectExists(client, key) {
    try {
        await client.send(new HeadObjectCommand({
            Bucket: R2_CONFIG.R2_BUCKET_NAME,
            Key: key,
        }));
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Upload file to R2 storage
 * @param {S3Client} client
 * @param {string} filePath
 * @param {string} key
 * @returns {Promise<boolean>}
 */
async function uploadToR2(client, filePath, key) {
    try {
        const fileContent = fs.readFileSync(filePath);
        await client.send(new PutObjectCommand({
            Bucket: R2_CONFIG.R2_BUCKET_NAME,
            Key: key,
            Body: fileContent,
            ContentType: path.extname(filePath) === '.webp' ? 'image/webp' : 'image/png',
        }));
        return true;
    } catch (error) {
        console.error(`ERROR: Upload failed for ${key}:`, error.message);
        return false;
    }
}

/**
 * Process a batch of character images for R2 upload
 * @param {Array} characterBatch - Array of character data with image info
 * @returns {Promise<Object>}
 */
async function processBatch(characterBatch) {
    const client = createR2Client();
    const uploadedFiles = loadUploadedFiles();
    const failures = loadFailures();
    
    const cacheDir = path.resolve(__dirname, '../../cache');
    ensureDir(cacheDir);
    
    let processed = 0;
    let uploaded = 0;
    let skipped = 0;
    
    for (const char of characterBatch) {
        for (const variant of char.validVariants) {
            const imageUrl = `${R2_CONFIG.SOURCE_BASE_URL}${variant}.png`;
            const cacheFile = path.resolve(cacheDir, `${variant}.png`);
            const webpFile = path.resolve(cacheDir, `${variant}.webp`);
            
            const r2Key = R2_CONFIG.ENABLE_WEBP_CONVERSION ? `${variant}.webp` : `${variant}.png`;
            
            processed++;
            
            if (uploadedFiles[r2Key]) {
                skipped++;
                if (processed % 10 === 0) {
                    console.log(`Progress: ${processed} processed, ${uploaded} uploaded, ${skipped} skipped`);
                }
                continue;
            }
            
            console.log(`Processing ${variant}...`);
            
            if (!fs.existsSync(cacheFile)) {
                const downloadSuccess = await downloadImage(imageUrl, cacheFile);
                if (!downloadSuccess) {
                    failures.downloadFailures.push({ url: imageUrl, timestamp: Date.now() });
                    console.warn(`WARNING: Failed to download ${variant}`);
                    continue;
                }
            }
            
            let uploadFile = cacheFile;
            if (R2_CONFIG.ENABLE_WEBP_CONVERSION) {
                const webpSuccess = await convertToWebP(cacheFile, webpFile);
                if (webpSuccess) {
                    uploadFile = webpFile;
                }
            }
            
            const exists = await objectExists(client, r2Key);
            if (!exists) {
                const uploadSuccess = await uploadToR2(client, uploadFile, r2Key);
                if (uploadSuccess) {
                    uploadedFiles[r2Key] = {
                        timestamp: Date.now(),
                        variant: variant,
                        webp: R2_CONFIG.ENABLE_WEBP_CONVERSION
                    };
                    uploaded++;
                    console.log(`Uploaded ${variant} (${uploaded} total)`);
                } else {
                    failures.uploadFailures.push({ key: r2Key, timestamp: Date.now() });
                }
            } else {
                uploadedFiles[r2Key] = {
                    timestamp: Date.now(),
                    variant: variant,
                    webp: R2_CONFIG.ENABLE_WEBP_CONVERSION,
                    skipped: true
                };
                skipped++;
            }
            
            if (R2_CONFIG.CLEAN_CACHE_AFTER_UPLOAD) {
                if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
                if (fs.existsSync(webpFile)) fs.unlinkSync(webpFile);
            }
            
            if (processed % 10 === 0) {
                saveUploadedFiles(uploadedFiles);
                saveFailures(failures);
            }
        }
    }
    
    saveUploadedFiles(uploadedFiles);
    saveFailures(failures);
    
    return { processed, uploaded, skipped };
}

module.exports = {
    processBatch,
    loadUploadedFiles,
    loadFailures,
    createR2Client
};