/**
 * @fileoverview Story Parser Worker
 * @module arknights/workers/story-parser-worker
 * @description
 * Background worker thread for parsing Arknights story files in parallel.
 * Processes assigned story file chunks and extracts character-name mappings
 * using the focus-tracking story parser.
 *
 * @example
 * // Worker is spawned by main-fetcher.cjs
 * // workerData: { storyFiles: [], baseDir: string, langCode: string }
 * // Returns: { success: true, results: [[charId, data], ...], processedCount: number }
 */

const { parentPort, workerData } = require("worker_threads");
const fs = require("fs");
const path = require("path");
const { parseStory } = require("../core/story-parser.cjs");

/**
 * Parse assigned story files and extract character data
 * @async
 * @description
 * Processes each story file in the assigned chunk:
 * 1. Reads file content from disk
 * 2. Parses with focus-tracking story parser
 * 3. Merges results for duplicate characters
 * 4. Returns consolidated character-name mappings
 *
 * @returns {Promise<void>} Results sent via parentPort
 */
async function run() {
    const { storyFiles, baseDir, langCode = "zh_CN" } = workerData;
    const results = new Map();

    for (const storyFile of storyFiles) {
        try {
            const filePath = path.join(baseDir, storyFile);
            if (fs.existsSync(filePath)) {
                const text = fs.readFileSync(filePath, "utf-8");
                const parsed = parseStory(text, storyFile, langCode);

                for (const [id, data] of parsed) {
                    if (results.has(id)) {
                        const existing = results.get(id);
                        existing.speakerNames = [
                            ...new Set([
                                ...existing.speakerNames,
                                ...data.speakerNames,
                            ]),
                        ];
                        existing.storyFiles = [
                            ...new Set([
                                ...existing.storyFiles,
                                ...data.storyFiles,
                            ]),
                        ];
                    } else {
                        results.set(id, data);
                    }
                }
            }
        } catch (e) {
            console.error(
                `ERROR: Worker failed to parse ${storyFile}: ${e.message}`
            );
        }
    }

    parentPort.postMessage({
        success: true,
        results: Array.from(results.entries()),
        processedCount: storyFiles.length,
    });
}

if (parentPort) run();
