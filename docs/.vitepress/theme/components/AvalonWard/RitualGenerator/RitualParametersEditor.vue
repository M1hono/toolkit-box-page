<!--
/**
 * @fileoverview Ritual Parameters Editor Component
 * @component RitualParametersEditor
 * @description Handles ritual parameters like tier, colors, and toggles
 */
-->

<template>
    <v-card flat>
        <v-card-title class="text-h6">{{ t.parameters }}</v-card-title>
        <v-card-text>
            <v-text-field
                :model-value="parameters.tier"
                @update:model-value="updateParameter('tier', Number($event))"
                :label="t.tier"
                type="number"
                :min="1"
                :max="10"
                variant="outlined"
                density="compact"
                class="mb-4"
            ></v-text-field>

            <v-text-field
                :model-value="parameters.innerColor"
                @update:model-value="updateParameter('innerColor', $event)"
                :label="t.innerColor"
                variant="outlined"
                density="compact"
                class="mb-4"
            >
                <template #append>
                    <v-btn
                        icon
                        size="small"
                        variant="text"
                        class="color-picker-btn"
                        @click="$refs.innerColorPicker.click()"
                    >
                        <v-icon color="primary">mdi-palette</v-icon>
                    </v-btn>
                    <input
                        ref="innerColorPicker"
                        type="color"
                        :value="innerColorHex"
                        @input="updateInnerColorFromHex(($event.target as HTMLInputElement).value)"
                        class="color-picker-input"
                    />
                </template>
            </v-text-field>

            <v-text-field
                :model-value="parameters.outerColor"
                @update:model-value="updateParameter('outerColor', $event)"
                :label="t.outerColor"
                variant="outlined"
                density="compact"
                class="mb-4"
            >
                <template #append>
                    <v-btn
                        icon
                        size="small"
                        variant="text"
                        class="color-picker-btn"
                        @click="$refs.outerColorPicker.click()"
                    >
                        <v-icon color="primary">mdi-palette</v-icon>
                    </v-btn>
                    <input
                        ref="outerColorPicker"
                        type="color"
                        :value="outerColorHex"
                        @input="updateOuterColorFromHex(($event.target as HTMLInputElement).value)"
                        class="color-picker-input"
                    />
                </template>
            </v-text-field>

            <v-text-field
                :model-value="parameters.beamColor"
                @update:model-value="updateParameter('beamColor', $event)"
                :label="t.beamColor"
                variant="outlined"
                density="compact"
                class="mb-4"
            >
                <template #append>
                    <v-btn
                        icon
                        size="small"
                        variant="text"
                        class="color-picker-btn"
                        @click="$refs.beamColorPicker.click()"
                    >
                        <v-icon color="primary">mdi-palette</v-icon>
                    </v-btn>
                    <input
                        ref="beamColorPicker"
                        type="color"
                        :value="beamColorHex"
                        @input="updateBeamColorFromHex(($event.target as HTMLInputElement).value)"
                        class="color-picker-input"
                    />
                </template>
            </v-text-field>

            <v-text-field
                :model-value="parameters.createsItem"
                @update:model-value="updateParameter('createsItem', $event)"
                :label="t.createdItem"
                :placeholder="t.createdItemPlaceholder"
                variant="outlined"
                density="compact"
                class="mb-4"
            ></v-text-field>

            <div class="parameter-toggles">
                <v-switch
                    :model-value="parameters.connectBeam"
                    @update:model-value="updateParameter('connectBeam', $event)"
                    :label="t.connectBeam"
                    color="primary"
                    density="compact"
                    hide-details
                    class="mb-2"
                ></v-switch>
                <v-switch
                    :model-value="parameters.displayIndexes"
                    @update:model-value="
                        updateParameter('displayIndexes', $event)
                    "
                    :label="t.displayIndexes"
                    color="primary"
                    density="compact"
                    hide-details
                    class="mb-2"
                ></v-switch>
                <v-switch
                    :model-value="parameters.kittable"
                    @update:model-value="updateParameter('kittable', $event)"
                    :label="t.kittable"
                    color="primary"
                    density="compact"
                    hide-details
                ></v-switch>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { computed } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { RitualParameters } from "../../../../utils/ritualGenerator";

    const { t } = useSafeI18n("ritual-parameters-editor", {
        parameters: "Parameters",
        tier: "Tier",
        innerColor: "Inner Color",
        outerColor: "Outer Color",
        beamColor: "Beam Color",
        createdItem: "Created Item",
        createdItemPlaceholder: "e.g. minecraft:diamond",
        connectBeam: "Connect Beam",
        displayIndexes: "Display Indexes",
        kittable: "Kittable",
    });

    const props = defineProps<{
        parameters: RitualParameters;
    }>();

    const emit = defineEmits<{
        "update:parameters": [parameters: RitualParameters];
    }>();

    const innerColorHex = computed(() =>
        hexFromParameterColor(props.parameters.innerColor)
    );
    const outerColorHex = computed(() =>
        hexFromParameterColor(props.parameters.outerColor)
    );
    const beamColorHex = computed(() =>
        hexFromParameterColor(props.parameters.beamColor)
    );

    /**
     * Updates a parameter value
     * @param key - Parameter key
     * @param value - New value
     */
    const updateParameter = (key: keyof RitualParameters, value: any) => {
        const newParams = { ...props.parameters, [key]: value };
        emit("update:parameters", newParams);
    };

    /**
     * Converts parameter color to hex format
     * @param paramColor - Parameter color string
     * @returns Hex color string
     */
    const hexFromParameterColor = (paramColor: string): string => {
        if (!paramColor) return "#ffffff";

        if (paramColor.startsWith("0x")) {
            return "#" + paramColor.substring(2);
        }

        return paramColor.startsWith("#") ? paramColor : "#" + paramColor;
    };

    /**
     * Converts hex color to parameter format
     * @param hexColor - Hex color string
     * @returns Parameter color string
     */
    const parameterColorFromHex = (hexColor: string): string => {
        if (!hexColor) return "0xffffff";

        if (hexColor.startsWith("#")) {
            return "0x" + hexColor.substring(1);
        }

        return hexColor.startsWith("0x") ? hexColor : "0x" + hexColor;
    };

    /**
     * Updates inner color from hex picker
     * @param hexColor - Hex color value
     */
    const updateInnerColorFromHex = (hexColor: string) => {
        updateParameter("innerColor", parameterColorFromHex(hexColor));
    };

    /**
     * Updates outer color from hex picker
     * @param hexColor - Hex color value
     */
    const updateOuterColorFromHex = (hexColor: string) => {
        updateParameter("outerColor", parameterColorFromHex(hexColor));
    };

    /**
     * Updates beam color from hex picker
     * @param hexColor - Hex color value
     */
    const updateBeamColorFromHex = (hexColor: string) => {
        updateParameter("beamColor", parameterColorFromHex(hexColor));
    };
</script>

<style scoped>
    .v-card {
        border: 1px solid #bdbdbd;
        box-shadow: none !important;
    }

    .v-card,
    .v-text-field .v-field,
    .v-btn,
    .v-switch {
        border-radius: 12px !important;
    }

    .color-picker-input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
    }

    .color-picker-btn {
        transition: all 0.2s ease;
    }

    .color-picker-btn:hover {
        background-color: rgba(var(--v-theme-primary), 0.1);
        transform: scale(1.1);
    }

    .parameter-toggles {
        padding: 12px;
        background-color: rgba(var(--v-theme-surface), 0.3);
        border-radius: 12px;
        border: 1px solid rgba(var(--v-theme-surface-variant), 0.2);
    }
</style>
