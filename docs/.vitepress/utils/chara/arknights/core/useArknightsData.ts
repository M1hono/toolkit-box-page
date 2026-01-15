/**
 * @fileoverview Arknights Data API Composable
 * @description Provides access to character data, stories, and search functionality
 */

import { ref, computed } from "vue";
import type { UnifiedCharacterData, StoryReaderUrls } from "../types";
import { getStoryReaderUrls } from "./useArknightsStoryReader";

export function useArknightsData() {
    const characters = ref<Record<string, UnifiedCharacterData>>({});
    const names = ref<Record<string, any>>({});
    const storys = ref<Record<string, string[]>>({});
    const searchIndex = ref<Record<string, string>>({});
    const currentLang = ref("en_us");

    /**
     * Load all data for a specific language
     */
    async function loadLanguageData(lang: string) {
        currentLang.value = lang;

        try {
            const [globalRes, namesRes, storysRes, searchRes] =
                await Promise.all([
                    fetch(`/data/global/arknights/characters.json`),
                    fetch(`/data/${lang}/arknights/names.json`),
                    fetch(`/data/${lang}/arknights/storys.json`),
                    fetch(`/data/${lang}/arknights/search_index.json`),
                ]);

            const [globalData, namesData, storysData, searchData] =
                await Promise.all([
                    globalRes.json(),
                    namesRes.json(),
                    storysRes.json(),
                    searchRes.json(),
                ]);

            characters.value = globalData;
            names.value = namesData;
            storys.value = storysData;
            searchIndex.value = searchData;

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
    function getStoryReadersForCharacter(
        id: string
    ): Array<{ path: string; urls: StoryReaderUrls }> {
        const stories = getStoriesForCharacter(id);
        return stories.map((path) => ({
            path,
            urls: getStoryReaderUrls(path, currentLang.value),
        }));
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

    return {
        characters,
        names,
        storys,
        searchIndex,
        currentLang,
        stats,
        loadLanguageData,
        getCharacterIdByName,
        getAllCharacterIdsByName,
        getCharacterById,
        getStoriesForCharacter,
        getStoryReadersForCharacter,
        searchCharacters,
        storyTypes,
        getCharactersByStoryType,
    };
}
