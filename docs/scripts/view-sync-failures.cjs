/**
 * @fileoverview R2 Sync Failure Reporter
 * @description Analyzes and reports R2 synchronization failures for troubleshooting
 */

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.resolve(__dirname, '../.vitepress/logs');
const FAILURES_LOG = path.resolve(LOGS_DIR, 'r2-sync-failures.json');
const UPLOADED_LOG = path.resolve(LOGS_DIR, 'uploaded.json');

/**
 * Load and analyze failure data
 */
function analyzeFailures() {
    if (!fs.existsSync(FAILURES_LOG)) {
        console.log('No failure log found - all syncs successful!');
        return;
    }
    
    const failures = JSON.parse(fs.readFileSync(FAILURES_LOG, 'utf8'));
    const uploaded = fs.existsSync(UPLOADED_LOG) 
        ? JSON.parse(fs.readFileSync(UPLOADED_LOG, 'utf8'))
        : {};
    
    console.log('R2 Sync Status Report');
    console.log('========================');
    console.log(`Last Update: ${new Date(failures.lastUpdate).toLocaleString()}`);
    console.log(`Successfully Uploaded: ${Object.keys(uploaded).length} files`);
    console.log(`Download Failures: ${failures.downloadFailures.length}`);
    console.log(`Upload Failures: ${failures.uploadFailures.length}`);
    
    if (failures.downloadFailures.length > 0) {
        console.log('\nDownload Failures:');
        failures.downloadFailures.slice(0, 10).forEach((failure, index) => {
            const date = new Date(failure.timestamp).toLocaleString();
            console.log(`   ${index + 1}. ${failure.url} (${date})`);
        });
        if (failures.downloadFailures.length > 10) {
            console.log(`   ... and ${failures.downloadFailures.length - 10} more`);
        }
    }
    
    if (failures.uploadFailures.length > 0) {
        console.log('\nUpload Failures:');
        failures.uploadFailures.slice(0, 10).forEach((failure, index) => {
            const date = new Date(failure.timestamp).toLocaleString();
            console.log(`   ${index + 1}. ${failure.key} (${date})`);
        });
        if (failures.uploadFailures.length > 10) {
            console.log(`   ... and ${failures.uploadFailures.length - 10} more`);
        }
    }
    
    console.log('\nTroubleshooting Tips:');
    console.log('   - Download failures: Check source URLs and network connectivity');
    console.log('   - Upload failures: Verify R2 credentials and bucket permissions');
    console.log('   - Use --force-reset in workflow to retry all failed uploads');
}

if (require.main === module) {
    analyzeFailures();
}

module.exports = { analyzeFailures };