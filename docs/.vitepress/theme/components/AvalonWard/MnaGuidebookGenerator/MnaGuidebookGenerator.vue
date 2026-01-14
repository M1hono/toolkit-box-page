<!--
/**
 * @fileoverview MNA Guidebook Generator - Main Translation Tool
 * @component MnaGuidebookGenerator
 * @description Advanced translation and guidebook creation tool for MNA mod
 */
-->

<template>
    <v-app class="mna-guidebook-app">
        <v-main>
            <v-container fluid class="pa-0 ma-0" style="max-width: 100%">
                <!-- Header -->
                <v-row class="mb-6 mx-0">
                    <v-col cols="12" class="px-6">
                        <div class="text-h3 font-weight-bold mb-2 app-title">
                            {{ t.title }}
                        </div>
                        <v-divider class="theme-divider"></v-divider>
                    </v-col>
                </v-row>


                <!-- Status Alert -->
                <v-row v-if="statusMessage" class="mb-4 mx-0">
                    <v-col cols="12" class="px-6">
                        <v-alert
                            :type="hasError ? 'error' : 'success'"
                            variant="tonal"
                            :text="statusMessage"
                            closable
                            @click:close="clearStatus"
                        ></v-alert>
                    </v-col>
                </v-row>

                <!-- Quick Actions -->
                <v-row class="mb-4 mx-0">
                    <v-col cols="12" class="px-6">
                        <div class="d-flex gap-3 flex-wrap">
                            <v-btn
                                @click="generateJson"
                                color="primary"
                                :disabled="Object.keys(entries).length === 0"
                                prepend-icon="mdi-code-json"
                            >
                                {{ t.generateJson }}
                            </v-btn>

                            <v-btn
                                @click="downloadJson"
                                color="success"
                                :disabled="!jsonOutput"
                                prepend-icon="mdi-download"
                            >
                                {{ t.downloadJson }}
                            </v-btn>

                            <v-btn
                                v-if="hasSourceData"
                                @click="handleAutoUpdate"
                                color="warning"
                                prepend-icon="mdi-sync"
                            >
                                {{ t.autoUpdate }}
                                <v-badge
                                    v-if="newEntriesCount > 0"
                                    :content="newEntriesCount"
                                    color="error"
                                    inline
                                ></v-badge>
                            </v-btn>
                        </div>
                    </v-col>
                </v-row>

                <!-- Settings Panel at Top -->
                <v-row class="mx-0 mb-4">
                    <v-col cols="12" class="px-6">
                        <mna-settings-panel
                            v-model:config="config"
                            :has-source-data="hasSourceData"
                            :source-entries-count="Object.keys(sourceEntries).length"
                            :target-entries-count="Object.keys(entries).length"
                            :untranslated-count="untranslatedEntries.length"
                            :custom-categories="customCategories"
                            :all-categories="allCategories"
                            @import-source="handleImportSource"
                            @import-target="handleImportTarget"
                            @add-category="addCategory"
                            @remove-category="removeCategory"
                        />
                    </v-col>
                </v-row>

                <div class="main-layout">
                    <!-- Left Panel -->
                    <div class="left-panel">

                        <mna-entries-list
                            ref="entriesListRef"
                            :entries="paginatedEntries"
                            :total-entries-count="Object.keys(filteredEntries).length"
                            :current-entry-id="currentEntryId"
                            :current-page="currentPage"
                            :page-size="pageSize"
                            :total-pages="totalPages"
                            :visible-pages="visiblePageNumbers"
                            v-model:filter="entryFilter"
                            v-model:show-untranslated-only="showUntranslatedOnly"
                            @select-entry="editEntry"
                            @create-entry="handleCreateEntry"
                            @delete-entry="handleDeleteEntry"
                            @page-change="goToPage"
                            @page-size-change="changePageSize"
                            class="panel-item"
                        />

                        <!-- Untranslated entries integrated into mismatch manager -->
                    </div>

                    <!-- Right Panel -->
                    <div class="right-panel">
                        <mna-entry-editor
                            ref="editorRef"
                            v-model:entry-data="currentEntryData"
                            :entry-id="currentEntryId"
                            :categories="allCategories"
                            :has-source-data="hasSourceData"
                            :source-entry="sourceEntries[currentEntryId]"
                            :current-section="currentSection"
                            :current-text-segment="currentTextSegment"
                            :current-item-location="currentItemLocation"
                            :text-editing-index="currentTextSegmentEditingIndex"
                            @save="saveCurrentEntry"
                            @reset="resetEntryForm"
                            @fill-from-source="fillAllSectionsFromSource"
                            @add-category="addCategory"
                            @use-structure="useStructure"
                            @add-section="addSection"
                            @edit-section="editSection"
                            @remove-section="removeSection"
                            @add-text-segment="addTextSegment"
                            @edit-text-segment="editTextSegment"
                            @remove-text-segment="removeTextSegment"
                            @add-item-location="addItemLocation"
                            @remove-item-location="removeItemLocation"
                            @reset-section="resetCurrentSection"
                            class="panel-item flex-grow-1"
                        />

                        <mna-mismatch-manager
                            :entries="entries"
                            :source-entries="sourceEntries"
                            :untranslated-entries="untranslatedEntries"
                            :missing-keys="missingKeys"
                            :mismatch-entries="allMismatchEntries"
                            @create-from-source="handleCreateFromSource"
                            @delete-single-missing="deleteSingleMissingKey"
                            @fix-category-mismatch="fixCategoryMismatch"
                            @fix-structure-mismatch="fixStructureMismatch"
                            @fix-content-mismatch="fixContentMismatch"
                            class="panel-item"
                        />
                    </div>
                </div>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
    import { ref, computed } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import { useMnaGenerator } from "../../../../utils/mnaGuidebook";

    import MnaSettingsPanel from "./MnaSettingsPanel.vue";
    import MnaEntriesList from "./MnaEntriesList.vue";
    import MnaTranslationPanel from "./MnaTranslationPanel.vue";
    import MnaEntryEditor from "./MnaEntryEditor.vue";
    import MnaMismatchManager from "./MnaMismatchManager.vue";

    const { t } = useSafeI18n("mna-guidebook-generator", {
        title: "MNA Guidebook Generator & Translator",
        generateJson: "Generate JSON",
        downloadJson: "Download JSON",
        autoUpdate: "Auto Update",
        autoUpdateSuccess: "Auto-updated entries from source",
        importSourceSuccess: "Source file imported successfully",
        importTargetSuccess: "Target file imported successfully",
        exportSuccess: "File exported successfully",
        confirmClear: "Are you sure you want to clear all data?",
        confirmDelete: "Are you sure you want to delete this entry?",
        confirmDeleteEntry: "Are you sure you want to delete entry \"{entry}\"?",
        dataCleared: "All data cleared",
        newEntriesFound: "new entries found",
        changedEntriesFound: "changed entries found",
        entriesUpdated: "entries updated",
        pleaseEnterEntryId: "Please enter an entry ID",
        entryCreated: "Entry created successfully",
    });

    // Get all functionality from the organized composables
    const mnaGenerator = useMnaGenerator();

    // Destructure for easier access
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
        formatJsonText,
        importData,
        startTranslatingEntry,
        fillAllSectionsFromSource,
        useStructure,
        extractNewEntries,
        findChangedEntries,
        autoUpdateFromSource,
        createEntryFromSource,
        showMissingKeysPanel,
        selectedMissingKeys,
        showMismatchPanel,
        selectedMismatchEntries,
        missingKeys,
        categoryMismatchEntries,
        structureMismatchEntries,
        contentMismatchEntries,
        allMismatchEntries,
        toggleMissingKey,
        toggleAllMissingKeys,
        deleteSelectedMissingKeys,
        deleteSingleMissingKey,
        toggleMismatchEntry,
        toggleAllMismatchEntries,
        fixCategoryMismatch,
        fixStructureMismatch,
        fixContentMismatch,
        fixSelectedMismatches,
        deleteSelectedMismatches,
        currentPage,
        pageSize,
        untranslatedCurrentPage,
        untranslatedPageSize,
        pageSizeOptions,
        totalPages,
        paginatedEntries,
        untranslatedTotalPages,
        paginatedUntranslatedEntries,
        visiblePageNumbers,
        visibleUntranslatedPageNumbers,
        goToPage,
        nextPage,
        prevPage,
        goToFirstPage,
        goToLastPage,
        changePageSize,
        goToUntranslatedPage,
        nextUntranslatedPage,
        prevUntranslatedPage,
        goToFirstUntranslatedPage,
        goToLastUntranslatedPage,
        changeUntranslatedPageSize,
    } = mnaGenerator;

    const entriesListRef = ref();
    const editorRef = ref();

    // Computed for reactive counts
    const newEntriesCount = computed(() => extractNewEntries().length);

    // Event handlers
    const handleImportSource = async (file: File) => {
        console.log('[MNA Main] handleImportSource called with file:', file?.name);
        const success = await importData(file, "source");
        console.log('[MNA Main] importData returned:', success);
        if (success) {
            showTranslation.value = true;
            updateStatus(t.importSourceSuccess);
            
            // Auto-extract categories from source
            const categories = new Set<string>();
            Object.values(sourceEntries.value).forEach((entry: any) => {
                if (entry.category) {
                    categories.add(entry.category);
                }
            });
            
            categories.forEach(cat => {
                if (!allCategories.value.includes(cat)) {
                    customCategories.value.push(cat);
                }
            });
        }
    };

    const handleImportTarget = async (file: File) => {
        const success = await importData(file, "target");
        if (success) {
            updateStatus(t.importTargetSuccess);
            
            // Auto-extract categories from target
            const categories = new Set<string>();
            Object.values(entries.value).forEach((entry: any) => {
                if (entry.category) {
                    categories.add(entry.category);
                }
            });
            
            categories.forEach(cat => {
                if (!allCategories.value.includes(cat)) {
                    customCategories.value.push(cat);
                }
            });
        }
    };

    const handleDeleteEntry = (entryId: string) => {
        if (confirm(t.confirmDeleteEntry.replace("{entry}", entryId))) {
            deleteEntry(entryId);
        }
    };

    const handleCreateEntry = (entryId: string) => {
        if (!entryId.trim()) {
            updateStatus(t.pleaseEnterEntryId, true);
            return;
        }
        
        if (createNewEntry(entryId)) {
            updateStatus(t.entryCreated);
        }
    };

    const handleClear = () => {
        if (confirm(t.confirmClear)) {
            entries.value = {};
            sourceEntries.value = {};
            customCategories.value = [];
            resetEntryForm();
            generateJson();
            updateStatus(t.dataCleared);
        }
    };

    const handleAutoUpdate = () => {
        const newCount = extractNewEntries().length;
        const changedCount = findChangedEntries().length;
        const updatedCount = autoUpdateFromSource();

        updateStatus(
            `${t.autoUpdateSuccess}: ${newCount} ${t.newEntriesFound}, ${changedCount} ${t.changedEntriesFound}, ${updatedCount} ${t.entriesUpdated}`
        );
    };

    const handleCreateFromSource = (entryId: string) => {
        const sourceData = sourceEntries.value[entryId];
        if (sourceData) {
            createEntryFromSource(entryId, sourceData);
        }
    };
</script>

<style scoped>
    .mna-guidebook-app {
        background-color: var(--vp-c-bg);
        min-height: 100vh;
    }

    .app-title {
        color: var(--vp-c-text-1);
    }

    .theme-divider {
        border-color: var(--vp-c-divider) !important;
    }

    /* Modern clean style - limited rounded corners (4-8px max), no shadows */
    .v-card,
    .v-sheet,
    .v-alert,
    .v-chip,
    .v-btn,
    .v-text-field .v-field,
    .v-textarea .v-field,
    .v-select .v-field,
    .v-file-input .v-field {
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    /* Remove shadows from all components */
    :deep(.v-card),
    :deep(.v-sheet),
    :deep(.v-alert),
    :deep(.v-btn) {
        box-shadow: none !important;
    }

    /* Borders instead of shadows for depth */
    :deep(.v-card) {
        border: 1px solid var(--vp-c-divider);
    }

    /* Use Vuetify's default pagination styling */
    :deep(.v-pagination) {
        justify-content: center;
    }

    .main-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        padding: 0 24px;
        min-height: calc(100vh - 140px);
        align-items: start;
    }

    .left-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-right: 0;
        height: calc(100vh - 180px);
    }

    .left-panel > * {
        flex-shrink: 0;
    }

    .right-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-left: 0;
        height: calc(100vh - 180px);
    }

    .right-panel > * {
        flex-shrink: 0;
    }

    .panel-item {
        width: 100%;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
    }

    .panel-item:last-child {
        flex: 1;
        min-height: 0;
    }

    .flex-grow-1 {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }

    /* Ensure all panels fill available space */
    :deep(.v-card) {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    :deep(.v-card-text) {
        flex: 1;
        overflow-y: auto;
    }

    .gap-3 {
        gap: 12px;
    }

    @media (max-width: 1024px) {
        .main-layout {
            grid-template-columns: 1fr;
            padding: 0 16px;
            gap: 16px;
        }

        .left-panel,
        .right-panel {
            padding: 0;
            gap: 16px;
            margin-bottom: 16px;
            max-height: none;
            overflow-y: visible;
        }

        .right-panel {
            order: 2;
        }

        .left-panel {
            order: 1;
        }
    }

    @media (max-width: 768px) {
        .main-layout {
            padding: 0 12px;
            gap: 12px;
        }

        .left-panel,
        .right-panel {
            gap: 12px;
            margin-bottom: 12px;
        }
    }
</style>