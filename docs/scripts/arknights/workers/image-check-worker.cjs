/**
 * @fileoverview Image Verification Worker
 * @module arknights/workers/image-check-worker
 * @description
 * Background worker thread for verifying character variant image existence.
 * Tests multiple face/body combinations against image repositories to determine
 * valid character variants for each character ID.
 * 
 * @example
 * // Worker is spawned automatically by variant-generator.cjs
 * // workerData: { characters, allCharacters, useSmartDetection }
 * // Returns: { success: true, results: [[charId, variants[]], ...] }
 */

const { parentPort, workerData } = require("worker_threads");
const { checkUrlExists } = require("../../shared/network-utils.cjs");

/**
 * Main worker function - verifies image variants for assigned characters
 * @async
 * @description
 * For each character, tests combinations of face (1-15) and body (1-3) variants
 * against multiple image sources to determine which variants actually exist.
 * Uses smart detection to optimize checking patterns.
 * 
 * @returns {Promise<void>} Results sent via parentPort
 */
async function run() {
    const { characters, allCharacters, useSmartDetection } = workerData;
    const results = [];

    const R2_CONFIG = require("../../r2-config.cjs");
    const sources = [
        R2_CONFIG.SOURCE_BASE_URL,
        R2_CONFIG.BACKUP_SOURCE_URL,
    ];

    for (const [baseId, char] of characters) {
        const confirmedVariants = [];

        for (let face = 1; face <= (useSmartDetection ? 15 : 5); face++) {
            for (let body = 1; body <= (useSmartDetection ? 3 : 1); body++) {
                const variant = `${baseId}#${face}$${body}`;
                const encoded = encodeURIComponent(variant);

                let found = false;
                for (const source of sources) {
                    if (await checkUrlExists(source + encoded + ".png")) {
                        confirmedVariants.push(variant);
                        found = true;
                        break;
                    }
                }
                if (!found && face > 2) break;
            }
        }

        if (confirmedVariants.length === 0)
            confirmedVariants.push(`${baseId}#1$1`);
        results.push([baseId, confirmedVariants.sort()]);
    }

    parentPort.postMessage({
        success: true,
        results: results,
    });
}

if (parentPort) run();
