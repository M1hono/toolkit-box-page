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
                        <div class="actions-bar d-flex gap-3 flex-wrap">
                            <v-btn
                                @click="generateJson"
                                variant="text"
                                :disabled="Object.keys(entries).length === 0"
                                prepend-icon="mdi-code-json"
                                class="toolbar-action"
                            >
                                {{ t.generateJson }}
                            </v-btn>

                            <v-btn
                                @click="downloadJson"
                                variant="text"
                                :disabled="!jsonOutput"
                                prepend-icon="mdi-download"
                                class="toolbar-action"
                            >
                                {{ t.downloadJson }}
                            </v-btn>

                            <v-btn
                                v-if="hasSourceData"
                                @click="handleAutoUpdate"
                                variant="text"
                                prepend-icon="mdi-sync"
                                class="toolbar-action"
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
        entryAlreadyExists: "Entry already exists",
        createdNewEntryStatus: "Created new entry: {entry} - add sections and save",
        entryMustHaveSection: "Entry must have at least one section",
        entryMustHaveTitleSection:
            "Entry must contain at least one title section",
        entrySavedStatus: 'Entry "{entry}" saved successfully',
        editingEntryStatus: "Editing entry: {entry}",
        entryDeletedStatus: 'Entry "{entry}" deleted',
        downloadedLanguageJson: "Downloaded {language}.json",
        titleSectionRequiresValue: "Title section requires a value",
        textSectionRequiresSegment:
            "Text section requires at least one text segment",
        imageSectionRequiresLocation: "Image section requires a location",
        recipeSectionRequiresLocation: "Recipe section requires a location",
        itemSectionRequiresLocation:
            "Item section requires at least one item location",
        addedSectionStatus: "Added {type} section",
        removedSectionStatus: "Removed {type} section",
        editingSectionStatus: "Editing {type} section",
        appliedStructureFromSourceSection:
            "Applied structure from source section",
        selectOrphanedToDelete: "Please select orphaned entries to delete",
        deletedOrphanedCount: "Deleted {count} orphaned entries",
        deletedOrphanedSingle: "Deleted orphaned entry: {entry}",
        fixedCategoryFor: "Fixed category for: {entry}",
        fixedStructureFor: "Fixed structure for: {entry}",
        fixedContentFor: "Fixed content properties for: {entry}",
        selectMismatchToFix: "Please select mismatch entries to fix",
        fixedMismatchCount: "Fixed {count} mismatch entries",
        selectMismatchToDelete: "Please select mismatch entries to delete",
        deletedMismatchCount: "Deleted {count} mismatch entries",
        sourceImportedStatus:
            "Source language ({filename}) imported: {count} entries",
        targetImportedStatus:
            "Target language ({filename}) imported: {count} entries",
        importFailedStatus: "Import failed: {message}",
        startedTranslatingStatus: "Started translating: {entry}",
        filledSectionsFromSourceStatus:
            "Filled {count} sections from source",
        foundNewEntriesStatus: "Found {count} new entries to translate",
        foundChangedEntriesStatus: "Found {count} entries with changes",
        autoUpdatedEntriesStatus:
            "Auto-updated {count} entries from source{summary}",
        createdFromSourceStatus:
            'Created "{entry}" with {count} sections from source',
    });

    // Get all functionality from the organized composables
    const mnaGenerator = useMnaGenerator(t);

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
        --mna-shell-bg: var(--vp-c-bg);
        --mna-panel-bg: color-mix(in srgb, var(--vp-c-bg) 90%, var(--vp-c-bg-soft) 10%);
        --mna-panel-bg-strong: color-mix(
            in srgb,
            var(--vp-c-bg) 82%,
            var(--vp-c-bg-soft) 18%
        );
        --mna-panel-border: color-mix(
            in srgb,
            var(--vp-c-divider) 84%,
            var(--vp-c-text-3) 16%
        );
        --mna-panel-border-strong: color-mix(
            in srgb,
            var(--vp-c-divider) 66%,
            var(--vp-c-text-2) 34%
        );
        --mna-panel-muted: color-mix(in srgb, var(--vp-c-bg-soft) 72%, var(--vp-c-bg) 28%);
        background: var(--mna-shell-bg);
        min-height: 100vh;
    }

    .app-title {
        color: var(--vp-c-text-1);
    }

    .theme-divider {
        border-color: var(--vp-c-divider) !important;
    }

    .actions-bar {
        padding: 6px 4px;
        border: 1px solid var(--mna-panel-border);
        border-radius: 14px;
        background: color-mix(in srgb, var(--vp-c-bg) 94%, var(--vp-c-bg-soft) 6%);
    }

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

    :deep(.v-card),
    :deep(.v-sheet),
    :deep(.v-alert),
    :deep(.v-btn) {
        box-shadow: none !important;
    }

    :deep(.v-card) {
        border: 1px solid var(--mna-panel-border);
        background: var(--mna-panel-bg);
    }

    :deep(.v-card-title) {
        padding: 18px 20px;
        border-bottom: 1px solid color-mix(in srgb, var(--mna-panel-border) 86%, transparent);
        background: var(--mna-panel-muted);
        line-height: 1.35;
        min-height: 0;
    }

    :deep(.v-card-text) {
        color: var(--vp-c-text-1);
    }

    :deep(.v-field) {
        background: color-mix(in srgb, var(--vp-c-bg) 92%, var(--vp-c-bg-soft) 8%);
    }

    :deep(.v-field__outline) {
        color: var(--mna-panel-border-strong);
    }

    :deep(.v-field:hover .v-field__outline) {
        color: color-mix(in srgb, var(--vp-c-text-2) 38%, var(--mna-panel-border-strong));
    }

    :deep(.v-field.v-field--focused .v-field__outline) {
        color: var(--vp-c-brand-1);
    }

    :deep(.v-input .v-label),
    :deep(.v-input .v-messages),
    :deep(.v-input .v-field__input) {
        color: var(--vp-c-text-1);
    }

    :deep(.v-input__details) {
        padding-top: 6px;
        min-height: 22px;
    }

    :deep(.v-messages) {
        min-height: 16px;
        line-height: 1.35;
    }

    :deep(.v-btn--variant-outlined) {
        border-color: color-mix(in srgb, var(--mna-panel-border-strong) 72%, transparent);
    }

    :deep(.v-btn--variant-outlined:not(.v-btn--disabled):hover) {
        background: color-mix(in srgb, var(--vp-c-bg-soft) 54%, var(--vp-c-bg));
    }

    :deep(.v-btn.v-btn--disabled) {
        opacity: 1 !important;
        box-shadow: none !important;
        color: var(--vp-c-text-2) !important;
        border-color: color-mix(in srgb, var(--mna-panel-border-strong) 72%, transparent) !important;
        background: color-mix(in srgb, var(--vp-c-bg-soft) 82%, var(--vp-c-bg)) !important;
    }

    :deep(.v-btn.v-btn--disabled .v-btn__overlay),
    :deep(.v-btn.v-btn--disabled .v-btn__underlay) {
        display: none;
    }

    :deep(.toolbar-action) {
        background: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
        color: var(--vp-c-text-1) !important;
        min-height: 36px;
        padding-inline: 10px;
    }

    :deep(.toolbar-action .v-btn__overlay),
    :deep(.toolbar-action .v-btn__underlay) {
        display: none;
    }

    :deep(.toolbar-action:not(.v-btn--disabled):hover) {
        background: color-mix(in srgb, var(--vp-c-bg-soft) 60%, transparent) !important;
    }

    :deep(.toolbar-action.v-btn--disabled) {
        background: transparent !important;
        border-color: transparent !important;
        color: var(--vp-c-text-3) !important;
        opacity: 1 !important;
    }

    :deep(.v-chip--variant-outlined) {
        border-color: color-mix(in srgb, var(--mna-panel-border-strong) 78%, transparent);
    }

    :deep(.v-pagination) {
        justify-content: center;
    }

    .main-layout {
        display: grid;
        grid-template-columns: minmax(320px, 0.92fr) minmax(420px, 1.08fr);
        gap: 18px;
        padding: 0 24px 24px;
        align-items: start;
    }

    .left-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .right-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .panel-item {
        width: 100%;
        min-width: 0;
    }

    .flex-grow-1 {
        min-height: 360px;
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
            gap: 16px;
            margin-bottom: 16px;
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
