/**
 * @fileoverview Arknights Remote Repository Client
 * @description Interfaces with remote gamedata repositories for story files and metadata
 */

const { fetchData } = require("../../shared/network-utils.cjs");

const REPOS = {
    zh_CN: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/cn",
    en_US: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/en",
    ja_JP: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/jp",
};

/**
 * Get the base URL for a specific language
 * @param {string} langCode - Language code ('zh_CN', 'en_US', or 'ja_JP')
 * @returns {string} - Base URL
 */
function getBaseUrl(langCode) {
    return REPOS[langCode] || REPOS.zh_CN;
}

/**
 * Get the story base URL for a specific language
 * @param {string} langCode - Language code
 * @returns {string} - Story base URL
 */
function getStoryBaseUrl(langCode) {
    return getBaseUrl(langCode) + "story/";
}

/**
 * Fetch a specific story file from the remote repository
 * @param {string} langCode - Language code
 * @param {string} storyPath - Path to the story file
 * @returns {Promise<string>} - Story content
 */
async function fetchStoryFile(langCode, storyPath) {
    const url = getStoryBaseUrl(langCode) + storyPath;
    return await fetchData(url);
}

module.exports = {
    getBaseUrl,
    getStoryBaseUrl,
    fetchStoryFile,
};
