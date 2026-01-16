/**
 * @fileoverview R2 Sync Failure Reporter
 * @description Analyzes and reports R2 synchronization failures for troubleshooting
 */

const fs = require("fs");
const path = require("path");

const LOGS_DIR = path.resolve(__dirname, "../.vitepress/logs");
const FAILURES_LOG = path.resolve(LOGS_DIR, "r2-sync-failures.json");
const UPLOADED_LOG = path.resolve(LOGS_DIR, "uploaded.json");

/**
 * Load and analyze failure data
 */
function analyzeFailures() {
    if (!fs.existsSync(FAILURES_LOG)) {
        console.log("No failure log found - all syncs successful!");
        return;
    }

    const failures = JSON.parse(fs.readFileSync(FAILURES_LOG, "utf8"));
    const uploaded = fs.existsSync(UPLOADED_LOG)
        ? JSON.parse(fs.readFileSync(UPLOADED_LOG, "utf8"))
        : {};

    const uploadedEntries = Object.values(uploaded);
    const successCount = uploadedEntries.filter(
        (e) => e.status === "uploaded" || e.uploaded === true
    ).length;
    const skippedCount = uploadedEntries.filter(
        (e) => e.status === "skipped" || e.skipped === true
    ).length;
    const failedCount = uploadedEntries.filter(
        (e) => e.status === "failed"
    ).length;

    console.log("R2 Sync Status Report");
    console.log("========================");
    console.log(
        `Last Update: ${new Date(failures.lastUpdate).toLocaleString()}`
    );
    console.log(`Total Processed: ${uploadedEntries.length}`);
    console.log(`  - Successfully Uploaded: ${successCount}`);
    console.log(`  - Already on R2 (Skipped): ${skippedCount}`);
    console.log(`  - Persistent Failures: ${failedCount}`);
    console.log(
        `Download Failures (All-time Log): ${failures.downloadFailures.length}`
    );
    console.log(
        `Upload Failures (All-time Log): ${failures.uploadFailures.length}`
    );

    if (failedCount > 0) {
        console.log("\nPersistent Failures (from uploaded.json):");
        uploadedEntries
            .filter((e) => e.status === "failed")
            .slice(0, 20)
            .forEach((entry, index) => {
                console.log(
                    `   ${index + 1}. ${entry.variant} (Error: ${
                        entry.error || "unknown"
                    })`
                );
            });
        if (failedCount > 20) {
            console.log(`   ... and ${failedCount - 20} more`);
        }
    }

    if (failures.downloadFailures.length > 0) {
        console.log("\nRecent Download Failures:");

        const uniqueDownloads = [
            ...new Set(failures.downloadFailures.map((f) => f.url)),
        ].reverse();
        uniqueDownloads.slice(0, 10).forEach((url, index) => {
            console.log(`   ${index + 1}. ${url}`);
        });
        if (uniqueDownloads.length > 10) {
            console.log(
                `   ... and ${uniqueDownloads.length - 10} more unique URLs`
            );
        }
    }

    console.log("\nTroubleshooting Tips:");
    console.log(
        "   - Download failures: Check source URLs and network connectivity"
    );
    console.log(
        "   - Use --force-retry to attempt downloading/uploading failed items again"
    );
    console.log(
        '   - persistent failures are stored in uploaded.json with status "failed"'
    );
}

if (require.main === module) {
    analyzeFailures();
}

module.exports = { analyzeFailures };
