/**
 * @fileoverview Arknights Story Utilities
 * @description Helper functions for story icons and metadata
 */

import { ref } from "vue";
import {
    ARKNIGHTS_DATA_SOURCES
} from "../constants";

const storyVariables = ref<Record<string, Record<string, string>>>({});
const loadingPromise = new Map<string, Promise<void>>();
const currentLang = ref<string>("en_us");

/**
 * Load story variables mapping (avatar_xxx -> char_id)
 */
async function loadStoryVariables(lang: string): Promise<void> {
    currentLang.value = lang;

    if (storyVariables.value[lang]) return;

    if (loadingPromise.has(lang)) {
        await loadingPromise.get(lang);
        return;
    }

    const promise = (async () => {
        const dataSource = ARKNIGHTS_DATA_SOURCES[lang];
        if (!dataSource) return;

        try {
            const response = await fetch(
                `${dataSource}/gamedata/story/story_variables.json`
            );
            if (response.ok) {
                storyVariables.value[lang] = await response.json();
            }
        } catch (error) {
            console.warn("Failed to load story variables:", error);
        }
    })();

    loadingPromise.set(lang, promise);
    await promise;
}

/**
 * Get character ID from record story actId using chardict
 * Follows external component pattern: actId.split("_")[1] → chardict lookup
 * @param actId - Story actId (e.g., 'story_kalts_set_1' or 'story_003_kalts_set_1')
 * @param charDict - Character dictionary mapping
 * @returns Character ID or null
 */
export function getCharacterIdFromRecordActId(
    actId: string,
    charDict: Record<string, { id: string; name: string }>
): string | null {
    const parts = actId.split("_");
    if (parts.length < 2) return null;

    // Extract character code/index from position [1] (akgcc pattern)
    const cin = parts[1];
    const charData = charDict[cin];

    return charData?.id || null;
}

/**
 * Format story path display name for level_a001 type files
 * @param {string} path - Story file path
 * @returns {string} Formatted display name
 * @example
 * - 'activities/act1/level_a001_01_beg.txt' -> 'Act 1 - Chapter 1 (Beginning)'
 * - 'activities/act2/level_a002_05_end.txt' -> 'Act 2 - Chapter 5 (Ending)'
 */
export function formatLevelActStoryName(path: string): string {
    const filename = path.split("/").pop()?.replace(".txt", "") || "";

    // Match level_a<act>_<chapter>_<variant> format
    const match = filename.match(/^level_a(\d{3})_(\d+)_(.+)$/);
    if (!match) return filename;

    const actNum = parseInt(match[1], 10);
    const chapterNum = parseInt(match[2], 10);
    const variant = match[3];

    // Format variant names
    const variantMap: Record<string, string> = {
        beg: "Beginning",
        end: "Ending",
        mid: "Middle",
        start: "Start",
        finish: "Finish",
    };

    const variantDisplay = variantMap[variant.toLowerCase()] || variant;

    return `Act ${actNum} - Chapter ${chapterNum} (${variantDisplay})`;
}

/**
 * Get character avatar URL with R2 first, fallback to GitHub
 * @param {string} charId - Character ID
 * @param {boolean} useR2 - Whether to use R2 (true) or fallback (false)
 * @returns {string} Avatar URL
 */
function getCharacterThumbnailUrl(
    charId: string,
    useR2: boolean = true
): string {
    const baseId = charId.split("#")[0].toLowerCase();

    if (useR2) {
        return `https://arkimage.top/arknights/avatars/${encodeURIComponent(
            baseId
        )}.png`;
    } else {
        return `https://raw.githubusercontent.com/akgcc/arkdata/refs/heads/main/assets/torappu/dynamicassets/arts/charavatars/${encodeURIComponent(
            baseId
        )}.png`;
    }
}

/**
 * Get GitHub fallback URL for character avatar
 */
function getCharacterAvatarFallbackUrl(charId: string): string {
    return getCharacterThumbnailUrl(charId, false);
}

/**
 * Get story icon URL with R2 first, fallback to old CDN
 * @param path - Story file path
 * @param charDict - Optional character dictionary for record stories
 * @param useR2 - Whether to use R2 (true) or fallback (false)
 * @returns Icon URL
 */
export function getStoryIconUrl(
    path: string,
    charDict?: Record<string, { id: string; name: string }>,
    useR2: boolean = true
): string {
    const parts = path.split("/");
    const filename = parts[parts.length - 1].replace(".txt", "");

    // Record stories (operator records) - show character avatar using chardict
    if (filename.startsWith("story_") && charDict) {
        const actIdMatch = path.match(/story_[^\/]+/);
        if (actIdMatch) {
            const actId = actIdMatch[0].replace(".txt", "");
            const charId = getCharacterIdFromRecordActId(actId, charDict);
            if (charId) {
                return getCharacterThumbnailUrl(charId, useR2);
            }
        }
    }

    const baseUrl = useR2
        ? "https://arkimage.top/arknights"
        : "https://r2.m31ns.top/img";
    // Special rule for level_a001 format files 
    const levelActMatch = filename.match(/^level_a(\d{3})/);
    if (levelActMatch) {
        const actNum = parseInt(levelActMatch[1], 10);
        // Only act 1 uses ordinal format (1stact), others use normal format (act2, act3, etc.)
        if (actNum === 1) {
            return `${baseUrl}/${useR2 ? "banners" : "banners"}/1stact.png`;
        } else {
            return `${baseUrl}/${useR2 ? "banners" : "banners"}/act${actNum}.png`;
        }
    }

    if (parts[0] === "activities") {
        return `${baseUrl}/${useR2 ? "banners" : "banners"}/${parts[1]}.png`;
    }

    const hasMain = parts.includes("main");
    const hasSt = parts.includes("st");

    if (hasMain || hasSt) {
        const match = filename.match(/(\d+)-\d+/);
        if (match && match[1]) {
            const chapterNum = parseInt(match[1], 10);
            return `${baseUrl}/${
                useR2 ? "icons" : "icons"
            }/main_${chapterNum}.png`;
        }
    }

    // Fallback to chapter ID
    return `${baseUrl}/${useR2 ? "icons" : "icons"}/${
        parts[1] || parts[0]
    }.png`;
}

export function useArknightsStoryUtils() {
    return {
        loadStoryVariables,
        getStoryIconUrl,
        getCharacterIdFromRecordActId,
        getCharacterThumbnailUrl,
        getCharacterAvatarFallbackUrl,
        formatLevelActStoryName,
    };
}
