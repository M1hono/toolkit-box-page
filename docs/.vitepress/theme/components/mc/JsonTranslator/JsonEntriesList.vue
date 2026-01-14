<!--
/**
 * @fileoverview JSON Entries List Component
 * @component JsonEntriesList
 * @description Displays paginated list of translation entries with edit/delete actions
 */
-->

<template>
    <v-card flat>
        <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6">{{ t.translationEntries }}</span>
            <v-chip color="primary" size="small">
                {{ paginationInfo.totalItems }}
            </v-chip>
        </v-card-title>

        <v-card-text class="pa-4">
            <!-- Pagination Controls -->
            <div v-if="Object.keys(entries).length > 0" class="pagination-footer mb-4">
                <span class="text-body-2">
                    {{ ((paginationInfo.currentPage - 1) * pageSize + 1) }}-{{ Math.min(paginationInfo.currentPage * pageSize, Object.keys(entries).length) }} of {{ Object.keys(entries).length }}
                </span>
                <div class="d-flex align-center gap-2">
                    <v-btn
                        icon="mdi-chevron-left"
                        variant="text"
                        size="small"
                        :disabled="paginationInfo.currentPage === 1"
                        @click="$emit('update:page', paginationInfo.currentPage - 1)"
                    ></v-btn>
                    <v-btn
                        icon="mdi-chevron-right"
                        variant="text"
                        size="small"
                        :disabled="paginationInfo.currentPage === paginationInfo.totalPages"
                        @click="$emit('update:page', paginationInfo.currentPage + 1)"
                    ></v-btn>
                </div>
            </div>

            <!-- Entries List -->
            <div
                v-if="Object.keys(entries).length === 0"
                class="text-center text-grey pa-8"
            >
                {{ t.noEntries }}
            </div>

            <v-list v-else density="compact" class="pa-0">
                <v-list-item
                    v-for="(value, key) in entries"
                    :key="key"
                    class="entry-item"
                    :class="{ untranslated: !value }"
                >
                    <template #prepend>
                        <v-avatar
                            size="32"
                            :color="value ? 'success' : 'warning'"
                        >
                            <v-icon>{{
                                value ? "mdi-check" : "mdi-translate-off"
                            }}</v-icon>
                        </v-avatar>
                    </template>

                    <div class="entry-content">
                        <v-list-item-title
                            class="text-body-2 font-weight-medium entry-key"
                        >
                            {{ key }}
                        </v-list-item-title>
                        <v-list-item-subtitle class="text-caption entry-value">
                            {{ value || "(untranslated)" }}
                        </v-list-item-subtitle>
                    </div>

                    <template #append>
                        <div class="entry-actions">
                            <v-btn
                                @click="$emit('edit', key)"
                                color="primary"
                                variant="outlined"
                                size="small"
                                class="mr-2"
                            >
                                <v-icon start>mdi-pencil</v-icon>
                                {{ t.edit }}
                            </v-btn>
                            <v-btn
                                @click="$emit('delete', key)"
                                color="error"
                                variant="text"
                                size="small"
                            >
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </div>
                    </template>
                </v-list-item>
            </v-list>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type {
        TranslationEntries,
        PaginationInfo,
    } from "../../../../utils/jsonTranslator";

    const { t } = useSafeI18n("json-entries-list", {
        translationEntries: "Translation Entries",
        itemsPerPage: "Items per page",
        pageInfo: "Page {current} of {total}",
        noEntries:
            "No matching entries found. Please import files or clear filters.",
        edit: "Edit",
        delete: "Delete",
    });

    const props = defineProps<{
        entries: TranslationEntries;
        paginationInfo: PaginationInfo;
        pageSize: number;
    }>();

    const emit = defineEmits<{
        "update:page-size": [size: number];
        "update:page": [page: number];
        edit: [key: string];
        delete: [key: string];
    }>();

    const pageSizeOptions = [
        { title: "10", value: 10 },
        { title: "20", value: 20 },
        { title: "50", value: 50 },
        { title: "100", value: 100 },
    ];
</script>

<style scoped>
    .entry-item {
        margin-bottom: 8px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        padding: 8px;
        box-shadow: none !important;
    }

    .entry-item.untranslated {
        border-left: 4px solid var(--v-theme-warning);
        background-color: rgba(var(--v-theme-warning), 0.04);
    }

    .entry-item:not(.untranslated) {
        border-left: 4px solid var(--v-theme-success);
        background-color: rgba(var(--v-theme-success), 0.04);
    }

    .entry-content {
        flex-grow: 1;
        margin-right: 16px;
        overflow: hidden;
    }

    .entry-key {
        font-family: "Courier New", monospace;
        word-break: break-all;
    }

    .entry-value {
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 60px;
        overflow-y: auto;
    }

    .entry-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
    }

    .pagination-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-top: 1px solid var(--vp-c-divider);
        border-radius: 0 0 4px 4px;
    }

    .gap-2 {
        gap: 8px;
    }

    .gap-4 {
        gap: 16px;
    }
</style>
