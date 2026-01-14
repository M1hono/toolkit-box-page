/**
 * @fileoverview Main Arknights Data Fetcher Orchestrator
 * @description Central script for identifying, downloading, and processing Arknights gamedata across multiple languages
 */

const { getTargetStoryDir, countStoryFiles, getAllStoryFilesFromDir } = require('./core/story-extractor.cjs');
const { generateVariants } = require('./core/variant-generator.cjs');
const { consolidateResults } = require('./core/data-consolidator.cjs');
const { loadScanState } = require('./api/scan-stats-api.cjs');
const { Worker } = require("worker_threads");
const path = require("path");
const fs = require("fs");
const PROJECT_CONFIG = require('../project-config.cjs');

/**
 * Orchestrates the full acquisition workflow for a specific language
 * @param {string} langCode - Target language identifier
 * @param {Object} options - Execution flags and session parameters
 */
async function syncLanguage(langCode, options = {}) {
    console.log(`🚀 Starting character data processing for: ${langCode}`);
    
    const storyDir = getTargetStoryDir(langCode);
    const storyFiles = getAllStoryFilesFromDir(storyDir);
    
    if (storyFiles.length === 0) {
        console.warn(`⚠️  No story files found for ${langCode} in ${storyDir}. Skipping.`);
        return;
    }
    
    console.log(`📖 Processing ${storyFiles.length} story files for ${langCode}...`);
    
    const allCharacters = await runParsingWorkers(langCode, storyFiles, options);
    
    console.log(`👥 Found ${allCharacters.size} characters in stories.`);
    
    const scanState = loadScanState();
    const mergedCharacters = await generateVariants(allCharacters, allCharacters, scanState, options);
    
    consolidateResults(mergedCharacters, langCode);
}

/**
 * Executes multithreaded parsing session
 * @private
 */
async function runParsingWorkers(langCode, files, options) {
    const workerCount = Math.min(files.length, 4);
    if (workerCount === 0) return new Map();

    const langPath = PROJECT_CONFIG.getDataPath(langCode, 'arknights');
    const baseDir = path.resolve(langPath, 'story');

    const chunks = Array.from({ length: workerCount }, (_, i) => 
        files.slice(Math.floor(files.length * i / workerCount), Math.floor(files.length * (i + 1) / workerCount))
    );

    const promises = chunks.map((chunk, index) => {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.resolve(__dirname, "./workers/story-parser-worker.cjs"), {
                workerData: { storyFiles: chunk, baseDir, langCode }
            });
            worker.on("message", (res) => res.success ? resolve(res.results) : reject(new Error(res.error)));
            worker.on("error", reject);
        });
    });

    const resultsArray = await Promise.all(promises);
    const finalMap = new Map();
    resultsArray.flat().forEach(([id, data]) => {
        if (finalMap.has(id)) {
            const existing = finalMap.get(id);
            existing.speakerNames = [...new Set([...existing.speakerNames, ...data.speakerNames])];
        } else {
            finalMap.set(id, data);
        }
    });
    return finalMap;
}

/**
 * Main application entry point
 */
async function main() {
    const langs = PROJECT_CONFIG.GAMES.arknights.supported_langs;
    for (const lang of langs) {
        await syncLanguage(lang, { checkImages: true });
    }
}

if (require.main === module) main();

module.exports = { syncLanguage, main };
