/**
 * @fileoverview Arknights Scan Statistics API
 * @description Manages character scanning history and stability metrics
 */

const fs = require('fs');
const path = require('path');
const PROJECT_CONFIG = require('../../project-config.cjs');

/**
 * Loads the current scan state from disk
 * @returns {Object} - Scan statistics mapping
 */
function loadScanState() {
    const globalPath = PROJECT_CONFIG.getGlobalPath('arknights');
    const filePath = path.resolve(globalPath, 'scan_stats.json');
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};
}

/**
 * Persists the scan state to disk
 * @param {Object} state - Statistics to save
 */
function saveScanState(state) {
    const globalPath = PROJECT_CONFIG.getGlobalPath('arknights');
    const filePath = path.resolve(globalPath, 'scan_stats.json');
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Updates metadata for a character based on the latest scan outcome
 * @param {string} id - Character identifier
 * @param {Object} state - Global scan state
 * @param {number} variantCount - Identified variant count
 */
function updateCharacterScanStats(id, state, variantCount) {
    const now = Date.now();
    const stats = state[id] || { 
        lastScanTime: 0, 
        consistentCount: 0, 
        lastVariantCount: 0, 
        status: 'active' 
    };

    if (variantCount === stats.lastVariantCount) {
        stats.consistentCount++;
    } else {
        stats.consistentCount = 0;
    }

    stats.lastScanTime = now;
    stats.lastVariantCount = variantCount;

    if (variantCount === 1 && stats.consistentCount >= 20) {
        stats.status = 'npc';
    } else if (stats.consistentCount >= 5 && variantCount > 1) {
        stats.status = 'stable';
    } else {
        stats.status = 'active';
    }

    state[id] = stats;
    return stats;
}

module.exports = {
    loadScanState,
    saveScanState,
    updateCharacterScanStats
};
