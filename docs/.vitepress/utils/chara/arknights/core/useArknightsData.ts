/**
 * @fileoverview Arknights Data API Composable
 * @description Provides access to character data, stories, and search functionality
 */

import { ref, computed } from "vue";
import type { UnifiedCharacterData, StoryReaderUrls } from "../types";
import { getStoryReaderUrls } from "./useArknightsStoryReader";
import { loadDataWithFallback } from "../../../data/useDualSourceLoader";
import { ARKNIGHTS_DATA_SOURCES } from "../constants";

export function useArknightsData() {
    const characters = ref<Record<string, UnifiedCharacterData>>({});
    const names = ref<Record<string, any>>({});
    const storys = ref<Record<string, string[]>>({});
    const searchIndex = ref<Record<string, string>>({});
    const charDict = ref<Record<string, { id: string; name: string }>>({}); // charcode → {id, name}
    const currentLang = ref("en_us");

    /**
     * Load all data for a specific language
     */
    async function loadLanguageData(lang: string) {
        currentLang.value = lang;

        try {
            // Load character table to build chardict
            const dataSource = ARKNIGHTS_DATA_SOURCES[lang];
            let characterTable: any = {};
            
            if (dataSource) {
                try {
                    const charTableRes = await fetch(`${dataSource}/gamedata/excel/character_table.json`);
                    if (charTableRes.ok) {
                        characterTable = await charTableRes.json();
                    }
                } catch (e) {
                    console.warn("Failed to load character table:", e);
                }
            }

            // Load data with R2-first strategy, fallback to local/GitHub
            const [globalData, namesData, storysData, searchData] =
                await Promise.all([
                    loadDataWithFallback(`global/arknights/characters.json`).catch(() =>
                        fetch(`/data/global/arknights/characters.json`).then(r => r.json())
                    ),
                    loadDataWithFallback(`${lang}/arknights/names.json`).catch(() =>
                        fetch(`/data/${lang}/arknights/names.json`).then(r => r.json())
                    ),
                    loadDataWithFallback(`${lang}/arknights/storys.json`).catch(() =>
                        fetch(`/data/${lang}/arknights/storys.json`).then(r => r.json())
                    ),
                    loadDataWithFallback(`${lang}/arknights/search_index.json`).catch(() =>
                        fetch(`/data/${lang}/arknights/search_index.json`).then(r => r.json())
                    ),
                ]);

            characters.value = globalData;
            names.value = namesData;
            storys.value = storysData;
            searchIndex.value = searchData;

            // Build chardict from character_table.json
            const dict: Record<string, { id: string; name: string }> = {};
            for (const [charId, charData] of Object.entries(characterTable)) {
                const parts = charId.split('_');
                // Add mapping for numeric index (e.g., "003" from char_003_kalts)
                if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
                    dict[parts[1]] = { id: charId, name: (charData as any).name || charId };
                }
                // Add mapping for character code (last part, e.g., "kalts")
                if (parts.length >= 2) {
                    const code = parts[parts.length - 1];
                    dict[code] = { id: charId, name: (charData as any).name || charId };
                }
            }
            charDict.value = dict;

            return true;
        } catch (error) {
            console.error("Failed to load language data:", error);
            return false;
        }
    }

    /**
     * Get character ID(s) by name (using search index)
     * @returns Single ID (string) or multiple IDs (string[]) if duplicate names exist
     */
    function getCharacterIdByName(name: string): string | string[] | null {
        return searchIndex.value[name] || null;
    }

    /**
     * Get all character IDs by name (always returns array)
     */
    function getAllCharacterIdsByName(name: string): string[] {
        const result = searchIndex.value[name];
        if (!result) return [];
        return typeof result === "string" ? [result] : result;
    }

    /**
     * Get character data by ID
     */
    function getCharacterById(id: string): UnifiedCharacterData | null {
        const char = characters.value[id];
        const name = names.value[id];

        if (!char) return null;

        return {
            ...char,
            ...name,
            displayName: name?.displayName || id,
            speakerNames: name?.speakerNames || [],
            searchNames: name?.searchNames || [],
        };
    }

    /**
     * Get stories for a character ID
     */
    function getStoriesForCharacter(id: string): string[] {
        return storys.value[id] || [];
    }

    /**
     * Get story reader URLs for a character's stories
     */
    async function getStoryReadersForCharacter(
        id: string
    ): Promise<Array<{ path: string; urls: StoryReaderUrls }>> {
        const stories = getStoriesForCharacter(id);
        const results = await Promise.all(
            stories.map(async (path) => ({
                path,
                urls: await getStoryReaderUrls(path, currentLang.value),
            }))
        );
        return results;
    }

    /**
     * Search characters by name (fuzzy match)
     */
    function searchCharacters(query: string): UnifiedCharacterData[] {
        const lowerQuery = query.toLowerCase();
        const results: UnifiedCharacterData[] = [];

        for (const [id, nameData] of Object.entries(names.value)) {
            const allNames = [
                nameData.displayName,
                ...(nameData.speakerNames || []),
                ...(nameData.searchNames || []),
            ].filter(Boolean);

            const matches = allNames.some((name) =>
                name.toLowerCase().includes(lowerQuery)
            );

            if (matches) {
                const char = getCharacterById(id);
                if (char) results.push(char);
            }
        }

        return results;
    }

    /**
     * Get all unique story types
     */
    const storyTypes = computed(() => {
        const types = new Set<string>();
        for (const storyList of Object.values(storys.value)) {
            for (const story of storyList) {
                const type = story.split("/")[0];
                types.add(type);
            }
        }
        return Array.from(types).sort();
    });

    /**
     * Get characters that appear in a specific story type
     */
    function getCharactersByStoryType(type: string): UnifiedCharacterData[] {
        const results: UnifiedCharacterData[] = [];

        for (const [id, storyList] of Object.entries(storys.value)) {
            const hasType = storyList.some((story) =>
                story.startsWith(`${type}/`)
            );
            if (hasType) {
                const char = getCharacterById(id);
                if (char) results.push(char);
            }
        }

        return results;
    }

    /**
     * Get statistics about the loaded data
     */
    const stats = computed(() => ({
        totalCharacters: Object.keys(characters.value).length,
        totalNames: Object.keys(names.value).length,
        totalSearchTerms: Object.keys(searchIndex.value).length,
        charactersWithStories: Object.keys(storys.value).length,
        totalStories: Object.values(storys.value).flat().length,
    }));

    /**
     * Get character ID from record story actId using chardict
     * Follows akgcc pattern: eventid.split("_")[1] → chardict[cin].id
     */
    function getCharacterFromRecordActId(actId: string): string | null {
        const parts = actId.split('_');
        if (parts.length < 2) return null;
        
        // Extract character code/index from position [1]
        const cin = parts[1];
        const charData = charDict.value[cin];
        
        return charData?.id || null;
    }

    return {
        characters,
        names,
        storys,
        searchIndex,
        charDict,
        currentLang,
        stats,
        loadLanguageData,
        getCharacterIdByName,
        getAllCharacterIdsByName,
        getCharacterById,
        getStoriesForCharacter,
        getStoryReadersForCharacter,
        getCharacterFromRecordActId,
        searchCharacters,
        storyTypes,
        getCharactersByStoryType,
    };
}
