/**
 * @fileoverview ONE-TIME CLEANUP: Remove WebP files from arknights/characters/
 * @description Deletes all .webp files from arknights/characters/ folder (wrong format)
 *
 * Character variants should be PNG in arknights/characters/, not WebP
 * WebP variant avatars belong in arknights/variantavatars/
 */

const {
    S3Client,
    ListObjectsV2Command,
    DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");
const R2_CONFIG = require("./r2-config.cjs");

const client = new S3Client({
    region: "auto",
    endpoint: R2_CONFIG.R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_CONFIG.R2_ACCESS_KEY_ID,
        secretAccessKey: R2_CONFIG.R2_SECRET_ACCESS_KEY,
    },
});

/**
 * List all objects in bucket
 */
async function listAllObjects() {
    const objects = [];
    let continuationToken;

    do {
        const command = new ListObjectsV2Command({
            Bucket: R2_CONFIG.R2_BUCKET_NAME,
            ContinuationToken: continuationToken,
            MaxKeys: 1000,
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
 * Identify WebP files to delete from arknights/characters/
 */
function identifyWebPFiles(objects) {
    const filesToDelete = [];

    for (const obj of objects) {
        const key = obj.Key;

        // Only delete WebP files in arknights/characters/ folder
        if (key.startsWith("arknights/characters/") && key.endsWith(".webp")) {
            filesToDelete.push({
                Key: key,
                location: "arknights/characters",
            });
        }
    }

    return filesToDelete;
}

/**
 * Delete objects in batches
 */
async function deleteObjectsBatch(objectsToDelete) {
    const batchSize = 1000;
    const batches = [];

    for (let i = 0; i < objectsToDelete.length; i += batchSize) {
        batches.push(objectsToDelete.slice(i, i + batchSize));
    }

    let totalDeleted = 0;

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        try {
            const deleteParams = {
                Bucket: R2_CONFIG.R2_BUCKET_NAME,
                Delete: {
                    Objects: batch.map((obj) => ({ Key: obj.Key })),
                    Quiet: false,
                },
            };

            const result = await client.send(
                new DeleteObjectsCommand(deleteParams)
            );

            if (result.Deleted) {
                totalDeleted += result.Deleted.length;
                console.log(
                    `Batch ${i + 1}/${batches.length}: Deleted ${
                        result.Deleted.length
                    } files`
                );
            }

            if (result.Errors && result.Errors.length > 0) {
                console.error("Deletion errors:", result.Errors);
            }
        } catch (error) {
            console.error(`Batch ${i + 1} deletion failed:`, error);
        }
    }

    return totalDeleted;
}

/**
 * Main cleanup function
 */
async function main() {
    console.log("=== ONE-TIME WebP Cleanup Script ===\n");
    console.log("This will delete all .webp files from:");
    console.log("  - arknights/characters/ folder ONLY\n");
    console.log("Reason: Character variants should be PNG, not WebP");
    console.log("WebP variant avatars belong in arknights/variantavatars/\n");

    try {
        // List all objects
        console.log("Scanning R2 bucket...");
        const allObjects = await listAllObjects();
        console.log(`Total objects: ${allObjects.length}\n`);

        // Identify WebP files to delete
        const webpFiles = identifyWebPFiles(allObjects);

        if (webpFiles.length === 0) {
            console.log("No WebP files found in wrong locations!");
            return;
        }

        // Group by location
        const byLocation = {};
        webpFiles.forEach((file) => {
            if (!byLocation[file.location]) byLocation[file.location] = [];
            byLocation[file.location].push(file.Key);
        });

        console.log(`Found ${webpFiles.length} WebP files to delete:\n`);
        for (const [location, files] of Object.entries(byLocation)) {
            console.log(`  ${location}: ${files.length} files`);
            console.log(
                `    Examples: ${files.slice(0, 3).join(", ")}${
                    files.length > 3 ? "..." : ""
                }`
            );
        }

        console.log(`\nReady to DELETE ${webpFiles.length} WebP files from arknights/characters/`);
        console.log("Proceeding with cleanup...");

        console.log("Starting deletion...\n");
        const deletedCount = await deleteObjectsBatch(webpFiles);

        console.log(`\nCleanup completed!`);
        console.log(`  Files deleted: ${deletedCount}`);
        console.log(`  Total processed: ${webpFiles.length}`);
        console.log(
            `\nNOTE: Delete this script after use - it's a one-time operation!`
        );
    } catch (error) {
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
