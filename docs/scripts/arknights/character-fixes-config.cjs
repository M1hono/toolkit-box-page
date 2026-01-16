/**
 * @fileoverview Arknights Character Fixes Configuration
 * @module arknights/character-fixes-config
 * @description
 * Centralized configuration for character ID fixes, exclusions, and mappings.
 * Handles special cases and data corrections for character processing.
 */

/**
 * Character IDs that should be completely excluded from processing
 */
const EXCLUDE_IDS = new Set(["char_1012_skadi2_1"]);

/**
 * Load character fixes from VitePress config
 * @returns {Object} Character fixes mapping
 */
function loadCharacterFixes() {
    const fs = require('fs');
    const path = require('path');
    const fixesPath = path.resolve(__dirname, '../../.vitepress/config/arknights-fixes.json');
    return fs.existsSync(fixesPath) ? JSON.parse(fs.readFileSync(fixesPath, 'utf8')) : {};
}

/**
 * Load exclude mappings for a specific language
 * @param {string} langCode - Language code
 * @returns {Object} Exclude mappings
 */
function loadExcludeMappings(langCode) {
    const fs = require('fs');
    const path = require('path');
    
    const langMap = { 'zh_CN': 'zh-CN', 'en_US': 'en-US', 'ja_JP': 'ja-JP' };
    const localeCode = langMap[langCode] || langCode;
    const excludePath = path.resolve(__dirname, `../../.vitepress/config/locale/${localeCode}/arknights-exclude-mapping.json`);
    return fs.existsSync(excludePath) ? JSON.parse(fs.readFileSync(excludePath, 'utf8')) : {};
}

const SPECIAL_ID_MAPPINGS = {
    ill_amiya_normal: "char_002_amiya_1",
};

/**
 * Names that should be filtered out globally
 */
const FILTERED_NAMES = new Set([
    "middle",
    "right",
    "left",
    "char_empty",
    "char_empty_b",
    "$ill_amiya_normal",
    "???",
    "所有人",
    "",
]);


/**
 * Apply character path fixes
 * @param {string} charId - Original character ID
 * @returns {string} Fixed character ID
 */
function applyCharacterFixes(charId) {
    const fixes = loadCharacterFixes();
    return fixes[charId] || charId;
}

/**
 * Check if character-name mapping should be excluded
 * @param {string} charId - Character ID
 * @param {string} speakerName - Speaker name
 * @param {string} langCode - Language code
 * @returns {boolean} True if mapping should be excluded
 */
function shouldExcludeMapping(charId, speakerName, langCode = 'zh_CN') {
    if (!charId || !speakerName) return false;
    const excludeMappings = loadExcludeMappings(langCode);
    const excludeList = excludeMappings[speakerName] || [];
    const baseCharId = charId.split("#")[0];
    return excludeList.includes(baseCharId);
}

/**
 * Check if name should be filtered out
 * @param {string} name - Name to check
 * @returns {boolean} True if should be filtered
 */
function shouldFilterSpecialName(name) {
    if (!name || typeof name !== "string") return true;
    const trimmed = name.trim();
    if (!trimmed || FILTERED_NAMES.has(trimmed)) return true;
    if (/^\d+$/.test(trimmed)) return true;
    if (/^(avg|char)_[a-z0-9]+_\d+(_\d+)?$/i.test(trimmed)) return true;
    if (/^(avg|char)_[a-z0-9]+_[a-z]+_\d+$/i.test(trimmed)) return true;
    return false;
}

/**
 * @exports arknights/character-fixes-config
 */
module.exports = {
    EXCLUDE_IDS,
    SPECIAL_ID_MAPPINGS,
    FILTERED_NAMES,
    loadCharacterFixes,
    loadExcludeMappings,
    applyCharacterFixes,
    shouldExcludeMapping,
    shouldFilterSpecialName,
};
