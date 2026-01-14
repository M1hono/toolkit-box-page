<!--
/**
 * @fileoverview MNA Section Editor - Visual Editor for All Section Types
 * @component MnaSectionEditor
 * @description Visual editing interface for title, text, image, recipe, and item sections
 */
-->

<template>
    <div class="section-editor">
        <!-- Section Type Selector -->
        <v-select
            v-model="localSection.type"
            :items="sectionTypes"
            :label="t.sectionType"
            variant="outlined"
            density="compact"
            class="mb-4"
        ></v-select>

        <!-- Title Section Editor -->
        <div v-if="localSection.type === 'title'">
            <v-text-field
                v-model="localSection.value"
                :label="t.titleValue"
                :placeholder="t.titleValuePlaceholder"
                variant="outlined"
                density="compact"
            ></v-text-field>

            <v-checkbox
                v-model="localSection.newPage"
                :label="t.newPage"
                density="compact"
                hide-details
            ></v-checkbox>
        </div>

        <!-- Text Section Editor - Visual with Formatting -->
        <div v-if="localSection.type === 'text'">
            <v-card variant="outlined" class="mb-3">
                <v-card-title class="text-subtitle-2">{{ t.textSegments }}</v-card-title>
                <v-card-text>
                    <!-- Add Text Segment -->
                    <v-row dense>
                        <v-col cols="12">
                            <v-textarea
                                v-model="newSegment.text"
                                :label="t.text"
                                variant="outlined"
                                density="compact"
                                rows="2"
                            ></v-textarea>
                        </v-col>
                        <v-col cols="4">
                            <v-select
                                v-model="newSegment.color"
                                :items="colorOptions"
                                :label="t.color"
                                variant="outlined"
                                density="compact"
                                clearable
                            ></v-select>
                        </v-col>
                        <v-col cols="4">
                            <v-checkbox
                                v-model="newSegment.italic"
                                :label="t.italic"
                                density="compact"
                            ></v-checkbox>
                        </v-col>
                        <v-col cols="4">
                            <v-checkbox
                                v-model="newSegment.bold"
                                :label="t.bold"
                                density="compact"
                            ></v-checkbox>
                        </v-col>
                    </v-row>

                    <v-btn
                        @click="addTextSegment"
                        color="primary"
                        variant="outlined"
                        size="small"
                        :disabled="!newSegment.text"
                        block
                    >
                        <v-icon start>mdi-plus</v-icon>
                        {{ editingSegmentIndex !== null ? t.updateSegment : t.addSegment }}
                    </v-btn>

                    <!-- Text Segments Preview -->
                    <v-list v-if="localSection.json && localSection.json.length > 0" density="compact" class="mt-3">
                        <v-list-item
                            v-for="(segment, index) in localSection.json"
                            :key="index"
                            class="segment-item"
                        >
                            <div v-html="formatSegment(segment)"></div>
                            <template #append>
                                <v-btn
                                    @click="editSegment(index)"
                                    icon="mdi-pencil"
                                    size="x-small"
                                    variant="text"
                                ></v-btn>
                                <v-btn
                                    @click="removeSegment(index)"
                                    icon="mdi-delete"
                                    size="x-small"
                                    variant="text"
                                    color="error"
                                ></v-btn>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-card-text>
            </v-card>

            <v-checkbox
                v-model="localSection.newPage"
                :label="t.newPage"
                density="compact"
                hide-details
            ></v-checkbox>
        </div>

        <!-- Image Section Editor -->
        <div v-if="localSection.type === 'image'">
            <v-text-field
                v-model="localSection.location"
                :label="t.imageLocation"
                :placeholder="t.imageLocationPlaceholder"
                variant="outlined"
                density="compact"
                class="mb-3"
            ></v-text-field>

            <v-row dense>
                <v-col cols="6">
                    <v-text-field
                        v-model.number="localSection.width"
                        :label="t.width"
                        type="number"
                        variant="outlined"
                        density="compact"
                    ></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field
                        v-model.number="localSection.height"
                        :label="t.height"
                        type="number"
                        variant="outlined"
                        density="compact"
                    ></v-text-field>
                </v-col>
            </v-row>

            <v-checkbox
                v-model="localSection.newPage"
                :label="t.newPage"
                density="compact"
                hide-details
            ></v-checkbox>
        </div>

        <!-- Recipe Section Editor -->
        <div v-if="localSection.type === 'recipe'">
            <v-text-field
                v-model="localSection.location"
                :label="t.recipeLocation"
                :placeholder="t.recipeLocationPlaceholder"
                variant="outlined"
                density="compact"
                class="mb-3"
            ></v-text-field>

            <v-select
                v-model="localSection.recipeType"
                :items="recipeTypes"
                :label="t.recipeType"
                variant="outlined"
                density="compact"
            ></v-select>

            <v-checkbox
                v-model="localSection.newPage"
                :label="t.newPage"
                density="compact"
                hide-details
            ></v-checkbox>
        </div>

        <!-- Item Section Editor -->
        <div v-if="localSection.type === 'item'">
            <v-card variant="outlined" class="mb-3">
                <v-card-title class="text-subtitle-2">{{ t.itemLocations }}</v-card-title>
                <v-card-text>
                    <div class="d-flex gap-2 mb-3">
                        <v-text-field
                            v-model="newItemLocation"
                            :label="t.itemLocation"
                            :placeholder="t.itemLocationPlaceholder"
                            variant="outlined"
                            density="compact"
                            @keyup.enter="addItemLocation"
                        ></v-text-field>
                        <v-btn
                            @click="addItemLocation"
                            color="primary"
                            :disabled="!newItemLocation"
                        >
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                    </div>

                    <v-list v-if="localSection.locations && localSection.locations.length > 0" density="compact">
                        <v-list-item
                            v-for="(location, index) in localSection.locations"
                            :key="index"
                        >
                            {{ location }}
                            <template #append>
                                <v-btn
                                    @click="removeItemLocation(index)"
                                    icon="mdi-delete"
                                    size="x-small"
                                    variant="text"
                                    color="error"
                                ></v-btn>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-card-text>
            </v-card>

            <v-row dense>
                <v-col cols="6">
                    <v-text-field
                        v-model.number="localSection.scale"
                        :label="t.scale"
                        type="number"
                        step="0.1"
                        variant="outlined"
                        density="compact"
                    ></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field
                        v-model.number="localSection.items_per_row"
                        :label="t.itemsPerRow"
                        type="number"
                        variant="outlined"
                        density="compact"
                    ></v-text-field>
                </v-col>
            </v-row>

            <v-checkbox
                v-model="localSection.newPage"
                :label="t.newPage"
                density="compact"
                hide-details
            ></v-checkbox>
        </div>

        <!-- Action Buttons -->
        <v-card-actions class="mt-4">
            <v-btn
                v-if="sourceSection"
                @click="copyFromSource"
                color="warning"
                variant="outlined"
                size="small"
            >
                <v-icon start>mdi-content-copy</v-icon>
                {{ t.copyFromSource }}
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
                @click="$emit('cancel')"
                variant="outlined"
                size="small"
            >
                {{ t.cancel }}
            </v-btn>
            <v-btn
                @click="save"
                color="primary"
                size="small"
            >
                {{ t.save }}
            </v-btn>
        </v-card-actions>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";

    const { t } = useSafeI18n("mna-section-editor", {
        sectionType: "Section Type",
        titleValue: "Title Text",
        titleValuePlaceholder: "Enter title text",
        textSegments: "Text Segments",
        text: "Text",
        color: "Color",
        italic: "Italic",
        bold: "Bold",
        addSegment: "Add Segment",
        updateSegment: "Update Segment",
        imageLocation: "Image Location",
        imageLocationPlaceholder: "mna:textures/guide/image.png",
        width: "Width",
        height: "Height",
        recipeLocation: "Recipe Location",
        recipeLocationPlaceholder: "mna:recipe_name",
        recipeType: "Recipe Type",
        itemLocations: "Item Locations",
        itemLocation: "Item",
        itemLocationPlaceholder: "minecraft:stone",
        scale: "Scale",
        itemsPerRow: "Items Per Row",
        newPage: "Start on new page",
        copyFromSource: "Copy from Source",
        save: "Save",
        cancel: "Cancel",
    });

    const props = defineProps<{
        modelValue: any;
        sourceSection?: any;
    }>();

    const emit = defineEmits<{
        save: [section: any];
        cancel: [];
    }>();

    const localSection = ref({ ...props.modelValue });
    const newSegment = ref({ text: '', color: '', italic: false, bold: false });
    const editingSegmentIndex = ref<number | null>(null);
    const newItemLocation = ref('');

    const sectionTypes = [
        { title: 'Title', value: 'title' },
        { title: 'Text', value: 'text' },
        { title: 'Image', value: 'image' },
        { title: 'Recipe', value: 'recipe' },
        { title: 'Item', value: 'item' }
    ];

    const colorOptions = [
        'black', 'dark_blue', 'dark_green', 'dark_aqua', 'dark_red', 
        'dark_purple', 'gold', 'gray', 'dark_gray', 'blue', 'green', 
        'aqua', 'red', 'light_purple', 'yellow', 'white'
    ];

    const recipeTypes = ['crafting', 'smelting', 'blasting', 'smoking', 'campfire', 'stonecutting'];

    watch(() => props.modelValue, (newVal) => {
        localSection.value = { ...newVal };
    });

    const formatSegment = (segment: any) => {
        let formatted = segment.text || "";
        if (segment.color) {
            formatted = `<span style="color: var(--text-${segment.color})">${formatted}</span>`;
        }
        if (segment.italic) formatted = `<em>${formatted}</em>`;
        if (segment.bold) formatted = `<strong>${formatted}</strong>`;
        return formatted;
    };

    const addTextSegment = () => {
        if (!newSegment.value.text) return;

        if (!localSection.value.json) {
            localSection.value.json = [];
        }

        const segment: any = { text: newSegment.value.text };
        if (newSegment.value.color) segment.color = newSegment.value.color;
        if (newSegment.value.italic) segment.italic = true;
        if (newSegment.value.bold) segment.bold = true;

        if (editingSegmentIndex.value !== null) {
            localSection.value.json[editingSegmentIndex.value] = segment;
            editingSegmentIndex.value = null;
        } else {
            localSection.value.json.push(segment);
        }

        newSegment.value = { text: '', color: '', italic: false, bold: false };
    };

    const editSegment = (index: string | number) => {
        const idx = typeof index === 'string' ? parseInt(index) : index;
        const segment = localSection.value.json[idx];
        newSegment.value = {
            text: segment.text || '',
            color: segment.color || '',
            italic: segment.italic || false,
            bold: segment.bold || false
        };
        editingSegmentIndex.value = idx;
    };

    const removeSegment = (index: string | number) => {
        const idx = typeof index === 'string' ? parseInt(index) : index;
        if (localSection.value.json) {
            localSection.value.json.splice(idx, 1);
        }
    };

    const addItemLocation = () => {
        if (!newItemLocation.value) return;

        if (!localSection.value.locations) {
            localSection.value.locations = [];
        }

        localSection.value.locations.push(newItemLocation.value);
        newItemLocation.value = '';
    };

    const removeItemLocation = (index: string | number) => {
        const idx = typeof index === 'string' ? parseInt(index) : index;
        if (localSection.value.locations) {
            localSection.value.locations.splice(idx, 1);
        }
    };

    const copyFromSource = () => {
        if (props.sourceSection) {
            localSection.value = { ...props.sourceSection };
        }
    };

    const save = () => {
        emit('save', localSection.value);
    };
</script>

<style scoped>
    .segment-item {
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        padding: 8px;
        margin-bottom: 4px;
    }

    .v-text-field .v-field,
    .v-textarea .v-field,
    .v-select .v-field,
    .v-card,
    .v-btn {
        border-radius: 4px !important;
        box-shadow: none !important;
    }
</style>