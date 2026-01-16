/**
 * @fileoverview Arknights Story Parser Logic
 * @module arknights/story-parser
 * @description
 * Core parsing logic for extracting character IDs and speaker names from Arknights story files.
 * Implements focus-based character tracking to accurately map dialogue names to characters,
 * preventing cross-character name pollution and ensuring clean data extraction.
 *
 * @example
 * const { parseStory } = require('./story-parser');
 * const content = fs.readFileSync('story.txt', 'utf8');
 * const results = parseStory(content, 'main_01-01', 'zh_CN');
 *
 */

const fs = require("fs");
const path = require("path");
const { 
    shouldExcludeMapping, 
    shouldFilterSpecialName,
    EXCLUDE_IDS,
    applyCharacterFixes,
    SPECIAL_ID_MAPPINGS
} = require("../character-fixes-config.cjs");
const PROJECT_CONFIG = require("../../project-config.cjs");

const langExcludeCache = {};

/**
 * Load language-specific exclude rules from VitePress locale config
 * @param {string} langCode - Language code (zh_CN, en_US, ja_JP)
 * @returns {Object} Exclude rules object: { name: [charIds to exclude] }
 */
function loadLangExcludeRules(langCode) {
    if (langExcludeCache[langCode]) return langExcludeCache[langCode];

    const localeCode = PROJECT_CONFIG.getLocaleCode(langCode);
    const excludePath = path.resolve(
        __dirname,
        `../../../.vitepress/config/locale/${localeCode}/arknights-search-exclude.json`
    );

    if (fs.existsSync(excludePath)) {
        langExcludeCache[langCode] = JSON.parse(
            fs.readFileSync(excludePath, "utf8")
        );
    } else {
        langExcludeCache[langCode] = {};
    }
    return langExcludeCache[langCode];
}

/**
 * Check if character-name mapping should be excluded
 * @param {string} charId - Character ID
 * @param {string} speakerName - Speaker name from [name] tag
 * @param {string} langCode - Language code
 * @returns {boolean} True if mapping should be excluded
 */
function shouldExcludeMappingFull(charId, speakerName, langCode) {
    if (shouldExcludeMapping(charId, speakerName, langCode)) return true;

    const langRules = loadLangExcludeRules(langCode);
    const excludeList = langRules[speakerName] || [];
    const baseCharId = charId.split("#")[0];
    return excludeList.includes(baseCharId) || excludeList.includes(charId);
}

/**
 * Extract base character ID by removing face/body variants
 * @param {string} id - Full character ID with variants (e.g., char_002_amiya#5$1)
 * @returns {string} Base ID (e.g., char_002_amiya)
 */
function getBaseCharacterId(id) {
    if (!id) return "";
    const cleaned = id
        .replace(/[#\$]\d+/g, "")
        .trim()
        .toLowerCase();
    return cleaned || id.toLowerCase();
}


/**
 * Normalize character ID from story script format to standard format
 * @param {string} id - Raw character ID from story file
 * @returns {string} Normalized ID with face#body$ format, or empty if excluded
 * @example normalizeRawId("char_002_amiya#5") -> "char_002_amiya#5$1"
 */
function normalizeRawId(id) {
    if (!id || id === "" || id === "char_empty") return "";
    id = id.trim();
    const regex = /^(.*?)(?:#(\d+)(?:\s*#\d+)?)?(?:\$(\d+))?$/;
    const matches = regex.exec(id);
    if (!matches) return "";
    let baseId = matches[1].trim().replace(/\s+/g, "_").toLowerCase();

    if (SPECIAL_ID_MAPPINGS[baseId]) {
        baseId = SPECIAL_ID_MAPPINGS[baseId];
    }

    baseId = applyCharacterFixes(baseId);

    if (EXCLUDE_IDS.has(baseId)) return "";

    const faceNum = parseInt(matches[2] || "1", 10);
    const bodyNum = parseInt(matches[3] || "1", 10);
    return `${baseId}#${faceNum}$${bodyNum}`;
}

/**
 * Check if speaker name should be filtered out (meaningless names, system text, etc.)
 * @param {string} name - Speaker name to check
 * @param {string} langCode - Language code
 * @returns {boolean} True if name should be filtered
 */
function shouldFilterName(name, langCode = "zh_CN") {
    if (!name || typeof name !== "string") return true;
    const trimmed = name.trim();
    if (!trimmed || shouldFilterSpecialName(trimmed)) return true;

    const filterConfig = PROJECT_CONFIG.STORY_FILTER_CONFIG;
    const langSpecificFilters = filterConfig.meaninglessNames[langCode] || [];
    const allFilters = [...langSpecificFilters, ...filterConfig.commonFilters];

    if (allFilters.includes(trimmed)) return true;
    if (filterConfig.numericPattern.test(trimmed)) return true;
    return false;
}

const CharslotFocusMap = {
    l: 1,
    left: 1,
    m: 2,
    middle: 2,
    r: 3,
    right: 3,
    all: 99,
    a: 99,
    none: -1,
    n: -1,
};

const CharslotNameMap = {
    l: "",
    left: "",
    m: 2,
    middle: 2,
    r: 3,
    right: 3,
};

/**
 * Parse Arknights story file and extract character-name mappings
 * @param {string} text - Story file content
 * @param {string} storyId - Story file identifier (without .txt extension)
 * @param {string} langCode - Language code (zh_CN, en_US, ja_JP)
 * @returns {Map<string, Object>} Map of characterId -> { charId, speakerNames: [], storyFiles: [] }
 *
 * @description
 * Parses story script commands and dialogue to extract which characters speak which names.
 * Uses focus tracking to accurately determine the speaking character:
 * - Tracks [Character] and [charslot] commands to build character state
 * - Uses focus parameter to identify active speaker
 * - Cross-references names to prevent misassignment
 * - Only assigns first name to characters without prior names (prevents pollution)
 *
 * @example
 * const results = parseStory(content, 'main_01-01', 'zh_CN');
 * for (const [charId, data] of results) {
 *   console.log(`${charId}: ${data.speakerNames.join(', ')}`);
 * }
 */
function parseStory(text, storyId, langCode = "zh_CN") {
    const lines = text.split("\n");
    const stage = {
        spotlight: "",
        characters: {},
        speaker: 0,
        history: [],
        names: {},
    };

    const getSpeakingCharacter = () => {
        if (
            stage.speaker === 99 ||
            stage.speaker === -1 ||
            stage.speaker === 0 ||
            stage.speaker === ""
        )
            return null;
        const slotKey = stage.speaker === 1 ? "name" : `name${stage.speaker}`;
        return stage.characters[slotKey] || "";
    };

    lines.forEach((line) => {
        let trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("//")) return;
        trimmed = trimmed.replace(/\/\/.*$/, "").trim();
        if (!trimmed) return;

        const dialogMatch = trimmed.match(/\[name="([^"]+)"\]/);
        if (dialogMatch) {
            const speakerName = dialogMatch[1];
            let actualSpeaker = null;

            for (const [slot, variant] of Object.entries(stage.characters)) {
                const charId = getBaseCharacterId(variant);
                if (!charId) continue;

                if (stage.names[charId]?.has(speakerName)) {
                    actualSpeaker = variant;
                    break;
                }
            }

            if (!actualSpeaker) {
                const speakingChar = getSpeakingCharacter();
                if (speakingChar) {
                    const baseId = getBaseCharacterId(speakingChar);
                    if (
                        baseId &&
                        (!stage.names[baseId] || stage.names[baseId].size === 0)
                    ) {
                        actualSpeaker = speakingChar;
                    }
                }
            }

            if (actualSpeaker) {
                const baseId = getBaseCharacterId(actualSpeaker);
                if (
                    baseId &&
                    !shouldExcludeMappingFull(baseId, speakerName, langCode)
                ) {
                    if (!stage.names[baseId]) stage.names[baseId] = new Set();
                    stage.names[baseId].add(speakerName);
                }
            }
            return;
        }

        const cmdMatch = trimmed.match(/^\[([a-zA-Z]+)(\([^)]*\))?\]/);
        if (!cmdMatch) return;
        const cmd = cmdMatch[1].toLowerCase();
        const argsStr = cmdMatch[2]?.slice(1, -1) || "";
        const args = Object.fromEntries(
            argsStr
                .split(",")
                .map((p) =>
                    p
                        .split("=")
                        .map((s) => s?.trim().replace(/^["']|["']$/g, ""))
                )
        );

        if (cmd === "character") {
            if (!args.name && !args.name2) {
                stage.spotlight = "";
                stage.characters = {};
                stage.speaker = 0;
            } else {
                const variant1 = normalizeRawId(args.name);
                const variant2 = normalizeRawId(args.name2);

                stage.characters = {};
                if (variant1) {
                    stage.characters["name"] = variant1;
                    const baseId = getBaseCharacterId(variant1);
                    if (baseId) stage.history.push(baseId);
                }
                if (variant2) {
                    stage.characters["name2"] = variant2;
                    const baseId = getBaseCharacterId(variant2);
                    if (baseId) stage.history.push(baseId);
                }

                const focusArg = args.focus || "1";
                stage.speaker = parseInt(focusArg) || 1;
                stage.spotlight =
                    stage.speaker === 1 ? "name" : `name${stage.speaker}`;
            }
        } else if (cmd === "charslot") {
            if (!args || !args.name) {
                stage.spotlight = "";
                stage.characters = {};
                stage.speaker = 0;
            } else {
                const variant = normalizeRawId(args.name);
                if (variant) {
                    const basename = (name) => name.split("#")[0].split("$")[0];
                    const variantBase = basename(variant);
                    for (let key in stage.characters) {
                        if (basename(stage.characters[key]) === variantBase) {
                            delete stage.characters[key];
                        }
                    }

                    const slotKey = `name${
                        CharslotNameMap[args.slot] || args.slot
                    }`;
                    stage.characters[slotKey] = variant;

                    const baseId = getBaseCharacterId(variant);
                    if (baseId) stage.history.push(baseId);

                    stage.speaker =
                        CharslotFocusMap[args.focus] ||
                        CharslotNameMap[args.slot] ||
                        1;
                    stage.spotlight = slotKey;
                }
            }
        } else if (cmd === "dialog") {
            stage.spotlight = "";
            stage.characters = {};
            stage.speaker = 0;
        }
    });

    const results = new Map();
    new Set(stage.history).forEach((baseId) => {
        const names = Array.from(stage.names[baseId] || []).filter(
            (n) => !shouldFilterName(n, langCode)
        );
        if (names.length > 0) {
            results.set(baseId, {
                charId: baseId,
                speakerNames: names,
                storyFiles: [storyId],
            });
        }
    });
    return results;
}

/**
 * @exports arknights/story-parser
 * @type {Object}
 * @property {Function} parseStory - Main story parsing function
 * @property {Function} normalizeRawId - Normalize character ID format
 * @property {Function} shouldFilterName - Check if name should be filtered
 * @property {Function} getBaseCharacterId - Extract base ID without variants
 * @property {Function} shouldExcludeMappingFull - Check exclude rules
 * @property {Function} loadLangExcludeRules - Load language-specific excludes
 */
module.exports = {
    parseStory,
    normalizeRawId,
    shouldFilterName,
    getBaseCharacterId,
    shouldExcludeMappingFull,
    loadLangExcludeRules,
};
