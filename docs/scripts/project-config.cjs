/**
 * @fileoverview Project Shared Configuration
 * @description Global configuration for supported languages, games, and data paths
 */

const path = require("path");

const DOCS_ROOT = path.resolve(__dirname, "..");
const PUBLIC_DATA_ROOT = path.resolve(DOCS_ROOT, "src/public/data");
const TEMP_DIR = path.resolve(DOCS_ROOT, ".temp");

const PROJECT_CONFIG = {
    LANGUAGES: {
        zh_CN: {
            code: "zh_CN",
            path: "zh_cn",
            label: "简体中文",
        },
        en_US: {
            code: "en_US",
            path: "en_us",
            label: "English",
        },
        ja_JP: {
            code: "ja_JP",
            path: "ja_jp",
            label: "日本語",
        },
    },

    PLATFORM_MAPPING: {
        fgo: {
            NA: "en_US",
            JP: "ja_JP",
            CN: "zh_CN",
        },
        arknights: {
            en: "en_US",
            zh_CN: "zh_CN",
            ja_JP: "ja_JP",
        },
    },

    GAMES: {
        arknights: {
            id: "arknights",
            supported_langs: ["zh_CN", "en_US", "ja_JP"],
        },
        fgo: {
            id: "fgo",
            supported_langs: ["zh_CN", "en_US", "ja_JP"],
        },
    },

    REPOSITORIES: {
        arknights: {
            url: "https://github.com/ArknightsAssets/ArknightsGamedata.git",
            storyPaths: {
                zh_CN: "cn/gamedata/story",
                en_US: "en/gamedata/story",
                ja_JP: "jp/gamedata/story",
            },
            dataPaths: {
                zh_CN: "cn/gamedata",
                en_US: "en/gamedata",
                ja_JP: "jp/gamedata",
            },
        },
    },

    GIT_CONFIG: {
        SPARSE_CHECKOUT_TIMEOUT: 180000,
        PULL_TIMEOUT: 60000,
        BATCH_SIZE: 10,
        PROGRESS_INTERVAL: 50,
    },

    STORY_FILTER_CONFIG: {
        meaninglessNames: {
            zh_CN: [
                "？？？",
                "？？？？",
                "所有人",
                "？",
                "...",
                "unknown",
                "旁白",
                "画外音",
                "系统",
                "system",
            ],
            en_US: [
                "???",
                "?????",
                "Everyone",
                "?",
                "...",
                "unknown",
                "narrator",
                "system",
                "voice-over",
                "all",
            ],
            ja_JP: [
                "？？？",
                "?????",
                "全員",
                "？",
                "...",
                "unknown",
                "ナレーター",
                "システム",
                "system",
                "みんな",
            ],
        },
        commonFilters: [
            "？？？",
            "？？？？",
            "???",
            "?????",
            "?",
            "...",
            "unknown",
            "system",
        ],
        numericPattern: /^\d+$/,
    },

    TEMP_DIR,
    DOCS_ROOT,
    PUBLIC_DATA_ROOT,

    /**
     * Get the absolute path for a game's data in a specific language
     * @param {string} langCode - Language code (e.g., 'zh_CN')
     * @param {string} gameId - Game ID (e.g., 'arknights')
     * @returns {string} - Absolute path
     */
    getDataPath(langCode, gameId) {
        const langPath =
            this.LANGUAGES[langCode]?.path || langCode.toLowerCase();
        return path.resolve(PUBLIC_DATA_ROOT, langPath, gameId);
    },

    /**
     * Get the global (non-language specific) path for a game
     * @param {string} gameId - Game ID
     * @returns {string} - Absolute path
     */
    getGlobalPath(gameId) {
        return path.resolve(PUBLIC_DATA_ROOT, "global", gameId);
    },

    /**
     * Get the data source URL for Arknights game data
     * @param {string} langCode - Language code (zh_CN, en_US, ja_JP)
     * @returns {string} - GitHub raw content URL
     */
    getArknightsDataUrl(langCode) {
        const baseUrl =
            "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master";
        const dataPaths = this.REPOSITORIES.arknights.dataPaths;
        const dataPath = dataPaths[langCode];
        if (!dataPath) return null;

        const langDir = dataPath.split("/")[0];
        return `${baseUrl}/${langDir}`;
    },

    /**
     * Map internal language codes to VitePress locale codes
     */
    LANG_TO_LOCALE_MAP: {
        zh_CN: "zh-CN",
        en_US: "en-US",
        ja_JP: "ja",
    },

    /**
     * Get VitePress locale code from internal language code
     * @param {string} langCode - Internal language code (zh_CN, en_US, ja_JP)
     * @returns {string} - VitePress locale code (zh-CN, en-US, ja)
     */
    getLocaleCode(langCode) {
        return this.LANG_TO_LOCALE_MAP[langCode] || langCode;
    },

    /**
     * Get the data source URL for Arknights game data
     * @param {string} langCode - Language code (zh_CN, en_US, ja_JP)
     * @returns {string} - GitHub raw content URL
     */
    getArknightsDataUrl(langCode) {
        const baseUrl =
            "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master";
        const dataPaths = this.REPOSITORIES.arknights.dataPaths;
        const dataPath = dataPaths[langCode];
        if (!dataPath) return null;

        // Extract language directory (cn, en, jp) from dataPath
        const langDir = dataPath.split("/")[0];
        return `${baseUrl}/${langDir}`;
    },
};

module.exports = PROJECT_CONFIG;
