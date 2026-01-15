/**
 * @fileoverview Arknights Story Parser Logic
 * @description Core parsing logic for extracting character IDs and names from story text
 */

const fs = require('fs');
const path = require('path');
const { shouldExcludeMapping } = require('../arknights-exclude-config.cjs');
const { shouldFilterSpecialName } = require('../arknights-special-config.cjs');
const PROJECT_CONFIG = require('../../project-config.cjs');

const langExcludeCache = {};

/**
 * Load language-specific exclude rules
 * @param {string} langCode 
 * @returns {Object}
 */
function loadLangExcludeRules(langCode) {
    if (langExcludeCache[langCode]) return langExcludeCache[langCode];
    
    const langMap = { 'zh_CN': 'zh-CN', 'en_US': 'en-US', 'ja_JP': 'ja' };
    const configLang = langMap[langCode] || langCode;
    const excludePath = path.resolve(__dirname, `../../../.vitepress/config/locale/${configLang}/arknights-search-exclude.json`);
    
    if (fs.existsSync(excludePath)) {
        langExcludeCache[langCode] = JSON.parse(fs.readFileSync(excludePath, 'utf8'));
    } else {
        langExcludeCache[langCode] = {};
    }
    return langExcludeCache[langCode];
}

/**
 * Check if mapping should be excluded (combines hardcoded + language-specific rules)
 * @param {string} charId 
 * @param {string} speakerName 
 * @param {string} langCode 
 * @returns {boolean}
 */
function shouldExcludeMappingFull(charId, speakerName, langCode) {
    if (shouldExcludeMapping(charId, speakerName)) return true;
    
    const langRules = loadLangExcludeRules(langCode);
    const excludeList = langRules[speakerName] || [];
    const baseCharId = charId.split("#")[0];
    return excludeList.includes(baseCharId) || excludeList.includes(charId);
}

function getBaseCharacterId(id) {
    if (!id) return "";
    const cleaned = id.replace(/[#\$]\d+/g, '').trim().toLowerCase();
    return cleaned || id.toLowerCase();
}

const EXCLUDE_IDS = new Set([
    "char_1012_skadi2_1",
    "$ill_amiya_normal"
]);

function normalizeRawId(id) {
    if (!id || id === "" || id === "char_empty") return "";
    id = id.trim();
    const regex = /^(.*?)(?:#(\d+)(?:\s*#\d+)?)?(?:\$(\d+))?$/;
    const matches = regex.exec(id);
    if (!matches) return "";
    let baseId = matches[1].trim().replace(/\s+/g, "_").toLowerCase();
    
    // Specific mappings
    if (baseId === "ill_amiya_normal") {
        baseId = "char_002_amiya_1";
    } else if (baseId === "char_2001_aya_1") {
        baseId = "npc_2001_aya_1";
    }

    if (EXCLUDE_IDS.has(baseId)) return "";

    const faceNum = matches[2] || "1";
    const bodyNum = matches[3] || "1";
    return `${baseId}#${faceNum}$${bodyNum}`;
}

function shouldFilterName(name, langCode = 'zh_CN') {
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

function parseStory(text, storyId, langCode = 'zh_CN') {
    const lines = text.split("\n");
    const stage = { spotlight: "", characters: {}, history: [], names: {} };
    
    const getProtagonist = () => stage.characters[stage.spotlight] || "";
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const dialogMatch = trimmed.match(/\[name="([^"]+)"\]/);
        if (dialogMatch) {
            const speaker = dialogMatch[1];
            const protag = getProtagonist();
            if (protag) {
                const baseId = getBaseCharacterId(protag);
                if (baseId && !shouldExcludeMappingFull(baseId, speaker, langCode)) {
                    if (!stage.names[baseId]) stage.names[baseId] = new Set();
                    stage.names[baseId].add(speaker);
                }
            }
            return;
        }

        const cmdMatch = trimmed.match(/^\[([a-zA-Z]+)(\([^)]*\))?\]/);
        if (!cmdMatch) return;
        const cmd = cmdMatch[1].toLowerCase();
        const argsStr = cmdMatch[2]?.slice(1, -1) || "";
        const args = Object.fromEntries(argsStr.split(",").map(p => p.split("=").map(s => s?.trim().replace(/^["']|["']$/g, ""))));

        if (cmd === "character") {
            if (!args.name && !args.name2) {
                stage.spotlight = ""; 
                stage.characters = {};
            } else {
                const variant1 = normalizeRawId(args.name);
                const variant2 = normalizeRawId(args.name2);
                if (variant1) { 
                    stage.characters["1"] = variant1; 
                    const baseId = getBaseCharacterId(variant1);
                    if (baseId) stage.history.push(baseId);
                }
                if (variant2) { 
                    stage.characters["2"] = variant2; 
                    const baseId = getBaseCharacterId(variant2);
                    if (baseId) stage.history.push(baseId);
                }
                stage.spotlight = args.focus || "1";
            }
        } else if (cmd === "charslot") {
            const variant = normalizeRawId(args.name);
            if (variant) {
                stage.characters[args.slot] = variant;
                const baseId = getBaseCharacterId(variant);
                if (baseId) stage.history.push(baseId);
                stage.spotlight = args.focus || args.slot;
            } else {
                stage.spotlight = ""; 
                stage.characters = {};
            }
        } else if (cmd === "dialog") {
            stage.spotlight = ""; 
            stage.characters = {};
        }
    });

    const results = new Map();
    new Set(stage.history).forEach(baseId => {
        const names = Array.from(stage.names[baseId] || []).filter(n => !shouldFilterName(n, langCode));
        if (names.length > 0) {
            results.set(baseId, { charId: baseId, speakerNames: names, storyFiles: [storyId] });
        }
    });
    return results;
}

module.exports = {
    parseStory,
    normalizeRawId,
    shouldFilterName,
    getBaseCharacterId,
    shouldExcludeMappingFull,
    loadLangExcludeRules
};
