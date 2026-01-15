/**
 * @fileoverview Story Parser Worker
 * @description Background worker for parsing Arknights story files
 */

const { parentPort, workerData } = require("worker_threads");
const fs = require("fs");
const path = require("path");
const { parseStory } = require("../core/story-parser.cjs");

/**
 * Background process to parse assigned story files
 */
async function run() {
    const { storyFiles, baseDir, langCode = 'zh_CN' } = workerData;
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
                        existing.speakerNames = [...new Set([...existing.speakerNames, ...data.speakerNames])];
                        existing.storyFiles = [...new Set([...existing.storyFiles, ...data.storyFiles])];
                    } else {
                        results.set(id, data);
                    }
                }
            }
        } catch (e) {
            console.error(`ERROR: Worker failed to parse ${storyFile}: ${e.message}`);
        }
    }

    parentPort.postMessage({
        success: true,
        results: Array.from(results.entries()),
        processedCount: storyFiles.length
    });
}

if (parentPort) run();
