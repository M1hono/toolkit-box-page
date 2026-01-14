/**
 * @fileoverview Arknights Special Name Filtering Configuration
 * @description Configuration for filtering special character names that should be excluded
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
 * Check if a special name should be filtered out
 * @param {string} name - The character name to check
 * @returns {boolean} - Whether this name should be filtered out
 */
function shouldFilterSpecialName(name) {
    if (!name || typeof name !== "string") return true;
    if (name.trim() === "") return true;
    if (FILTERED_NAMES.has(name.trim())) return true;
    if (/^\d+$/.test(name.trim())) return true;
    
    if (/^(avg|char)_[a-z0-9]+_\d+(_\d+)?$/i.test(name.trim())) return true;
    if (/^(avg|char)_[a-z0-9]+_[a-z]+_\d+$/i.test(name.trim())) return true;

    return false;
}

module.exports = {
    shouldFilterSpecialName,
};