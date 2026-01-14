/**
 * @fileoverview MNA Pagination management
 * @description Handles pagination for entries and untranslated entries
 */

import { ref, computed, watch } from "vue";
import type { EntryCollection } from "../types.js";

export function useMnaPagination(
    filteredEntries: { value: EntryCollection },
    untranslatedEntries: { value: string[] },
    entryFilter: { value: string },
    showUntranslatedOnly: { value: boolean }
) {
    // Entry pagination state
    const currentPage = ref(1);
    const pageSize = ref(20);

    // Untranslated entries pagination state
    const untranslatedCurrentPage = ref(1);
    const untranslatedPageSize = ref(20);

    // Page size options
    const pageSizeOptions = [
        { title: "5", value: 5 },
        { title: "10", value: 10 },
        { title: "20", value: 20 },
        { title: "50", value: 50 },
        { title: "100", value: 100 },
    ];

    // Computed pagination values
    const totalPages = computed(() => {
        const totalItems = Object.keys(filteredEntries.value).length;
        return Math.ceil(totalItems / pageSize.value) || 1;
    });

    const paginatedEntries = computed(() => {
        const keys = Object.keys(filteredEntries.value);
        const startIndex = (currentPage.value - 1) * pageSize.value;
        const endIndex = startIndex + pageSize.value;
        const pageKeys = keys.slice(startIndex, endIndex);

        const result: any = {};
        pageKeys.forEach((key) => {
            result[key] = filteredEntries.value[key];
        });

        return result;
    });

    const untranslatedTotalPages = computed(() => {
        return (
            Math.ceil(
                untranslatedEntries.value.length / untranslatedPageSize.value
            ) || 1
        );
    });

    const paginatedUntranslatedEntries = computed(() => {
        const startIndex =
            (untranslatedCurrentPage.value - 1) * untranslatedPageSize.value;
        const endIndex = startIndex + untranslatedPageSize.value;
        return untranslatedEntries.value.slice(startIndex, endIndex);
    });

    // Entry pagination methods
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages.value) {
            currentPage.value = page;
            return true;
        }
        return false;
    };

    const nextPage = () => {
        if (currentPage.value < totalPages.value) {
            currentPage.value++;
            return true;
        }
        return false;
    };

    const prevPage = () => {
        if (currentPage.value > 1) {
            currentPage.value--;
            return true;
        }
        return false;
    };

    const goToFirstPage = () => goToPage(1);
    const goToLastPage = () => goToPage(totalPages.value);

    // Untranslated entries pagination methods
    const goToUntranslatedPage = (page: number) => {
        if (page >= 1 && page <= untranslatedTotalPages.value) {
            untranslatedCurrentPage.value = page;
            return true;
        }
        return false;
    };

    const nextUntranslatedPage = () => {
        if (untranslatedCurrentPage.value < untranslatedTotalPages.value) {
            untranslatedCurrentPage.value++;
            return true;
        }
        return false;
    };

    const prevUntranslatedPage = () => {
        if (untranslatedCurrentPage.value > 1) {
            untranslatedCurrentPage.value--;
            return true;
        }
        return false;
    };

    const goToFirstUntranslatedPage = () => goToUntranslatedPage(1);
    const goToLastUntranslatedPage = () =>
        goToUntranslatedPage(untranslatedTotalPages.value);

    // Reset pagination when filters change
    watch([entryFilter, showUntranslatedOnly], () => {
        currentPage.value = 1;
        untranslatedCurrentPage.value = 1;
    });

    // Auto-adjust current page if it exceeds total pages
    watch(totalPages, (newTotal) => {
        if (currentPage.value > newTotal && newTotal > 0) {
            currentPage.value = newTotal;
        }
    });

    watch(untranslatedTotalPages, (newTotal) => {
        if (untranslatedCurrentPage.value > newTotal && newTotal > 0) {
            untranslatedCurrentPage.value = newTotal;
        }
    });

    // Page size change handlers
    const changePageSize = (newSize: number) => {
        pageSize.value = newSize;
        currentPage.value = 1; // Reset to first page
    };

    const changeUntranslatedPageSize = (newSize: number) => {
        untranslatedPageSize.value = newSize;
        untranslatedCurrentPage.value = 1; // Reset to first page
    };

    // Get visible page numbers for pagination UI
    const getVisiblePageNumbers = (
        current: number,
        total: number,
        maxVisible = 5
    ) => {
        if (total <= maxVisible) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        const half = Math.floor(maxVisible / 2);
        let start = Math.max(1, current - half);
        let end = Math.min(total, current + half);

        // Adjust if we're near the beginning or end
        if (end - start + 1 < maxVisible) {
            if (start === 1) {
                end = Math.min(total, start + maxVisible - 1);
            } else {
                start = Math.max(1, end - maxVisible + 1);
            }
        }

        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    const visiblePageNumbers = computed(() =>
        getVisiblePageNumbers(currentPage.value, totalPages.value)
    );

    const visibleUntranslatedPageNumbers = computed(() =>
        getVisiblePageNumbers(
            untranslatedCurrentPage.value,
            untranslatedTotalPages.value
        )
    );

    return {
        // State
        currentPage,
        pageSize,
        untranslatedCurrentPage,
        untranslatedPageSize,
        pageSizeOptions,

        // Computed
        totalPages,
        paginatedEntries,
        untranslatedTotalPages,
        paginatedUntranslatedEntries,
        visiblePageNumbers,
        visibleUntranslatedPageNumbers,

        // Entry pagination methods
        goToPage,
        nextPage,
        prevPage,
        goToFirstPage,
        goToLastPage,
        changePageSize,

        // Untranslated pagination methods
        goToUntranslatedPage,
        nextUntranslatedPage,
        prevUntranslatedPage,
        goToFirstUntranslatedPage,
        goToLastUntranslatedPage,
        changeUntranslatedPageSize,
    };
}
