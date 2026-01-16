/**
 * @fileoverview Arknights Story Utilities
 * @description Helper functions for story icons and metadata
 */

import { ref } from "vue";
import { ARKNIGHTS_DATA_SOURCES, extractCharCodeFromRecordStory } from "../constants";

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
    const parts = actId.split('_');
    if (parts.length < 2) return null;
    
    // Extract character code/index from position [1] (akgcc pattern)
    const cin = parts[1];
    const charData = charDict[cin];
    
    return charData?.id || null;
}

/**
 * Get character avatar URL for arknights characters
 * Tries R2 first for faster loading, GitHub as fallback
 * Returns primary URL (browser will handle fallback via onerror)
 */
function getCharacterThumbnailUrl(charId: string): string {
    // Don't add #1$1 suffix for avatars - use base ID only
    const baseId = charId.split('#')[0].toLowerCase();
    
    // Try R2 first for better performance
    // If R2 fails, component's v-img error handler can fallback to GitHub
    return `https://arkimage.top/arknights/avatars/${encodeURIComponent(baseId)}.png`;
}

/**
 * Get GitHub fallback URL for character avatar
 */
function getCharacterAvatarFallbackUrl(charId: string): string {
    const baseId = charId.split('#')[0].toLowerCase();
    return `https://raw.githubusercontent.com/akgcc/arkdata/refs/heads/main/assets/torappu/dynamicassets/arts/charavatars/${encodeURIComponent(baseId)}.png`;
}

/**
 * Get story icon URL based on story path and type
 * @param path - Story file path
 * @param charDict - Optional character dictionary for record stories
 * @returns Icon URL
 */
export function getStoryIconUrl(path: string, charDict?: Record<string, { id: string; name: string }>): string {
    const parts = path.split("/");
    const filename = parts[parts.length - 1].replace(".txt", "");

    // Record stories (operator records) - show character avatar using chardict
    if (filename.startsWith("story_") && charDict) {
        // Extract actId from path for record stories
        const actIdMatch = path.match(/story_[^\/]+/);
        if (actIdMatch) {
            const actId = actIdMatch[0].replace('.txt', '');
            const charId = getCharacterIdFromRecordActId(actId, charDict);
            if (charId) {
                return getCharacterThumbnailUrl(charId);
            }
        }
    }

    // Activities type (side stories)
    if (parts[0] === "activities") {
        return `https://r2.m31ns.top/img/banners/${parts[1]}.png`;
    }

    // Main stories
    const hasMain = parts.includes("main");
    const hasSt = parts.includes("st");

    if (hasMain || hasSt) {
        // Extract chapter number from filename: level_main_15-10_beg → 15
        const match = filename.match(/(\d+)-\d+/);
        if (match && match[1]) {
            const chapterNum = parseInt(match[1], 10);
            return `https://r2.m31ns.top/img/icons/main_${chapterNum}.png`;
        }
    }

    // Fallback to chapter ID
    return `https://r2.m31ns.top/img/icons/${parts[1] || parts[0]}.png`;
}

export function useArknightsStoryUtils() {
    return {
        loadStoryVariables,
        getStoryIconUrl,
        getCharacterIdFromRecordActId,
        getCharacterThumbnailUrl,
        getCharacterAvatarFallbackUrl,
    };
}
