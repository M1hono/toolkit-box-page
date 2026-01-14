/**
 * @fileoverview Image Verification Worker
 * @description Background worker for verifying character variant image existence
 */

const { parentPort, workerData } = require("worker_threads");
const { checkUrlExists } = require("../../shared/network-utils.cjs");

/**
 * Background process to verify image existence for assigned character variants
 */
async function run() {
    const { characters, allCharacters, useSmartDetection } = workerData;
    const results = [];

    const sources = [
        "https://raw.githubusercontent.com/akgcc/arkdata/main/assets/avg/characters/",
        "https://raw.githubusercontent.com/Aceship/Arknight-Images/main/avg/characters/"
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

        if (confirmedVariants.length === 0) confirmedVariants.push(`${baseId}#1$1`);
        results.push([baseId, confirmedVariants.sort()]);
    }

    parentPort.postMessage({
        success: true,
        results: results
    });
}

if (parentPort) run();
