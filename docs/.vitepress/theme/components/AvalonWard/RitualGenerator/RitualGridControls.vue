<!--
/**
 * @fileoverview Ritual Grid Controls Component
 * @component RitualGridControls
 * @description Handles grid size controls, layer tabs, and overlay settings
 */
-->

<template>
    <v-card flat class="ritual-grid-controls">
        <v-card-text class="pa-6">
            <div class="controls-grid mb-6">
                <div class="control-panel control-panel--slider">
                    <div class="control-panel__label-row">
                        <span class="control-panel__label">{{ t.gridSize }}</span>
                        <span class="control-panel__value">
                            {{ gridSize }}×{{ gridSize }}
                        </span>
                    </div>
                    <v-slider
                        :model-value="gridSize"
                        @update:model-value="$emit('update:grid-size', $event)"
                        :min="3"
                        :max="maxGridSize"
                        :step="2"
                        :disabled="locked"
                        density="comfortable"
                        hide-details
                        thumb-label
                        class="grid-size-slider"
                    ></v-slider>
                </div>

                <div class="control-panel">
                    <div class="control-panel__stack">
                        <span class="control-panel__label ritual-field-label">{{
                            t.maxSize
                        }}</span>
                        <input
                            :value="maxGridSize"
                            @input="
                                $emit(
                                    'update:max-grid-size',
                                    Number(
                                        ($event.target as HTMLInputElement)
                                            .value
                                    )
                                )
                            "
                            type="number"
                            min="3"
                            max="21"
                            step="2"
                            :disabled="locked"
                            class="ritual-native-input ritual-native-input--mono control-panel__input"
                        />
                    </div>
                </div>

                <div class="control-panel control-panel--action">
                    <v-btn
                        @click="$emit('lock-size')"
                        :disabled="locked"
                        variant="outlined"
                        block
                        class="lock-button"
                    >
                        <v-icon v-if="locked" start>mdi-lock</v-icon>
                        <v-icon v-else start>mdi-lock-open</v-icon>
                        {{ locked ? t.locked : t.lockSize }}
                    </v-btn>
                </div>
            </div>

            <v-tabs
                :model-value="activeLayer"
                @update:model-value="$emit('update:active-layer', $event)"
                :disabled="!locked"
                class="mb-4 layer-tabs"
            >
                <v-tab value="pattern">{{ t.pattern }}</v-tab>
                <v-tab value="displayPattern">{{ t.displayPattern }}</v-tab>
                <v-tab value="reagents">{{ t.reagents }}</v-tab>
            </v-tabs>

            <div class="overlay-bar">
                <v-switch
                    :model-value="showKeysOverlay[activeLayer]"
                    @update:model-value="updateShowKeys"
                    :disabled="!locked || activeLayer === 'reagents'"
                    :label="t.showKeys"
                    color="warning"
                    density="compact"
                    hide-details
                    inset
                    class="overlay-bar__switch"
                ></v-switch>
                <v-btn
                    @click="$emit('randomize-runes')"
                    :disabled="!locked || activeLayer !== 'pattern'"
                    variant="text"
                    class="overlay-bar__button toolbar-action"
                >
                    <v-icon start>mdi-dice-multiple</v-icon>
                    {{ t.randomizeRunes }}
                </v-btn>
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
    .controls-grid {
        display: grid;
        grid-template-columns: minmax(260px, 1fr) minmax(140px, 220px) minmax(180px, 220px);
        gap: 12px;
        align-items: stretch;
    }

    .control-panel {
        padding: 14px 16px;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        border-radius: 12px;
        background: color-mix(in srgb, var(--vp-c-bg) 92%, var(--ritual-surface-muted) 8%);
    }

    .control-panel--slider {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .control-panel__stack {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .control-panel--action {
        display: flex;
        align-items: stretch;
    }

    .control-panel__label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
    }

    .control-panel__label {
        color: var(--vp-c-text-2);
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }

    .control-panel__value {
        padding: 4px 10px;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 88%, transparent);
        border-radius: 999px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 0.9rem;
        font-weight: 600;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }

    .grid-size-slider {
        margin-inline: 4px;
    }

    .control-panel__input {
        padding-top: 10px;
        padding-bottom: 10px;
    }

    .grid-size-slider :deep(.v-slider-track) {
        color: color-mix(in srgb, var(--ritual-border-strong) 72%, transparent);
    }

    .grid-size-slider :deep(.v-slider-track__background) {
        opacity: 1;
    }

    .grid-size-slider :deep(.v-slider-track__fill) {
        color: var(--ritual-accent);
    }

    .grid-size-slider :deep(.v-slider-thumb__surface) {
        color: var(--ritual-accent);
        border: 2px solid var(--vp-c-bg);
    }

    .lock-button {
        min-height: 100%;
        color: var(--vp-c-text-1) !important;
        font-weight: 600;
    }

    .layer-tabs {
        overflow: hidden;
    }

    .overlay-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        border-radius: 12px;
        background: color-mix(in srgb, var(--vp-c-bg) 92%, var(--ritual-surface-muted) 8%);
    }

    .overlay-bar__switch {
        margin: 0;
    }

    .overlay-bar__button {
        margin-left: auto;
    }

    @media (max-width: 960px) {
        .controls-grid {
            grid-template-columns: 1fr;
        }

        .overlay-bar {
            flex-direction: column;
            align-items: stretch;
        }
    }
</style>
