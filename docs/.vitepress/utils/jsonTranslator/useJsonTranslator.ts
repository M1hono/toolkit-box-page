/**
 * @fileoverview Main composable for JSON Translator functionality
 * @description Manages translation state, file processing, and core logic
 */

import { ref, reactive, computed, nextTick } from "vue";
import type {
    TranslatorState,
    TranslatorConfig,
    TranslationStats,
    PaginationInfo,
} from "./types";

/**
 * Main composable for JSON Translator functionality
 * @returns Object containing state, computed values, and methods
 */
export function useJsonTranslator() {
    const config = reactive<TranslatorConfig>({
        sourceLanguage: "en_us",
        targetLanguage: "zh_cn",
        pageSize: 20,
        untranslatedPageSize: 20,
        missingKeysPageSize: 20,
    });

    const state = reactive<TranslatorState>({
        sourceEntries: {},
        targetEntries: {},
        currentKey: "",
        currentValue: "",
        originalValue: "",
        editMode: false,
        searchKey: "",
        showUntranslatedOnly: false,
        showTranslationPanel: true,
        statusMessage: "",
        hasError: false,
        isImporting: false,
        importProgress: 0,
        jsonOutput: "",
        currentPage: 1,
        untranslatedCurrentPage: 1,
        missingKeysCurrentPage: 1,
        showMissingKeysPanel: false,
        selectedMissingKeys: [],
    });

    const untranslatedKeys = computed(() => {
        if (!state.sourceEntries) return [];
        return Object.keys(state.sourceEntries).filter(
            (key) => !state.targetEntries || !state.targetEntries[key]
        );
    });

    const missingKeys = computed(() => {
        if (!state.targetEntries || !state.sourceEntries) return [];
        return Object.keys(state.targetEntries).filter(
            (key) => !state.sourceEntries[key]
        );
    });

    const filteredEntries = computed(() => {
        if (!state.targetEntries) return {};

        let result = {};
        Object.entries(state.targetEntries).forEach(([key, value]) => {
            if (state.showUntranslatedOnly && value) return;
            if (
                state.searchKey &&
                !key.toLowerCase().includes(state.searchKey.toLowerCase())
            )
                return;
            result[key] = value;
        });

        return result;
    });

    const translationStats = computed(
        (): TranslationStats => ({
            totalEntries: Object.keys(state.sourceEntries).length,
            translatedCount: Object.keys(state.targetEntries).filter(
                (key) => state.targetEntries[key]
            ).length,
            untranslatedCount: untranslatedKeys.value.length,
            missingKeysCount: missingKeys.value.length,
        })
    );

    const paginationInfo = computed(
        (): PaginationInfo => ({
            currentPage: state.currentPage,
            totalPages: Math.ceil(
                Object.keys(filteredEntries.value).length / config.pageSize
            ),
            pageSize: config.pageSize,
            totalItems: Object.keys(filteredEntries.value).length,
        })
    );

    const paginatedEntries = computed(() => {
        const keys = Object.keys(filteredEntries.value);
        const startIndex = (state.currentPage - 1) * config.pageSize;
        const endIndex = startIndex + config.pageSize;
        const pageKeys = keys.slice(startIndex, endIndex);

        const result = {};
        pageKeys.forEach((key) => {
            result[key] = filteredEntries.value[key];
        });
        return result;
    });

    const paginatedUntranslatedKeys = computed(() => {
        const startIndex =
            (state.untranslatedCurrentPage - 1) * config.untranslatedPageSize;
        const endIndex = startIndex + config.untranslatedPageSize;
        return untranslatedKeys.value.slice(startIndex, endIndex);
    });

    const paginatedMissingKeys = computed(() => {
        const startIndex =
            (state.missingKeysCurrentPage - 1) * config.missingKeysPageSize;
        const endIndex = startIndex + config.missingKeysPageSize;
        return missingKeys.value.slice(startIndex, endIndex);
    });

    /**
     * Updates status message and error state
     * @param message - Status message
     * @param isError - Whether this is an error
     */
    const updateStatus = (message: string, isError = false) => {
        state.statusMessage = message;
        state.hasError = isError;
    };

    /**
     * Clears status message
     */
    const clearStatus = () => {
        state.statusMessage = "";
        state.hasError = false;
    };

    /**
     * Reads file with progress updates
     * @param file - File to read
     * @param onProgress - Progress callback
     * @returns File content
     */
    const readFileWithProgress = (
        file: File,
        onProgress: (progress: number) => void
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Error reading file"));
            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    onProgress(event.loaded / event.total);
                }
            };
            reader.readAsText(file);
        });
    };

    /**
     * Parses JSON with yielding to prevent UI freezing
     * @param jsonString - JSON string to parse
     * @returns Parsed object
     */
    const parseJsonWithYield = async (jsonString: string): Promise<any> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    const parsed = JSON.parse(jsonString);
                    resolve(parsed);
                } catch (error) {
                    console.error("JSON parse error:", error);
                    resolve(null);
                }
            }, 0);
        });
    };

    /**
     * Processes keys in small batches to avoid UI freezing
     * @param keys - Keys to process
     * @param processor - Function to process each key
     * @param batchSize - Size of each batch
     * @param pauseTime - Pause between batches
     * @returns Promise that resolves when done
     */
    const processKeysInSmallBatches = (
        keys: string[],
        processor: (key: string) => void,
        batchSize = 50,
        pauseTime = 10
    ): Promise<void> => {
        return new Promise((resolve) => {
            let index = 0;

            function processNextBatch() {
                const endIndex = Math.min(index + batchSize, keys.length);
                const batch = keys.slice(index, endIndex);

                if (state.isImporting) {
                    state.importProgress =
                        60 + Math.floor((index / keys.length) * 30);
                    state.statusMessage = `Processing entries (${index}/${keys.length})...`;
                }

                batch.forEach(processor);
                index = endIndex;

                if (index < keys.length) {
                    setTimeout(processNextBatch, pauseTime);
                } else {
                    resolve();
                }
            }

            if (keys.length > 0) {
                processNextBatch();
            } else {
                resolve();
            }
        });
    };

    /**
     * Generates JSON output from current target entries
     */
    const generateJson = () => {
        try {
            state.jsonOutput = JSON.stringify(
                state.targetEntries || {},
                null,
                2
            );
        } catch (error) {
            console.error("Error generating JSON:", error);
            updateStatus("Error generating JSON output", true);
        }
    };

    /**
     * Imports source language file
     * @param file - File to import
     */
    const importSourceLanguage = async (file: File) => {
        state.isImporting = true;
        state.importProgress = 10;
        updateStatus("Reading source language file...");

        try {
            const content = await readFileWithProgress(file, (progress) => {
                state.importProgress = Math.floor(10 + progress * 40);
            });

            state.importProgress = 50;
            updateStatus("Parsing source language file...");

            const parsedData = await parseJsonWithYield(content);
            if (!parsedData) {
                throw new Error("Failed to parse JSON");
            }

            state.importProgress = 60;
            updateStatus("Processing data...");

            const filename = file.name;
            config.sourceLanguage = filename.replace(/\.json$/i, "");

            state.sourceEntries = parsedData;

            if (
                !state.targetEntries ||
                Object.keys(state.targetEntries).length === 0
            ) {
                state.targetEntries = {};
                await processKeysInSmallBatches(
                    Object.keys(parsedData),
                    (key) => {
                        state.targetEntries[key] = "";
                    },
                    50,
                    10
                );
            }

            state.importProgress = 100;
            updateStatus(
                `Source language file (${
                    config.sourceLanguage
                }) imported successfully with ${
                    Object.keys(parsedData).length
                } entries`
            );
            generateJson();
        } catch (error) {
            console.error("Import error:", error);
            updateStatus(
                `Error importing source language file: ${error.message}`,
                true
            );
        } finally {
            setTimeout(() => {
                state.isImporting = false;
                state.importProgress = 0;
            }, 500);
        }
    };

    /**
     * Imports target language file
     * @param file - File to import
     */
    const importTargetLanguage = async (file: File) => {
        state.isImporting = true;
        state.importProgress = 10;
        updateStatus("Reading target language file...");

        try {
            const content = await readFileWithProgress(file, (progress) => {
                state.importProgress = Math.floor(10 + progress * 40);
            });

            state.importProgress = 50;
            updateStatus("Parsing target language file...");

            const parsedData = await parseJsonWithYield(content);
            if (!parsedData) {
                throw new Error("Failed to parse JSON");
            }

            state.importProgress = 80;

            const filename = file.name;
            config.targetLanguage = filename.replace(/\.json$/i, "");

            state.targetEntries = parsedData;

            state.importProgress = 100;
            updateStatus(
                `Target language file (${
                    config.targetLanguage
                }) imported successfully with ${
                    Object.keys(parsedData).length
                } entries`
            );
            generateJson();
        } catch (error) {
            console.error("Import error:", error);
            updateStatus(
                `Error importing target language file: ${error.message}`,
                true
            );
        } finally {
            setTimeout(() => {
                state.isImporting = false;
                state.importProgress = 0;
            }, 500);
        }
    };

    /**
     * Starts editing an entry
     * @param key - Entry key to edit
     */
    const editEntry = (key: string) => {
        state.currentKey = key;
        state.currentValue = state.targetEntries[key] || "";
        state.originalValue = state.currentValue;
        state.editMode = true;

        nextTick(() => {
            const textareaElement = document.querySelector(
                ".entry-editor textarea"
            ) as HTMLTextAreaElement;
            if (textareaElement) {
                textareaElement.focus();
            }
        });
    };

    /**
     * Saves current entry
     */
    const saveEntry = () => {
        if (!state.currentKey) return;

        if (!state.targetEntries) {
            state.targetEntries = {};
        }

        state.targetEntries[state.currentKey] = state.currentValue;
        updateStatus(`Entry "${state.currentKey}" has been saved`);

        state.currentKey = "";
        state.currentValue = "";
        state.originalValue = "";
        state.editMode = false;

        generateJson();
    };

    /**
     * Cancels current edit
     */
    const cancelEdit = () => {
        state.currentKey = "";
        state.currentValue = "";
        state.originalValue = "";
        state.editMode = false;
    };

    /**
     * Uses source value for current entry
     */
    const useSourceValue = () => {
        if (
            !state.currentKey ||
            !state.sourceEntries ||
            !state.sourceEntries[state.currentKey]
        )
            return;
        state.currentValue = state.sourceEntries[state.currentKey];
    };

    /**
     * Deletes an entry
     * @param key - Entry key to delete
     */
    const deleteEntry = (key: string) => {
        if (!state.targetEntries || !state.targetEntries[key]) return;

        if (confirm(`Are you sure you want to delete entry "${key}"?`)) {
            delete state.targetEntries[key];
            updateStatus(`Entry "${key}" has been deleted`);
            generateJson();
        }
    };

    /**
     * Downloads JSON output
     */
    const downloadJson = () => {
        if (!state.jsonOutput) {
            generateJson();
        }

        const filename = `${config.targetLanguage}.json`;
        const blob = new Blob([state.jsonOutput], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const element = document.createElement("a");
        element.setAttribute("href", url);
        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();

        document.body.removeChild(element);
        URL.revokeObjectURL(url);
    };

    /**
     * Fills all untranslated entries from source
     */
    const fillAllFromSource = () => {
        if (!state.sourceEntries || !state.targetEntries) return;

        const untranslated = untranslatedKeys.value;

        processKeysInSmallBatches(
            untranslated,
            (key) => {
                state.targetEntries[key] = state.sourceEntries[key];
            },
            100
        );

        updateStatus(
            `Filling ${untranslated.length} untranslated entries from source language`
        );

        setTimeout(() => {
            updateStatus(
                `Filled ${untranslated.length} untranslated entries from source language`
            );
            generateJson();
        }, 100);
    };

    return {
        config,
        state,
        untranslatedKeys,
        missingKeys,
        filteredEntries,
        translationStats,
        paginationInfo,
        paginatedEntries,
        paginatedUntranslatedKeys,
        paginatedMissingKeys,
        updateStatus,
        clearStatus,
        importSourceLanguage,
        importTargetLanguage,
        editEntry,
        saveEntry,
        cancelEdit,
        useSourceValue,
        deleteEntry,
        downloadJson,
        fillAllFromSource,
        generateJson,
    };
}
