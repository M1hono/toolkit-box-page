/**
 * @fileoverview Upload Tracker for Different Work Types
 * @description Manages separate log files for different uploader types
 */

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.resolve(__dirname, '../../.vitepress/logs');

/**
 * Ensure logs directory exists
 */
function ensureLogsDir() {
    if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
}

/**
 * Get log file paths for specific work type
 * @param {string} workType - Type of work (characters, variant-avatars, story-avatars, story-icons, data)
 * @returns {Object} Paths to uploaded and failures logs
 */
function getLogPaths(workType) {
    ensureLogsDir();
    
    if (workType === 'characters') {
        // Default logs for characters
        return {
            uploaded: path.resolve(LOGS_DIR, 'uploaded.json'),
            failures: path.resolve(LOGS_DIR, 'failures.json')
        };
    } else {
        // Work-specific logs for others
        return {
            uploaded: path.resolve(LOGS_DIR, `${workType}-uploaded.json`),
            failures: path.resolve(LOGS_DIR, `${workType}-failures.json`)
        };
    }
}

/**
 * Load uploaded files log
 */
function loadUploaded(workType) {
    const { uploaded } = getLogPaths(workType);
    if (fs.existsSync(uploaded)) {
        try {
            return JSON.parse(fs.readFileSync(uploaded, 'utf8'));
        } catch (error) {
            console.warn(`Failed to load ${workType} upload log, starting fresh`);
        }
    }
    return {};
}

/**
 * Save uploaded files log
 */
function saveUploaded(workType, data) {
    const { uploaded } = getLogPaths(workType);
    fs.writeFileSync(uploaded, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Load failures log
 */
function loadFailures(workType) {
    const { failures } = getLogPaths(workType);
    if (fs.existsSync(failures)) {
        try {
            return JSON.parse(fs.readFileSync(failures, 'utf8'));
        } catch (error) {
            console.warn(`Failed to load ${workType} failures log, starting fresh`);
        }
    }
    return { downloadFailures: [], uploadFailures: [] };
}

/**
 * Save failures log
 */
function saveFailures(workType, data) {
    const { failures } = getLogPaths(workType);
    fs.writeFileSync(failures, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    getLogPaths,
    loadUploaded,
    saveUploaded,
    loadFailures,
    saveFailures
};