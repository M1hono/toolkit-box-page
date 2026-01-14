<!--
/**
 * @fileoverview JSON Untranslated Panel Component
 * @component JsonUntranslatedPanel
 * @description Shows untranslated entries with source preview and quick translation access
 */
-->

<template>
    <v-card flat>
        <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6">{{ t.untranslatedEntries }}</span>
            <v-chip color="warning" size="small">
                {{ totalUntranslated }}
            </v-chip>
        </v-card-title>

        <v-card-text class="pa-4">
            <div
                v-if="totalUntranslated === 0"
                class="text-center text-success pa-8"
            >
                <v-icon size="48" color="success" class="mb-3"
                    >mdi-check-circle</v-icon
                >
                <div class="text-h6">{{ t.allTranslated }}</div>
            </div>

            <div v-else>
                <!-- Pagination Controls -->
                <div class="pagination-controls mb-4">
                    <span class="text-body-2">
                        {{ ((currentPage - 1) * pageSize + 1) }}-{{ Math.min(currentPage * pageSize, totalUntranslated) }} of {{ totalUntranslated }}
                    </span>
                    <div class="d-flex align-center gap-2">
                        <v-btn
                            icon="mdi-chevron-left"
                            variant="text"
                            size="small"
                            :disabled="currentPage === 1 || totalUntranslated === 0"
                            @click="$emit('update:page', currentPage - 1)"
                        ></v-btn>
                        <v-btn
                            icon="mdi-chevron-right"
                            variant="text"
                            size="small"
                            :disabled="currentPage === Math.ceil(totalUntranslated / pageSize) || totalUntranslated === 0"
                            @click="$emit('update:page', currentPage + 1)"
                        ></v-btn>
                    </div>
                </div>

                <!-- Untranslated Entries List -->
                <v-list density="compact" class="pa-0">
                    <v-list-item
                        v-for="key in untranslatedKeys"
                        :key="key"
                        class="untranslated-item"
                        @click="$emit('start-translating', key)"
                    >
                        <template #prepend>
                            <v-avatar size="32" color="warning">
                                <v-icon>mdi-translate-off</v-icon>
                            </v-avatar>
                        </template>

                        <div class="untranslated-content">
                            <v-list-item-title
                                class="text-body-2 font-weight-medium untranslated-key"
                            >
                                {{ key }}
                            </v-list-item-title>
                            <v-list-item-subtitle
                                v-if="sourceEntries && sourceEntries[key]"
                                class="text-caption source-preview"
                            >
                                {{ sourceEntries[key] }}
                            </v-list-item-subtitle>
                        </div>

                        <template #append>
                            <v-btn
                                @click.stop="$emit('start-translating', key)"
                                color="success"
                                variant="outlined"
                                size="small"
                            >
                                <v-icon start>mdi-pencil</v-icon>
                                {{ t.translate }}
                            </v-btn>
                        </template>
                    </v-list-item>
                </v-list>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { TranslationEntries } from "../../../../utils/jsonTranslator";

    const { t } = useSafeI18n("json-untranslated-panel", {
        untranslatedEntries: "Untranslated Entries",
        allTranslated: "All entries have been translated!",
        itemsPerPage: "Items per page",
        translate: "Translate",
    });

    const props = defineProps<{
        untranslatedKeys: string[];
        sourceEntries: TranslationEntries;
        currentPage: number;
        pageSize: number;
        totalUntranslated: number;
    }>();

    const emit = defineEmits<{
        "update:page": [page: number];
        "update:page-size": [size: number];
        "start-translating": [key: string];
    }>();

    const pageSizeOptions = [
        { title: "10", value: 10 },
        { title: "20", value: 20 },
        { title: "50", value: 50 },
        { title: "100", value: 100 },
    ];
</script>

<style scoped>
    .untranslated-item {
        margin-bottom: 8px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        padding: 8px;
        cursor: pointer;
        border-left: 4px solid var(--v-theme-warning);
        background-color: rgba(var(--v-theme-warning), 0.04);
        box-shadow: none !important;
    }

    .untranslated-content {
        flex-grow: 1;
        margin-right: 16px;
        overflow: hidden;
    }

    .untranslated-key {
        font-family: "Courier New", monospace;
        word-break: break-all;
    }

    .source-preview {
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 40px;
        overflow-y: auto;
        padding: 4px 8px;
        background-color: transparent;
        border-radius: 4px;
        margin-top: 4px;
        border: 1px solid var(--vp-c-divider);
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
