/**
 * @fileoverview R2 One-Time Cleanup Script
 * @description Delete all files NOT in path manager defined paths (legacy cleanup)
 */

const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const R2_CONFIG = require("../r2-config.cjs");
const { R2_FOLDERS } = require("./r2-path-manager.cjs");

const client = new S3Client({
    region: "auto",
    endpoint: R2_CONFIG.R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_CONFIG.R2_ACCESS_KEY_ID,
        secretAccessKey: R2_CONFIG.R2_SECRET_ACCESS_KEY,
    },
});

/**
 * List all objects in R2 bucket
 * @returns {Promise<Array>} Array of objects
 */
async function listAllObjects() {
    const objects = [];
    let continuationToken;
    
    do {
        const command = new ListObjectsV2Command({
            Bucket: R2_CONFIG.R2_BUCKET_NAME,
            ContinuationToken: continuationToken,
            MaxKeys: 1000
        });
        
        const response = await client.send(command);
        
        if (response.Contents) {
            objects.push(...response.Contents);
        }
        
        continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    return objects;
}

/**
 * Identify files that are NOT in path manager defined paths
 * @param {Array} objects - Array of S3 objects
 * @returns {Array} Array of objects to delete
 */
function identifyWrongPathFiles(objects) {
    const wrongPathFiles = [];
    
    // Get all valid folder prefixes from path manager
    const validPaths = [
        R2_FOLDERS.AVATARS,           // arknights/avatars/
        R2_FOLDERS.CHARACTERS,        // arknights/characters/
        R2_FOLDERS.VARIANT_AVATARS,   // arknights/variantavatars/
        R2_FOLDERS.ICONS,             // arknights/icons/
        R2_FOLDERS.BANNERS,           // arknights/banners/
        R2_FOLDERS.DATA_GLOBAL,       // data/global/
        R2_FOLDERS.DATA_LANG,         // data/ (covers all lang paths)
    ];
    
    for (const obj of objects) {
        const key = obj.Key;
        
        // Check if file is in any valid path
        const isInValidPath = validPaths.some(validPath => key.startsWith(validPath + '/'));
        
        if (!isInValidPath) {
            wrongPathFiles.push({
                Key: key,
                reason: 'Not in path manager defined paths (legacy file)'
            });
        }
    }
    
    return wrongPathFiles;
}

/**
 * Delete objects in batches
 * @param {Array} objectsToDelete - Array of objects to delete
 */
async function deleteObjectsBatch(objectsToDelete) {
    const batchSize = 1000; // S3 delete limit
    const batches = [];
    
    for (let i = 0; i < objectsToDelete.length; i += batchSize) {
        batches.push(objectsToDelete.slice(i, i + batchSize));
    }
    
    let totalDeleted = 0;
    
    for (const batch of batches) {
        try {
            const deleteParams = {
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Delete: {
                    Objects: batch.map(obj => ({ Key: obj.Key })),
                    Quiet: false
                }
            };
            
            const result = await client.send(new DeleteObjectsCommand(deleteParams));
            
            if (result.Deleted) {
                totalDeleted += result.Deleted.length;
                console.log(`Deleted ${result.Deleted.length} files in this batch`);
            }
            
            if (result.Errors && result.Errors.length > 0) {
                console.error('Deletion errors:', result.Errors);
            }
            
        } catch (error) {
            console.error('Batch deletion failed:', error);
        }
    }
    
    return totalDeleted;
}

/**
 * Main cleanup function
 */
async function main() {
    console.log("Starting R2 cleanup for wrong paths...\n");
    
    try {
        // List all objects
        console.log("Fetching all objects from R2...");
        const allObjects = await listAllObjects();
        console.log(`Found ${allObjects.length} total objects\n`);
        
        // Identify wrong path files
        console.log("Identifying files in wrong paths...");
        const wrongPathFiles = identifyWrongPathFiles(allObjects);
        
        if (wrongPathFiles.length === 0) {
            console.log("No files found in wrong paths!");
            return;
        }
        
        console.log(`\nFound ${wrongPathFiles.length} files in wrong paths:`);
        
        // Group by reason
        const groupedByReason = {};
        wrongPathFiles.forEach(file => {
            if (!groupedByReason[file.reason]) {
                groupedByReason[file.reason] = [];
            }
            groupedByReason[file.reason].push(file.Key);
        });
        
        // Display summary
        for (const [reason, files] of Object.entries(groupedByReason)) {
            console.log(`\n${reason}:`);
            console.log(`  Count: ${files.length}`);
            console.log(`  Examples: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`);
        }
        
        // Confirm deletion
        console.log(`\nThis will DELETE ${wrongPathFiles.length} files from R2`);
        console.log("Are you sure? This action cannot be undone.");
        console.log("To proceed, set CONFIRM_DELETE=true environment variable\n");
        
        if (process.env.CONFIRM_DELETE !== 'true') {
            console.log("Cleanup cancelled. Set CONFIRM_DELETE=true to proceed.");
            return;
        }
        
        // Proceed with deletion
        console.log("Starting deletion...");
        const deletedCount = await deleteObjectsBatch(wrongPathFiles);
        
        console.log(`\nCleanup completed!`);
        console.log(`   Files deleted: ${deletedCount}`);
        console.log(`   Total processed: ${wrongPathFiles.length}`);
        
    } catch (error) {
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };