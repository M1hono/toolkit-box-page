<!--
/**
 * @fileoverview MNA Entry Editor - Visual Section Editor
 * @component MnaEntryEditor
 * @description Visual editor for MNA guidebook entries with theme-aware previews
 */
-->

<template>
    <v-card flat class="entry-editor">
        <v-card-title class="entry-editor__header">
            <div>
                <v-icon color="primary" class="mr-2">mdi-book-edit</v-icon>
                <span class="text-h6">
                    {{ currentEntryId ? `${t.editingEntry}: ${currentEntryId}` : t.noEntrySelected }}
                </span>
            </div>
            <div class="d-flex gap-2 flex-wrap">
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
                    variant="text"
                    size="small"
                    :disabled="!currentEntryId || sections.length === 0"
                    class="entry-editor__save"
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
            <v-row dense>
                <v-col cols="12" md="6">
                    <v-text-field
                        :model-value="entryId"
                        :label="t.entryName"
                        variant="outlined"
                        density="compact"
                        readonly
                    ></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                    <v-text-field
                        :model-value="localEntryData.index"
                        @update:model-value="updateNumberField('index', $event)"
                        :label="t.index"
                        type="number"
                        variant="outlined"
                        density="compact"
                    ></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                    <v-select
                        :model-value="localEntryData.tier"
                        @update:model-value="updateNumberField('tier', $event)"
                        :items="[1, 2, 3, 4, 5]"
                        :label="t.tier"
                        variant="outlined"
                        density="compact"
                    ></v-select>
                </v-col>
                <v-col cols="12" md="6">
                    <v-combobox
                        :model-value="localEntryData.category"
                        @update:model-value="updateStringField('category', $event)"
                        :items="categories"
                        :label="t.entryCategory"
                        variant="outlined"
                        density="compact"
                        clearable
                    ></v-combobox>
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field
                        :model-value="localEntryData.required_advancement"
                        @update:model-value="updateStringField('required_advancement', $event)"
                        :label="t.requiredAdvancement"
                        :placeholder="t.requiredAdvancementPlaceholder"
                        variant="outlined"
                        density="compact"
                    ></v-text-field>
                </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>

            <div class="d-flex justify-space-between align-center mb-3 flex-wrap gap-2">
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

                    <div class="section-preview-copy">
                        <v-list-item-title v-if="section.type === 'title'">
                            {{ section.value || t.untitled }}
                        </v-list-item-title>
                        <v-list-item-title v-else-if="section.type === 'text'">
                            <span class="segment-rich-text" v-html="formatTextSection(section)"></span>
                        </v-list-item-title>
                        <v-list-item-title v-else-if="section.type === 'image'">
                            {{ section.location }} ({{ section.width }}x{{ section.height }})
                        </v-list-item-title>
                        <v-list-item-title v-else-if="section.type === 'recipe'">
                            {{ section.location }} ({{ section.recipeType }})
                        </v-list-item-title>
                        <v-list-item-title v-else-if="section.type === 'item'">
                            {{ itemCount(section) }} {{ t.items }}
                        </v-list-item-title>

                        <v-list-item-subtitle
                            v-if="section.newPage || (section.type === 'text' && section.link)"
                            class="section-preview-meta"
                        >
                            <span v-if="section.newPage">{{ t.startsOnNewPage }}</span>
                            <span v-if="section.newPage && section.type === 'text' && section.link"> · </span>
                            <span v-if="section.type === 'text' && section.link">
                                {{ t.linkedTo }} {{ section.link.type }}:{{ section.link.path }}
                            </span>
                        </v-list-item-subtitle>
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

        <v-dialog v-model="showSectionDialog" max-width="860">
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
    import { computed, ref, watch } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { Entry, Section } from "../../../../utils/mnaGuidebook";
    import { renderGuidebookSegments } from "../../../../utils/mnaGuidebook/richTextPreview.js";
    import MnaSectionEditor from "./MnaSectionEditor.vue";

    const { t } = useSafeI18n("mna-entry-editor", {
        editingEntry: "Editing Entry",
        noEntrySelected: "No Entry Selected",
        saveEntry: "Save Entry",
        fillFromSource: "Fill from Source",
        selectOrCreateEntry: "Select an entry from the list or create a new one to start editing.",
        entryName: "Entry Key",
        index: "Index",
        entryCategory: "Category",
        tier: "Tier",
        requiredAdvancement: "Required Advancement",
        requiredAdvancementPlaceholder: "mna:tier_0/vinteum_bar",
        sections: "Sections",
        addSection: "Add Section",
        editSection: "Edit Section",
        noSections: "No sections added. Click \"Add Section\" to start.",
        untitled: "Untitled",
        startsOnNewPage: "Starts on new page",
        linkedTo: "Linked to",
        items: "items",
    });

    const props = defineProps<{
        entryData: Entry;
        entryId: string;
        categories: string[];
        hasSourceData: boolean;
        sourceEntry?: Entry;
    }>();

    const emit = defineEmits<{
        save: [];
        reset: [];
        "fill-from-source": [];
        "add-category": [category: string];
        "update:entry-data": [data: Entry];
    }>();

    function cloneEntry(entry: Entry): Entry {
        return JSON.parse(JSON.stringify({
            ...entry,
            index: entry.index ?? 0,
            tier: entry.tier ?? 1,
            required_advancement: entry.required_advancement ?? "",
            sections: entry.sections ?? [],
            related_recipes: entry.related_recipes ?? [],
        }));
    }

    const localEntryData = ref<Entry>(cloneEntry(props.entryData));
    const showSectionDialog = ref(false);
    const editingIndex = ref<number | null>(null);
    const currentSection = ref<Partial<Section>>({});

    const sections = computed(() => localEntryData.value.sections || []);
    const currentEntryId = computed(() => props.entryId);

    watch(
        () => props.entryData,
        (newData) => {
            localEntryData.value = cloneEntry(newData);
        },
        { deep: true }
    );

    const emitEntryUpdate = () => {
        emit("update:entry-data", cloneEntry(localEntryData.value));
    };

    const updateStringField = (field: "category" | "required_advancement", value: unknown) => {
        localEntryData.value[field] = typeof value === "string" ? value : "";
        emitEntryUpdate();
    };

    const updateNumberField = (field: "index" | "tier", value: unknown) => {
        const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
        localEntryData.value[field] = Number.isFinite(parsed) ? parsed : field === "tier" ? 1 : 0;
        emitEntryUpdate();
    };

    const getSectionColor = (type: string) => {
        const colors: Record<string, string> = {
            title: "primary",
            text: "info",
            image: "warning",
            recipe: "error",
            item: "secondary",
        };

        return colors[type] || "grey";
    };

    const formatTextSection = (section: Partial<Section>) => {
        if (section.value) {
            return renderGuidebookSegments([{ text: section.value }]);
        }

        return renderGuidebookSegments(section.json || []);
    };

    const itemCount = (section: Partial<Section>) => {
        if (Array.isArray(section.locations) && section.locations.length > 0) {
            return section.locations.length;
        }
        return section.location ? 1 : 0;
    };

    const editSectionAt = (index: number) => {
        editingIndex.value = index;
        currentSection.value = JSON.parse(JSON.stringify(sections.value[index]));
        showSectionDialog.value = true;
    };

    const removeSection = (index: number) => {
        const newSections = [...sections.value];
        newSections.splice(index, 1);
        localEntryData.value.sections = newSections;
        emitEntryUpdate();
    };

    const saveSection = (sectionData: Section) => {
        const newSections = [...sections.value];
        if (editingIndex.value !== null) {
            newSections[editingIndex.value] = sectionData;
        } else {
            newSections.push(sectionData);
        }

        localEntryData.value.sections = newSections;
        emitEntryUpdate();
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
        background: var(--vp-c-bg);
    }

    .entry-editor__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }

    .entry-editor__save {
        color: var(--vp-c-text-1) !important;
    }

    .section-preview-item {
        border: 1px solid color-mix(in srgb, var(--vp-c-divider) 86%, transparent);
        border-radius: 4px !important;
        box-shadow: none !important;
        transition: border-color 0.2s ease, background-color 0.2s ease;
        background: color-mix(in srgb, var(--vp-c-bg) 92%, var(--vp-c-bg-soft) 8%);
    }

    .section-preview-item:hover {
        border-color: color-mix(in srgb, var(--vp-c-text-2) 40%, var(--vp-c-divider));
        background: color-mix(in srgb, var(--vp-c-bg) 88%, var(--vp-c-bg-soft) 12%);
    }

    .section-preview-copy {
        min-width: 0;
    }

    .section-preview-meta {
        margin-top: 4px;
        color: var(--vp-c-text-3);
    }

    .segment-rich-text {
        display: block;
        color: var(--vp-c-text-2);
        line-height: 1.55;
        overflow-wrap: anywhere;
    }

    :deep(.mna-rich-segment) {
        color: inherit;
    }

    :deep(.mna-rich-bold) {
        font-weight: 700;
    }

    :deep(.mna-rich-italic) {
        font-style: italic;
    }

    :deep(.mna-rich-underlined) {
        text-decoration: underline;
    }

    :deep(.mna-rich-strikethrough) {
        text-decoration: line-through;
    }

    :deep(.mna-rich-obfuscated) {
        filter: blur(0.02em);
        letter-spacing: 0.08em;
    }

    :deep(.mna-color-black),
    :deep(.mna-color-white) {
        color: var(--vp-c-text-1);
    }

    :deep(.mna-color-gray) {
        color: var(--vp-c-text-2);
    }

    :deep(.mna-color-dark_gray) {
        color: var(--vp-c-text-3);
    }

    :deep(.mna-color-dark_blue) {
        color: color-mix(in srgb, #3559b7 76%, var(--vp-c-text-1));
    }

    :deep(.mna-color-blue) {
        color: color-mix(in srgb, #4c7ef3 78%, var(--vp-c-text-1));
    }

    :deep(.mna-color-dark_green) {
        color: color-mix(in srgb, #2f7d4d 78%, var(--vp-c-text-1));
    }

    :deep(.mna-color-green) {
        color: color-mix(in srgb, #44b96e 78%, var(--vp-c-text-1));
    }

    :deep(.mna-color-dark_aqua) {
        color: color-mix(in srgb, #1f8b8b 76%, var(--vp-c-text-1));
    }

    :deep(.mna-color-aqua) {
        color: color-mix(in srgb, #51c7d9 78%, var(--vp-c-text-1));
    }

    :deep(.mna-color-dark_red) {
        color: color-mix(in srgb, #a83e48 78%, var(--vp-c-text-1));
    }

    :deep(.mna-color-red) {
        color: color-mix(in srgb, #df5f68 78%, var(--vp-c-text-1));
    }

    :deep(.mna-color-dark_purple) {
        color: color-mix(in srgb, #7d4bb3 78%, var(--vp-c-text-1));
    }

    :deep(.mna-color-light_purple) {
        color: color-mix(in srgb, #bc7bff 78%, var(--vp-c-text-1));
    }

    :deep(.mna-color-gold) {
        color: color-mix(in srgb, #c9962c 78%, var(--vp-c-text-1));
    }

    :deep(.mna-color-yellow) {
        color: color-mix(in srgb, #e0bf46 78%, var(--vp-c-text-1));
    }

    .v-card,
    .v-btn,
    .v-chip,
    .v-text-field .v-field,
    .v-select .v-field,
    .v-combobox .v-field {
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    .gap-2 {
        gap: 8px;
    }

    .gap-1 {
        gap: 4px;
    }

    @media (max-width: 768px) {
        .entry-editor__header {
            align-items: stretch;
        }
    }
</style>
