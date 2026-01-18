/**
 * @fileoverview Iconify Icon Autocomplete
 * @module cardgen/iconify-autocomplete
 * @description
 * Provides autocomplete functionality for Iconify MDI icons
 *
 * @author FGO Card Generator Team
 * @version 1.0.0
 */

import { ref } from "vue";

const iconCache = new Map<string, string[]>();

/**
 * Search Iconify icons with autocomplete
 * @param {string} query - Search query
 * @returns {Promise<string[]>} Array of icon names
 */
export async function searchIconifyIcons(query: string): Promise<string[]> {
    if (!query || query.length < 2) {
        return [];
    }

    const cacheKey = query.toLowerCase();
    if (iconCache.has(cacheKey)) {
        return iconCache.get(cacheKey)!;
    }

    try {
        const response = await fetch(
            `https://api.iconify.design/search?query=${encodeURIComponent(
                query
            )}&prefix=mdi&limit=30`
        );
        if (response.ok) {
            const data = await response.json();
            const icons = data.icons || [];
            iconCache.set(cacheKey, icons);
            return icons;
        }
    } catch (error) {
        // Search failed, return empty
    }

    return [];
}

/**
 * Use iconify autocomplete composable
 */
export function useIconifyAutocomplete() {
    const suggestions = ref<string[]>([]);
    const isLoading = ref(false);

    const search = async (query: string) => {
        isLoading.value = true;
        suggestions.value = await searchIconifyIcons(query);
        isLoading.value = false;
    };

    return {
        suggestions,
        isLoading,
        search,
    };
}
