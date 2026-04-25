<!--
/**
 * @fileoverview Ritual Parameters Editor Component
 * @component RitualParametersEditor
 * @description Handles ritual parameters like tier, colors, and toggles
 */
-->

<template>
    <v-card flat class="ritual-parameters-editor">
        <v-card-title class="text-h6">{{ t.parameters }}</v-card-title>
        <v-card-text class="pa-5">
            <div class="parameter-stack ritual-field-stack">
                <div class="parameter-field">
                    <span class="parameter-field__label ritual-field-label">{{
                        t.tier
                    }}</span>
                    <input
                        :value="parameters.tier"
                        @input="
                            updateNumericParameter(
                                'tier',
                                ($event.target as HTMLInputElement).value
                            )
                        "
                        type="number"
                        min="1"
                        max="10"
                        class="ritual-native-input ritual-native-input--mono"
                    />
                </div>

                <div class="parameter-field">
                    <span class="parameter-field__label ritual-field-label">{{
                        t.innerColor
                    }}</span>
                    <div class="parameter-field__control">
                        <input
                            :value="parameters.innerColor"
                            @input="
                                updateParameter(
                                    'innerColor',
                                    ($event.target as HTMLInputElement).value
                                )
                            "
                            type="text"
                            class="ritual-native-input ritual-native-input--mono parameter-input"
                        />
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            class="color-picker-btn toolbar-action"
                            @click="$refs.innerColorPicker.click()"
                        >
                            <v-icon>mdi-palette</v-icon>
                        </v-btn>
                        <input
                            ref="innerColorPicker"
                            type="color"
                            :value="innerColorHex"
                            @input="
                                updateInnerColorFromHex(
                                    ($event.target as HTMLInputElement).value
                                )
                            "
                            class="color-picker-input"
                        />
                    </div>
                </div>

                <div class="parameter-field">
                    <span class="parameter-field__label ritual-field-label">{{
                        t.outerColor
                    }}</span>
                    <div class="parameter-field__control">
                        <input
                            :value="parameters.outerColor"
                            @input="
                                updateParameter(
                                    'outerColor',
                                    ($event.target as HTMLInputElement).value
                                )
                            "
                            type="text"
                            class="ritual-native-input ritual-native-input--mono parameter-input"
                        />
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            class="color-picker-btn toolbar-action"
                            @click="$refs.outerColorPicker.click()"
                        >
                            <v-icon>mdi-palette</v-icon>
                        </v-btn>
                        <input
                            ref="outerColorPicker"
                            type="color"
                            :value="outerColorHex"
                            @input="
                                updateOuterColorFromHex(
                                    ($event.target as HTMLInputElement).value
                                )
                            "
                            class="color-picker-input"
                        />
                    </div>
                </div>

                <div class="parameter-field">
                    <span class="parameter-field__label ritual-field-label">{{
                        t.beamColor
                    }}</span>
                    <div class="parameter-field__control">
                        <input
                            :value="parameters.beamColor"
                            @input="
                                updateParameter(
                                    'beamColor',
                                    ($event.target as HTMLInputElement).value
                                )
                            "
                            type="text"
                            class="ritual-native-input ritual-native-input--mono parameter-input"
                        />
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            class="color-picker-btn toolbar-action"
                            @click="$refs.beamColorPicker.click()"
                        >
                            <v-icon>mdi-palette</v-icon>
                        </v-btn>
                        <input
                            ref="beamColorPicker"
                            type="color"
                            :value="beamColorHex"
                            @input="
                                updateBeamColorFromHex(
                                    ($event.target as HTMLInputElement).value
                                )
                            "
                            class="color-picker-input"
                        />
                    </div>
                </div>

                <div class="parameter-field">
                    <span class="parameter-field__label ritual-field-label">{{
                        t.createdItem
                    }}</span>
                    <input
                        :value="parameters.createsItem"
                        @input="
                            updateParameter(
                                'createsItem',
                                ($event.target as HTMLInputElement).value
                            )
                        "
                        :placeholder="t.createdItemPlaceholder"
                        type="text"
                        class="ritual-native-input parameter-input"
                    />
                </div>
            </div>

            <div class="parameter-toggles mt-4">
                <v-switch
                    :model-value="parameters.connectBeam"
                    @update:model-value="updateParameter('connectBeam', $event)"
                    :label="t.connectBeam"
                    color="warning"
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
                    color="warning"
                    density="compact"
                    hide-details
                    class="mb-2"
                ></v-switch>
                <v-switch
                    :model-value="parameters.kittable"
                    @update:model-value="updateParameter('kittable', $event)"
                    :label="t.kittable"
                    color="warning"
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

    const updateNumericParameter = (
        key: keyof RitualParameters,
        rawValue: string
    ) => {
        const parsedValue = Number.parseInt(rawValue, 10);
        updateParameter(
            key,
            Number.isFinite(parsedValue) ? parsedValue : props.parameters[key]
        );
    };

    /**
     * Converts parameter color to hex format
     * @param paramColor - Parameter color string
     * @returns Hex color string
     */
    const hexFromParameterColor = (paramColor: string): string => {
        if (!paramColor) return "#ffd24a";

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
        if (!hexColor) return "0xffd24a";

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
    .parameter-field {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .parameter-field__control {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .parameter-input {
        flex: 1 1 auto;
    }

    .color-picker-input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
    }

    .color-picker-btn {
        align-self: stretch;
        width: 40px;
        min-width: 40px;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        border-radius: 12px;
        color: var(--vp-c-text-2) !important;
        transition:
            border-color 0.18s ease,
            color 0.18s ease;
    }

    .color-picker-btn:hover {
        color: var(--vp-c-text-1) !important;
    }

    .color-picker-btn :deep(.v-icon) {
        font-size: 1rem;
    }

    .parameter-toggles {
        padding: 14px;
        background-color: color-mix(in srgb, var(--vp-c-bg) 92%, var(--ritual-surface-muted) 8%);
        border-radius: 12px;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
    }

    .parameter-toggles :deep(.v-selection-control) {
        margin: 0;
    }

    .parameter-toggles :deep(.v-label) {
        font-size: 0.94rem;
    }
</style>
