<!--
/**
 * @fileoverview MNA Translation Panel Component
 * @component MnaTranslationPanel
 * @description Shows untranslated entries with pagination and quick translation options
 */
-->

<template>
    <v-card flat class="translation-panel">
        <v-card-title class="translation-panel__header">
            <div>
                <div class="d-flex align-center">
                    <v-icon color="warning" class="mr-2">mdi-translate</v-icon>
                    <span class="text-h6">{{ t.untranslatedEntries }}</span>
                </div>
                <div class="translation-panel__hint">
                    {{ t.translationHint }}
                </div>
            </div>
            <v-chip 
                v-if="totalUntranslated > 0" 
                color="warning" 
                size="small"
            >
                {{ totalUntranslated }}
            </v-chip>
        </v-card-title>

        <v-card-text class="pa-4">
            <!-- Empty State -->
            <div 
                v-if="totalUntranslated === 0" 
                class="text-center text-success pa-8"
            >
                <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
                <div class="text-h6 mb-2">{{ t.allTranslated }}</div>
                <div class="text-body-2">{{ t.translationComplete }}</div>
            </div>

            <!-- Untranslated Entries List -->
            <div v-else>
                <!-- Pagination Controls -->
                <div class="d-flex justify-space-between align-center mb-4">
                    <v-select
                        :model-value="pageSize"
                        @update:model-value="$emit('page-size-change', $event)"
                        :items="pageSizeOptions"
                        :label="t.itemsPerPage"
                        variant="outlined"
                        density="compact"
                        style="max-width: 120px"
                    ></v-select>

                    <v-pagination
                        v-if="totalPages > 1"
                        :model-value="currentPage"
                        @update:model-value="$emit('page-change', $event)"
                        :length="totalPages"
                        :total-visible="5"
                        size="small"
                    ></v-pagination>

                    <div class="text-caption">
                        {{ totalUntranslated }} {{ t.totalEntries }}
                    </div>
                </div>

                <!-- Entries List -->
                <div class="untranslated-list">
                    <v-card
                        v-for="entryId in untranslatedEntries"
                        :key="entryId"
                        variant="outlined"
                        class="mb-2 untranslated-item"
                        :class="{ 'entry-highlight': sourceEntries[entryId] }"
                    >
                        <v-card-text class="d-flex align-center pa-3">
                            <v-avatar size="32" color="error" class="mr-3">
                                <v-icon color="white">mdi-alert-circle</v-icon>
                            </v-avatar>

                            <div class="flex-grow-1">
                                <div class="text-body-1 font-weight-medium">
                                    {{ entryId }}
                                </div>
                                <div class="text-caption text-medium-emphasis">
                                    {{ t.missingTranslationFor }} {{ entryId }}
                                </div>
                                <div v-if="sourceEntries[entryId]" class="text-caption mt-1">
                                    {{ t.category }}: {{ sourceEntries[entryId].category || 'basics' }} | 
                                    {{ t.tier }}: {{ sourceEntries[entryId].tier || 1 }} |
                                    {{ t.sections }}: {{ (sourceEntries[entryId].sections || []).length }}
                                </div>
                            </div>

                            <div class="d-flex flex-column gap-2">
                                <v-btn
                                    @click="$emit('create-entry', entryId)"
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                    density="compact"
                                >
                                    <v-icon start>mdi-plus</v-icon>
                                    {{ t.startTranslating }}
                                </v-btn>

                                <v-btn
                                    v-if="sourceEntries[entryId]"
                                    @click="$emit('create-from-source', entryId)"
                                    color="success"
                                    variant="outlined"
                                    size="small"
                                    density="compact"
                                >
                                    <v-icon start>mdi-content-copy</v-icon>
                                    {{ t.createFromSource }}
                                </v-btn>
                            </div>
                        </v-card-text>
                    </v-card>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { EntryCollection } from "../../../../utils/mnaGuidebook";

    const { t } = useSafeI18n("mna-translation-panel", {
        untranslatedEntries: "Untranslated Entries",
        allTranslated: "All Translated!",
        translationComplete: "All entries have been translated successfully.",
        itemsPerPage: "Items per page",
        totalEntries: "total entries",
        missingTranslationFor: "Missing translation for:",
        category: "Category",
        tier: "Tier",
        sections: "Sections",
        startTranslating: "Start",
        createFromSource: "Copy & Edit",
        translationHint: "Use this queue to create missing entries from the source file without losing context.",
    });

    const props = defineProps<{
        untranslatedEntries: string[];
        totalUntranslated: number;
        sourceEntries: EntryCollection;
        currentPage: number;
        pageSize: number;
        totalPages: number;
        visiblePages: number[];
    }>();

    const emit = defineEmits<{
        "create-entry": [entryId: string];
        "create-from-source": [entryId: string];
        "page-change": [page: number];
        "page-size-change": [size: number];
    }>();

    const pageSizeOptions = [
        { title: "5", value: 5 },
        { title: "10", value: 10 },
        { title: "20", value: 20 },
        { title: "50", value: 50 },
    ];
</script>

<style scoped>
    .translation-panel {
        border: 1px solid color-mix(in srgb, var(--vp-c-divider) 64%, var(--vp-c-warning-1) 36%);
        box-shadow: none !important;
        border-radius: 16px !important;
        background: color-mix(in srgb, var(--vp-c-bg-soft) 70%, var(--vp-c-bg));
    }

    .translation-panel__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
    }

    .translation-panel__hint {
        margin-top: 8px;
        color: var(--vp-c-text-2);
        font-size: 0.92rem;
        line-height: 1.45;
    }

    .untranslated-item {
        transition: border-color 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
        border-radius: 14px !important;
        box-shadow: none !important;
        border: 1px solid color-mix(in srgb, var(--vp-c-divider) 84%, transparent);
        background: color-mix(in srgb, var(--vp-c-bg) 72%, var(--vp-c-bg-soft) 28%);
    }

    .untranslated-item:hover {
        transform: translateY(-1px);
        border-color: color-mix(in srgb, var(--vp-c-warning-1) 46%, var(--vp-c-divider));
        background-color: color-mix(in srgb, var(--vp-c-warning-soft) 60%, var(--vp-c-bg));
    }

    .entry-highlight {
        border-left: 2px solid color-mix(in srgb, var(--vp-c-success-1) 78%, var(--vp-c-success-2));
    }

    .v-card,
    .v-btn,
    .v-chip,
    .v-select .v-field {
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    .untranslated-list {
        max-height: none;
        overflow-y: visible;
    }

    :deep(.v-pagination__item),
    :deep(.v-pagination__next),
    :deep(.v-pagination__prev) {
        border-radius: 4px !important;
        box-shadow: none !important;
    }
</style>
