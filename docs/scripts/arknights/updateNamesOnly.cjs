/**
 * @fileoverview Update Names.json Only
 * @module arknights/updateNamesOnly
 * @description
 * Safely updates names.json, storys.json, and search_index.json
 * without modifying characters.json. Useful for quick name updates
 * without full data regeneration.
 *
 * Uses existing story files if available, otherwise keeps current data.
 *
 * @example
 * const { updateNamesForLanguage } = require('./updateNamesOnly');
 * await updateNamesForLanguage('zh_CN');
 */

const fs = require("fs");
const path = require("path");
const PROJECT_CONFIG = require("../project-config.cjs");
const {
    getTargetStoryDir,
    getAllStoryFilesFromDir,
} = require("./core/story-extractor.cjs");
const { parseStory } = require("./core/story-parser.cjs");
const {
    loadGlobalCharacters,
    loadLanguageNames,
    saveLanguageNames,
    saveLanguageStorys,
    saveLanguageSearchIndex,
    loadLanguageStorys,
} = require("./api/characters-api.cjs");

/**
 * Load language-specific exclude rules
 * @param {string} langCode - Language code
 * @returns {Object} Exclude rules
 */
function loadExcludeRules(langCode) {
    const localeCode = PROJECT_CONFIG.getLocaleCode(langCode);
    const excludePath = path.resolve(
        __dirname,
        `../../.vitepress/config/locale/${localeCode}/arknights-search-exclude.json`
    );
    if (fs.existsSync(excludePath)) {
        console.log(` Loaded exclude rules for ${langCode} from ${localeCode}`);
        return JSON.parse(fs.readFileSync(excludePath, "utf8"));
    }
    console.log(` No exclude rules found for ${langCode}`);
    return {};
}

/**
 * Load global combine rules
 * @returns {Object} Combine rules
 */
function loadCombineRules() {
    const combinePath = path.resolve(
        __dirname,
        "../../.vitepress/config/arknights-combine.json"
    );
    if (fs.existsSync(combinePath)) {
        console.log(`Loaded combine rules`);
        return JSON.parse(fs.readFileSync(combinePath, "utf8"));
    }
    return {};
}

async function updateNamesForLanguage(langCode) {
    console.log(`\nUpdating names for ${langCode}...`);

    const globalChars = loadGlobalCharacters();
    const validCharIds = new Set(Object.keys(globalChars));

    console.log(
        `Found ${validCharIds.size} valid character IDs in global characters.json`
    );

    const existingNames = loadLanguageNames(langCode);
    const characterStorys = loadLanguageStorys(langCode);

    const storyDir = getTargetStoryDir(langCode);
    const storyFiles = getAllStoryFilesFromDir(storyDir);

    let finalNames = { ...existingNames };
    let updatedFromStories = 0;

    if (storyFiles.length > 0) {
        console.log(`Parsing ${storyFiles.length} story files...`);

        const characterNames = {};

        for (const storyFile of storyFiles) {
            try {
                const fullPath = path.resolve(storyDir, storyFile);
                const content = fs.readFileSync(fullPath, "utf8");
                const storyId = path.basename(storyFile, ".txt");
                const parsed = parseStory(content, storyId, langCode);

                for (const [charId, data] of parsed) {
                    if (validCharIds.has(charId)) {
                        if (!characterNames[charId]) {
                            characterNames[charId] = {
                                speakerNames: new Set(),
                                displayName: data.speakerNames[0] || charId,
                            };
                        }
                        data.speakerNames.forEach((name) =>
                            characterNames[charId].speakerNames.add(name)
                        );

                        if (data.storyFiles && data.storyFiles.length > 0) {
                            const combineRules = loadCombineRules();
                            const targetId = combineRules[charId] || charId;
                            const existing = characterStorys[targetId] || [];
                            characterStorys[targetId] = Array.from(
                                new Set([...existing, ...data.storyFiles])
                            ).sort();
                        }
                    }
                }
            } catch (error) {
                console.error(`Error parsing ${storyFile}:`, error.message);
            }
        }

        for (const [charId, data] of Object.entries(characterNames)) {
            const speakerNames = Array.from(data.speakerNames);
            finalNames[charId] = {
                speakerNames,
                searchNames: speakerNames,
                displayName: data.displayName,
            };
            updatedFromStories++;
        }

        for (const charId of Object.keys(existingNames)) {
            if (validCharIds.has(charId) && !finalNames[charId]) {
                finalNames[charId] = existingNames[charId];
            }
        }

        console.log(
            `Extracted names for ${
                Object.keys(finalNames).length
            } characters (${updatedFromStories} from stories, ${
                Object.keys(finalNames).length - updatedFromStories
            } kept)`
        );
    } else {
        console.warn(
            `WARNING: No story files found for ${langCode}, using existing names data`
        );
    }

    const excludeRules = loadExcludeRules(langCode);
    const combineRules = loadCombineRules();

    let cleanupCount = 0;
    for (const [name, excludedCharIds] of Object.entries(excludeRules)) {
        for (const charId of excludedCharIds) {
            if (finalNames[charId] && finalNames[charId].speakerNames) {
                const before = finalNames[charId].speakerNames.length;
                finalNames[charId].speakerNames = finalNames[
                    charId
                ].speakerNames.filter((n) => n !== name);
                finalNames[charId].searchNames =
                    finalNames[charId].speakerNames;
                if (finalNames[charId].speakerNames.length < before) {
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

    let excludedCount = 0;
    let combinedCount = 0;

    for (const [id, data] of Object.entries(finalNames)) {
        const names = new Set();
        if (data.displayName) names.add(data.displayName);
        if (data.speakerNames) data.speakerNames.forEach((n) => names.add(n));
        if (data.searchNames) data.searchNames.forEach((n) => names.add(n));

        for (const name of names) {
            if (!name || name.trim() === "") continue;

            const excludeList = excludeRules[name] || [];
            if (excludeList.includes(id)) {
                excludedCount++;
                continue;
            }

            const actualId = combineRules[id] || id;
            if (combineRules[id]) combinedCount++;

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

    console.log(
        `Applied rules: ${excludedCount} excluded, ${combinedCount} combined`
    );

    let duplicateCount = 0;
    for (const value of Object.values(searchIndex)) {
        if (Array.isArray(value)) duplicateCount++;
    }

    console.log(
        `Generated search index: ${
            Object.keys(searchIndex).length
        } terms (${duplicateCount} with duplicates)`
    );

    saveLanguageNames(langCode, finalNames);
    saveLanguageStorys(langCode, characterStorys);
    saveLanguageSearchIndex(langCode, searchIndex);
}

async function main() {
    const languages = ["zh_CN", "en_US", "ja_JP"];

    for (const lang of languages) {
        await updateNamesForLanguage(lang);
    }

    console.log("\nAll names.json files updated successfully!");
}

main().catch(console.error);
