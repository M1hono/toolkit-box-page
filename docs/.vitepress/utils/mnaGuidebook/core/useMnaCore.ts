/**
 * @fileoverview Core MNA state management and basic operations
 * @description Manages entries, status, and core CRUD functionality
 */

import { ref, reactive, computed } from "vue";
import type { EntryCollection, GeneratorConfig, Entry } from "../types.js";

export function useMnaCore() {
    // Basic configuration
    const config = reactive<GeneratorConfig>({
        modId: "mna",
        language: "zh_cn",
        sourceLanguage: "en_us",
        isPackAddition: false,
    });

    // Core state
    const entries = ref<EntryCollection>({});
    const sourceEntries = ref<EntryCollection>({});
    const currentEntryId = ref("");
    const customCategories = ref<string[]>([]);
    const removedCategories = ref<string[]>([]);

    // UI state
    const showTranslation = ref(false);
    const showUntranslatedOnly = ref(false);
    const entryFilter = ref("");

    // Status management
    const statusMessage = ref("");
    const hasError = ref(false);
    const jsonOutput = ref("");

    // Default MNA categories
    const defaultCategories = [
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
    ];

    const tierOptions = [1, 2, 3, 4, 5];

    // Current entry being edited
    const currentEntryData = reactive<Entry>({
        id: "",
        name: "",
        category: "basics",
        icon: "",
        advancement: "",
        sections: [],
        sortnum: 0,
    });

    // Computed properties
    const allCategories = computed(() => {
        const all = [...defaultCategories, ...customCategories.value];
        return all.filter((cat) => !removedCategories.value.includes(cat));
    });

    const filteredEntries = computed(() => {
        let result: EntryCollection = {};

        for (const [key, entry] of Object.entries(entries.value)) {
            // Filter by untranslated only
            if (showUntranslatedOnly.value && sourceEntries.value[key]) {
                continue;
            }

            // Filter by search term
            if (
                entryFilter.value &&
                !key.toLowerCase().includes(entryFilter.value.toLowerCase())
            ) {
                continue;
            }

            result[key] = entry;
        }

        return result;
    });

    const untranslatedEntries = computed(() =>
        Object.keys(sourceEntries.value).filter((key) => !entries.value[key])
    );

    const hasSourceData = computed(
        () => Object.keys(sourceEntries.value).length > 0
    );

    // Status management
    const updateStatus = (message: string, isError = false) => {
        statusMessage.value = message;
        hasError.value = isError;
    };

    const clearStatus = () => {
        statusMessage.value = "";
        hasError.value = false;
    };

    // Entry management
    const createEmptyEntry = (): Entry => ({
        id: "",
        name: "",
        category: "basics",
        icon: "",
        advancement: "",
        sections: [],
        sortnum: 0,
    });

    const createNewEntry = (entryId: string) => {
        if (!entryId.trim()) {
            updateStatus("Please enter an entry ID", true);
            return false;
        }

        if (entries.value[entryId]) {
            updateStatus("Entry already exists", true);
            return false;
        }

        // Set as current entry for editing
        currentEntryId.value = entryId;
        const newEntry = createEmptyEntry();
        newEntry.id = entryId;
        newEntry.name = entryId;
        Object.assign(currentEntryData, newEntry);

        updateStatus(`Created new entry: ${entryId} - add sections and save`);
        return true;
    };

    const saveCurrentEntry = () => {
        if (!currentEntryId.value) {
            updateStatus("Please enter an entry ID", true);
            return false;
        }

        if (
            !currentEntryData.sections ||
            currentEntryData.sections.length === 0
        ) {
            updateStatus("Entry must have at least one section", true);
            return false;
        }

        // Create MNA-compatible entry structure
        const newEntry: any = {
            index: currentEntryData.sortnum || 0,
            category: currentEntryData.category || "basics",
            sections: JSON.parse(
                JSON.stringify(currentEntryData.sections || [])
            ),
        };

        // Add tier if > 1
        if (currentEntryData.sortnum && currentEntryData.sortnum > 1) {
            newEntry.tier = currentEntryData.sortnum;
        }

        // Add advancement if present
        if (currentEntryData.advancement) {
            newEntry.required_advancement = currentEntryData.advancement;
        }

        entries.value[currentEntryId.value] = newEntry;
        updateStatus(`Entry "${currentEntryId.value}" saved successfully`);
        generateJson();
        return true;
    };

    const editEntry = (entryId: string) => {
        const entry = entries.value[entryId];
        if (!entry) return false;

        currentEntryId.value = entryId;
        Object.assign(currentEntryData, {
            id: entryId,
            name: entryId,
            category: entry.category || "basics",
            icon: "",
            advancement: entry.required_advancement || "",
            sections: JSON.parse(JSON.stringify(entry.sections || [])),
            sortnum: entry.index || 0,
        });

        updateStatus(`Editing entry: ${entryId}`);
        return true;
    };

    const deleteEntry = (entryId: string) => {
        if (entries.value[entryId]) {
            delete entries.value[entryId];

            // Clear current entry if it's the deleted one
            if (currentEntryId.value === entryId) {
                currentEntryId.value = "";
                Object.assign(currentEntryData, createEmptyEntry());
            }

            updateStatus(`Entry "${entryId}" deleted`);
            generateJson();
            return true;
        }
        return false;
    };

    const resetEntryForm = () => {
        currentEntryId.value = "";
        Object.assign(currentEntryData, createEmptyEntry());
        clearStatus();
    };

    // Category management
    const addCategory = (categoryName: string) => {
        if (categoryName && !allCategories.value.includes(categoryName)) {
            customCategories.value.push(categoryName);
            return true;
        }
        return false;
    };

    const removeCategory = (category: string) => {
        // Check if it's in custom categories
        const customIndex = customCategories.value.indexOf(category);
        if (customIndex !== -1) {
            customCategories.value.splice(customIndex, 1);
            return true;
        }

        // If it's a default category, add to removed list
        if (defaultCategories.includes(category)) {
            if (!removedCategories.value.includes(category)) {
                removedCategories.value.push(category);
            }
            return true;
        }

        return false;
    };

    // JSON operations
    const generateJson = () => {
        jsonOutput.value = JSON.stringify(entries.value, null, 2);
    };

    const downloadJson = () => {
        if (!jsonOutput.value) {
            generateJson();
        }

        const blob = new Blob([jsonOutput.value], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${config.language}.json`;
        link.click();
        URL.revokeObjectURL(url);

        updateStatus(`Downloaded ${config.language}.json`);
    };

    return {
        // Config and state
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

        // Methods
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
    };
}
