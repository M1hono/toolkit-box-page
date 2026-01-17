/**
 * @fileoverview FGO Asset URL Management
 * @module cardgen/fgo-asset-urls
 * @description
 * Manages FGO asset URLs with R2 CDN primary and local fallback.
 * Provides functions to get optimized URLs for fonts, UI assets, and data files.
 *
 * @example
 * import { getFontUrl, getUIAssetUrl } from './useFGOAssetUrls';
 *
 * const fontUrl = getFontUrl('honoka.woff');
 * const frameUrl = getUIAssetUrl('frames/gold/frame3T.png');
 *
 * @author FGO Card Generator Team
 * @version 2.0.0
 */

/**
 * R2 CDN base URL for FGO assets
 * @constant {string}
 */
const R2_BASE_URL = "https://arkimage.top";

/**
 * Local fallback base URL
 * @constant {string}
 */
const LOCAL_BASE_URL = "";

/**
 * Get font URL with R2 primary and local fallback
 * @param {string} filename - Font filename (e.g., 'honoka.woff')
 * @param {boolean} [useR2=true] - Whether to use R2 CDN
 * @returns {string} Complete font URL
 * @description
 * Returns optimized font URL. R2 CDN provides faster loading,
 * local fallback ensures reliability during development.
 */
export function getFontUrl(filename: string, useR2: boolean = true): string {
    if (useR2) {
        return `${R2_BASE_URL}/fgo/font/${filename}`;
    } else {
        return `${LOCAL_BASE_URL}/Font/${filename}`;
    }
}

/**
 * Get UI asset URL with R2 primary and local fallback
 * @param {string} assetPath - Relative asset path (e.g., 'frames/gold/frame3T.png')
 * @param {boolean} [useR2=true] - Whether to use R2 CDN
 * @returns {string} Complete UI asset URL
 * @description
 * Returns optimized UI asset URL for frames, rarity overlays, class icons.
 * Handles proper path construction for both R2 and local environments.
 */
export function getUIAssetUrl(
    assetPath: string,
    useR2: boolean = true
): string {
    if (useR2) {
        return `${R2_BASE_URL}/fgo/servantcardui/${assetPath}`;
    } else {
        return `${LOCAL_BASE_URL}/imgs/fgo/${assetPath}`;
    }
}

/**
 * Get data file URL with R2 primary and local fallback
 * @param {string} filename - Data filename (e.g., 'fgo-assets.json')
 * @param {boolean} [useR2=true] - Whether to use R2 CDN
 * @returns {string} Complete data file URL
 * @description
 * Returns optimized data file URL. R2 provides faster global access,
 * local fallback ensures development environment compatibility.
 */
export function getDataUrl(filename: string, useR2: boolean = true): string {
    if (useR2) {
        return `${R2_BASE_URL}/data/global/fgo/${filename}`;
    } else {
        return `${LOCAL_BASE_URL}/data/global/fgo/${filename}`;
    }
}

/**
 * Load data with R2 first fallback logic
 * @param {string} filename - Data filename
 * @returns {Promise<any>} Parsed JSON data or null
 * @description
 * Tries R2 first for faster CDN delivery, falls back to local if R2 fails.
 * Returns null if both sources fail.
 */
export async function loadDataWithFallback(filename: string): Promise<any> {
    try {
        const r2Url = getDataUrl(filename, true);
        const response = await fetch(r2Url);
        
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
    }
    
    try {
        const localUrl = getDataUrl(filename, false);
        const response = await fetch(localUrl);
        
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        // Both failed
    }
    
    return null;
}

/**
 * Test if R2 asset is available
 * @param {string} url - URL to test
 * @returns {Promise<boolean>} True if asset is accessible
 * @description
 * Performs HEAD request to check asset availability.
 * Used for implementing fallback logic in asset loading.
 */
export async function testAssetAvailability(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: "HEAD" });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Get asset URL with automatic fallback
 * @param {string} assetPath - Relative asset path
 * @param {'font'|'ui'|'data'} assetType - Type of asset
 * @returns {Promise<string>} Best available URL
 * @description
 * Automatically tests R2 availability and falls back to local if needed.
 * Provides seamless asset loading with optimal performance.
 */
export async function getAssetUrlWithFallback(
    assetPath: string,
    assetType: "font" | "ui" | "data"
): Promise<string> {
    let r2Url: string;
    let localUrl: string;

    switch (assetType) {
        case "font":
            r2Url = getFontUrl(assetPath, true);
            localUrl = getFontUrl(assetPath, false);
            break;
        case "ui":
            r2Url = getUIAssetUrl(assetPath, true);
            localUrl = getUIAssetUrl(assetPath, false);
            break;
        case "data":
            r2Url = getDataUrl(assetPath, true);
            localUrl = getDataUrl(assetPath, false);
            break;
    }

    const isR2Available = await testAssetAvailability(r2Url);
    return isR2Available ? r2Url : localUrl;
}
