/**
 * @fileoverview Main MNA Guidebook Generator Composable
 * @description Orchestrates all MNA functionality with clean separation of concerns
 */

import { useMnaCore } from "./core/useMnaCore.js";
import { useMnaSections } from "./core/useMnaSections.js";
import { useMnaTranslation } from "./core/useMnaTranslation.js";
import { useMnaMismatch } from "./core/useMnaMismatch.js";
import { useMnaPagination } from "./core/useMnaPagination.js";

/**
 * Main composable that orchestrates all MNA functionality
 * @returns Comprehensive MNA generator functionality
 */
export function useMnaGenerator() {
    // Core functionality
    const {
        config,
        entries,
        sourceEntries,
        currentEntryId,
        currentEntryData,
        customCategories,
        showTranslation,
        showUntranslatedOnly,
        entryFilter,
        statusMessage,
        hasError,
        jsonOutput,
        defaultCategories,
        tierOptions,
        allCategories,
        filteredEntries,
        untranslatedEntries,
        hasSourceData,
        updateStatus,
        clearStatus,
        createEmptyEntry,
        createNewEntry,
        saveCurrentEntry,
        editEntry,
        deleteEntry,
        resetEntryForm,
        addCategory,
        removeCategory,
        generateJson,
        downloadJson,
    } = useMnaCore();

    // Section editing functionality
    const sectionsComposable = useMnaSections(currentEntryData, updateStatus);
    
    const {
        currentSection,
        currentTextSegment,
        currentTextSegmentEditingIndex,
        currentItemLocation,
        sectionTypes,
        resetCurrentSection,
        addTextSegment,
        editTextSegment,
        removeTextSegment,
        addItemLocation,
        removeItemLocation,
        addSection,
        removeSection,
        editSection,
        useStructure: useStructureFromSection,
        formatJsonText,
    } = sectionsComposable;

    // Translation functionality
    const translationComposable = useMnaTranslation(
        entries,
        sourceEntries,
        currentEntryData,
        currentEntryId,
        updateStatus
    );

    const { getSourceSection } = translationComposable;

    // Combine useStructure functionality
    const useStructure = (sectionType: string, index: number) => {
        const sourceSection = getSourceSection(index);
        if (sourceSection && sourceSection.type === sectionType) {
            return useStructureFromSection(sourceSection);
        }
        return false;
    };

    // Mismatch detection functionality
    const mismatchComposable = useMnaMismatch(
        entries,
        sourceEntries,
        updateStatus,
        generateJson
    );

    // Pagination functionality
    const paginationComposable = useMnaPagination(
        filteredEntries,
        untranslatedEntries,
        entryFilter,
        showUntranslatedOnly
    );

    return {
        // Core state
        config,
        entries,
        sourceEntries,
        currentEntryId,
        currentEntryData,
        customCategories,
        showTranslation,
        showUntranslatedOnly,
        entryFilter,
        statusMessage,
        hasError,
        jsonOutput,

        // Constants
        defaultCategories,
        tierOptions,

        // Computed
        allCategories,
        filteredEntries,
        untranslatedEntries,
        hasSourceData,

        // Core methods
        updateStatus,
        clearStatus,
        createEmptyEntry,
        createNewEntry,
        saveCurrentEntry,
        editEntry,
        deleteEntry,
        resetEntryForm,
        addCategory,
        removeCategory,
        generateJson,
        downloadJson,

        // Section state and methods
        currentSection,
        currentTextSegment,
        currentTextSegmentEditingIndex,
        currentItemLocation,
        sectionTypes,
        resetCurrentSection,
        addTextSegment,
        editTextSegment,
        removeTextSegment,
        addItemLocation,
        removeItemLocation,
        addSection,
        removeSection,
        editSection,
        useStructure,
        formatJsonText,

        // Translation methods
        ...translationComposable,

        // Mismatch state and methods
        ...mismatchComposable,

        // Pagination state and methods
        ...paginationComposable,
    };
}
