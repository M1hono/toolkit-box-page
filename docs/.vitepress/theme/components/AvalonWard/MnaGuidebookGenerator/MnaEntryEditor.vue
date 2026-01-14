<!--
/**
 * @fileoverview MNA Entry Editor - Visual Section Editor
 * @component MnaEntryEditor
 * @description Visual editor for MNA guidebook entries with all section types
 */
-->

<template>
    <v-card flat class="entry-editor">
        <v-card-title class="d-flex justify-space-between align-center">
            <div>
                <v-icon color="primary" class="mr-2">mdi-book-edit</v-icon>
                <span class="text-h6">{{ currentEntryId ? t.editingEntry + ': ' + currentEntryId : t.noEntrySelected }}</span>
            </div>
            <div class="d-flex gap-2">
                <v-btn
                    v-if="hasSourceData && sourceEntry"
                    @click="$emit('fill-from-source')"
                    color="warning"
                    variant="outlined"
                    size="small"
                >
                    <v-icon start>mdi-download</v-icon>
                    {{ t.fillFromSource }}
                </v-btn>
                <v-btn
                    @click="$emit('save')"
                    color="success"
                    size="small"
                    :disabled="!currentEntryId || sections.length === 0"
                >
                    <v-icon start>mdi-content-save</v-icon>
                    {{ t.saveEntry }}
                </v-btn>
            </div>
        </v-card-title>

        <v-card-text v-if="!currentEntryId" class="text-center pa-12">
            <v-icon size="64" color="grey-lighten-1">mdi-book-open-variant</v-icon>
            <div class="text-h6 mt-4 text-medium-emphasis">{{ t.selectOrCreateEntry }}</div>
        </v-card-text>

        <v-card-text v-else class="pa-4">
            <!-- Entry Basic Fields -->
            <v-row dense>
                <v-col cols="6">
                    <v-text-field
                        :model-value="entryId"
                        :label="t.entryName"
                        variant="outlined"
                        density="compact"
                        readonly
                    ></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field
                        :model-value="localEntryData.sortnum"
                        @update:model-value="updateField('sortnum', parseInt($event) || 0)"
                        :label="t.index"
                        type="number"
                        variant="outlined"
                        density="compact"
                    ></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-select
                        :model-value="localEntryData.category"
                        @update:model-value="updateField('category', $event)"
                        :items="categories"
                        :label="t.entryCategory"
                        variant="outlined"
                        density="compact"
                    ></v-select>
                </v-col>
                <v-col cols="6">
                    <v-select
                        :model-value="localEntryData.sortnum || 1"
                        @update:model-value="updateField('sortnum', $event)"
                        :items="[1, 2, 3, 4, 5]"
                        :label="t.tier"
                        variant="outlined"
                        density="compact"
                    ></v-select>
                </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>

            <!-- Sections Management -->
            <div class="d-flex justify-space-between align-center mb-3">
                <span class="text-h6">{{ t.sections }}</span>
                <v-btn
                    @click="showSectionDialog = true"
                    color="primary"
                    variant="outlined"
                    size="small"
                >
                    <v-icon start>mdi-plus</v-icon>
                    {{ t.addSection }}
                </v-btn>
            </div>

            <!-- Sections List with Preview -->
            <div v-if="sections.length === 0" class="text-center pa-8 text-medium-emphasis">
                <v-icon size="48">mdi-text-box-plus-outline</v-icon>
                <div class="mt-2">{{ t.noSections }}</div>
            </div>

            <v-list v-else density="compact" class="pa-0">
                <v-list-item
                    v-for="(section, index) in sections"
                    :key="index"
                    class="mb-2 section-preview-item"
                >
                    <template #prepend>
                        <v-chip :color="getSectionColor(section.type)" size="small" label>
                            {{ section.type }}
                        </v-chip>
                    </template>

                    <div>
                        <v-list-item-title v-if="section.type === 'title'">
                            {{ section.value || 'Untitled' }}
                        </v-list-item-title>
                        <v-list-item-title v-else-if="section.type === 'text'">
                            <span v-html="formatJsonText(section.json || [])"></span>
                        </v-list-item-title>
                        <v-list-item-title v-else-if="section.type === 'image'">
                            {{ section.location }} ({{ section.width }}x{{ section.height }})
                        </v-list-item-title>
                        <v-list-item-title v-else-if="section.type === 'recipe'">
                            {{ section.location }} ({{ section.recipeType }})
                        </v-list-item-title>
                        <v-list-item-title v-else-if="section.type === 'item'">
                            {{ section.locations?.length || 1 }} items
                        </v-list-item-title>
                    </div>

                    <template #append>
                        <div class="d-flex gap-1">
                            <v-btn
                                @click="editSectionAt(index)"
                                icon="mdi-pencil"
                                size="x-small"
                                variant="text"
                            ></v-btn>
                            <v-btn
                                @click="removeSection(index)"
                                icon="mdi-delete"
                                size="x-small"
                                variant="text"
                                color="error"
                            ></v-btn>
                        </div>
                    </template>
                </v-list-item>
            </v-list>
        </v-card-text>

        <!-- Section Editor Dialog -->
        <v-dialog v-model="showSectionDialog" max-width="800">
            <v-card>
                <v-card-title>
                    {{ editingIndex !== null ? t.editSection : t.addSection }}
                </v-card-title>
                <v-card-text>
                    <mna-section-editor
                        v-model="currentSection"
                        :source-section="getSourceSection(editingIndex)"
                        @save="saveSection"
                        @cancel="showSectionDialog = false"
                    />
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script setup lang="ts">
    import { ref, computed, watch } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { Entry } from "../../../../utils/mnaGuidebook";
    import MnaSectionEditor from "./MnaSectionEditor.vue";

    const { t } = useSafeI18n("mna-entry-editor", {
        editingEntry: "Editing Entry",
        noEntrySelected: "No Entry Selected",
        saveEntry: "Save Entry",
        fillFromSource: "Fill from Source",
        clearForm: "Clear Form",
        selectOrCreateEntry: "Select an entry from the list or create a new one to start editing.",
        entryName: "Entry ID",
        index: "Index",
        entryCategory: "Category",
        tier: "Tier",
        sections: "Sections",
        addSection: "Add Section",
        editSection: "Edit Section",
        noSections: "No sections added. Click \"Add Section\" to start.",
    });

    const props = defineProps<{
        entryData: Entry;
        entryId: string;
        categories: string[];
        hasSourceData: boolean;
        sourceEntry?: any;
    }>();

    const emit = defineEmits<{
        save: [];
        reset: [];
        "fill-from-source": [];
        "add-category": [category: string];
        "update:entry-data": [data: Entry];
    }>();

    const localEntryData = ref({ ...props.entryData });
    const showSectionDialog = ref(false);
    const editingIndex = ref<number | null>(null);
    const currentSection = ref<any>({});

    const sections = computed(() => localEntryData.value.sections || []);
    const currentEntryId = computed(() => props.entryId);

    watch(() => props.entryData, (newData) => {
        localEntryData.value = { ...newData };
    }, { deep: true });

    const updateField = (field: string, value: any) => {
        localEntryData.value[field] = value;
        emit("update:entry-data", localEntryData.value);
    };

    const getSectionColor = (type: string) => {
        const colors = {
            title: 'primary',
            text: 'info',
            image: 'warning',
            recipe: 'error',
            item: 'purple'
        };
        return colors[type] || 'grey';
    };

    const formatJsonText = (jsonArray: any[]) => {
        if (!jsonArray || !Array.isArray(jsonArray)) return "";

        return jsonArray.map(segment => {
            if (!segment) return "";

            let formatted = segment.text || "";
            if (segment.color) {
                formatted = `<span style="color: var(--text-${segment.color})">${formatted}</span>`;
            }
            if (segment.italic) {
                formatted = `<em>${formatted}</em>`;
            }
            if (segment.bold) {
                formatted = `<strong>${formatted}</strong>`;
            }
            return formatted;
        }).join("");
    };

    const editSectionAt = (index: number) => {
        editingIndex.value = index;
        currentSection.value = { ...sections.value[index] };
        showSectionDialog.value = true;
    };

    const removeSection = (index: number) => {
        const newSections = [...sections.value];
        newSections.splice(index, 1);
        updateField('sections', newSections);
    };

    const saveSection = (sectionData: any) => {
        const newSections = [...sections.value];
        if (editingIndex.value !== null) {
            newSections[editingIndex.value] = sectionData;
        } else {
            newSections.push(sectionData);
        }
        updateField('sections', newSections);
        showSectionDialog.value = false;
        editingIndex.value = null;
        currentSection.value = {};
    };

    const getSourceSection = (index: number | null) => {
        if (index !== null && props.sourceEntry?.sections?.[index]) {
            return props.sourceEntry.sections[index];
        }
        return null;
    };
</script>

<style scoped>
    .entry-editor {
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    .section-preview-item {
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px !important;
        box-shadow: none !important;
        transition: border-color 0.2s ease;
    }

    .section-preview-item:hover {
        border-color: rgb(var(--v-theme-primary));
        background-color: rgba(var(--v-theme-primary), 0.02);
    }

    .v-card,
    .v-btn,
    .v-chip,
    .v-text-field .v-field,
    .v-select .v-field {
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    .gap-2 {
        gap: 8px;
    }

    .gap-1 {
        gap: 4px;
    }
</style>