<!--
/**
 * @fileoverview MNA Section Editor
 * @component MnaSectionEditor
 * @description Theme-aware editor for title, text, image, recipe, and item sections
 */
-->

<template>
    <div class="section-editor">
        <v-select
            v-model="localSection.type"
            :items="sectionTypes"
            :label="t.sectionType"
            variant="outlined"
            density="compact"
            class="mb-4"
        ></v-select>

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

        <div v-if="localSection.type === 'text'">
            <v-textarea
                v-model="localSection.value"
                :label="t.plainText"
                :placeholder="t.plainTextPlaceholder"
                variant="outlined"
                density="compact"
                rows="3"
                class="mb-3"
            ></v-textarea>

            <v-card variant="outlined" class="mb-3">
                <v-card-title class="text-subtitle-2">{{ t.textSegments }}</v-card-title>
                <v-card-text>
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
                        <v-col cols="12" md="4">
                            <v-select
                                v-model="newSegment.color"
                                :items="colorOptions"
                                :label="t.color"
                                variant="outlined"
                                density="compact"
                                clearable
                            ></v-select>
                        </v-col>
                        <v-col cols="6" md="4">
                            <v-checkbox
                                v-model="newSegment.italic"
                                :label="t.italic"
                                density="compact"
                            ></v-checkbox>
                        </v-col>
                        <v-col cols="6" md="4">
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

                    <v-list
                        v-if="localSection.json && localSection.json.length > 0"
                        density="compact"
                        class="mt-3"
                    >
                        <v-list-item
                            v-for="(segment, index) in localSection.json"
                            :key="index"
                            class="segment-item"
                        >
                            <div class="segment-rich-text" v-html="formatSegment(segment)"></div>
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

            <v-row dense class="mb-2">
                <v-col cols="12" md="4">
                    <v-select
                        v-model="localSection.linkType"
                        :items="textLinkTypes"
                        :label="t.linkType"
                        variant="outlined"
                        density="compact"
                        clearable
                    ></v-select>
                </v-col>
                <v-col cols="12" md="8">
                    <v-text-field
                        v-model="localSection.linkPath"
                        :label="t.linkPath"
                        :placeholder="t.linkPathPlaceholder"
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

        <div v-if="localSection.type === 'recipe'">
            <v-text-field
                v-model="localSection.location"
                :label="t.recipeLocation"
                :placeholder="t.recipeLocationPlaceholder"
                variant="outlined"
                density="compact"
                class="mb-3"
            ></v-text-field>

            <v-combobox
                v-model="localSection.recipeType"
                :items="recipeTypes"
                :label="t.recipeType"
                variant="outlined"
                density="compact"
            ></v-combobox>

            <v-checkbox
                v-model="localSection.newPage"
                :label="t.newPage"
                density="compact"
                hide-details
            ></v-checkbox>
        </div>

        <div v-if="localSection.type === 'item'">
            <v-card variant="outlined" class="mb-3">
                <v-card-title class="text-subtitle-2">{{ t.itemLocations }}</v-card-title>
                <v-card-text>
                    <div class="d-flex gap-2 mb-3 item-input-row">
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

                    <v-list v-if="normalizedLocations.length > 0" density="compact">
                        <v-list-item
                            v-for="(location, index) in normalizedLocations"
                            :key="`${location}-${index}`"
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
    import { computed, ref, watch } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import { COMMON_RECIPE_TYPES, TEXT_LINK_TYPES } from "../../../../utils/mnaGuidebook/constants.js";
    import { renderGuidebookSegments } from "../../../../utils/mnaGuidebook/richTextPreview.js";

    const { t } = useSafeI18n("mna-section-editor", {
        sectionType: "Section Type",
        titleValue: "Title Text",
        titleValuePlaceholder: "Enter title text",
        plainText: "Plain Text Value",
        plainTextPlaceholder: "Use this for simple text sections without JSON segments",
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
        linkType: "Text Link Type",
        linkPath: "Text Link Target",
        linkPathPlaceholder: "Entry name or recipe id",
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

    function cloneSection(value: any) {
        const cloned = JSON.parse(JSON.stringify(value ?? {}));

        if (cloned.link && typeof cloned.link === "object") {
            cloned.linkType = cloned.link.type ?? "";
            cloned.linkPath = cloned.link.path ?? "";
        }

        if (
            cloned.type === "item" &&
            typeof cloned.location === "string" &&
            cloned.location.trim() &&
            (!Array.isArray(cloned.locations) || cloned.locations.length === 0)
        ) {
            cloned.locations = [cloned.location.trim()];
        }

        return cloned;
    }

    const localSection = ref<any>(cloneSection(props.modelValue));
    const newSegment = ref({ text: "", color: "", italic: false, bold: false });
    const editingSegmentIndex = ref<number | null>(null);
    const newItemLocation = ref("");

    const sectionTypes = [
        { title: "Title", value: "title" },
        { title: "Text", value: "text" },
        { title: "Image", value: "image" },
        { title: "Recipe", value: "recipe" },
        { title: "Item", value: "item" },
    ];

    const colorOptions = [
        "black", "dark_blue", "dark_green", "dark_aqua", "dark_red",
        "dark_purple", "gold", "gray", "dark_gray", "blue", "green",
        "aqua", "red", "light_purple", "yellow", "white",
    ];

    const recipeTypes = COMMON_RECIPE_TYPES;
    const textLinkTypes = TEXT_LINK_TYPES;

    const normalizedLocations = computed(() => {
        const rawLocations = Array.isArray(localSection.value.locations)
            ? [...localSection.value.locations]
            : [];

        if (typeof localSection.value.location === "string" && localSection.value.location.trim()) {
            rawLocations.unshift(localSection.value.location.trim());
        }

        return rawLocations.filter(Boolean);
    });

    watch(
        () => props.modelValue,
        (newVal) => {
            localSection.value = cloneSection(newVal);
        }
    );

    const formatSegment = (segment: any) => renderGuidebookSegments([segment]);

    const addTextSegment = () => {
        if (!newSegment.value.text) return;

        if (!Array.isArray(localSection.value.json)) {
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

        newSegment.value = { text: "", color: "", italic: false, bold: false };
    };

    const editSegment = (index: number) => {
        const segment = localSection.value.json?.[index];
        if (!segment) {
            return;
        }

        newSegment.value = {
            text: segment.text || "",
            color: segment.color || "",
            italic: segment.italic || false,
            bold: segment.bold || false,
        };
        editingSegmentIndex.value = index;
    };

    const removeSegment = (index: number) => {
        if (Array.isArray(localSection.value.json)) {
            localSection.value.json.splice(index, 1);
        }
    };

    const addItemLocation = () => {
        if (!newItemLocation.value.trim()) return;

        const nextLocations = [...normalizedLocations.value, newItemLocation.value.trim()];
        localSection.value.locations = nextLocations;
        localSection.value.location = "";
        newItemLocation.value = "";
    };

    const removeItemLocation = (index: number) => {
        const nextLocations = [...normalizedLocations.value];
        nextLocations.splice(index, 1);
        localSection.value.locations = nextLocations;
        localSection.value.location = "";
    };

    const copyFromSource = () => {
        if (props.sourceSection) {
            localSection.value = cloneSection(props.sourceSection);
        }
    };

    const save = () => {
        const normalized = cloneSection(localSection.value);

        if (normalized.type === "text") {
            if (normalized.linkType && normalized.linkPath) {
                normalized.link = {
                    type: normalized.linkType,
                    path: normalized.linkPath,
                };
            } else {
                delete normalized.link;
            }
            delete normalized.linkType;
            delete normalized.linkPath;
        }

        if (normalized.type === "item") {
            const locations = normalizedLocations.value;
            if (locations.length <= 1) {
                normalized.location = locations[0] || normalized.location || "";
                delete normalized.locations;
            } else {
                normalized.locations = locations;
                delete normalized.location;
            }
        }

        emit("save", normalized);
    };
</script>

<style scoped>
    .section-editor {
        color: var(--vp-c-text-1);
    }

    .segment-item {
        border: 1px solid color-mix(in srgb, var(--vp-c-divider) 86%, transparent);
        border-radius: 4px;
        padding: 8px;
        margin-bottom: 4px;
        background: color-mix(in srgb, var(--vp-c-bg-soft) 42%, var(--vp-c-bg));
    }

    .segment-rich-text {
        display: block;
        line-height: 1.55;
        overflow-wrap: anywhere;
        color: var(--vp-c-text-2);
    }

    .item-input-row {
        align-items: start;
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

    .v-text-field .v-field,
    .v-textarea .v-field,
    .v-select .v-field,
    .v-card,
    .v-btn,
    .v-combobox .v-field {
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    .gap-2 {
        gap: 8px;
    }

    @media (max-width: 768px) {
        .item-input-row {
            flex-direction: column;
        }
    }
</style>
