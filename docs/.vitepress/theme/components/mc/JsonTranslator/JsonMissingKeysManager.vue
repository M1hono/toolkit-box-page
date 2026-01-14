<!--
/**
 * @fileoverview JSON Missing Keys Manager Component
 * @component JsonMissingKeysManager
 * @description Manages orphaned translation keys that exist in target but not in source
 */
-->

<template>
    <v-card flat>
        <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6 text-error">
                <v-icon class="mr-2">mdi-delete-alert</v-icon>
                {{ t.orphanedKeys }} ({{ missingKeys.length }})
            </span>
            <v-btn
                @click="$emit('update:show-panel', !showPanel)"
                variant="text"
                size="small"
            >
                {{ showPanel ? t.hide : t.show }}
            </v-btn>
        </v-card-title>

        <v-expand-transition>
            <v-card-text v-if="showPanel" class="pa-4">
                <v-alert type="warning" variant="tonal" class="mb-4">
                    <div class="d-flex align-start">
                        <v-icon class="mr-2">mdi-alert</v-icon>
                        <span>{{
                            t.warningText.replace(
                                "{count}",
                                missingKeys.length.toString()
                            )
                        }}</span>
                    </div>
                </v-alert>

                <!-- Bulk Actions -->
                <div class="bulk-actions mb-4">
                    <v-btn
                        @click="toggleAllKeys"
                        color="info"
                        variant="outlined"
                        class="mr-2"
                    >
                        {{
                            selectedMissingKeys.length === missingKeys.length
                                ? t.deselectAll
                                : t.selectAll
                        }}
                    </v-btn>
                    <v-btn
                        @click="$emit('delete-selected')"
                        :disabled="selectedMissingKeys.length === 0"
                        color="error"
                        variant="flat"
                    >
                        <v-icon start>mdi-delete</v-icon>
                        {{ t.deleteSelected }} ({{
                            selectedMissingKeys.length
                        }})
                    </v-btn>
                </div>

                <!-- Pagination -->
                <div class="pagination-controls mb-4">
                    <span class="text-body-2">
                        {{ ((currentPage - 1) * pageSize + 1) }}-{{ Math.min(currentPage * pageSize, missingKeys.length) }} of {{ missingKeys.length }}
                    </span>
                    <div class="d-flex align-center gap-2">
                        <v-btn
                            icon="mdi-chevron-left"
                            variant="text"
                            size="small"
                            :disabled="currentPage === 1 || missingKeys.length === 0"
                            @click="$emit('update:page', currentPage - 1)"
                        ></v-btn>
                        <v-btn
                            icon="mdi-chevron-right"
                            variant="text"
                            size="small"
                            :disabled="currentPage === Math.ceil(missingKeys.length / pageSize) || missingKeys.length === 0"
                            @click="$emit('update:page', currentPage + 1)"
                        ></v-btn>
                    </div>
                </div>

                <!-- Missing Keys List -->
                <v-list density="compact" class="missing-keys-list">
                    <v-list-item
                        v-for="key in paginatedMissingKeys"
                        :key="key"
                        class="missing-key-item"
                        :class="{ selected: selectedMissingKeys.includes(key) }"
                    >
                        <template #prepend>
                            <v-checkbox
                                :model-value="selectedMissingKeys.includes(key)"
                                @update:model-value="toggleKey(key)"
                                color="primary"
                                density="compact"
                                hide-details
                            ></v-checkbox>
                        </template>

                        <div class="missing-key-content">
                            <v-list-item-title
                                class="text-body-2 font-weight-medium missing-key-name"
                            >
                                {{ key }}
                            </v-list-item-title>
                            <v-list-item-subtitle
                                class="text-caption missing-key-value"
                            >
                                {{ targetEntries[key] }}
                            </v-list-item-subtitle>
                        </div>

                        <template #append>
                            <v-btn
                                @click="$emit('delete-single', key)"
                                color="error"
                                variant="text"
                                size="small"
                                icon="mdi-delete"
                            ></v-btn>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card-text>
        </v-expand-transition>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { TranslationEntries } from "../../../../utils/jsonTranslator";

    const { t } = useSafeI18n("json-missing-keys-manager", {
        orphanedKeys: "Orphaned Keys",
        hide: "Hide",
        show: "Show",
        warningText:
            "Found {count} orphaned keys: These keys exist in the target translation but not in the source file. Consider removing these outdated translation entries.",
        selectAll: "Select All",
        deselectAll: "Deselect All",
        deleteSelected: "Delete Selected",
        itemsPerPage: "Items per page",
    });

    const props = defineProps<{
        missingKeys: string[];
        paginatedMissingKeys: string[];
        targetEntries: TranslationEntries;
        selectedMissingKeys: string[];
        showPanel: boolean;
        currentPage: number;
        pageSize: number;
    }>();

    const emit = defineEmits<{
        "update:show-panel": [show: boolean];
        "update:selected-keys": [keys: string[]];
        "update:page": [page: number];
        "update:page-size": [size: number];
        "delete-selected": [];
        "delete-single": [key: string];
    }>();

    const pageSizeOptions = [
        { title: "10", value: 10 },
        { title: "20", value: 20 },
        { title: "50", value: 50 },
        { title: "100", value: 100 },
    ];

    /**
     * Toggles selection of a single key
     * @param key - Key to toggle
     */
    const toggleKey = (key: string) => {
        const newSelected = [...props.selectedMissingKeys];
        const index = newSelected.indexOf(key);
        if (index > -1) {
            newSelected.splice(index, 1);
        } else {
            newSelected.push(key);
        }
        emit("update:selected-keys", newSelected);
    };

    /**
     * Toggles all keys selection
     */
    const toggleAllKeys = () => {
        if (props.selectedMissingKeys.length === props.missingKeys.length) {
            emit("update:selected-keys", []);
        } else {
            emit("update:selected-keys", [...props.missingKeys]);
        }
    };
</script>

<style scoped>
    .v-card {
        border: 2px solid var(--v-theme-error);
        background-color: rgba(var(--v-theme-error), 0.04);
    }

    .bulk-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }

    .missing-keys-list {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        background-color: transparent;
    }

    .missing-key-item {
        border-bottom: 1px solid var(--vp-c-divider);
        padding: 8px;
    }

    .missing-key-item:last-child {
        border-bottom: none;
    }

    .missing-key-item.selected {
        background-color: rgba(var(--v-theme-primary), 0.08);
        border-left: 3px solid var(--v-theme-primary);
    }

    .missing-key-content {
        flex-grow: 1;
        margin-right: 16px;
        overflow: hidden;
    }

    .missing-key-name {
        font-family: "Courier New", monospace;
        word-break: break-all;
        background-color: rgba(var(--v-theme-error), 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid rgba(var(--v-theme-error), 0.2);
    }

    .missing-key-value {
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 60px;
        overflow-y: auto;
        padding: 4px 8px;
        background-color: rgba(var(--v-theme-surface), 0.5);
        border-radius: 4px;
        margin-top: 4px;
    }

    .pagination-controls,
    .pagination-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-top: 1px solid var(--vp-c-divider);
    }

    .gap-2 {
        gap: 8px;
    }

    .gap-4 {
        gap: 16px;
    }
</style>
