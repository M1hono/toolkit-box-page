/**
 * @fileoverview FGO Assets Management System
 * @module cardgen/fgo-assets
 * @description
 * Dynamic asset discovery and management for FGO card generation.
 * Provides functions to scan available assets from the filesystem
 * and generate dropdown options for the card generator interface.
 *
 * @example
 * import { scanClassFolders, scanClassVariants } from './useFGOAssets';
 *
 * const classes = await scanClassFolders();
 * const variants = await scanClassVariants('saber');
 *
 * @author FGO Card Generator Team
 * @version 2.0.0
 */

import { ref } from "vue";
import {
    getDataUrl,
    getUIAssetUrl,
    loadDataWithFallback,
} from "./useFGOAssetUrls";

/**
 * Available class names (populated dynamically)
 * @type {string[]}
 */
export const CLASS_NAMES = [
    "saber",
    "archer",
    "lancer",
    "caster",
    "assassin",
    "rider",
    "berserker",
    "ruler",
    "avenger",
    "alterego",
    "foreigner",
    "pretender",
    "mooncancer",
    "shielder",
    "beast",
];

/**
 * Available rarity levels
 * @type {string[]}
 */
export const RARITY_LEVELS = ["0", "1", "2", "3", "4", "5"];

/**
 * Reactive class options array
 * @type {Ref<Array<{value: string, label: string}>>}
 */
export const CLASS_OPTIONS = ref<Array<{ value: string; label: string }>>([]);

/**
 * Reactive rarity states array
 * @type {Ref<Array<{value: string, label: string}>>}
 */
export const RARITY_STATES = ref<Array<{ value: string; label: string }>>([]);

/**
 * Reactive frame categories array
 * @type {Ref<Array<{value: string, label: string}>>}
 */
export const FRAME_CATEGORIES = ref<Array<{ value: string; label: string }>>(
    []
);

/**
 * Assets manifest cache
 * @type {Object|null}
 * @private
 */
let ASSETS_MANIFEST: {
    classes: Record<string, string[]>;
    frames: Array<{ value: string; label: string }>;
    rarity: Record<
        string,
        Array<{ value: string; label: string; filename: string }>
    >;
} | null = null;

/**
 * Load assets manifest from JSON file
 * @returns {Promise<Object|null>} Loaded manifest or null if failed
 * @description
 * Loads the pre-generated assets manifest containing all available
 * classes, frames, and rarity variants. Caches result for subsequent calls.
 */
async function loadManifest() {
    if (ASSETS_MANIFEST) return ASSETS_MANIFEST;

    ASSETS_MANIFEST = await loadDataWithFallback("fgo-assets.json");
    return ASSETS_MANIFEST;
}

/**
 * Scan available class folders
 * @returns {Promise<Array<{value: string, label: string}>>} Array of class options
 * @description
 * Discovers all available character classes by reading the assets manifest.
 * Each class corresponds to a folder in /imgs/fgo/classes/.
 * Updates the reactive CLASS_OPTIONS array.
 */
export async function scanClassFolders(): Promise<
    Array<{ value: string; label: string }>
> {
    const manifest = await loadManifest();

    if (manifest && manifest.classes) {
        const classes = Object.keys(manifest.classes)
            .map((name) => ({
                value: name,
                label: name.charAt(0).toUpperCase() + name.slice(1),
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        CLASS_OPTIONS.value = classes;
        return classes;
    }

    return [
        { value: "saber", label: "Saber" },
        { value: "archer", label: "Archer" },
    ];
}

/**
 * Get available variants for specific class
 * @param {string} className - Class name to scan
 * @returns {Promise<Array<{value: string, label: string}>>} Array of variant options
 * @description
 * Retrieves all available icon variants for a specific character class.
 * Variants include different ascension levels and special forms.
 */
export async function scanClassVariants(
    className: string
): Promise<Array<{ value: string; label: string }>> {
    const manifest = await loadManifest();

    if (manifest && manifest.classes && manifest.classes[className]) {
        return manifest.classes[className]
            .map((v: string) => ({
                value: v,
                label: `${v}.png`,
            }))
            .sort((a: { label: string }, b: { label: string }) =>
                a.label.localeCompare(b.label)
            );
    }

    return [];
}

/**
 * Scan available rarity variants for specific star level
 * @param {string} starLevel - Star level to scan (0-5)
 * @returns {Promise<Array<{value: string, label: string}>>} Array of rarity variant options
 * @description
 * Discovers all available rarity overlay variants for a specific star level.
 * Includes standard variants (0-3) and special variants (sp_2, sp_3, etc.).
 * Updates the reactive RARITY_STATES array.
 */
export async function scanRarityVariants(
    starLevel: string
): Promise<Array<{ value: string; label: string }>> {
    const manifest = await loadManifest();

    if (manifest && manifest.rarity && manifest.rarity[starLevel]) {
        RARITY_STATES.value = manifest.rarity[starLevel];
        return manifest.rarity[starLevel];
    }

    return [];
}

/**
 * Scan available frame categories
 * @returns {Promise<Array<{value: string, label: string}>>} Array of frame options
 * @description
 * Discovers all available frame types including standard rarities
 * (bronze, silver, gold) and special variants (grand, special series).
 * Updates the reactive FRAME_CATEGORIES array.
 */
export async function scanFrameFolders(): Promise<
    Array<{ value: string; label: string }>
> {
    const manifest = await loadManifest();

    if (manifest && manifest.frames) {
        FRAME_CATEGORIES.value = manifest.frames;
        return manifest.frames;
    }

    return [];
}

/**
 * Get frame component path for specific category
 * @param {string} category - Frame category identifier
 * @returns {string} Base path for frame components
 * @deprecated Use direct path construction instead
 */
export function getFramePath(category: string): string {
    const frameMap: Record<string, string> = {
        bronze: "frame1",
        silver: "frame2",
        gold: "frame3",
        "gold-special": "frame5",
    };

    const frameId = frameMap[category] || "frame5";
    return `/imgs/fgo/frames/${category}/${frameId}`;
}

/**
 * Get rarity star overlay path
 * @param {string} level - Star level (0-5)
 * @param {string} variant - Variant filename
 * @returns {string} Complete path to rarity overlay
 * @deprecated Use direct path construction instead
 */
export function getRarityPath(level: string, variant: string): string {
    return `/imgs/fgo/rarity/${level}-star/${variant}.png`;
}

/**
 * Get class icon path
 * @param {string} className - Class name
 * @param {string} variant - Icon variant
 * @returns {string} Complete path to class icon
 * @deprecated Use direct path construction instead
 */
export function getClassIconPath(className: string, variant: string): string {
    return `/imgs/fgo/classes/${className}/${variant}.png`;
}
