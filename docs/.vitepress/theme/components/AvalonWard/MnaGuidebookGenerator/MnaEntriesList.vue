<!--
/**
 * @fileoverview MNA Entries List Component
 * @component MnaEntriesList
 * @description Displays paginated list of entries with search and management options
 */
-->

<template>
    <v-card flat class="entries-list-panel">
        <v-card-title class="d-flex justify-space-between align-center">
            <div class="d-flex align-center">
                <v-icon color="primary" class="mr-2">mdi-book-multiple</v-icon>
                <span class="text-h6">{{ t.entriesList }}</span>
            </div>
            <v-chip 
                v-if="totalEntriesCount > 0" 
                color="primary" 
                size="small"
            >
                {{ totalEntriesCount }}
            </v-chip>
        </v-card-title>

        <v-card-text class="pa-4">
            <!-- Search and Filters -->
            <div class="mb-4">
                <v-text-field
                    :model-value="filter"
                    @update:model-value="$emit('update:filter', $event)"
                    :label="t.filterEntries"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="compact"
                    clearable
                    class="mb-3"
                ></v-text-field>

                <v-checkbox
                    :model-value="showUntranslatedOnly"
                    @update:model-value="$emit('update:show-untranslated-only', $event)"
                    :label="t.showUntranslatedOnly"
                    density="compact"
                    hide-details
                ></v-checkbox>
            </div>

            <!-- New Entry Creator -->
            <div class="d-flex gap-2 align-center mb-3">
                <v-text-field
                    v-model="newEntryId"
                    :label="t.newEntryId"
                    :placeholder="t.newEntryPlaceholder"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="flex-grow-1"
                    @keyup.enter="handleCreateEntry"
                ></v-text-field>
                <v-btn
                    @click="handleCreateEntry"
                    :disabled="!newEntryId.trim()"
                    icon
                    variant="outlined"
                    size="default"
                    class="add-entry-btn"
                >
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
            </div>

            <!-- Content Container -->
            <div class="content-container">
                <!-- Empty State -->
                <div 
                    v-if="totalEntriesCount === 0" 
                    class="empty-state-full"
                >
                    <div class="text-center text-medium-emphasis">
                        <v-icon size="64" class="mb-4">mdi-book-plus</v-icon>
                        <div class="text-h6 mb-2">{{ t.noEntries }}</div>
                        <div class="text-body-2">{{ t.createFirstEntry }}</div>
                    </div>
                </div>

                <!-- Entries List -->
                <div v-else class="entries-container">
                    <!-- Pagination Controls -->
                    <div v-if="totalEntriesCount > 0" class="pagination-footer">
                        <span class="text-body-2">
                            {{ ((currentPage - 1) * pageSize + 1) }}-{{ Math.min(currentPage * pageSize, totalEntriesCount) }} {{ t.of }} {{ totalEntriesCount }}
                        </span>
                        <div class="d-flex align-center gap-2">
                            <v-btn
                                icon="mdi-chevron-left"
                                variant="text"
                                size="small"
                                :disabled="currentPage === 1"
                                @click="$emit('page-change', currentPage - 1)"
                            ></v-btn>
                            <v-btn
                                icon="mdi-chevron-right"
                                variant="text"
                                size="small"
                                :disabled="currentPage === totalPages"
                                @click="$emit('page-change', currentPage + 1)"
                            ></v-btn>
                        </div>
                    </div>

                    <!-- Entries -->
                    <div class="entries-list">
                        <v-card
                            v-for="(entry, entryId) in entries"
                            :key="entryId"
                            variant="outlined"
                            class="mb-2 entry-item"
                            :class="{ 'entry-selected': entryId === currentEntryId }"
                        >
                            <v-card-text class="d-flex align-center pa-3">
                                <div class="flex-grow-1 mr-3">
                                    <div class="text-body-1 font-weight-medium">
                                        {{ entryId }}
                                    </div>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ t.category }}: {{ entry.category || 'basics' }} | 
                                        {{ t.tier }}: {{ entry.tier || 1 }} |
                                        {{ t.sections }}: {{ (entry.sections || []).length }}
                                    </div>
                                </div>

                                <div class="d-flex gap-2">
                                    <v-btn
                                        @click="$emit('select-entry', entryId)"
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                        density="compact"
                                    >
                                        <v-icon start>mdi-pencil</v-icon>
                                        {{ t.edit }}
                                    </v-btn>

                                    <v-btn
                                        @click="$emit('delete-entry', entryId)"
                                        color="error"
                                        variant="outlined"
                                        size="small"
                                        density="compact"
                                    >
                                        <v-icon start>mdi-delete</v-icon>
                                        {{ t.delete }}
                                    </v-btn>
                                </div>
                            </v-card-text>
                        </v-card>
                    </div>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { ref } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { EntryCollection } from "../../../../utils/mnaGuidebook";

    const { t } = useSafeI18n("mna-entries-list", {
        entriesList: "Entries List",
        filterEntries: "Filter entries",
        showUntranslatedOnly: "Show untranslated only",
        newEntryId: "New Entry ID",
        newEntryPlaceholder: "Enter unique entry ID",
        createEntry: "Create Entry",
        noEntries: "No Entries",
        createFirstEntry: "Create your first entry above.",
        itemsPerPage: "Items per page",
        totalEntries: "total entries",
        of: "of",
        category: "Category",
        tier: "Tier", 
        sections: "Sections",
        edit: "Edit",
        delete: "Delete",
    });

    const props = defineProps<{
        entries: EntryCollection;
        totalEntriesCount: number;
        currentEntryId: string;
        currentPage: number;
        pageSize: number;
        totalPages: number;
        visiblePages: number[];
        filter: string;
        showUntranslatedOnly: boolean;
    }>();

    const emit = defineEmits<{
        "select-entry": [entryId: string];
        "create-entry": [entryId: string];
        "delete-entry": [entryId: string];
        "page-change": [page: number];
        "page-size-change": [size: number];
        "update:filter": [value: string];
        "update:show-untranslated-only": [value: boolean];
    }>();

    const newEntryId = ref("");

    const pageSizeOptions = [
        { title: "5", value: 5 },
        { title: "10", value: 10 },
        { title: "20", value: 20 },
        { title: "50", value: 50 },
    ];

    const handleCreateEntry = () => {
        if (newEntryId.value.trim()) {
            emit("create-entry", newEntryId.value.trim());
            newEntryId.value = "";
        }
    };
</script>

<style scoped>
    .entries-list-panel {
        border: 1px solid var(--vp-c-divider);
        box-shadow: none !important;
        border-radius: 4px !important;
    }

    .add-entry-btn {
        height: 40px !important;
        width: 40px !important;
    }

    .pagination-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-top: 1px solid var(--vp-c-divider);
        margin-top: 16px;
        padding-top: 16px;
    }

    .gap-2 {
        gap: 8px;
    }

    .gap-4 {
        gap: 16px;
    }

    .entry-item {
        transition: border-color 0.2s ease;
        border-radius: 4px !important;
        box-shadow: none !important;
        border: 1px solid var(--vp-c-divider);
    }

    .entry-item:hover {
        border-color: rgb(var(--v-theme-primary));
        background-color: rgba(var(--v-theme-primary), 0.02);
    }

    .entry-selected {
        border-color: rgb(var(--v-theme-primary));
        border-width: 2px;
        background-color: rgba(var(--v-theme-primary), 0.04);
    }

    .v-card,
    .v-btn,
    .v-chip,
    .v-text-field .v-field,
    .v-select .v-field {
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    .content-container {
        min-height: 400px;
        display: flex;
        flex-direction: column;
    }

    .empty-state-full {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
    }

    .entries-container {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .entries-list {
        flex: 1;
        max-height: 500px;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 4px;
    }

    /* Custom scrollbar */
    .entries-list::-webkit-scrollbar {
        width: 6px;
    }

    .entries-list::-webkit-scrollbar-track {
        background: var(--vp-c-bg-soft);
        border-radius: 3px;
    }

    .entries-list::-webkit-scrollbar-thumb {
        background: var(--vp-c-divider);
        border-radius: 3px;
    }
</style>