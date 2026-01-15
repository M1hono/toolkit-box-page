/**
 * @fileoverview Arknights Story File Extractor
 * @description Extracts story files from cloned git repository to target locations
 */

const fs = require('fs');
const path = require('path');
const { ensureDir, walkDir } = require('../../shared/file-utils.cjs');
const PROJECT_CONFIG = require('../../project-config.cjs');

/**
 * Extract story files from git repository
 * @param {string} langCode - Language code
 * @param {string} sourceStoryDir - Source directory from git repo
 * @param {string} targetStoryDir - Target directory for stories
 */
async function extractStoryFiles(langCode, sourceStoryDir, targetStoryDir) {
    if (!fs.existsSync(sourceStoryDir)) {
        console.error(`ERROR: Source story directory not found: ${sourceStoryDir}`);
        return false;
    }

    ensureDir(targetStoryDir);

    const storyFiles = walkDir(sourceStoryDir, '.txt');
    let successCount = 0;

    for (const storyFile of storyFiles) {
        try {
            const sourcePath = path.join(sourceStoryDir, storyFile);
            const targetPath = path.join(targetStoryDir, storyFile);
            
            ensureDir(path.dirname(targetPath));
            fs.copyFileSync(sourcePath, targetPath);
            successCount++;
        } catch (e) {
            console.error(`ERROR: Failed to extract ${storyFile}: ${e.message}`);
        }
    }

    console.log(`Extracted ${successCount}/${storyFiles.length} story files for ${langCode}`);
    return successCount > 0;
}

/**
 * Get all story files from a source directory
 * @param {string} sourceDir - Source story directory
 * @returns {string[]} - Array of story file paths
 */
function getAllStoryFilesFromDir(sourceDir) {
    if (!fs.existsSync(sourceDir)) {
        return [];
    }
    return walkDir(sourceDir, '.txt');
}

/**
 * Get target story directory for a language
 * @param {string} langCode - Language code
 * @returns {string} - Target directory path
 */
function getTargetStoryDir(langCode) {
    const langDataPath = PROJECT_CONFIG.getDataPath(langCode, 'arknights');
    return path.resolve(langDataPath, 'story');
}

/**
 * Count extracted story files for reporting
 * @param {string} dir - Directory to count files in
 * @returns {number} - Number of .txt files
 */
function countStoryFiles(dir) {
    if (!fs.existsSync(dir)) return 0;
    return walkDir(dir, '.txt').length;
}

module.exports = {
    extractStoryFiles,
    getAllStoryFilesFromDir,
    getTargetStoryDir,
    countStoryFiles
};