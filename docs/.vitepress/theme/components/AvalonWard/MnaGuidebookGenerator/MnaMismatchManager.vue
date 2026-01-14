<!--
/**
 * @fileoverview MNA Mismatch Manager - Integrated Translation Assistant
 * @component MnaMismatchManager  
 * @description Shows untranslated entries, orphaned entries, and structural mismatches
 */
-->

<template>
    <v-card flat class="mismatch-manager">
        <v-card-title class="d-flex justify-space-between align-center">
            <div class="d-flex align-center">
                <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
                <span class="text-h6">{{ t.title }}</span>
            </div>
            <v-chip 
                v-if="totalIssuesCount > 0" 
                color="warning" 
                size="small"
            >
                {{ totalIssuesCount }}
            </v-chip>
        </v-card-title>

        <v-card-text class="pa-4">
            <!-- Tabs for different issue types -->
            <v-tabs v-model="activeTab" density="compact" color="primary">
                <v-tab value="untranslated">
                    <v-badge 
                        :content="untranslatedEntries.length" 
                        color="error"
                        :model-value="untranslatedEntries.length > 0"
                        inline
                    >
                        {{ t.untranslated }}
                    </v-badge>
                </v-tab>
                <v-tab value="orphaned">
                    <v-badge 
                        :content="missingKeys.length" 
                        color="warning"
                        :model-value="missingKeys.length > 0"
                        inline
                    >
                        {{ t.orphaned }}
                    </v-badge>
                </v-tab>
                <v-tab value="mismatches">
                    <v-badge 
                        :content="mismatchEntries.length" 
                        color="info"
                        :model-value="mismatchEntries.length > 0"
                        inline
                    >
                        {{ t.mismatches }}
                    </v-badge>
                </v-tab>
            </v-tabs>

            <v-window v-model="activeTab" class="mt-4">
                <!-- Untranslated Entries -->
                <v-window-item value="untranslated">
                    <div v-if="untranslatedEntries.length === 0" class="text-center text-success pa-8">
                        <v-icon size="48" color="success">mdi-check-circle</v-icon>
                        <div class="text-body-1 mt-2">{{ t.allTranslated }}</div>
                    </div>

                    <div v-else>
                        <v-list density="compact" class="pa-0">
                            <v-list-item
                                v-for="entryId in paginatedUntranslated"
                                :key="entryId"
                                class="mb-2 untranslated-entry"
                            >
                                <template #prepend>
                                    <v-avatar size="32" color="error">
                                        <v-icon size="20" color="white">mdi-translate-off</v-icon>
                                    </v-avatar>
                                </template>

                                <div>
                                    <v-list-item-title class="text-body-2 font-weight-medium">
                                        {{ entryId }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle class="text-caption" v-if="sourceEntries[entryId]">
                                        {{ t.category }}: {{ sourceEntries[entryId].category }} | 
                                        {{ t.sections }}: {{ (sourceEntries[entryId].sections || []).length }}
                                    </v-list-item-subtitle>
                                </div>

                                <template #append>
                                    <v-btn
                                        @click="$emit('create-from-source', entryId)"
                                        color="success"
                                        variant="outlined"
                                        size="small"
                                        density="compact"
                                    >
                                        <v-icon start size="16">mdi-plus-circle</v-icon>
                                        {{ t.createFromSource }}
                                    </v-btn>
                                </template>
                            </v-list-item>
                        </v-list>

                        <!-- Pagination -->
                        <div v-if="untranslatedEntries.length > 0" class="pagination-footer">
                            <span class="text-body-2">
                                {{ ((untranslatedPage - 1) * pageSize + 1) }}-{{ Math.min(untranslatedPage * pageSize, untranslatedEntries.length) }} of {{ untranslatedEntries.length }}
                            </span>
                            <div class="d-flex align-center gap-2">
                                <v-btn
                                    icon="mdi-chevron-left"
                                    variant="text"
                                    size="small"
                                    :disabled="untranslatedPage === 1"
                                    @click="untranslatedPage--"
                                ></v-btn>
                                <v-btn
                                    icon="mdi-chevron-right"
                                    variant="text"
                                    size="small"
                                    :disabled="untranslatedPage === untranslatedPages"
                                    @click="untranslatedPage++"
                                ></v-btn>
                            </div>
                        </div>
                    </div>
                </v-window-item>

                <!-- Orphaned Entries -->
                <v-window-item value="orphaned">
                    <div v-if="missingKeys.length === 0" class="text-center text-success pa-8">
                        <v-icon size="48" color="success">mdi-check-circle</v-icon>
                        <div class="text-body-1 mt-2">{{ t.noOrphaned }}</div>
                    </div>

                    <div v-else>
                        <v-alert type="warning" variant="tonal" class="mb-4">
                            {{ t.orphanedWarning }}
                        </v-alert>

                        <v-list density="compact" class="pa-0">
                            <v-list-item
                                v-for="key in paginatedOrphaned"
                                :key="key"
                                class="mb-2 orphaned-entry"
                            >
                                <template #prepend>
                                    <v-avatar size="32" color="warning">
                                        <v-icon size="20" color="white">mdi-alert</v-icon>
                                    </v-avatar>
                                </template>

                                <v-list-item-title class="text-body-2 font-weight-medium">
                                    {{ key }}
                                </v-list-item-title>

                                <template #append>
                                    <v-btn
                                        @click="$emit('delete-single-missing', key)"
                                        color="error"
                                        variant="outlined"
                                        size="small"
                                        density="compact"
                                    >
                                        <v-icon start size="16">mdi-delete</v-icon>
                                        {{ t.delete }}
                                    </v-btn>
                                </template>
                            </v-list-item>
                        </v-list>

                        <!-- Pagination -->
                        <div v-if="missingKeys.length > 0" class="pagination-footer">
                            <span class="text-body-2">
                                {{ ((orphanedPage - 1) * pageSize + 1) }}-{{ Math.min(orphanedPage * pageSize, missingKeys.length) }} of {{ missingKeys.length }}
                            </span>
                            <div class="d-flex align-center gap-2">
                                <v-btn
                                    icon="mdi-chevron-left"
                                    variant="text"
                                    size="small"
                                    :disabled="orphanedPage === 1"
                                    @click="orphanedPage--"
                                ></v-btn>
                                <v-btn
                                    icon="mdi-chevron-right"
                                    variant="text"
                                    size="small"
                                    :disabled="orphanedPage === orphanedPages"
                                    @click="orphanedPage++"
                                ></v-btn>
                            </div>
                        </div>
                    </div>
                </v-window-item>

                <!-- Structure Mismatches -->
                <v-window-item value="mismatches">
                    <div v-if="mismatchEntries.length === 0" class="text-center text-success pa-8">
                        <v-icon size="48" color="success">mdi-check-circle</v-icon>
                        <div class="text-body-1 mt-2">{{ t.noMismatches }}</div>
                    </div>

                    <div v-else>
                        <v-alert type="info" variant="tonal" class="mb-4">
                            {{ t.mismatchWarning }}
                        </v-alert>

                        <v-list density="compact" class="pa-0">
                            <v-list-item
                                v-for="entry in paginatedMismatches"
                                :key="entry.key"
                                class="mb-2 mismatch-entry"
                            >
                                <template #prepend>
                                    <v-avatar size="32" :color="getMismatchColor(entry.type)">
                                        <v-icon size="20" color="white">mdi-alert-circle</v-icon>
                                    </v-avatar>
                                </template>

                                <div>
                                    <v-list-item-title class="text-body-2 font-weight-medium">
                                        {{ entry.key }}
                                        <v-chip size="x-small" :color="getMismatchColor(entry.type)" class="ml-2">
                                            {{ entry.type }}
                                        </v-chip>
                                    </v-list-item-title>
                                    <v-list-item-subtitle class="text-caption">
                                        {{ getMismatchDescription(entry) }}
                                    </v-list-item-subtitle>
                                </div>

                                <template #append>
                                    <div class="d-flex gap-2">
                                        <v-btn
                                            v-if="entry.type === 'category'"
                                            @click="$emit('fix-category-mismatch', entry.key)"
                                            color="primary"
                                            variant="outlined"
                                            size="small"
                                            density="compact"
                                        >
                                            {{ t.fix }}
                                        </v-btn>
                                        <v-btn
                                            v-if="entry.type === 'structure'"
                                            @click="$emit('fix-structure-mismatch', entry.key)"
                                            color="primary"
                                            variant="outlined"
                                            size="small"
                                            density="compact"
                                        >
                                            {{ t.fix }}
                                        </v-btn>
                                        <v-btn
                                            v-if="entry.type === 'content'"
                                            @click="$emit('fix-content-mismatch', entry.key)"
                                            color="primary"
                                            variant="outlined"
                                            size="small"
                                            density="compact"
                                        >
                                            {{ t.fix }}
                                        </v-btn>
                                        <v-btn
                                            @click="$emit('delete-single-missing', entry.key)"
                                            color="error"
                                            variant="outlined"
                                            size="small"
                                            density="compact"
                                        >
                                            <v-icon size="16">mdi-delete</v-icon>
                                        </v-btn>
                                    </div>
                                </template>
                            </v-list-item>
                        </v-list>

                        <!-- Pagination -->
                        <div v-if="mismatchEntries.length > 0" class="pagination-footer">
                            <span class="text-body-2">
                                {{ ((mismatchPage - 1) * pageSize + 1) }}-{{ Math.min(mismatchPage * pageSize, mismatchEntries.length) }} of {{ mismatchEntries.length }}
                            </span>
                            <div class="d-flex align-center gap-2">
                                <v-btn
                                    icon="mdi-chevron-left"
                                    variant="text"
                                    size="small"
                                    :disabled="mismatchPage === 1"
                                    @click="mismatchPage--"
                                ></v-btn>
                                <v-btn
                                    icon="mdi-chevron-right"
                                    variant="text"
                                    size="small"
                                    :disabled="mismatchPage === mismatchPages"
                                    @click="mismatchPage++"
                                ></v-btn>
                            </div>
                        </div>
                    </div>
                </v-window-item>
            </v-window>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { ref, computed } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { EntryCollection } from "../../../../utils/mnaGuidebook";

    const { t } = useSafeI18n("mna-mismatch-manager", {
        title: "Translation Issues",
        untranslated: "Untranslated",
        orphaned: "Orphaned",
        mismatches: "Mismatches",
        allTranslated: "All entries translated!",
        noOrphaned: "No orphaned entries",
        noMismatches: "No structural mismatches",
        orphanedWarning: "These entries exist in target but not in source. Consider deleting them.",
        mismatchWarning: "These entries have structural differences between source and target.",
        category: "Category",
        sections: "Sections",
        createFromSource: "Create from Source",
        delete: "Delete",
        fix: "Fix",
    });

    const props = defineProps<{
        entries: EntryCollection;
        sourceEntries: EntryCollection;
        untranslatedEntries: string[];
        missingKeys: string[];
        mismatchEntries: any[];
        hasSourceData?: boolean;
    }>();

    const emit = defineEmits<{
        "create-from-source": [entryId: string];
        "delete-single-missing": [key: string];
        "fix-category-mismatch": [key: string];
        "fix-structure-mismatch": [key: string];
        "fix-content-mismatch": [key: string];
        "toggle-missing-key": [key: string];
        "toggle-all-missing": [];
        "delete-selected-missing": [];
        "toggle-mismatch-entry": [key: string];
        "toggle-all-mismatches": [];
        "fix-selected-mismatches": [];
        "delete-selected-mismatches": [];
    }>();

    const activeTab = ref("untranslated");
    
    // Pagination for each tab
    const untranslatedPage = ref(1);
    const orphanedPage = ref(1);
    const mismatchPage = ref(1);
    const pageSize = 10;

    const totalIssuesCount = computed(() => 
        props.untranslatedEntries.length + props.missingKeys.length + props.mismatchEntries.length
    );

    // Pagination computed properties
    const untranslatedPages = computed(() => 
        Math.ceil(props.untranslatedEntries.length / pageSize)
    );
    const paginatedUntranslated = computed(() => {
        const start = (untranslatedPage.value - 1) * pageSize;
        return props.untranslatedEntries.slice(start, start + pageSize);
    });

    const orphanedPages = computed(() => 
        Math.ceil(props.missingKeys.length / pageSize)
    );
    const paginatedOrphaned = computed(() => {
        const start = (orphanedPage.value - 1) * pageSize;
        return props.missingKeys.slice(start, start + pageSize);
    });

    const mismatchPages = computed(() => 
        Math.ceil(props.mismatchEntries.length / pageSize)
    );
    const paginatedMismatches = computed(() => {
        const start = (mismatchPage.value - 1) * pageSize;
        return props.mismatchEntries.slice(start, start + pageSize);
    });

    const getMismatchColor = (type: string) => {
        switch (type) {
            case 'category': return 'error';
            case 'structure': return 'warning';
            case 'content': return 'info';
            default: return 'grey';
        }
    };

    const getMismatchDescription = (entry: any) => {
        if (entry.type === 'category') {
            return `${entry.targetCategory} → ${entry.sourceCategory}`;
        }
        if (entry.mismatches && entry.mismatches.length > 0) {
            return entry.mismatches[0].issue;
        }
        return '';
    };
</script>

<style scoped>
    .mismatch-manager {
        border: 1px solid var(--vp-c-divider);
        box-shadow: none !important;
        border-radius: 4px !important;
        min-height: 300px;
    }

    .untranslated-entry,
    .orphaned-entry,
    .mismatch-entry {
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px !important;
        box-shadow: none !important;
        transition: border-color 0.2s ease;
    }

    .untranslated-entry:hover {
        border-color: rgb(var(--v-theme-error));
        background-color: rgba(var(--v-theme-error), 0.02);
    }

    .orphaned-entry:hover {
        border-color: rgb(var(--v-theme-warning));
        background-color: rgba(var(--v-theme-warning), 0.02);
    }

    .mismatch-entry:hover {
        border-color: rgb(var(--v-theme-info));
        background-color: rgba(var(--v-theme-info), 0.02);
    }

    .v-card,
    .v-btn,
    .v-chip,
    .v-tab,
    :deep(.v-pagination__item),
    :deep(.v-pagination__next),
    :deep(.v-pagination__prev) {
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    .v-window {
        max-height: 50vh;
        overflow-y: auto;
    }

    .pagination-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-top: 1px solid var(--vp-c-divider);
        margin-top: 16px;
    }

    .gap-2 {
        gap: 8px;
    }
</style>