/**
 * @fileoverview MNA Section editing and management
 * @description Handles section creation, editing, and text segment management
 */

import { ref, reactive, nextTick } from "vue";
import type { Entry } from "../types.js";

export function useMnaSections(
    currentEntryData: Entry,
    updateStatus: (msg: string, isError?: boolean) => void
) {
    // Current section being edited
    const currentSection = reactive({
        type: "title",
        value: "",
        json: [] as any[],
        location: "",
        width: 128,
        height: 128,
        recipeType: "crafting",
        locations: [] as string[],
        scale: 1.0,
        items_per_row: 4,
        newPage: false,
        editingIndex: undefined as number | undefined,
    });

    // Text segment editing for text sections
    const currentTextSegment = reactive({
        text: "",
        color: "",
        italic: false,
        bold: false,
    });

    const currentTextSegmentEditingIndex = ref<number | undefined>(undefined);
    const currentItemLocation = ref("");

    const sectionTypes = ["title", "text", "image", "recipe", "item"];

    // Section management
    const resetCurrentSection = (type?: string) => {
        currentSection.type = type || "title";
        currentSection.newPage = false;
        currentSection.editingIndex = undefined;

        if (type === "title") {
            currentSection.value = "";
        } else if (type === "text") {
            currentSection.json = [];
        } else if (type === "image") {
            currentSection.location = "";
            currentSection.width = 128;
            currentSection.height = 128;
        } else if (type === "recipe") {
            currentSection.location = "";
            currentSection.recipeType = "crafting";
            currentSection.newPage = true;
        } else if (type === "item") {
            currentSection.locations = [];
            currentSection.location = "";
            currentSection.scale = 1.0;
            currentSection.items_per_row = 4;
        }
    };

    // Text segment management
    const addTextSegment = () => {
        if (!currentTextSegment.text.trim()) return false;

        const segment: any = { text: currentTextSegment.text };

        if (currentTextSegment.color) {
            segment.color = currentTextSegment.color;
        }
        if (currentTextSegment.italic) {
            segment.italic = true;
        }
        if (currentTextSegment.bold) {
            segment.bold = true;
        }

        if (!currentSection.json) {
            currentSection.json = [];
        }

        // Check if editing existing segment
        if (currentTextSegmentEditingIndex.value !== undefined) {
            currentSection.json.splice(
                currentTextSegmentEditingIndex.value,
                1,
                segment
            );
            currentTextSegmentEditingIndex.value = undefined;
        } else {
            currentSection.json.push(segment);
        }

        // Reset form
        currentTextSegment.text = "";
        currentTextSegment.color = "";
        currentTextSegment.italic = false;
        currentTextSegment.bold = false;

        return true;
    };

    const editTextSegment = (index: number) => {
        if (
            !currentSection.json ||
            index < 0 ||
            index >= currentSection.json.length
        ) {
            return false;
        }

        const segment = currentSection.json[index];
        currentTextSegment.text = segment.text || "";
        currentTextSegment.color = segment.color || "";
        currentTextSegment.italic = segment.italic || false;
        currentTextSegment.bold = segment.bold || false;

        currentTextSegmentEditingIndex.value = index;

        // Focus on textarea
        nextTick(() => {
            const textarea = document.querySelector(
                ".text-segment-creator textarea"
            ) as HTMLTextAreaElement;
            if (textarea) textarea.focus();
        });

        return true;
    };

    const removeTextSegment = (index: number) => {
        if (
            currentSection.json &&
            index >= 0 &&
            index < currentSection.json.length
        ) {
            currentSection.json.splice(index, 1);
            return true;
        }
        return false;
    };

    // Item location management
    const addItemLocation = () => {
        if (!currentItemLocation.value.trim()) return false;

        if (!currentSection.locations) {
            currentSection.locations = [];
        }

        currentSection.locations.push(currentItemLocation.value);
        currentItemLocation.value = "";
        return true;
    };

    const removeItemLocation = (index: number) => {
        if (
            currentSection.locations &&
            index >= 0 &&
            index < currentSection.locations.length
        ) {
            currentSection.locations.splice(index, 1);
            return true;
        }
        return false;
    };

    // Section CRUD operations
    const addSection = () => {
        // Validate section before adding
        if (currentSection.type === "title" && !currentSection.value.trim()) {
            updateStatus("Title section requires a value", true);
            return false;
        }

        if (
            currentSection.type === "text" &&
            (!currentSection.json || currentSection.json.length === 0)
        ) {
            if (currentTextSegment.text.trim()) {
                addTextSegment();
            }
            if (!currentSection.json || currentSection.json.length === 0) {
                updateStatus(
                    "Text section requires at least one text segment",
                    true
                );
                return false;
            }
        }

        if (
            currentSection.type === "image" &&
            !currentSection.location.trim()
        ) {
            updateStatus("Image section requires a location", true);
            return false;
        }

        if (
            currentSection.type === "recipe" &&
            !currentSection.location.trim()
        ) {
            updateStatus("Recipe section requires a location", true);
            return false;
        }

        if (currentSection.type === "item") {
            const hasSingleLocation = currentSection.location?.trim();
            const hasMultipleLocations =
                currentSection.locations && currentSection.locations.length > 0;

            if (!hasSingleLocation && !hasMultipleLocations) {
                if (currentItemLocation.value.trim()) {
                    addItemLocation();
                    // Check again after adding
                    if (
                        !currentSection.locations ||
                        currentSection.locations.length === 0
                    ) {
                        updateStatus(
                            "Item section requires at least one item location",
                            true
                        );
                        return false;
                    }
                } else {
                    updateStatus(
                        "Item section requires at least one item location",
                        true
                    );
                    return false;
                }
            }
        }

        const sectionToAdd = JSON.parse(JSON.stringify(currentSection));
        delete sectionToAdd.editingIndex;

        if (!currentEntryData.sections) {
            currentEntryData.sections = [];
        }

        if (currentSection.editingIndex !== undefined) {
            currentEntryData.sections.splice(
                currentSection.editingIndex,
                0,
                sectionToAdd
            );
            currentSection.editingIndex = undefined;
        } else {
            currentEntryData.sections.push(sectionToAdd);
        }

        resetCurrentSection(currentSection.type);
        updateStatus(`Added ${sectionToAdd.type} section`);
        return true;
    };

    const removeSection = (index: number) => {
        if (
            currentEntryData.sections &&
            index >= 0 &&
            index < currentEntryData.sections.length
        ) {
            const removedType = currentEntryData.sections[index].type;
            currentEntryData.sections.splice(index, 1);
            updateStatus(`Removed ${removedType} section`);
            return true;
        }
        return false;
    };

    const editSection = (index: number) => {
        if (
            !currentEntryData.sections ||
            index < 0 ||
            index >= currentEntryData.sections.length
        ) {
            return false;
        }

        const section = currentEntryData.sections[index];
        const sectionCopy = JSON.parse(JSON.stringify(section));

        currentSection.type = sectionCopy.type || "title";
        currentSection.newPage = sectionCopy.newPage || false;

        // Load section data based on type
        if (sectionCopy.type === "title") {
            currentSection.value = sectionCopy.value || "";
        } else if (sectionCopy.type === "text") {
            currentSection.json = sectionCopy.json
                ? JSON.parse(JSON.stringify(sectionCopy.json))
                : [];
        } else if (sectionCopy.type === "image") {
            currentSection.location = sectionCopy.location || "";
            currentSection.width = sectionCopy.width || 128;
            currentSection.height = sectionCopy.height || 128;
        } else if (sectionCopy.type === "recipe") {
            currentSection.location = sectionCopy.location || "";
            currentSection.recipeType = sectionCopy.recipeType || "crafting";
            currentSection.newPage = sectionCopy.newPage !== false;
        } else if (sectionCopy.type === "item") {
            currentSection.locations = sectionCopy.locations
                ? [...sectionCopy.locations]
                : [];
            currentSection.location = sectionCopy.location || "";
            currentSection.scale = sectionCopy.scale || 1.0;
            currentSection.items_per_row = sectionCopy.items_per_row || 4;
            currentSection.newPage = sectionCopy.newPage || false;
        }

        currentSection.editingIndex = index;
        removeSection(index);

        updateStatus(`Editing ${sectionCopy.type} section`);
        return true;
    };

    // Use structure from source section
    const useStructure = (sourceSection: any) => {
        if (!sourceSection) return false;

        resetCurrentSection(sourceSection.type);

        if (sourceSection.type === "title") {
            currentSection.value = sourceSection.value || "";
            currentSection.newPage = sourceSection.newPage || false;
        } else if (sourceSection.type === "text") {
            currentSection.json = sourceSection.json
                ? JSON.parse(JSON.stringify(sourceSection.json))
                : [];
            currentSection.newPage = sourceSection.newPage || false;
        } else if (sourceSection.type === "image") {
            currentSection.location = sourceSection.location || "";
            currentSection.width = sourceSection.width || 128;
            currentSection.height = sourceSection.height || 128;
            currentSection.newPage = sourceSection.newPage || false;
        } else if (sourceSection.type === "recipe") {
            currentSection.location = sourceSection.location || "";
            currentSection.recipeType = sourceSection.recipeType || "crafting";
            currentSection.newPage = sourceSection.newPage !== false;
        } else if (sourceSection.type === "item") {
            currentSection.location = sourceSection.location || "";
            currentSection.locations = sourceSection.locations
                ? [...sourceSection.locations]
                : [];
            currentSection.scale = sourceSection.scale || 1.0;
            currentSection.items_per_row = sourceSection.items_per_row || 4;
            currentSection.newPage = sourceSection.newPage || false;
        }

        updateStatus(`Applied structure from source section`);
        return true;
    };

    // Utility function for formatting JSON text
    const formatJsonText = (jsonArray: any[]) => {
        if (!jsonArray || !Array.isArray(jsonArray)) return "";

        return jsonArray
            .map((segment) => {
                if (!segment) return "";

                let formatted = segment.text || "";
                if (segment.color) {
                    formatted = `<span class="text-${segment.color}">${formatted}</span>`;
                }
                if (segment.italic) {
                    formatted = `<em>${formatted}</em>`;
                }
                if (segment.bold) {
                    formatted = `<strong>${formatted}</strong>`;
                }
                return formatted;
            })
            .join("");
    };

    return {
        // State
        currentSection,
        currentTextSegment,
        currentTextSegmentEditingIndex,
        currentItemLocation,
        sectionTypes,

        // Methods
        resetCurrentSection,
        addTextSegment,
        editTextSegment,
        removeTextSegment,
        addItemLocation,
        removeItemLocation,
        addSection,
        removeSection,
        editSection,
        useStructure,
        formatJsonText,
    };
}
