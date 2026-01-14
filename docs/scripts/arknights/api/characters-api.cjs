/**
 * @fileoverview Arknights Character Data API
 * @description Interfaces with the global and language-specific character data
 */

const fs = require('fs');
const path = require('path');
const PROJECT_CONFIG = require('../../project-config.cjs');
const { ensureDir } = require('../../shared/file-utils.cjs');

/**
 * Load global character metadata
 * @returns {Object}
 */
function loadGlobalCharacters() {
    const globalPath = PROJECT_CONFIG.getGlobalPath('arknights');
    const filePath = path.resolve(globalPath, 'characters.json');
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};
}

/**
 * Load character names for a specific language
 * @param {string} langCode - Language code
 * @returns {Object}
 */
function loadLanguageNames(langCode) {
    const langPath = PROJECT_CONFIG.getDataPath(langCode, 'arknights');
    const filePath = path.resolve(langPath, 'names.json');
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};
}

/**
 * Save global character metadata
 * @param {Object} characters - Data to save
 */
function saveGlobalCharacters(characters) {
    const globalPath = PROJECT_CONFIG.getGlobalPath('arknights');
    ensureDir(globalPath);
    const filePath = path.resolve(globalPath, 'characters.json');
    fs.writeFileSync(filePath, JSON.stringify(characters, null, 2), 'utf8');
}

/**
 * Save character names for a specific language
 * @param {string} langCode - Language code
 * @param {Object} names - Data to save
 */
function saveLanguageNames(langCode, names) {
    const langPath = PROJECT_CONFIG.getDataPath(langCode, 'arknights');
    ensureDir(langPath);
    const filePath = path.resolve(langPath, 'names.json');
    fs.writeFileSync(filePath, JSON.stringify(names, null, 2), 'utf8');
}

module.exports = {
    loadGlobalCharacters,
    loadLanguageNames,
    saveGlobalCharacters,
    saveLanguageNames
};
