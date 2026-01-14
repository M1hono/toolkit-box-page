/**
 * @fileoverview MNA translation management service
 * @author Professional TS Developer
 */

import type {
    EntryCollection,
    MismatchEntry,
    TranslationStatus,
} from "./types.js";
import { MnaDataService } from "./dataService.js";

export class MnaTranslationService {
    /**
     * Calculates comprehensive translation status
     */
    static getTranslationStatus(
        targetCollection: EntryCollection,
        sourceCollection: EntryCollection
    ): TranslationStatus {
        const sourceKeys = Object.keys(sourceCollection);
        const targetKeys = Object.keys(targetCollection);

        const untranslatedKeys = sourceKeys.filter(
            (key) => !targetCollection[key]
        );
        const orphanedKeys = targetKeys.filter((key) => !sourceCollection[key]);
        const mismatches = MnaDataService.findMismatchedEntries(
            targetCollection,
            sourceCollection
        );

        return {
            total: sourceKeys.length,
            translated: sourceKeys.length - untranslatedKeys.length,
            untranslated: untranslatedKeys.length,
            orphaned: orphanedKeys.length,
            mismatched: mismatches.length,
        };
    }

    /**
     * Gets untranslated entries with pagination support
     */
    static getUntranslatedEntries(
        sourceCollection: EntryCollection,
        targetCollection: EntryCollection,
        page = 1,
        pageSize = 20
    ): { entries: string[]; totalPages: number } {
        const untranslatedKeys = Object.keys(sourceCollection).filter(
            (key) => !targetCollection[key]
        );

        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedKeys = untranslatedKeys.slice(startIndex, endIndex);

        return {
            entries: paginatedKeys,
            totalPages: Math.ceil(untranslatedKeys.length / pageSize),
        };
    }

    /**
     * Prepares entry for translation by copying structure from source
     */
    static prepareEntryForTranslation(
        entryId: string,
        sourceCollection: EntryCollection
    ): { success: boolean; entry?: EntryCollection[string]; message: string } {
        const sourceEntry = sourceCollection[entryId];

        if (!sourceEntry) {
            return {
                success: false,
                message: `Source entry "${entryId}" not found`,
            };
        }

        const translationEntry = MnaDataService.cloneData(sourceEntry);

        translationEntry.sections = translationEntry.sections.map((section) => {
            const translationSection = { ...section };

            if (section.type === "title") {
                translationSection.value = "";
            } else if (section.type === "text") {
                translationSection.json =
                    section.json?.map((segment) => ({
                        ...segment,
                        text: "",
                    })) || [];
            }

            return translationSection;
        });

        return {
            success: true,
            entry: translationEntry,
            message: `Entry "${entryId}" prepared for translation`,
        };
    }

    /**
     * Fixes category mismatch by updating target to match source
     */
    static fixCategoryMismatch(
        targetCollection: EntryCollection,
        sourceCollection: EntryCollection,
        entryId: string
    ): { success: boolean; collection: EntryCollection; message: string } {
        const targetEntry = targetCollection[entryId];
        const sourceEntry = sourceCollection[entryId];

        if (!targetEntry || !sourceEntry) {
            return {
                success: false,
                collection: targetCollection,
                message: `Entry "${entryId}" not found in source or target`,
            };
        }

        const updatedCollection = { ...targetCollection };
        updatedCollection[entryId] = {
            ...targetEntry,
            category: sourceEntry.category,
        };

        return {
            success: true,
            collection: updatedCollection,
            message: `Fixed category for "${entryId}"`,
        };
    }

    /**
     * Fixes structure mismatch by updating target sections to match source structure
     */
    static fixStructureMismatch(
        targetCollection: EntryCollection,
        sourceCollection: EntryCollection,
        entryId: string
    ): { success: boolean; collection: EntryCollection; message: string } {
        const targetEntry = targetCollection[entryId];
        const sourceEntry = sourceCollection[entryId];

        if (!targetEntry || !sourceEntry) {
            return {
                success: false,
                collection: targetCollection,
                message: `Entry "${entryId}" not found in source or target`,
            };
        }

        const updatedCollection = { ...targetCollection };
        const updatedEntry = { ...targetEntry };

        if (sourceEntry.sections) {
            updatedEntry.sections = sourceEntry.sections.map(
                (sourceSection, index) => {
                    const targetSection = targetEntry.sections?.[index];
                    const newSection = MnaDataService.cloneData(sourceSection);

                    if (
                        targetSection &&
                        targetSection.type === sourceSection.type
                    ) {
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
        }

        updatedCollection[entryId] = updatedEntry;

        return {
            success: true,
            collection: updatedCollection,
            message: `Fixed structure for "${entryId}"`,
        };
    }

    /**
     * Fixes content mismatch by updating index and tier to match source
     */
    static fixContentMismatch(
        targetCollection: EntryCollection,
        sourceCollection: EntryCollection,
        entryId: string
    ): { success: boolean; collection: EntryCollection; message: string } {
        const targetEntry = targetCollection[entryId];
        const sourceEntry = sourceCollection[entryId];

        if (!targetEntry || !sourceEntry) {
            return {
                success: false,
                collection: targetCollection,
                message: `Entry "${entryId}" not found in source or target`,
            };
        }

        const updatedCollection = { ...targetCollection };
        updatedCollection[entryId] = {
            ...targetEntry,
            index: sourceEntry.index,
            tier: sourceEntry.tier,
        };

        return {
            success: true,
            collection: updatedCollection,
            message: `Fixed content properties for "${entryId}"`,
        };
    }

    /**
     * Batch operations for fixing multiple entries
     */
    static async batchFixMismatches(
        targetCollection: EntryCollection,
        sourceCollection: EntryCollection,
        mismatches: MismatchEntry[]
    ): Promise<{
        success: boolean;
        collection: EntryCollection;
        fixedCount: number;
        message: string;
    }> {
        let currentCollection = targetCollection;
        let fixedCount = 0;

        for (const mismatch of mismatches) {
            let result;

            switch (mismatch.type) {
                case "category":
                    result = this.fixCategoryMismatch(
                        currentCollection,
                        sourceCollection,
                        mismatch.key
                    );
                    break;
                case "structure":
                    result = this.fixStructureMismatch(
                        currentCollection,
                        sourceCollection,
                        mismatch.key
                    );
                    break;
                case "content":
                    result = this.fixContentMismatch(
                        currentCollection,
                        sourceCollection,
                        mismatch.key
                    );
                    break;
                default:
                    continue;
            }

            if (result.success) {
                currentCollection = result.collection;
                fixedCount++;
            }
        }

        return {
            success: fixedCount > 0,
            collection: currentCollection,
            fixedCount,
            message: `Successfully fixed ${fixedCount} mismatch ${
                fixedCount === 1 ? "entry" : "entries"
            }`,
        };
    }
}
