/**
 * @fileoverview MNA Translation assistance and auto-update functionality
 * @description Handles source comparison, auto-updates, and translation workflows
 */

import { ref, computed } from "vue";
import type { EntryCollection, Entry } from "../types.js";

export function useMnaTranslation(
    entries: { value: EntryCollection },
    sourceEntries: { value: EntryCollection },
    currentEntryData: Entry,
    currentEntryId: { value: string },
    updateStatus: (msg: string, isError?: boolean) => void
) {
    // File import/export operations
    const importData = async (
        file: File,
        type: "source" | "target" = "target"
    ): Promise<boolean> => {
        if (!file) {
            console.error('[MNA] No file provided to importData');
            return false;
        }

        console.log('[MNA] Starting import:', file.name, 'type:', type);

        try {
            const text = await file.text();
            console.log('[MNA] File text length:', text.length);
            
            const json = JSON.parse(text);
            console.log('[MNA] Parsed JSON, keys:', Object.keys(json).length);
            
            const cleanedJson: any = {};

            // Process and validate entries
            Object.entries(json).forEach(([key, entry]) => {
                if (!entry) {
                    console.log('[MNA] Skipping null/undefined entry:', key);
                    return;
                }

                // Handle both string entries and object entries
                if (typeof entry === "string") {
                    // Convert simple string translations to guidebook format
                    cleanedJson[key] = {
                        id: key,
                        category: "basics",
                        tier: 1,
                        index: 0,
                        sections: [{
                            type: "text",
                            json: [{ text: entry }]
                        }]
                    };
                    return;
                }

                if (typeof entry !== "object") {
                    console.log('[MNA] Skipping invalid entry type:', key, typeof entry);
                    return;
                }

                const processedEntry = { ...entry } as any;

                // Ensure sections array is properly structured
                if (
                    processedEntry.sections &&
                    Array.isArray(processedEntry.sections)
                ) {
                    processedEntry.sections = processedEntry.sections.map(
                        (section: any) => {
                            const processedSection = { ...section };

                            // Handle text sections with JSON arrays
                            if (
                                processedSection.type === "text" &&
                                processedSection.json
                            ) {
                                if (typeof processedSection.json === "string") {
                                    try {
                                        processedSection.json = JSON.parse(
                                            processedSection.json
                                        );
                                    } catch (e) {
                                        processedSection.json = [];
                                    }
                                }
                                if (!Array.isArray(processedSection.json)) {
                                    processedSection.json = [];
                                }
                            }
                            return processedSection;
                        }
                    );
                } else {
                    processedEntry.sections = [];
                }

                cleanedJson[key] = processedEntry;
            });

            const filename = file.name.replace(/\.json$/i, "");
            const validEntries = Object.keys(cleanedJson).length;

            if (type === "source") {
                // Replace the entire object to trigger reactivity
                sourceEntries.value = cleanedJson;
                console.log(`[MNA] Source imported: ${validEntries} entries`, Object.keys(cleanedJson).slice(0, 5));
                updateStatus(
                    `Source language (${filename}) imported: ${validEntries} entries`
                );
            } else {
                // Replace the entire object to trigger reactivity
                entries.value = cleanedJson;
                console.log(`[MNA] Target imported: ${validEntries} entries`, Object.keys(cleanedJson).slice(0, 5));
                updateStatus(
                    `Target language (${filename}) imported: ${validEntries} entries`
                );
            }

            console.log('[MNA] Import complete, entries.value:', Object.keys(entries.value).length, 'sourceEntries.value:', Object.keys(sourceEntries.value).length);
            return true;
        } catch (error) {
            updateStatus(`Import failed: ${error.message}`, true);
            return false;
        }
    };

    // Start translating a specific entry
    const startTranslatingEntry = (entryId: string) => {
        const sourceEntry = sourceEntries.value[entryId];
        if (!sourceEntry) return false;

        currentEntryId.value = entryId;
        Object.assign(currentEntryData, {
            id: entryId,
            name: entryId,
            category: sourceEntry.category || "basics",
            icon: "",
            advancement: sourceEntry.required_advancement || "",
            sections: [], // Start empty for translation
            sortnum: sourceEntry.index || 0,
        });

        updateStatus(`Started translating: ${entryId}`);
        return true;
    };

    // Fill all sections from source (for quick setup)
    const fillAllSectionsFromSource = () => {
        const sourceEntry = sourceEntries.value[currentEntryId.value];
        if (!sourceEntry || !sourceEntry.sections) return false;

        currentEntryData.sections = [];

        sourceEntry.sections.forEach((sourceSection: any) => {
            const newSection = JSON.parse(JSON.stringify(sourceSection));
            currentEntryData.sections.push(newSection);
        });

        updateStatus(
            `Filled ${sourceEntry.sections.length} sections from source`
        );
        return true;
    };

    // Get structure from specific source section (returns the section data)
    const getSourceSection = (index: number) => {
        const sourceEntry = sourceEntries.value[currentEntryId.value];
        if (!sourceEntry?.sections?.[index]) return null;

        const sourceSection = sourceEntry.sections[index];
        return JSON.parse(JSON.stringify(sourceSection));
    };

    // Auto-update functionality: Extract new entries from source
    const extractNewEntries = () => {
        const newEntries: string[] = [];

        Object.keys(sourceEntries.value).forEach((key) => {
            if (!entries.value[key]) {
                newEntries.push(key);
            }
        });

        updateStatus(`Found ${newEntries.length} new entries to translate`);
        return newEntries;
    };

    // Auto-update functionality: Find changed entries in source
    const findChangedEntries = () => {
        const changedEntries: Array<{ key: string; changes: string[] }> = [];

        Object.keys(entries.value).forEach((key) => {
            const sourceEntry = sourceEntries.value[key];
            const targetEntry = entries.value[key];

            if (!sourceEntry || !targetEntry) return;

            const changes: string[] = [];

            // Check basic properties
            if (sourceEntry.category !== targetEntry.category) {
                changes.push(
                    `category: ${targetEntry.category} → ${sourceEntry.category}`
                );
            }
            if (sourceEntry.index !== targetEntry.index) {
                changes.push(
                    `index: ${targetEntry.index} → ${sourceEntry.index}`
                );
            }
            if (sourceEntry.tier !== targetEntry.tier) {
                changes.push(
                    `tier: ${targetEntry.tier || 1} → ${sourceEntry.tier || 1}`
                );
            }

            // Check sections count
            const sourceSectionsCount = sourceEntry.sections?.length || 0;
            const targetSectionsCount = targetEntry.sections?.length || 0;
            if (sourceSectionsCount !== targetSectionsCount) {
                changes.push(
                    `sections: ${targetSectionsCount} → ${sourceSectionsCount}`
                );
            }

            if (changes.length > 0) {
                changedEntries.push({ key, changes });
            }
        });

        updateStatus(`Found ${changedEntries.length} entries with changes`);
        return changedEntries;
    };

    // Auto-fill changed properties from source (comprehensive update)
    const autoUpdateFromSource = () => {
        let updatedCount = 0;
        const updates: string[] = [];

        Object.keys(entries.value).forEach((key) => {
            const sourceEntry = sourceEntries.value[key];
            const targetEntry = entries.value[key];

            if (!sourceEntry || !targetEntry) return;

            let hasChanges = false;
            const entryUpdates: string[] = [];

            // Update basic properties
            if (sourceEntry.category !== targetEntry.category) {
                targetEntry.category = sourceEntry.category;
                entryUpdates.push('category');
                hasChanges = true;
            }
            if (sourceEntry.index !== targetEntry.index) {
                targetEntry.index = sourceEntry.index;
                entryUpdates.push('index');
                hasChanges = true;
            }
            if (sourceEntry.tier !== targetEntry.tier) {
                targetEntry.tier = sourceEntry.tier;
                entryUpdates.push('tier');
                hasChanges = true;
            }

            // Update structure if sections count changed
            const sourceSectionsCount = sourceEntry.sections?.length || 0;
            const targetSectionsCount = targetEntry.sections?.length || 0;
            
            if (sourceSectionsCount !== targetSectionsCount) {
                // Merge sections: keep translations but match source structure
                const newSections = sourceEntry.sections.map((sourceSection: any, index: number) => {
                    const targetSection = targetEntry.sections?.[index];
                    const newSection = { ...sourceSection };
                    
                    // Preserve translation content if types match
                    if (targetSection && targetSection.type === sourceSection.type) {
                        if (sourceSection.type === 'title' && targetSection.value) {
                            newSection.value = targetSection.value;
                        } else if (sourceSection.type === 'text' && targetSection.json) {
                            newSection.json = targetSection.json;
                        }
                    }
                    
                    return newSection;
                });
                
                targetEntry.sections = newSections;
                entryUpdates.push(`sections(${targetSectionsCount}→${sourceSectionsCount})`);
                hasChanges = true;
            }

            if (hasChanges) {
                updatedCount++;
                updates.push(`${key}: ${entryUpdates.join(', ')}`);
            }
        });

        const summary = updates.length > 0 ? `\n${updates.slice(0, 5).join('\n')}${updates.length > 5 ? '\n...' : ''}` : '';
        updateStatus(`Auto-updated ${updatedCount} entries from source${summary}`);
        return updatedCount;
    };

    // Create entry from source data (for mismatch resolution)
    const createEntryFromSource = (entryId: string, sourceData: any) => {
        const newEntry: any = {
            index: sourceData.index || 0,
            category: sourceData.category || "basics",
            sections: JSON.parse(JSON.stringify(sourceData.sections || [])),
        };

        if (sourceData.tier) {
            newEntry.tier = sourceData.tier;
        }
        if (sourceData.required_advancement) {
            newEntry.required_advancement = sourceData.required_advancement;
        }

        entries.value[entryId] = newEntry;

        // Set as current for editing
        currentEntryId.value = entryId;
        Object.assign(currentEntryData, {
            id: entryId,
            name: entryId,
            category: newEntry.category,
            icon: "",
            advancement: newEntry.required_advancement || "",
            sections: newEntry.sections,
            sortnum: newEntry.index,
        });

        updateStatus(
            `Created "${entryId}" with ${newEntry.sections.length} sections from source`
        );
        return true;
    };

    // Format JSON text for display
    const formatJsonText = (jsonArray: any[]) => {
        if (!jsonArray || !Array.isArray(jsonArray)) return "";

        return jsonArray
            .map((segment) => {
                if (!segment) return "";

                let formatted = segment.text || "";
                if (segment.color) {
                    formatted = `<span class="text-${segment.color}">${formatted}</span>`;
                }
                if (segment.italic) {
                    formatted = `<em>${formatted}</em>`;
                }
                if (segment.bold) {
                    formatted = `<strong>${formatted}</strong>`;
                }
                return formatted;
            })
            .join("");
    };

    return {
        // Methods
        importData,
        startTranslatingEntry,
        fillAllSectionsFromSource,
        getSourceSection,
        extractNewEntries,
        findChangedEntries,
        autoUpdateFromSource,
        createEntryFromSource,
        formatJsonText,
    };
}
