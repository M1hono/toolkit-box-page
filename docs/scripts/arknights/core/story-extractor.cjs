/**
 * @fileoverview Arknights Story File Extractor
 * @module arknights/story-extractor
 * @description
 * Extracts and filters story files from git repository.
 * Only copies files listed in story_review_table.json (official game stories).
 * Automatically removes obsolete story files no longer in game data.
 *
 * @example
 * const { extractStoryFiles } = require('./story-extractor');
 * await extractStoryFiles('zh_CN', sourceDir, targetDir);
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { ensureDir, walkDir } = require("../../shared/file-utils.cjs");
const PROJECT_CONFIG = require("../../project-config.cjs");

/**
 * Fetch and build set of valid story paths from story_review_table.json
 * @param {string} langCode - Language code
 * @returns {Promise<Set<string>>} - Set of valid story file paths
 */
async function fetchValidStoryPaths(langCode) {
    const dataSource = PROJECT_CONFIG.getArknightsDataUrl(langCode);
    if (!dataSource) {
        console.warn(`No data source for ${langCode}, skipping filter`);
        return null;
    }

    try {
        const url = `${dataSource}/gamedata/excel/story_review_table.json`;
        const response = await axios.get(url, { timeout: 30000 });

        const storyReview = response.data;
        const validPaths = new Set();

        for (const actData of Object.values(storyReview)) {
            if (actData?.infoUnlockDatas) {
                for (const story of actData.infoUnlockDatas) {
                    if (story.storyTxt) {
                        validPaths.add(`${story.storyTxt}.txt`);
                        validPaths.add(story.storyTxt);
                    }
                }
            }
        }

        console.log(
            `Loaded ${validPaths.size} valid story paths from story_review_table.json`
        );
        return validPaths;
    } catch (error) {
        console.warn(
            `Failed to load story filter for ${langCode}:`,
            error.message
        );
        return null;
    }
}

/**
 * Extract story files from git repository (filtered by story_review_table.json)
 * @param {string} langCode - Language code
 * @param {string} sourceStoryDir - Source directory from git repo
 * @param {string} targetStoryDir - Target directory for stories
 */
async function extractStoryFiles(langCode, sourceStoryDir, targetStoryDir) {
    if (!fs.existsSync(sourceStoryDir)) {
        console.error(
            `ERROR: Source story directory not found: ${sourceStoryDir}`
        );
        return false;
    }

    ensureDir(targetStoryDir);
    const validPaths = await fetchValidStoryPaths(langCode);
    const storyFiles = walkDir(sourceStoryDir, ".txt");
    let deletedCount = 0;
    if (validPaths && fs.existsSync(targetStoryDir)) {
        const existingFiles = walkDir(targetStoryDir, ".txt");
        for (const existingFile of existingFiles) {
            const isValid =
                validPaths.has(existingFile) ||
                validPaths.has(existingFile.replace(/\.txt$/, ""));

            if (!isValid) {
                try {
                    const filePath = path.join(targetStoryDir, existingFile);
                    fs.unlinkSync(filePath);
                    deletedCount++;
                } catch (e) {
                    console.error(
                        `ERROR: Failed to delete ${existingFile}: ${e.message}`
                    );
                }
            }
        }
        if (deletedCount > 0) {
            console.log(`Cleaned up ${deletedCount} obsolete story files`);
        }
    }

    let successCount = 0;
    let skippedCount = 0;

    for (const storyFile of storyFiles) {
        if (validPaths) {
            const isValid =
                validPaths.has(storyFile) ||
                validPaths.has(storyFile.replace(/\.txt$/, ""));

            if (!isValid) {
                skippedCount++;
                continue;
            }
        }

        try {
            const sourcePath = path.join(sourceStoryDir, storyFile);
            const targetPath = path.join(targetStoryDir, storyFile);

            ensureDir(path.dirname(targetPath));
            fs.copyFileSync(sourcePath, targetPath);
            successCount++;
        } catch (e) {
            console.error(
                `ERROR: Failed to extract ${storyFile}: ${e.message}`
            );
        }
    }

    console.log(
        `Extracted ${successCount}/${storyFiles.length} story files for ${langCode} (${skippedCount} filtered, ${deletedCount} deleted)`
    );
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
    return walkDir(sourceDir, ".txt");
}

/**
 * Get target story directory for a language
 * @param {string} langCode - Language code
 * @returns {string} - Target directory path
 */
function getTargetStoryDir(langCode) {
    const langDataPath = PROJECT_CONFIG.getDataPath(langCode, "arknights");
    return path.resolve(langDataPath, "story");
}

/**
 * Count extracted story files for reporting
 * @param {string} dir - Directory to count files in
 * @returns {number} - Number of .txt files
 */
function countStoryFiles(dir) {
    if (!fs.existsSync(dir)) return 0;
    return walkDir(dir, ".txt").length;
}

module.exports = {
    extractStoryFiles,
    getAllStoryFilesFromDir,
    getTargetStoryDir,
    countStoryFiles,
};
