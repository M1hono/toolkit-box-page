/**
 * @fileoverview R2 Path Manager
 * @description Centralized path management for R2 uploads with proper folder organization
 */

const R2_CONFIG = require("../r2-config.cjs");

/**
 * R2 folder structure constants - MUST match actual bucket structure
 * Bucket name: arknights-chara-image
 * 
 * CORRECT structure (from screenshots):
 * - arknights/avatars/ (regular character avatars)
 * - arknights/characters/ (variant character avatars) 
 * - arknights/banners/ (story banners)
 * - arknights/icons/ (story icons)
 * - data/global/arknights/ (global JSON data)
 * - data/zh_cn/arknights/ (language JSON data)
 */
const R2_FOLDERS = {
    // Character assets in arknights/ folder
    AVATARS: 'arknights/avatars',           // Story avatars (small PNG icons): char_002_amiya.png
    CHARACTERS: 'arknights/characters',     // Character variant images (full PNG): avg_003_kalts_1#1$1.png
    VARIANT_AVATARS: 'arknights/variantavatars', // Variant avatars (small WebP): avg_003_kalts_1#1$1.webp
    
    // Story assets in arknights/ folder  
    ICONS: 'arknights/icons',            // Story icons: main_14.png
    BANNERS: 'arknights/banners',        // Story banners: 1stact.png, act2.png
    
    // Data files in data/ folder
    DATA_GLOBAL: 'data/global',          // Global data: data/global/arknights/
    DATA_LANG: 'data',                   // Language data: data/zh_cn/arknights/
    
    // Legacy cleanup patterns
    LEGACY_ROOT: '',                     // Files in root (wrong)
    LEGACY_IMG: 'img'                    // Old img/ structure
};

/**
 * Generate proper R2 key for story avatar (small icon used in story tracker)
 * @param {string} charId - Character ID (base ID without variants)
 * @param {boolean} isWebp - Whether to use webp format
 * @returns {string} R2 key
 */
function getStoryAvatarKey(charId, isWebp = false) {
    // Story avatars are always base character IDs (no variants) in avatars folder
    const baseId = charId.split('#')[0].split('$')[0];
    const extension = isWebp ? 'webp' : 'png';
    return `${R2_FOLDERS.AVATARS}/${baseId}.${extension}`;
}

/**
 * Generate proper R2 key for character variant image (full PNG image)
 * @param {string} variantId - Full variant ID with # and $ 
 * @returns {string} R2 key
 */
function getCharacterVariantKey(variantId) {
    // Character variant images are always PNG in characters folder
    return `${R2_FOLDERS.CHARACTERS}/${variantId}.png`;
}

/**
 * Generate proper R2 key for variant avatar (small WebP icon for display/search)
 * @param {string} variantId - Full variant ID with # and $
 * @returns {string} R2 key  
 */
function getVariantAvatarKey(variantId) {
    // Variant avatars are always WebP in variantavatars folder
    return `${R2_FOLDERS.VARIANT_AVATARS}/${variantId}.webp`;
}

/**
 * Generate proper R2 key for character avatar (legacy function - determines type automatically)
 * @param {string} charId - Character ID
 * @param {boolean} isWebp - Whether to use webp format
 * @returns {string} R2 key
 * @deprecated Use getStoryAvatarKey, getCharacterVariantKey, or getVariantAvatarKey instead
 */
function getCharacterAvatarKey(charId, isWebp = false) {
    const hasVariant = charId.includes('#') || charId.includes('$');
    if (hasVariant) {
        if (isWebp) {
            // WebP variants are small avatars
            return getVariantAvatarKey(charId);
        } else {
            // PNG variants are full character images
            return getCharacterVariantKey(charId);
        }
    } else {
        // Base character IDs are story avatars
        return getStoryAvatarKey(charId, isWebp);
    }
}

/**
 * Generate proper R2 key for character portrait (full body) - DEPRECATED
 * For now, portraits go in same folder as avatars
 * @param {string} charId - Character ID  
 * @param {boolean} isWebp - Whether to use webp format
 * @returns {string} R2 key
 */
function getCharacterPortraitKey(charId, isWebp = false) {
    // For now, use avatars folder since frontend expects this
    return getCharacterAvatarKey(charId, isWebp);
}

/**
 * Generate proper R2 key for story icon
 * @param {string} iconName - Icon name (e.g., 'main_14', '1stact', 'act2')
 * @returns {string} R2 key
 */
function getStoryIconKey(iconName) {
    return `${R2_FOLDERS.ICONS}/${iconName}.png`;
}

/**
 * Generate proper R2 key for story banner
 * @param {string} bannerName - Banner name (e.g., '1stact', 'act2', 'act18mini')
 * @returns {string} R2 key
 */
function getStoryBannerKey(bannerName) {
    return `${R2_FOLDERS.BANNERS}/${bannerName}.png`;
}

/**
 * Generate proper R2 key for data file
 * @param {string} filename - Data filename (e.g., 'characters.json', 'names.json')
 * @param {string} lang - Language code (e.g., 'zh_cn', 'en_us') 
 * @param {string} game - Game name (default: 'arknights')
 * @returns {string} R2 key
 */
function getDataFileKey(filename, lang = null, game = 'arknights') {
    if (lang) {
        return `${R2_FOLDERS.DATA_LANG}/${lang}/${game}/${filename}`;
    }
    return `${R2_FOLDERS.DATA_GLOBAL}/${game}/${filename}`;
}

/**
 * Get R2 public URL for a key
 * @param {string} key - R2 key
 * @returns {string} Public URL
 */
function getPublicUrl(key) {
    return `https://${R2_CONFIG.R2_PUBLIC_URL}/${key}`;
}

/**
 * Parse R2 key to determine file type and metadata
 * @param {string} key - R2 key
 * @returns {Object} File metadata
 */
function parseR2Key(key) {
    const parts = key.split('/');
    
    if (key.startsWith(R2_FOLDERS.AVATARS)) {
        return {
            type: 'avatar',
            category: 'character',
            filename: parts[parts.length - 1],
            isVariant: false
        };
    }
    
    if (key.startsWith(R2_FOLDERS.CHARACTERS)) {
        return {
            type: 'character_variant',
            category: 'character', 
            filename: parts[parts.length - 1],
            isVariant: true
        };
    }
    
    // Note: portraits are handled same as avatars for now
    
    if (key.startsWith(R2_FOLDERS.ICONS)) {
        return {
            type: 'icon',
            category: 'story',
            filename: parts[parts.length - 1]
        };
    }
    
    if (key.startsWith(R2_FOLDERS.BANNERS)) {
        return {
            type: 'banner', 
            category: 'story',
            filename: parts[parts.length - 1]
        };
    }
    
    if (key.startsWith(R2_FOLDERS.DATA_GLOBAL) || key.startsWith(R2_FOLDERS.DATA_LANG)) {
        // data/global/arknights/file.json or data/zh_cn/arknights/file.json
        const isGlobal = key.startsWith(R2_FOLDERS.DATA_GLOBAL);
        const lang = isGlobal ? 'global' : parts[1]; // data/[LANG]/arknights/
        const game = parts[isGlobal ? 2 : 2]; // arknights
        return {
            type: 'data',
            category: 'data',
            filename: parts[parts.length - 1],
            lang: lang,
            game: game
        };
    }
    
    return {
        type: 'unknown',
        category: 'legacy',
        filename: parts[parts.length - 1],
        needsCleanup: true
    };
}

/**
 * Check if a key represents a legacy file that needs cleanup
 * @param {string} key - R2 key
 * @returns {boolean} True if needs cleanup
 */
function isLegacyFile(key) {
    const metadata = parseR2Key(key);
    return metadata.needsCleanup || metadata.category === 'legacy';
}

/**
 * Get all folder paths for initialization
 * @returns {string[]} Array of folder paths
 */
function getAllFolders() {
    return Object.values(R2_FOLDERS);
}

/**
 * Generate migration mapping for legacy files
 * @param {string} legacyKey - Legacy R2 key
 * @returns {string|null} New key or null if should be deleted
 */
function getMigrationKey(legacyKey) {
    // Handle root level character files (WRONG PLACE)
    if (!legacyKey.includes('/')) {
        const filename = legacyKey;
        
        // Variant avatars in root -> move to arknights/characters/
        if ((filename.includes('#') || filename.includes('$')) && (filename.endsWith('.webp') || filename.endsWith('.png'))) {
            const charId = filename.replace(/\.(webp|png)$/, '');
            const isWebp = filename.endsWith('.webp');
            return getCharacterAvatarKey(charId, isWebp);
        }
        
        // Regular character files in root -> move to appropriate folder
        if (filename.match(/^(char_|avg_|npc_)/) && (filename.endsWith('.png') || filename.endsWith('.webp'))) {
            const charId = filename.replace(/\.(webp|png)$/, '');
            const isWebp = filename.endsWith('.webp');
            return getCharacterAvatarKey(charId, isWebp);
        }
    }
    
    // Handle old img/ structure files
    if (legacyKey.startsWith('img/')) {
        if (legacyKey.startsWith('img/icons/')) {
            const iconName = legacyKey.replace('img/icons/', '').replace('.png', '');
            return getStoryIconKey(iconName);
        }
        
        if (legacyKey.startsWith('img/banners/')) {
            const bannerName = legacyKey.replace('img/banners/', '').replace('.png', '');
            return getStoryBannerKey(bannerName);
        }
    }
    
    // Files that should be deleted (unknown legacy formats)
    return null;
}

module.exports = {
    R2_FOLDERS,
    getStoryAvatarKey,
    getCharacterVariantKey,
    getVariantAvatarKey,
    getCharacterAvatarKey, // legacy - auto-determines type
    getCharacterPortraitKey,
    getStoryIconKey,
    getStoryBannerKey,
    getDataFileKey,
    getPublicUrl,
    parseR2Key,
    isLegacyFile,
    getAllFolders,
    getMigrationKey
};