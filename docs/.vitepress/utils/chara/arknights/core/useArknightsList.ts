/**
 * @fileoverview Arknights List Composable
 * @description Logic for filtering and paginating the character list
 */

import { ref, computed } from 'vue';
import type { UnifiedCharacterData } from '../types';

export function useArknightsList(characters: { value: UnifiedCharacterData[] }) {
    const searchQuery = ref("");
    const typeFilter = ref("");
    const currentPage = ref(1);
    const pageSize = ref(50);

    const filteredCharacters = computed(() => {
        let chars = characters.value;

        if (typeFilter.value) {
            chars = chars.filter((char) => char.charType === typeFilter.value);
        }

        if (searchQuery.value.trim()) {
            const query = searchQuery.value.toLowerCase();
            chars = chars.filter(
                (char) =>
                    char.displayName.toLowerCase().includes(query) ||
                    char.charId.toLowerCase().includes(query) ||
                    char.searchNames.some((name) => name.toLowerCase().includes(query)) ||
                    char.speakerNames.some((name) => name.toLowerCase().includes(query))
            );
        }

        return chars;
    });

    const paginatedCharacters = computed(() => {
        const start = (currentPage.value - 1) * pageSize.value;
        const end = start + pageSize.value;
        return filteredCharacters.value.slice(start, end);
    });

    const totalPages = computed(() => Math.ceil(filteredCharacters.value.length / pageSize.value));

    function handleSearch() {
        currentPage.value = 1;
    }

    return {
        searchQuery,
        typeFilter,
        currentPage,
        pageSize,
        filteredCharacters,
        paginatedCharacters,
        totalPages,
        handleSearch
    };
}
