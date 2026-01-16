/**
 * @fileoverview Main Arknights Data Fetcher Orchestrator
 * @module arknights/main-fetcher
 * @description
 * Central orchestrator for Arknights data processing pipeline:
 * 1. Reads synced story files
 * 2. Parses stories in parallel (worker threads)
 * 3. Generates character variants
 * 4. Consolidates into structured JSON
 *
 * @example
 * const { syncLanguage } = require('./main-fetcher');
 * await syncLanguage('zh_CN', { checkImages: true });
 */

const {
    getTargetStoryDir,
    getAllStoryFilesFromDir,
} = require("./core/story-extractor.cjs");
const { generateVariants } = require("./core/variant-generator.cjs");
const { consolidateResults } = require("./core/data-consolidator.cjs");
const { loadScanState } = require("./api/scan-stats-api.cjs");
const { Worker } = require("worker_threads");
const path = require("path");
const PROJECT_CONFIG = require("../project-config.cjs");

/**
 * Orchestrate full data processing workflow for a language
 * @param {string} langCode - Language code (zh_CN, en_US, ja_JP)
 * @param {Object} [options={}] - Processing options
 * @param {boolean} [options.checkImages=false] - Verify image variants
 * @returns {Promise<void>}
 */
async function syncLanguage(langCode, options = {}) {
    console.log(`Starting character data processing for: ${langCode}`);

    const storyDir = getTargetStoryDir(langCode);
    const storyFiles = getAllStoryFilesFromDir(storyDir);

    if (storyFiles.length === 0) {
        console.warn(
            `WARNING: No story files found for ${langCode} in ${storyDir}. Skipping.`
        );
        return;
    }

    console.log(
        `Processing ${storyFiles.length} story files for ${langCode}...`
    );

    const allCharacters = await runParsingWorkers(
        langCode,
        storyFiles,
        options
    );

    console.log(`Found ${allCharacters.size} characters in stories.`);

    const scanState = loadScanState();
    const mergedCharacters = await generateVariants(
        allCharacters,
        allCharacters,
        scanState,
        options
    );

    await consolidateResults(mergedCharacters, langCode);
}

/**
 * Parse story files using worker threads for parallel processing
 * @private
 * @param {string} langCode - Language code
 * @param {string[]} files - Array of story file paths
 * @param {Object} options - Parsing options
 * @returns {Promise<Map>} Character data map
 */
async function runParsingWorkers(langCode, files, options) {
    const workerCount = Math.min(files.length, 4);
    if (workerCount === 0) return new Map();

    const langPath = PROJECT_CONFIG.getDataPath(langCode, "arknights");
    const baseDir = path.resolve(langPath, "story");

    const chunks = Array.from({ length: workerCount }, (_, i) =>
        files.slice(
            Math.floor((files.length * i) / workerCount),
            Math.floor((files.length * (i + 1)) / workerCount)
        )
    );

    const promises = chunks.map((chunk, index) => {
        return new Promise((resolve, reject) => {
            const worker = new Worker(
                path.resolve(__dirname, "./workers/story-parser-worker.cjs"),
                {
                    workerData: { storyFiles: chunk, baseDir, langCode },
                }
            );
            worker.on("message", (res) =>
                res.success
                    ? resolve(res.results)
                    : reject(new Error(res.error))
            );
            worker.on("error", reject);
        });
    });

    const resultsArray = await Promise.all(promises);
    const finalMap = new Map();
    resultsArray.flat().forEach(([id, data]) => {
        if (finalMap.has(id)) {
            const existing = finalMap.get(id);
            existing.speakerNames = [
                ...new Set([...existing.speakerNames, ...data.speakerNames]),
            ];
        } else {
            finalMap.set(id, data);
        }
    });
    return finalMap;
}

/**
 * Process all supported languages
 * @returns {Promise<void>}
 */
async function main() {
    const langs = PROJECT_CONFIG.GAMES.arknights.supported_langs;
    for (const lang of langs) {
        await syncLanguage(lang, { checkImages: true });
    }
}

if (require.main === module) main();

/**
 * @exports arknights/main-fetcher
 * @property {Function} syncLanguage - Process single language
 * @property {Function} main - Process all languages
 */
module.exports = { syncLanguage, main };
