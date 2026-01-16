/**
 * @fileoverview Arknights Data Consolidator
 * @module arknights/data-consolidator
 * @description
 * Consolidates parsed story data into structured JSON files for frontend consumption.
 * Handles data merging, combine rules, exclude rules, and cleanup operations.
 *
 * Output files:
 * - global/arknights/characters.json - Character metadata
 * - {lang}/arknights/names.json - Character names per language
 * - {lang}/arknights/storys.json - Story file mappings
 * - {lang}/arknights/search_index.json - Name search index
 *
 * @example
 * const { consolidateResults } = require('./data-consolidator');
 * await consolidateResults(parsedCharacters, 'zh_CN');
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
const PROJECT_CONFIG = require("../../project-config.cjs");
const fs = require("fs");
const path = require("path");

/**
 * Load language-specific exclude rules
 * @param {string} langCode - Language code (zh_CN, en_US, ja_JP)
 * @returns {Object} Exclude rules: { name: [charIds] }
 */
function loadExcludeRules(langCode) {
    const localeCode = PROJECT_CONFIG.getLocaleCode(langCode);
    const excludePath = path.resolve(
        __dirname,
        `../../../.vitepress/config/locale/${localeCode}/arknights-search-exclude.json`
    );
    return fs.existsSync(excludePath)
        ? JSON.parse(fs.readFileSync(excludePath, "utf8"))
        : {};
}

/**
 * Load global character fixes
 * @returns {Object} Character fixes: { sourceId: targetId }
 */
function loadCharacterFixes() {
    const fixesPath = path.resolve(
        __dirname,
        "../../../.vitepress/config/arknights-fixes.json"
    );
    return fs.existsSync(fixesPath)
        ? JSON.parse(fs.readFileSync(fixesPath, "utf8"))
        : {};
}

/**
 * Consolidate parsed story results into structured data files
 * @param {Map} results - Parsed character data from story files
 * @param {string} langCode - Language code (zh_CN, en_US, ja_JP)
 * @returns {Promise<void>}
 */
async function consolidateResults(results, langCode) {
    const globalChars = loadGlobalCharacters();
    const langNames = loadLanguageNames(langCode);
    const langStorys = loadLanguageStorys(langCode);
    const scanState = loadScanState();
    const characterFixes = loadCharacterFixes();

    const isMasterSource = langCode === "zh_CN";
    let newChars = 0;
    let updatedNames = 0;

    for (const [baseId, data] of results) {
        const targetId = characterFixes[baseId] || baseId;
        if (isMasterSource || !globalChars[targetId]) {
            if (!globalChars[targetId]) {
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

        if (isMasterSource) {
            updateCharacterScanStats(
                targetId,
                scanState,
                globalChars[targetId].validVariants.length
            );
        }

        if (data.speakerNames && data.speakerNames.length > 0) {
            langNames[targetId] = {
                speakerNames: data.speakerNames,
                searchNames: data.speakerNames,
                displayName: data.speakerNames[0] || targetId,
            };
            updatedNames++;
        } else if (!langNames[targetId]) {
            langNames[targetId] = {
                speakerNames: langNames[targetId]?.speakerNames || [],
                searchNames: langNames[targetId]?.searchNames || [],
                displayName: langNames[targetId]?.displayName || targetId,
            };
        }
        if (data.storyFiles && data.storyFiles.length > 0) {
            const existingStorys = langStorys[targetId] || [];
            langStorys[targetId] = Array.from(
                new Set([...existingStorys, ...data.storyFiles])
            ).sort();
        }
    }
    Object.keys(characterFixes).forEach((sourceId) => {
        const targetId = characterFixes[sourceId];
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
    const searchIndex = {};

    for (const [id, data] of Object.entries(langNames)) {
        const names = new Set();
        if (data.displayName) names.add(data.displayName);
        if (data.speakerNames) data.speakerNames.forEach((n) => names.add(n));
        if (data.searchNames) data.searchNames.forEach((n) => names.add(n));

        for (const name of names) {
            if (!name || name.trim() === "") continue;
            const excludeList = excludeRules[name] || [];
            if (excludeList.includes(id)) {
                continue;
            }
            const actualId = combineRules[id] || id;
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

    let validStoryPaths = null;
    try {
        const axios = require("axios");
        const PROJECT_CONFIG = require("../../project-config.cjs");
        const dataSource = PROJECT_CONFIG.getArknightsDataUrl(langCode);

        if (dataSource) {
            const response = await axios.get(
                `${dataSource}/gamedata/excel/story_review_table.json`,
                { timeout: 30000 }
            );
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
        console.warn(
            `   Could not load story_review_table for cleanup: ${error.message}`
        );
    }
    let cleanedStoryPaths = 0;
    if (validStoryPaths) {
        for (const charId of Object.keys(langStorys)) {
            if (langStorys[charId] && Array.isArray(langStorys[charId])) {
                const originalLength = langStorys[charId].length;
                langStorys[charId] = langStorys[charId].filter(
                    (storyPath) =>
                        validStoryPaths.has(storyPath) ||
                        validStoryPaths.has(storyPath.replace(/\.txt$/, ""))
                );
                cleanedStoryPaths += originalLength - langStorys[charId].length;
            }
        }
        if (cleanedStoryPaths > 0) {
            console.log(`   Removed ${cleanedStoryPaths} obsolete story paths`);
        }
    }
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

/**
 * @exports arknights/data-consolidator
 */
module.exports = {
    consolidateResults,
};
