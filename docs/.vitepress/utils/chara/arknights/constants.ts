/**
 * @fileoverview Arknights Shared Constants
 * @description Centralized constants for Arknights utilities
 */

/**
 * Data source URLs for different languages
 */
export const ARKNIGHTS_DATA_SOURCES: Record<string, string> = {
    en_us: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/en",
    en_US: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/en",
    ja_jp: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/jp",
    ja_JP: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/jp",
    zh_cn: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/cn",
    zh_CN: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/cn",
};

/**
 * Determine story type from path
 * @param path - Story file path
 * @returns Story type: 'record' | 'main' | 'side' | 'mini' | etc.
 */
export function getStoryType(path: string): string {
    const parts = path.split("/");
    const filename = parts[parts.length - 1];

    // Record stories start with "story_"
    if (filename.startsWith("story_")) {
        return "record";
    }

    // Main stories contain "_main_"
    if (filename.includes("_main_")) {
        return "main";
    }

    // Activities directory = side stories (includes mini)
    if (parts[0] === "activities") {
        return "side";
    }

    // Default to the directory name
    return parts[0];
}

/**
 * Extract actId from story path based on story type
 * @param storyPath - Story file path
 * @returns actId or null
 * @example
 * - 'activities/act18mini/level_act18mini_st04_beg' -> 'act18mini'
 * - 'obt/main/level_main_14-17_end' -> 'main_14'
 * - 'obt/memory/story_chen2_set_1_1' -> 'story_chen2_set_1'
 * - 'bt/memory/story_bldsk_2_1' -> 'story_bldsk' (tries to match base)
 */
export function extractActId(storyPath: string): string | null {
    const parts = storyPath.split("/");
    const filename = parts[parts.length - 1];

    // Record stories: story_<charcode>_[optional_num]_set_<set>_<chapter>
    if (filename.startsWith("story_")) {
        // Extract up to and including _set_<num>
        // Handles: story_chen2_set_1 OR story_chen2_1_set_1 → story_chen2_set_1
        const setMatch = filename.match(/^story_([^_]+)_(?:\d+_)?set_(\d+)/);
        if (setMatch) {
            return `story_${setMatch[1]}_set_${setMatch[2]}`;
        }
        
        // Fallback: extract character code and default to set_1
        const baseMatch = filename.match(/^story_([^_]+)/);
        if (baseMatch) {
            return `story_${baseMatch[1]}_set_1`;
        }
        
        return filename;
    }

    // Main stories: level_main_<chapter>-<stage>_<variant>
    if (filename.includes("_main_")) {
        const match = filename.match(/main_(\d+)/);
        return match ? `main_${match[1]}` : null;
    }

    // Side/mini stories: use directory name (parts[1])
    if (parts.length >= 2 && parts[0] === "activities") {
        return parts[1];
    }

    return null;
}

/**
 * Extract character code from record story filename
 * story_variables.json uses names without number prefixes (e.g., 'avatar_kalts', not 'avatar_003')
 * Handles formats:
 * - 'story_kalts_1_1' -> 'kalts'
 * - 'story_003_kalts_1_1' -> 'kalts' (skips '003_' prefix)
 * - 'story_12fce_set_1' -> '12fce' (pure number codes kept)
 * - 'story_chen2_1_set_1' -> 'chen2' (alphanumeric codes kept)
 * @param filename - Story filename
 * @returns Character code for avatar lookup
 */
export function extractCharCodeFromRecordStory(
    filename: string
): string | null {
    // Remove story_ prefix and .txt suffix
    const cleaned = filename.replace(/^story_/, '').replace(/\.txt$/, '');
    const parts = cleaned.split('_');
    
    // Skip pure number parts at the beginning (like '003')
    // Keep alphanumeric codes (like '12fce', 'chen2')
    let codeIndex = 0;
    while (codeIndex < parts.length && /^\d+$/.test(parts[codeIndex])) {
        codeIndex++;
    }
    
    // Return the first non-pure-number part
    return parts[codeIndex] || null;
}
