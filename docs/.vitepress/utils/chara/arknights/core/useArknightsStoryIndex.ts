/**
 * @fileoverview Arknights Story Index Calculator
 * @description Calculates correct akgcc story indices by processing story_review_table.json
 */

import { ref } from "vue";

interface StoryIndexMap {
    [actId: string]: {
        [storyTxt: string]: number;
    };
}

const storyIndexCache = ref<Record<string, StoryIndexMap>>({});
const loadingPromises = new Map<string, Promise<void>>();

const DATA_SOURCES: Record<string, string> = {
    en_us: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/en",
    en_US: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/en",
    ja_jp: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/jp",
    ja_JP: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/jp",
    zh_cn: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/cn",
    zh_CN: "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/cn",
};

/**
 * Load and process story review table to build index mappings
 */
async function loadStoryIndexMap(lang: string): Promise<void> {
    if (storyIndexCache.value[lang]) return;

    const dataSource = DATA_SOURCES[lang];
    if (!dataSource) {
        console.warn(`No data source for language: ${lang}`);
        return;
    }

    try {
        // Fetch both story_review_table and story_table to check for intros
        const [reviewResponse, tableResponse] = await Promise.all([
            fetch(`${dataSource}/gamedata/excel/story_review_table.json`),
            fetch(`${dataSource}/gamedata/excel/story_table.json`),
        ]);

        if (!reviewResponse.ok) throw new Error(`HTTP ${reviewResponse.status}`);

        const storyReview = (await reviewResponse.json()) as Record<string, any>;
        const storyTable = tableResponse.ok ? (await tableResponse.json()) as Record<string, any> : {};
        const indexMap: StoryIndexMap = {};

        // Process each act (replicating akgcc logic)
        for (const [actId, actData] of Object.entries(storyReview)) {
            if (!actData?.infoUnlockDatas) continue;

            const stories = [...actData.infoUnlockDatas] as Array<{
                storyTxt?: string;
                storySort?: number;
            }>;

            // Check if intro story exists and add it at index 0 (like akgcc does)
            if (stories.length > 0 && stories[0].storyTxt) {
                const firstStoryPath = stories[0].storyTxt;
                let introPath: string;
                
                if (actId.startsWith("main_")) {
                    // Main story intro: replace filename with actId_zone_enter
                    introPath = firstStoryPath.replace(/[^\/]+$/, `${actId}_zone_enter`);
                } else {
                    // Side/mini story intro: replace filename with level_actId_entry
                    introPath = firstStoryPath.replace(/[^\/]+$/, `level_${actId}_entry`);
                }

                // If intro exists in storyTable, it will be added at index 0
                // This shifts all other stories by 1
                if (storyTable[introPath]) {
                    stories.unshift({
                        storyTxt: introPath,
                        storySort: -1, // Ensure it stays at top after sorting
                    });
                }
            }

            // Sort by storySort like akgcc does
            stories.sort(
                (a: any, b: any) => (a.storySort || 0) - (b.storySort || 0)
            );

            // Build index map for this act
            indexMap[actId] = {};
            stories.forEach((story: any, index: number) => {
                if (story.storyTxt) {
                    indexMap[actId][story.storyTxt] = index;
                }
            });
        }

        storyIndexCache.value[lang] = indexMap;
    } catch (error) {
        console.warn(`Failed to load story index map for ${lang}:`, error);
        storyIndexCache.value[lang] = {};
    }
}

/**
 * Get the akgcc index for a story path
 * @param storyPath Internal path (e.g., 'activities/act18mini/level_act18mini_st04_beg.txt')
 * @param lang Language code
 * @returns Promise resolving to the story index, or 0 if not found
 */
export async function getAkgccIndex(
    storyPath: string,
    lang: string
): Promise<number> {
    // Ensure data is loaded
    if (!loadingPromises.has(lang)) {
        loadingPromises.set(lang, loadStoryIndexMap(lang));
    }
    await loadingPromises.get(lang);

    const cleanPath = storyPath.replace(/\.txt$/, "");
    const parts = cleanPath.split("/");

    if (parts.length < 2) return 0;

    const actId = parts[1]; // e.g., 'act18mini'
    const indexMap = storyIndexCache.value[lang];

    if (!indexMap || !indexMap[actId]) return 0;

    // Try to find exact match
    const storyTxt = cleanPath;
    if (indexMap[actId][storyTxt] !== undefined) {
        return indexMap[actId][storyTxt];
    }

    // Try without activities/ prefix
    const shortPath = parts.slice(1).join("/");
    if (indexMap[actId][shortPath] !== undefined) {
        return indexMap[actId][shortPath];
    }

    return 0;
}

/**
 * Preload story index maps for better performance
 */
export function preloadStoryIndices(languages: string[]) {
    languages.forEach((lang) => {
        if (!loadingPromises.has(lang)) {
            loadingPromises.set(lang, loadStoryIndexMap(lang));
        }
    });
}
