/**
 * @fileoverview MNA Guidebook data service using VitePress utilities
 * @author Professional TS Developer
 */

import type {
    Entry,
    EntryCollection,
    ValidationResult,
    MismatchEntry,
} from "./types.js";
import { isDeepEqual } from "../sidebar/shared/objectUtils.js";

export class MnaDataService {
    private static readonly DEFAULT_CATEGORIES = [
        "basics",
        "rituals",
        "spells",
        "items",
        "blocks",
        "mobs",
        "mechanics",
        "world",
        "enchants",
        "artifice",
    ] as const;

    private static readonly TIER_OPTIONS = [1, 2, 3, 4, 5] as const;

    /**
     * Creates a new empty entry with default values
     */
    static createEmptyEntry(): Entry {
        return {
            index: 0,
            category: "basics",
            tier: 1,
            sections: [],
        };
    }

    /**
     * Validates an entry using comprehensive checks
     */
    static validateEntry(entry: Entry, entryId: string): ValidationResult {
        const errors: string[] = [];

        if (!entryId?.trim()) {
            errors.push("Entry ID is required");
        }

        if (!entry.sections || entry.sections.length === 0) {
            errors.push("Entry must have at least one section");
        }

        if (entry.tier && !this.TIER_OPTIONS.includes(entry.tier as any)) {
            errors.push("Invalid tier value");
        }

        entry.sections?.forEach((section, index) => {
            if (!section.type) {
                errors.push(`Section ${index + 1}: type is required`);
            }

            if (section.type === "title" && !section.value?.trim()) {
                errors.push(`Section ${index + 1}: title value is required`);
            }

            if (
                section.type === "text" &&
                (!section.json || section.json.length === 0)
            ) {
                errors.push(`Section ${index + 1}: text content is required`);
            }

            if (section.type === "image" && !section.location?.trim()) {
                errors.push(`Section ${index + 1}: image location is required`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Safely saves an entry to the collection with validation
     */
    static saveEntry(
        collection: EntryCollection,
        entryId: string,
        entry: Entry,
        originalIndex?: number
    ): { success: boolean; message: string; collection: EntryCollection } {
        const validation = this.validateEntry(entry, entryId);

        if (!validation.isValid) {
            return {
                success: false,
                message: validation.errors.join(", "),
                collection,
            };
        }

        let newCollection = { ...collection };

        if (originalIndex !== undefined) {
            newCollection = this.reorderEntry(
                newCollection,
                entryId,
                entry,
                originalIndex
            );
        } else {
            newCollection[entryId] = { ...entry };
        }

        return {
            success: true,
            message: "Entry saved successfully",
            collection: newCollection,
        };
    }

    /**
     * Removes an entry from the collection
     */
    static deleteEntry(
        collection: EntryCollection,
        entryId: string
    ): { success: boolean; message: string; collection: EntryCollection } {
        if (!collection[entryId]) {
            return {
                success: false,
                message: `Entry "${entryId}" not found`,
                collection,
            };
        }

        const newCollection = { ...collection };
        delete newCollection[entryId];

        return {
            success: true,
            message: `Entry "${entryId}" deleted successfully`,
            collection: newCollection,
        };
    }

    /**
     * Filters entries with support for search and translation status
     */
    static filterEntries(
        collection: EntryCollection,
        searchTerm = "",
        showUntranslatedOnly = false,
        sourceCollection?: EntryCollection
    ): EntryCollection {
        const filtered: EntryCollection = {};

        Object.entries(collection).forEach(([key, value]) => {
            if (showUntranslatedOnly && sourceCollection?.[key]) {
                return;
            }

            if (
                searchTerm &&
                !key.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
                return;
            }

            filtered[key] = value;
        });

        return filtered;
    }

    /**
     * Finds entries that exist in target but not in source (orphaned entries)
     */
    static findOrphanedEntries(
        targetCollection: EntryCollection,
        sourceCollection: EntryCollection
    ): string[] {
        return Object.keys(targetCollection).filter(
            (key) => !sourceCollection[key]
        );
    }

    /**
     * Finds entries with structural mismatches
     */
    static findMismatchedEntries(
        targetCollection: EntryCollection,
        sourceCollection: EntryCollection
    ): MismatchEntry[] {
        const mismatches: MismatchEntry[] = [];

        Object.keys(targetCollection).forEach((key) => {
            const targetEntry = targetCollection[key];
            const sourceEntry = sourceCollection[key];

            if (!sourceEntry || !targetEntry) return;

            if (targetEntry.category !== sourceEntry.category) {
                mismatches.push({
                    key,
                    type: "category",
                    targetCategory: targetEntry.category,
                    sourceCategory: sourceEntry.category,
                });
            }

            if (!isDeepEqual(targetEntry.sections, sourceEntry.sections)) {
                mismatches.push({
                    key,
                    type: "structure",
                    mismatches: this.analyzeSectionDifferences(
                        targetEntry.sections,
                        sourceEntry.sections
                    ),
                });
            }

            if (
                targetEntry.index !== sourceEntry.index ||
                targetEntry.tier !== sourceEntry.tier
            ) {
                mismatches.push({
                    key,
                    type: "content",
                    mismatches: [
                        ...(targetEntry.index !== sourceEntry.index
                            ? [
                                  {
                                      type: "index",
                                      issue: `Index: target(${targetEntry.index}) vs source(${sourceEntry.index})`,
                                  },
                              ]
                            : []),
                        ...(targetEntry.tier !== sourceEntry.tier
                            ? [
                                  {
                                      type: "tier",
                                      issue: `Tier: target(${targetEntry.tier}) vs source(${sourceEntry.tier})`,
                                  },
                              ]
                            : []),
                    ],
                });
            }
        });

        return mismatches;
    }

    /**
     * Gets paginated entries
     */
    static getPaginatedEntries(
        collection: EntryCollection,
        page: number,
        pageSize: number
    ): { entries: EntryCollection; totalPages: number } {
        const keys = Object.keys(collection);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageKeys = keys.slice(startIndex, endIndex);

        const paginatedEntries: EntryCollection = {};
        pageKeys.forEach((key) => {
            paginatedEntries[key] = collection[key];
        });

        return {
            entries: paginatedEntries,
            totalPages: Math.ceil(keys.length / pageSize),
        };
    }

    /**
     * Deep clones data safely
     */
    static cloneData<T>(data: T): T {
        return JSON.parse(JSON.stringify(data));
    }

    /**
     * Gets default configuration
     */
    static getDefaults() {
        return {
            categories: [...this.DEFAULT_CATEGORIES],
            tiers: [...this.TIER_OPTIONS],
        };
    }

    /**
     * Extracts custom categories from entries
     */
    static extractCustomCategories(collection: EntryCollection): string[] {
        const customCategories = new Set<string>();

        Object.values(collection).forEach((entry) => {
            if (
                entry.category &&
                !this.DEFAULT_CATEGORIES.includes(entry.category as any)
            ) {
                customCategories.add(entry.category);
            }
        });

        return Array.from(customCategories);
    }

    /**
     * Private helper: Reorders an entry in the collection
     */
    private static reorderEntry(
        collection: EntryCollection,
        entryId: string,
        entry: Entry,
        targetIndex: number
    ): EntryCollection {
        const entriesList = Object.keys(collection);
        const tempCollection: EntryCollection = {};

        entriesList.forEach((key, index) => {
            if (index < targetIndex) {
                tempCollection[key] = collection[key];
            }
        });

        tempCollection[entryId] = { ...entry };

        entriesList.forEach((key, index) => {
            if (index >= targetIndex) {
                tempCollection[key] = collection[key];
            }
        });

        return tempCollection;
    }

    /**
     * Private helper: Analyzes differences between section arrays
     */
    private static analyzeSectionDifferences(
        targetSections: Entry["sections"],
        sourceSections: Entry["sections"]
    ): Array<{ type: string; issue: string; index?: number }> {
        const differences: Array<{
            type: string;
            issue: string;
            index?: number;
        }> = [];

        if (targetSections.length !== sourceSections.length) {
            differences.push({
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
                    differences.push({
                        type: "sectionType",
                        index: i,
                        issue: `Section ${i}: type mismatch - target(${targetSection.type}) vs source(${sourceSection.type})`,
                    });
                }
            } else if (targetSection && !sourceSection) {
                differences.push({
                    type: "extraSection",
                    index: i,
                    issue: `Section ${i}: exists in target but not in source`,
                });
            } else if (!targetSection && sourceSection) {
                differences.push({
                    type: "missingSection",
                    index: i,
                    issue: `Section ${i}: missing in target but exists in source`,
                });
            }
        }

        return differences;
    }
}
