/**
 * @fileoverview Arknights Data Consolidator
 * @description Merges and splits character data between global metadata and language-specific names
 * IMPORTANT: Only updates/merges data, never deletes existing entries
 */

const {
    loadGlobalCharacters,
    loadLanguageNames,
    loadLanguageStorys,
    saveGlobalCharacters,
    saveLanguageNames,
    saveLanguageStorys,
    saveLanguageSearchIndex,
} = require("../api/characters-api.cjs");
const {
    loadScanState,
    saveScanState,
    updateCharacterScanStats,
} = require("../api/scan-stats-api.cjs");
const { getBaseCharacterId } = require("./story-parser.cjs");
const fs = require("fs");
const path = require("path");

/**
 * Load exclude rules for search index
 */
function loadExcludeRules(langCode) {
    const langMap = { zh_CN: "zh-CN", en_US: "en-US", ja_JP: "ja" };
    const configLang = langMap[langCode] || langCode;
    const excludePath = path.resolve(
        __dirname,
        `../../../.vitepress/config/locale/${configLang}/arknights-search-exclude.json`
    );
    return fs.existsSync(excludePath)
        ? JSON.parse(fs.readFileSync(excludePath, "utf8"))
        : {};
}

/**
 * Load combine rules (global)
 */
function loadCombineRules() {
    const combinePath = path.resolve(
        __dirname,
        "../../.vitepress/config/arknights-combine.json"
    );
    return fs.existsSync(combinePath)
        ? JSON.parse(fs.readFileSync(combinePath, "utf8"))
        : {};
}

async function consolidateResults(results, langCode) {
    const globalChars = loadGlobalCharacters();
    const langNames = loadLanguageNames(langCode);
    const langStorys = loadLanguageStorys(langCode);
    const scanState = loadScanState();
    const combineRules = loadCombineRules();

    const isMasterSource = langCode === "zh_CN";
    let newChars = 0;
    let updatedNames = 0;

    for (const [baseId, data] of results) {
        // Apply combine rule
        const targetId = combineRules[baseId] || baseId;

        // Update global character metadata
        if (isMasterSource || !globalChars[targetId]) {
            if (!globalChars[targetId]) {
                // Rename variants to match targetId
                const renamedVariants = (
                    data.validVariants || [`${targetId}#1$1`]
                ).map((v) => v.replace(baseId, targetId));

                globalChars[targetId] = {
                    charId: targetId,
                    validVariants: renamedVariants,
                    charType: targetId.startsWith("char_") ? "operator" : "npc",
                    dialogCount: 0,
                };
                newChars++;
            } else {
                if (data.validVariants && data.validVariants.length > 0) {
                    // Rename variants when merging
                    const renamedVariants = data.validVariants.map((v) =>
                        v.replace(baseId, targetId)
                    );
                    const existingVariants = new Set(
                        globalChars[targetId].validVariants
                    );
                    renamedVariants.forEach((v) => existingVariants.add(v));
                    globalChars[targetId].validVariants =
                        Array.from(existingVariants).sort();
                }
            }
        }

        // Update scan stats if this is the master source
        if (isMasterSource) {
            updateCharacterScanStats(
                targetId,
                scanState,
                globalChars[targetId].validVariants.length
            );
        }

        // Update language-specific names (use targetId after combine)
        // REPLACE names from story parsing, don't merge with old data
        if (data.speakerNames && data.speakerNames.length > 0) {
            langNames[targetId] = {
                speakerNames: data.speakerNames,
                searchNames: data.speakerNames,
                displayName: data.speakerNames[0] || targetId,
            };
            updatedNames++;
        } else if (!langNames[targetId]) {
            // Only keep existing if character not found in stories
            langNames[targetId] = {
                speakerNames: langNames[targetId]?.speakerNames || [],
                searchNames: langNames[targetId]?.searchNames || [],
                displayName: langNames[targetId]?.displayName || targetId,
            };
        }

        // Update language-specific story mappings
        if (data.storyFiles && data.storyFiles.length > 0) {
            const existingStorys = langStorys[targetId] || [];
            langStorys[targetId] = Array.from(
                new Set([...existingStorys, ...data.storyFiles])
            ).sort();
        }
    }

    // Clean up: Remove source IDs that should be combined
    Object.keys(combineRules).forEach((sourceId) => {
        const targetId = combineRules[sourceId];
        if (sourceId !== targetId) {
            if (globalChars[sourceId]) {
                console.log(
                    `  Removing combined source: ${sourceId} (→ ${targetId})`
                );
                delete globalChars[sourceId];
            }
            if (langNames[sourceId]) {
                console.log(
                    `  Removing combined source from names: ${sourceId}`
                );
                delete langNames[sourceId];
            }
            if (langStorys[sourceId]) {
                console.log(
                    `  Removing combined source from storys: ${sourceId}`
                );
                delete langStorys[sourceId];
            }
        }
    });

    // Bidirectional cleanup FIRST: Remove excluded names from speakerNames BEFORE search index generation
    const excludeRules = loadExcludeRules(langCode);
    let cleanupCount = 0;
    for (const [name, excludedCharIds] of Object.entries(excludeRules)) {
        for (const charId of excludedCharIds) {
            if (langNames[charId] && langNames[charId].speakerNames) {
                const before = langNames[charId].speakerNames.length;
                langNames[charId].speakerNames = langNames[
                    charId
                ].speakerNames.filter((n) => n !== name);
                langNames[charId].searchNames = langNames[charId].speakerNames;
                if (langNames[charId].speakerNames.length < before) {
                    cleanupCount++;
                }
            }
        }
    }
    if (cleanupCount > 0) {
        console.log(
            `  Cleaned ${cleanupCount} speakerNames entries via exclude rules`
        );
    }

    // Generate search index: name -> charId (after cleanup, so excluded entries won't appear)
    const searchIndex = {};

    for (const [id, data] of Object.entries(langNames)) {
        const names = new Set();
        if (data.displayName) names.add(data.displayName);
        if (data.speakerNames) data.speakerNames.forEach((n) => names.add(n));
        if (data.searchNames) data.searchNames.forEach((n) => names.add(n));

        for (const name of names) {
            if (!name || name.trim() === "") continue;

            // Double-check exclude rules (for names that might still appear in displayName)
            const excludeList = excludeRules[name] || [];
            if (excludeList.includes(id)) {
                continue;
            }

            // Apply combine rules
            const actualId = combineRules[id] || id;

            // Support multiple characters with the same name (with deduplication)
            if (!searchIndex[name]) {
                searchIndex[name] = actualId;
            } else if (typeof searchIndex[name] === "string") {
                if (searchIndex[name] !== actualId) {
                    searchIndex[name] = [searchIndex[name], actualId];
                }
            } else if (Array.isArray(searchIndex[name])) {
                if (!searchIndex[name].includes(actualId)) {
                    searchIndex[name].push(actualId);
                }
            }
        }
    }

    // Clean up storys.json: Remove story paths that no longer exist
    // Build set of valid story paths from story_review_table
    let validStoryPaths = null;
    try {
        const axios = require('axios');
        const PROJECT_CONFIG = require('../../project-config.cjs');
        const dataSource = PROJECT_CONFIG.getArknightsDataUrl(langCode);
        
        if (dataSource) {
            const response = await axios.get(`${dataSource}/gamedata/excel/story_review_table.json`, { timeout: 30000 });
            validStoryPaths = new Set();
            for (const actData of Object.values(response.data)) {
                if (actData?.infoUnlockDatas) {
                    for (const story of actData.infoUnlockDatas) {
                        if (story.storyTxt) {
                            validStoryPaths.add(story.storyTxt);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.warn(`   Could not load story_review_table for cleanup: ${error.message}`);
    }

    // Remove non-existent story paths from each character
    let cleanedStoryPaths = 0;
    if (validStoryPaths) {
        for (const charId of Object.keys(langStorys)) {
            if (langStorys[charId] && Array.isArray(langStorys[charId])) {
                const originalLength = langStorys[charId].length;
                langStorys[charId] = langStorys[charId].filter(storyPath => 
                    validStoryPaths.has(storyPath) || validStoryPaths.has(storyPath.replace(/\.txt$/, ''))
                );
                cleanedStoryPaths += originalLength - langStorys[charId].length;
            }
        }
        if (cleanedStoryPaths > 0) {
            console.log(`   Removed ${cleanedStoryPaths} obsolete story paths`);
        }
    }

    // Clean up: Remove characters that have no stories
    let cleanedChars = 0;
    for (const charId of Object.keys(langNames)) {
        if (!langStorys[charId] || langStorys[charId].length === 0) {
            delete langNames[charId];
            cleanedChars++;
        }
    }
    if (cleanedChars > 0) {
        console.log(`   Removed ${cleanedChars} characters with no stories`);
    }

    saveGlobalCharacters(globalChars);
    saveLanguageNames(langCode, langNames);
    saveLanguageStorys(langCode, langStorys);
    saveLanguageSearchIndex(langCode, searchIndex);
    saveScanState(scanState);

    // Save debug info if Kal'tsit debug is enabled
    if (process.env.DEBUG_KALTS === 'true') {
        const { KALTS_DEBUG } = require('./story-parser.cjs');
        if (KALTS_DEBUG.issues.length > 0) {
            const debugFile = path.resolve(__dirname, `../debug-kalts-${langCode}.json`);
            fs.writeFileSync(debugFile, JSON.stringify(KALTS_DEBUG.issues, null, 2), 'utf8');
            console.log(`   ⚠️  Kal'tsit debug: ${KALTS_DEBUG.issues.length} issues found → ${debugFile}`);
        }
    }

    console.log(`Consolidation complete for ${langCode}`);
    console.log(
        `   Global: ${Object.keys(globalChars).length} total (${newChars} new)`
    );
    console.log(
        `   Names: ${
            Object.keys(langNames).length
        } total (${updatedNames} updated)`
    );
    console.log(
        `   Stories Mapped: ${Object.keys(langStorys).length} characters`
    );
    console.log(`   Search Index: ${Object.keys(searchIndex).length} terms`);
}

module.exports = {
    consolidateResults,
};
