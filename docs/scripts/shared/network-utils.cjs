/**
 * @fileoverview Shared Networking Utilities
 * @description Common networking functions for data fetching
 */

const https = require('https');

/**
 * Fetch JSON or text from a URL
 * @param {string} url - Target URL
 * @returns {Promise<any>} - Parsed JSON or raw text
 */
async function fetchData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}: ${url}`));
                return;
            }
            
            let data = Buffer.alloc(0);
            res.on('data', (chunk) => {
                data = Buffer.concat([data, chunk]);
            });
            res.on('end', () => {
                try {
                    const text = data.toString('utf8');
                    try {
                        resolve(JSON.parse(text));
                    } catch (e) {
                        resolve(text);
                    }
                } catch (error) {
                    reject(new Error(`Failed to decode data: ${error.message}`));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Check if a URL exists
 * @param {string} url - Target URL
 * @returns {Promise<boolean>}
 */
async function checkUrlExists(url) {
    return new Promise((resolve) => {
        const request = https.get(url, { method: 'HEAD' }, (res) => {
            resolve(res.statusCode === 200);
            res.destroy();
        });
        request.on('error', () => resolve(false));
        request.setTimeout(5000, () => {
            request.destroy();
            resolve(false);
        });
    });
}

module.exports = {
    fetchData,
    checkUrlExists
};
