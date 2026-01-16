/**
 * @fileoverview Arknights Variant Generation Logic
 * @description Manages character variant discovery and verification using worker threads
 */

const { Worker } = require("worker_threads");
const path = require("path");

/**
 * Verifies character variants via physical image asset checks in worker threads
 * @param {Map} allCharacters - Raw extracted character map
 * @param {Map} mergedCharacters - Unified character map
 * @param {Object} scanState - Current execution scan state
 * @param {Object} options - Configuration options
 * @returns {Promise<Map>} - Updated character data with valid variants
 */
async function generateVariants(
    allCharacters,
    mergedCharacters,
    scanState,
    options = {}
) {
    const {
        checkImages = false,
        quietMode = false,
        useSmartDetection = true,
        maxScans = 300,
    } = options;

    const charsToScan = [];
    const charactersArray = Array.from(mergedCharacters.entries());

    for (const [id, char] of charactersArray) {
        if (shouldScan(id, char, scanState, options)) {
            charsToScan.push([id, char]);
        }
    }

    const activeScans = charsToScan.slice(0, maxScans);
    console.log(
        ` Processing ${activeScans.length} characters for variants (${
            checkImages ? "image check" : "metadata only"
        })`
    );

    if (!checkImages) {
        for (const [id, char] of mergedCharacters) {
            const inferred = [];
            for (const [fullId] of allCharacters) {
                if (fullId.startsWith(id + "#")) inferred.push(fullId);
            }
            char.validVariants =
                inferred.length > 0 ? inferred.sort() : [`${id}#1$1`];
        }
        return mergedCharacters;
    }

    const results = await runVerificationWorkers(
        activeScans,
        allCharacters,
        options
    );

    for (const [id, variants] of results) {
        const char = mergedCharacters.get(id);
        if (char) {
            char.validVariants = variants;
        }
    }

    return mergedCharacters;
}

/**
 * Determines if a character should be scanned in the current session
 * @private
 */
function shouldScan(id, char, scanState, options) {
    if (options.targetChar && id !== options.targetChar) return false;
    if (options.scanAll) return true;

    const stats = scanState[id] || { lastScanTime: 0 };
    const now = Date.now();
    const daysSince = (now - stats.lastScanTime) / (1000 * 60 * 60 * 24);

    return !stats.lastScanTime || daysSince > 1;
}

/**
 * Spawns worker threads to handle image existence verification
 * @private
 */
async function runVerificationWorkers(tasks, allCharacters, options) {
    const workerCount = Math.min(tasks.length, 6);
    if (workerCount === 0) return new Map();

    const chunks = Array.from({ length: workerCount }, (_, i) =>
        tasks.slice(
            Math.floor((tasks.length * i) / workerCount),
            Math.floor((tasks.length * (i + 1)) / workerCount)
        )
    );

    const promises = chunks.map((chunk, index) => {
        return new Promise((resolve, reject) => {
            const worker = new Worker(
                path.resolve(__dirname, "../workers/image-check-worker.cjs"),
                {
                    workerData: {
                        characters: chunk,
                        allCharacters: Array.from(allCharacters.entries()),
                        quietMode: options.quietMode,
                        useSmartDetection: options.useSmartDetection,
                    },
                }
            );

            worker.on("message", (res) =>
                res.success
                    ? resolve(res.results)
                    : reject(new Error(res.error))
            );
            worker.on("error", reject);
            worker.on(
                "exit",
                (code) =>
                    code !== 0 &&
                    reject(
                        new Error(`Worker ${index} exited with code ${code}`)
                    )
            );
        });
    });

    const resultsArray = await Promise.all(promises);
    const finalResults = new Map();
    resultsArray.forEach((workerRes) =>
        workerRes.forEach(([id, variants]) => finalResults.set(id, variants))
    );
    return finalResults;
}

module.exports = {
    generateVariants,
};
