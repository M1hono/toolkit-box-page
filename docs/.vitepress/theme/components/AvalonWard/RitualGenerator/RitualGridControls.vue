<!--
/**
 * @fileoverview Ritual Grid Controls Component
 * @component RitualGridControls
 * @description Handles grid size controls, layer tabs, and overlay settings
 */
-->

<template>
    <v-card flat>
        <v-card-text class="pa-6">
            <div class="size-controls mb-6">
                <v-row align="center">
                    <v-col cols="12" md="6">
                        <div class="d-flex align-center">
                            <span class="text-body-1 font-weight-medium mr-4"
                                >{{ t.gridSize }}:</span
                            >
                            <v-slider
                                :model-value="gridSize"
                                @update:model-value="
                                    $emit('update:grid-size', $event)
                                "
                                :min="3"
                                :max="maxGridSize"
                                :step="2"
                                :disabled="locked"
                                thumb-label
                                class="flex-grow-1"
                            ></v-slider>
                            <v-chip
                                class="ml-4"
                                color="primary"
                                variant="outlined"
                            >
                                {{ gridSize }}×{{ gridSize }}
                            </v-chip>
                        </div>
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field
                            :model-value="maxGridSize"
                            @update:model-value="
                                $emit('update:max-grid-size', $event)
                            "
                            :label="t.maxSize"
                            type="number"
                            :min="3"
                            :max="21"
                            :step="2"
                            :disabled="locked"
                            variant="outlined"
                            density="compact"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="2">
                        <v-btn
                            @click="$emit('lock-size')"
                            :disabled="locked"
                            :color="locked ? 'grey' : 'success'"
                            block
                        >
                            <v-icon v-if="locked" start>mdi-lock</v-icon>
                            <v-icon v-else start>mdi-lock-open</v-icon>
                            {{ locked ? t.locked : t.lockSize }}
                        </v-btn>
                    </v-col>
                </v-row>
            </div>

            <v-tabs
                :model-value="activeLayer"
                @update:model-value="$emit('update:active-layer', $event)"
                :disabled="!locked"
                class="mb-4"
            >
                <v-tab value="pattern">{{ t.pattern }}</v-tab>
                <v-tab value="displayPattern">{{ t.displayPattern }}</v-tab>
                <v-tab value="reagents">{{ t.reagents }}</v-tab>
            </v-tabs>

            <div class="overlay-controls mb-6">
                <v-row align="center">
                    <v-col cols="auto">
                        <v-switch
                            :model-value="showKeysOverlay[activeLayer]"
                            @update:model-value="updateShowKeys"
                            :disabled="!locked || activeLayer === 'reagents'"
                            :label="t.showKeys"
                            color="primary"
                            density="compact"
                            hide-details
                        ></v-switch>
                    </v-col>
                    <v-col cols="auto">
                        <v-btn
                            @click="$emit('randomize-runes')"
                            :disabled="!locked || activeLayer !== 'pattern'"
                            color="primary"
                            variant="outlined"
                        >
                            <v-icon start>mdi-dice-multiple</v-icon>
                            {{ t.randomizeRunes }}
                        </v-btn>
                    </v-col>
                </v-row>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type {
        LayerType,
        ShowKeysOverlay,
    } from "../../../../utils/ritualGenerator";

    const { t } = useSafeI18n("ritual-grid-controls", {
        gridSize: "Grid Size",
        maxSize: "Max Size",
        lockSize: "Lock Size",
        locked: "Size Locked",
        pattern: "Pattern",
        displayPattern: "Display Pattern",
        reagents: "Reagents",
        showKeys: "Show Keys",
        randomizeRunes: "Randomize Runes",
    });

    const props = defineProps<{
        gridSize: number;
        maxGridSize: number;
        locked: boolean;
        activeLayer: LayerType;
        showKeysOverlay: ShowKeysOverlay;
    }>();

    const emit = defineEmits<{
        "update:grid-size": [size: number];
        "update:max-grid-size": [size: number];
        "update:active-layer": [layer: LayerType];
        "update:show-keys-overlay": [overlay: ShowKeysOverlay];
        "lock-size": [];
        "randomize-runes": [];
    }>();

    /**
     * Updates show keys overlay setting
     * @param value - New overlay value
     */
    const updateShowKeys = (value: boolean) => {
        const newOverlay = {
            ...props.showKeysOverlay,
            [props.activeLayer]: value,
        };
        emit("update:show-keys-overlay", newOverlay);
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
    .v-chip,
    .v-slider,
    .v-tabs {
        border-radius: 12px !important;
    }

    .size-controls .v-slider {
        margin: 0 16px;
    }
</style>
