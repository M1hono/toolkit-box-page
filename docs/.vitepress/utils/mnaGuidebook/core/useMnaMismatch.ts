/**
 * @fileoverview MNA Mismatch detection and resolution
 * @description Handles orphaned entries, structure mismatches, and content validation
 */

import { ref, computed } from "vue";
import type { EntryCollection } from "../types.js";

export function useMnaMismatch(
    entries: { value: EntryCollection },
    sourceEntries: { value: EntryCollection },
    updateStatus: (msg: string, isError?: boolean) => void,
    generateJson: () => void
) {
    // Mismatch management state
    const showMissingKeysPanel = ref(false);
    const selectedMissingKeys = ref<string[]>([]);
    const showMismatchPanel = ref(false);
    const selectedMismatchEntries = ref<string[]>([]);

    // Orphaned entries (exist in target but not in source)
    const missingKeys = computed(() => {
        const result: string[] = [];
        if (!entries.value || !sourceEntries.value) return result;

        Object.keys(entries.value).forEach((key) => {
            if (!sourceEntries[key]) {
                result.push(key);
            }
        });

        return result;
    });

    // Category mismatches
    const categoryMismatchEntries = computed(() => {
        const result: any[] = [];
        if (!entries.value || !sourceEntries.value) return result;

        Object.keys(entries.value).forEach((key) => {
            const targetEntry = entries.value[key] as any;
            const sourceEntry = sourceEntries.value[key] as any;

            if (sourceEntry && targetEntry) {
                if (targetEntry.category !== sourceEntry.category) {
                    result.push({
                        key,
                        targetCategory: targetEntry.category,
                        sourceCategory: sourceEntry.category,
                        type: "category",
                    });
                }
            }
        });

        return result;
    });

    // Structure mismatches
    const structureMismatchEntries = computed(() => {
        const result: any[] = [];
        if (!entries.value || !sourceEntries.value) return result;

        Object.keys(entries.value).forEach((key) => {
            const targetEntry = entries.value[key] as any;
            const sourceEntry = sourceEntries.value[key] as any;

            if (sourceEntry && targetEntry) {
                const mismatches: any[] = [];

                const targetSections = targetEntry.sections || [];
                const sourceSections = sourceEntry.sections || [];

                if (targetSections.length !== sourceSections.length) {
                    mismatches.push({
                        type: "sectionsCount",
                        issue: `Sections count: target(${targetSections.length}) vs source(${sourceSections.length})`,
                    });
                }

                const maxLength = Math.max(
                    targetSections.length,
                    sourceSections.length
                );
                for (let i = 0; i < maxLength; i++) {
                    const targetSection = targetSections[i];
                    const sourceSection = sourceSections[i];

                    if (targetSection && sourceSection) {
                        if (targetSection.type !== sourceSection.type) {
                            mismatches.push({
                                type: "sectionType",
                                index: i,
                                issue: `Section ${i}: type mismatch - target(${targetSection.type}) vs source(${sourceSection.type})`,
                            });
                        }
                    } else if (targetSection && !sourceSection) {
                        mismatches.push({
                            type: "extraSection",
                            index: i,
                            issue: `Section ${i}: exists in target but not in source`,
                        });
                    } else if (!targetSection && sourceSection) {
                        mismatches.push({
                            type: "missingSection",
                            index: i,
                            issue: `Section ${i}: missing in target but exists in source`,
                        });
                    }
                }

                if (mismatches.length > 0) {
                    result.push({
                        key,
                        mismatches,
                        type: "structure",
                    });
                }
            }
        });

        return result;
    });

    // Content mismatches (index, tier differences)
    const contentMismatchEntries = computed(() => {
        const result: any[] = [];
        if (!entries.value || !sourceEntries.value) return result;

        Object.keys(entries.value).forEach((key) => {
            const targetEntry = entries.value[key] as any;
            const sourceEntry = sourceEntries.value[key] as any;

            if (sourceEntry && targetEntry) {
                const mismatches: any[] = [];

                if (targetEntry.index !== sourceEntry.index) {
                    mismatches.push({
                        type: "index",
                        issue: `Index: target(${targetEntry.index}) vs source(${sourceEntry.index})`,
                    });
                }

                if (targetEntry.tier !== sourceEntry.tier) {
                    mismatches.push({
                        type: "tier",
                        issue: `Tier: target(${targetEntry.tier}) vs source(${sourceEntry.tier})`,
                    });
                }

                if (mismatches.length > 0) {
                    result.push({
                        key,
                        mismatches,
                        type: "content",
                    });
                }
            }
        });

        return result;
    });

    // All mismatch entries combined
    const allMismatchEntries = computed(() => [
        ...categoryMismatchEntries.value,
        ...structureMismatchEntries.value,
        ...contentMismatchEntries.value,
    ]);

    // Missing keys management
    const toggleMissingKey = (key: string) => {
        const index = selectedMissingKeys.value.indexOf(key);
        if (index > -1) {
            selectedMissingKeys.value.splice(index, 1);
        } else {
            selectedMissingKeys.value.push(key);
        }
    };

    const toggleAllMissingKeys = () => {
        if (selectedMissingKeys.value.length === missingKeys.value.length) {
            selectedMissingKeys.value = [];
        } else {
            selectedMissingKeys.value = [...missingKeys.value];
        }
    };

    const deleteSelectedMissingKeys = () => {
        if (selectedMissingKeys.value.length === 0) {
            updateStatus("Please select orphaned entries to delete", true);
            return false;
        }

        const keysToDelete = [...selectedMissingKeys.value];
        keysToDelete.forEach((key) => {
            if (entries.value[key]) {
                delete entries.value[key];
            }
        });

        const deletedCount = keysToDelete.length;
        selectedMissingKeys.value = [];

        updateStatus(
            `Deleted ${deletedCount} orphaned ${
                deletedCount > 1 ? "entries" : "entry"
            }`
        );
        generateJson();
        return true;
    };

    const deleteSingleMissingKey = (key: string) => {
        if (entries.value[key]) {
            delete entries.value[key];
            const index = selectedMissingKeys.value.indexOf(key);
            if (index > -1) {
                selectedMissingKeys.value.splice(index, 1);
            }
            updateStatus(`Deleted orphaned entry: ${key}`);
            generateJson();
            return true;
        }
        return false;
    };

    // Mismatch entries management
    const toggleMismatchEntry = (entryKey: string) => {
        const index = selectedMismatchEntries.value.indexOf(entryKey);
        if (index > -1) {
            selectedMismatchEntries.value.splice(index, 1);
        } else {
            selectedMismatchEntries.value.push(entryKey);
        }
    };

    const toggleAllMismatchEntries = () => {
        const allKeys = allMismatchEntries.value.map((entry) => entry.key);
        if (selectedMismatchEntries.value.length === allKeys.length) {
            selectedMismatchEntries.value = [];
        } else {
            selectedMismatchEntries.value = [...allKeys];
        }
    };

    // Fix individual mismatch types
    const fixCategoryMismatch = (key: string) => {
        const targetEntry = entries[key] as any;
        const sourceEntry = sourceEntries[key] as any;

        if (targetEntry && sourceEntry) {
            targetEntry.category = sourceEntry.category;
            updateStatus(`Fixed category for: ${key}`);
            generateJson();
            return true;
        }
        return false;
    };

    const fixStructureMismatch = (key: string) => {
        const targetEntry = entries[key] as any;
        const sourceEntry = sourceEntries[key] as any;

        if (targetEntry && sourceEntry && sourceEntry.sections) {
            const newSections = sourceEntry.sections.map(
                (sourceSection: any, index: number) => {
                    const targetSection = targetEntry.sections?.[index];
                    const newSection = { ...sourceSection };

                    if (
                        targetSection &&
                        targetSection.type === sourceSection.type
                    ) {
                        // Preserve translation content
                        if (
                            sourceSection.type === "title" &&
                            targetSection.value
                        ) {
                            newSection.value = targetSection.value;
                        } else if (
                            sourceSection.type === "text" &&
                            targetSection.json
                        ) {
                            newSection.json = targetSection.json;
                        }
                    }

                    return newSection;
                }
            );

            targetEntry.sections = newSections;
            updateStatus(`Fixed structure for: ${key}`);
            generateJson();
            return true;
        }
        return false;
    };

    const fixContentMismatch = (key: string) => {
        const targetEntry = entries[key] as any;
        const sourceEntry = sourceEntries[key] as any;

        if (targetEntry && sourceEntry) {
            targetEntry.index = sourceEntry.index;
            targetEntry.tier = sourceEntry.tier;
            updateStatus(`Fixed content properties for: ${key}`);
            generateJson();
            return true;
        }
        return false;
    };

    // Batch operations
    const fixSelectedMismatches = () => {
        if (selectedMismatchEntries.value.length === 0) {
            updateStatus("Please select mismatch entries to fix", true);
            return false;
        }

        let fixedCount = 0;

        selectedMismatchEntries.value.forEach((key) => {
            const mismatchEntry = allMismatchEntries.value.find(
                (entry) => entry.key === key
            );

            if (mismatchEntry) {
                if (
                    mismatchEntry.type === "category" &&
                    fixCategoryMismatch(key)
                ) {
                    fixedCount++;
                } else if (
                    mismatchEntry.type === "structure" &&
                    fixStructureMismatch(key)
                ) {
                    fixedCount++;
                } else if (
                    mismatchEntry.type === "content" &&
                    fixContentMismatch(key)
                ) {
                    fixedCount++;
                }
            }
        });

        selectedMismatchEntries.value = [];
        updateStatus(
            `Fixed ${fixedCount} mismatch ${
                fixedCount > 1 ? "entries" : "entry"
            }`
        );
        return fixedCount > 0;
    };

    const deleteSelectedMismatches = () => {
        if (selectedMismatchEntries.value.length === 0) {
            updateStatus("Please select mismatch entries to delete", true);
            return false;
        }

        const keysToDelete = [...selectedMismatchEntries.value];
        keysToDelete.forEach((key) => {
            if (entries.value[key]) {
                delete entries.value[key];
            }
        });

        const deletedCount = keysToDelete.length;
        selectedMismatchEntries.value = [];

        updateStatus(
            `Deleted ${deletedCount} mismatch ${
                deletedCount > 1 ? "entries" : "entry"
            }`
        );
        generateJson();
        return true;
    };

    return {
        // State
        showMissingKeysPanel,
        selectedMissingKeys,
        showMismatchPanel,
        selectedMismatchEntries,

        // Computed
        missingKeys,
        categoryMismatchEntries,
        structureMismatchEntries,
        contentMismatchEntries,
        allMismatchEntries,

        // Missing keys methods
        toggleMissingKey,
        toggleAllMissingKeys,
        deleteSelectedMissingKeys,
        deleteSingleMissingKey,

        // Mismatch methods
        toggleMismatchEntry,
        toggleAllMismatchEntries,
        fixCategoryMismatch,
        fixStructureMismatch,
        fixContentMismatch,
        fixSelectedMismatches,
        deleteSelectedMismatches,
    };
}
