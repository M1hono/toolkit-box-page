<!--
/**
 * @fileoverview JSON Translator - Main Component
 * @component JsonTranslator
 * @description Main orchestrator for JSON translation functionality with file import, editing, and export
 */
-->

<template>
    <v-app class="json-translator-app">
        <v-main>
            <v-container fluid class="pa-0 ma-0" style="max-width: 100%">
                <v-row class="mb-6 mx-0">
                    <v-col cols="12" class="px-6">
                        <div class="text-h3 font-weight-bold mb-2 app-title">
                            {{ t.title }}
                        </div>
                        <v-divider class="theme-divider"></v-divider>
                    </v-col>
                </v-row>

                <v-row v-if="state.statusMessage" class="mb-4 mx-0">
                    <v-col cols="12" class="px-6">
                        <v-alert
                            :type="state.hasError ? 'error' : 'success'"
                            variant="tonal"
                            :text="state.statusMessage"
                            closable
                            @click:close="clearStatus"
                        ></v-alert>
                    </v-col>
                </v-row>

                <v-row class="mx-0">
                    <v-col cols="12" class="px-6">
                        <json-import-panel
                            :config="config"
                            :is-importing="state.isImporting"
                            :import-progress="state.importProgress"
                            :translation-stats="translationStats"
                            :show-untranslated-only="state.showUntranslatedOnly"
                            :show-translation-panel="state.showTranslationPanel"
                            @import-source="handleImportSource"
                            @import-target="handleImportTarget"
                            @fill-all-from-source="fillAllFromSource"
                            @update:show-untranslated-only="
                                state.showUntranslatedOnly = $event
                            "
                            @update:show-translation-panel="
                                state.showTranslationPanel = $event
                            "
                            class="mb-6"
                        />
                    </v-col>
                </v-row>

                <v-row class="mx-0">
                    <v-col cols="12" class="px-6">
                        <json-search-bar
                            v-model:search="state.searchKey"
                            class="mb-6"
                        />
                    </v-col>
                </v-row>

                <div
                    class="main-layout"
                    :class="{ 'full-width': !state.showTranslationPanel }"
                >
                    <!-- Left Panel: Entry Management -->
                    <div class="left-panel">
                        <json-entry-editor
                            v-if="state.editMode"
                            :current-key="state.currentKey"
                            v-model:current-value="state.currentValue"
                            :source-value="
                                state.sourceEntries[state.currentKey]
                            "
                            @save="saveEntry"
                            @cancel="cancelEdit"
                            @use-source="useSourceValue"
                            class="panel-item"
                        />

                        <json-entries-list
                            :entries="paginatedEntries"
                            :pagination-info="paginationInfo"
                            :page-size="config.pageSize"
                            @update:page-size="config.pageSize = $event"
                            @update:page="state.currentPage = $event"
                            @edit="editEntry"
                            @delete="deleteEntry"
                            class="panel-item"
                        />

                        <json-output-panel
                            :json-output="state.jsonOutput"
                            :target-language="config.targetLanguage"
                            @generate="generateJson"
                            @download="downloadJson"
                            class="panel-item"
                        />
                    </div>

                    <!-- Right Panel: Translation Tools -->
                    <div v-if="state.showTranslationPanel" class="right-panel">
                        <json-missing-keys-manager
                            v-if="missingKeys.length > 0"
                            :missing-keys="missingKeys"
                            :paginated-missing-keys="paginatedMissingKeys"
                            :target-entries="state.targetEntries"
                            :selected-missing-keys="state.selectedMissingKeys"
                            :show-panel="state.showMissingKeysPanel"
                            :current-page="state.missingKeysCurrentPage"
                            :page-size="config.missingKeysPageSize"
                            @update:show-panel="
                                state.showMissingKeysPanel = $event
                            "
                            @update:selected-keys="
                                state.selectedMissingKeys = $event
                            "
                            @update:page="state.missingKeysCurrentPage = $event"
                            @update:page-size="
                                config.missingKeysPageSize = $event
                            "
                            @delete-selected="handleDeleteSelectedMissingKeys"
                            @delete-single="handleDeleteSingleMissingKey"
                            class="panel-item panel-item-top"
                        />

                        <json-untranslated-panel
                            :untranslated-keys="paginatedUntranslatedKeys"
                            :source-entries="state.sourceEntries"
                            :current-page="state.untranslatedCurrentPage"
                            :page-size="config.untranslatedPageSize"
                            :total-untranslated="untranslatedKeys.length"
                            @update:page="
                                state.untranslatedCurrentPage = $event
                            "
                            @update:page-size="
                                config.untranslatedPageSize = $event
                            "
                            @start-translating="editEntry"
                            class="panel-item panel-item-bottom"
                        />
                    </div>
                </div>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import { useJsonTranslator } from "../../../../utils/jsonTranslator";

    import JsonImportPanel from "./JsonImportPanel.vue";
    import JsonSearchBar from "./JsonSearchBar.vue";
    import JsonEntryEditor from "./JsonEntryEditor.vue";
    import JsonEntriesList from "./JsonEntriesList.vue";
    import JsonOutputPanel from "./JsonOutputPanel.vue";
    import JsonMissingKeysManager from "./JsonMissingKeysManager.vue";
    import JsonUntranslatedPanel from "./JsonUntranslatedPanel.vue";

    const { t } = useSafeI18n("json-translator", {
        title: "JSON Translator",
    });

    const {
        config,
        state,
        untranslatedKeys,
        missingKeys,
        translationStats,
        paginationInfo,
        paginatedEntries,
        paginatedUntranslatedKeys,
        paginatedMissingKeys,
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
    } = useJsonTranslator();

    /**
     * Handles source file import
     * @param file - File to import
     */
    const handleImportSource = (file: File) => {
        importSourceLanguage(file);
    };

    /**
     * Handles target file import
     * @param file - File to import
     */
    const handleImportTarget = (file: File) => {
        importTargetLanguage(file);
    };

    /**
     * Handles deleting selected missing keys
     */
    const handleDeleteSelectedMissingKeys = () => {
        if (state.selectedMissingKeys.length === 0) {
            state.statusMessage = "Please select orphaned keys to delete";
            state.hasError = true;
            return;
        }

        const keysToDelete = [...state.selectedMissingKeys];
        keysToDelete.forEach((key) => {
            if (state.targetEntries && state.targetEntries[key]) {
                delete state.targetEntries[key];
            }
        });

        const deletedCount = keysToDelete.length;
        state.selectedMissingKeys = [];

        state.statusMessage = `Successfully deleted ${deletedCount} orphaned key${
            deletedCount > 1 ? "s" : ""
        }`;
        state.hasError = false;
        generateJson();
    };

    /**
     * Handles deleting a single missing key
     * @param key - Key to delete
     */
    const handleDeleteSingleMissingKey = (key: string) => {
        if (state.targetEntries && state.targetEntries[key]) {
            delete state.targetEntries[key];
            const index = state.selectedMissingKeys.indexOf(key);
            if (index > -1) {
                state.selectedMissingKeys.splice(index, 1);
            }
            state.statusMessage = `Deleted orphaned key: ${key}`;
            state.hasError = false;
            generateJson();
        }
    };
</script>

<style scoped>
    .json-translator-app {
        background-color: #ffffff;
        min-height: 100vh;
    }

    :root.dark .json-translator-app {
        background-color: #1b1b1f;
    }

    .v-card {
        border: 1px solid #bdbdbd;
        box-shadow: none !important;
    }

    .v-card .v-card {
        border: 1px solid #e0e0e0;
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

    /* Remove ALL hover effects globally */
    :deep(.v-btn:hover),
    :deep(.v-card:hover),
    :deep(.v-list-item:hover),
    :deep(.v-chip:hover),
    :deep(.entry-item:hover),
    :deep(*:hover) {
        transform: none !important;
        box-shadow: none !important;
    }

    /* Clean minimal pagination */
    /* Use Vuetify's default pagination styling */
    :deep(.v-pagination) {
        justify-content: center;
    }

    .v-container {
        padding: 0 !important;
        margin: 0 !important;
    }

    .v-row {
        margin-left: 0 !important;
        margin-right: 0 !important;
    }

    .main-layout {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 16px;
        padding: 0 24px;
        min-height: calc(100vh - 140px); /* Fill available height */
        align-items: stretch; /* Stretch items to fill height */
    }

    .main-layout.full-width {
        grid-template-columns: 1fr;
    }

    .left-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-right: 0;
        /* No height constraint, let it grow */
    }

    .right-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-left: 0;
        height: 100%; /* Fill the grid cell height */
        position: sticky; /* Keep sticky behavior */
        top: 24px;
    }

.panel-item {
    width: 100%;
}

.panel-item-top {
    flex-shrink: 0;
}

.panel-item-bottom {
    margin-top: auto;
    flex-shrink: 0;
}

    @media (max-width: 1024px) {
        .main-layout {
            grid-template-columns: 1fr !important;
            padding: 0 16px;
        }

        .left-panel,
        .right-panel {
            padding: 0;
            gap: 12px;
            position: static;
        }
    }

    .app-title {
        color: var(--vp-c-text-1);
    }

    .theme-divider {
        border-color: var(--vp-c-divider) !important;
    }

    /* Modern clean style - limited rounded corners, no shadows */
    :deep(.v-card),
    :deep(.v-sheet),
    :deep(.v-alert),
    :deep(.v-chip),
    :deep(.v-btn),
    :deep(.v-text-field .v-field),
    :deep(.v-textarea .v-field),
    :deep(.v-select .v-field) {
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    :deep(.v-card) {
        border: 1px solid var(--vp-c-divider);
    }

    .panel-item:last-child {
        flex: 1;
        min-height: 0;
    }
</style>
