<template>
    <v-card class="poster-panel">
        <v-card-title class="panel-title">{{ t.properties }}</v-card-title>
        <v-card-text class="panel-body">
            <div v-if="layer" class="property-form">
                <div class="field-block">
                    <span class="field-label">{{ t.name }}</span>
                    <v-text-field
                        class="property-control"
                        density="compact"
                        hide-details
                        :aria-label="t.name"
                        :model-value="layer.name"
                        single-line
                        variant="outlined"
                        @update:model-value="updateLayer({ name: String($event) })"
                    />
                </div>

                <div class="field-block">
                    <span class="field-label">{{ t.blend }}</span>
                    <v-select
                        class="property-control"
                        density="compact"
                        hide-details
                        :aria-label="t.blend"
                        :items="blendModes"
                        :model-value="layer.blendMode ?? 'Normal'"
                        single-line
                        variant="outlined"
                        @update:model-value="updateLayer({ blendMode: String($event) })"
                    />
                </div>

                <div v-if="textLayer" class="property-section">
                    <div class="section-title">{{ t.textLayer }}</div>
                    <div class="field-block">
                        <span class="field-label">{{ t.textContent }}</span>
                        <v-textarea
                            class="property-control"
                            auto-grow
                            density="compact"
                            hide-details
                            :aria-label="t.textContent"
                            :model-value="textLayer.text"
                            rows="2"
                            single-line
                            variant="outlined"
                            @update:model-value="updateLayer({ text: String($event) })"
                        />
                    </div>
                    <div class="transform-grid">
                        <div class="field-block">
                            <span class="field-label">{{ t.fontFamily }}</span>
                            <v-text-field
                                class="property-control"
                                density="compact"
                                hide-details
                                :aria-label="t.fontFamily"
                                :model-value="textLayer.fontFamily"
                                single-line
                                variant="outlined"
                                @update:model-value="updateLayer({ fontFamily: String($event) })"
                            />
                        </div>
                        <div class="field-block">
                            <span class="field-label">{{ t.fontSize }}</span>
                            <v-text-field
                                class="property-control"
                                density="compact"
                                hide-details
                                :aria-label="t.fontSize"
                                :model-value="Math.round(textLayer.fontSize)"
                                single-line
                                type="number"
                                variant="outlined"
                                @update:model-value="updateLayer({ fontSize: Number($event) })"
                            />
                        </div>
                    </div>
                    <div class="transform-grid">
                        <div class="field-block">
                            <span class="field-label">{{ t.color }}</span>
                            <v-text-field
                                class="property-control color-control"
                                density="compact"
                                hide-details
                                :aria-label="t.color"
                                :model-value="textLayer.color"
                                single-line
                                type="color"
                                variant="outlined"
                                @update:model-value="updateLayer({ color: String($event) })"
                            />
                        </div>
                        <div class="field-block">
                            <span class="field-label">{{ t.align }}</span>
                            <v-btn-toggle
                                class="align-toggle"
                                density="compact"
                                divided
                                mandatory
                                :model-value="textLayer.align"
                                variant="outlined"
                                @update:model-value="updateLayer({ align: $event as 'left' | 'center' | 'right' })"
                            >
                                <v-btn value="left" :title="t.alignLeft">
                                    <v-icon size="16">mdi-format-align-left</v-icon>
                                </v-btn>
                                <v-btn value="center" :title="t.alignCenter">
                                    <v-icon size="16">mdi-format-align-center</v-icon>
                                </v-btn>
                                <v-btn value="right" :title="t.alignRight">
                                    <v-icon size="16">mdi-format-align-right</v-icon>
                                </v-btn>
                            </v-btn-toggle>
                        </div>
                    </div>
                </div>

                <div v-if="imageLikeLayer" class="property-section">
                    <div class="section-title">{{ t.effects }}</div>
                    <div class="effect-presets">
                        <button
                            v-for="preset in effectPresets"
                            :key="preset.id"
                            class="effect-preset"
                            type="button"
                            @click="applyEffectPreset(preset.id)"
                        >
                            <v-icon size="15">{{ preset.icon }}</v-icon>
                            <span>{{ preset.label }}</span>
                        </button>
                    </div>
                    <div v-if="layer.effects.length > 0" class="effect-stack">
                        <div
                            v-for="effect in layer.effects"
                            :key="effect.id"
                            class="effect-item"
                            :class="{ disabled: effect.enabled === false }"
                        >
                            <div class="effect-row">
                                <span>{{ effectLabel(effect.id) }}</span>
                                <div class="effect-actions">
                                    <button
                                        class="effect-action"
                                        type="button"
                                        :aria-label="effect.enabled === false ? t.enableEffect : t.disableEffect"
                                        @click="toggleEffect(effect.id)"
                                    >
                                        <v-icon size="14">
                                            {{ effect.enabled === false ? "mdi-eye-off-outline" : "mdi-eye-outline" }}
                                        </v-icon>
                                    </button>
                                    <button
                                        class="effect-action"
                                        type="button"
                                        :aria-label="t.removeEffect"
                                        @click="removeEffect(effect.id)"
                                    >
                                        <v-icon size="14">mdi-close</v-icon>
                                    </button>
                                </div>
                            </div>
                            <div
                                v-if="effect.enabled !== false"
                                class="effect-controls"
                            >
                                <div
                                    v-for="control in effectControls(effect)"
                                    :key="`${effect.id}-${control.param}`"
                                    class="effect-control"
                                >
                                    <div class="effect-control__heading">
                                        <span>{{ control.label }}</span>
                                        <span>{{ formatEffectValue(control, effect.params[control.param]) }}</span>
                                    </div>
                                    <v-slider
                                        class="effect-slider"
                                        density="compact"
                                        hide-details
                                        :aria-label="`${effectLabel(effect.id)} ${control.label}`"
                                        :max="control.max"
                                        :min="control.min"
                                        :model-value="numberParam(effect.params[control.param], control.fallback)"
                                        :step="control.step"
                                        @update:model-value="updateEffectParam(effect.id, control.param, Number($event))"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="section-title">{{ t.transform }}</div>
                <div class="transform-grid">
                    <div class="field-block">
                        <span class="field-label">{{ t.x }}</span>
                        <v-text-field
                            class="property-control"
                            density="compact"
                            hide-details
                            :aria-label="t.x"
                            :model-value="Math.round(layer.x)"
                            single-line
                            type="number"
                            variant="outlined"
                            @update:model-value="updateLayer({ x: Number($event) })"
                        />
                    </div>
                    <div class="field-block">
                        <span class="field-label">{{ t.y }}</span>
                        <v-text-field
                            class="property-control"
                            density="compact"
                            hide-details
                            :aria-label="t.y"
                            :model-value="Math.round(layer.y)"
                            single-line
                            type="number"
                            variant="outlined"
                            @update:model-value="updateLayer({ y: Number($event) })"
                        />
                    </div>
                    <div class="field-block">
                        <span class="field-label">{{ t.width }}</span>
                        <v-text-field
                            class="property-control"
                            density="compact"
                            hide-details
                            :aria-label="t.width"
                            :min="1"
                            :model-value="Math.round(layer.width)"
                            single-line
                            type="number"
                            variant="outlined"
                            @update:model-value="updateLayer({ width: Number($event) })"
                        />
                    </div>
                    <div class="field-block">
                        <span class="field-label">{{ t.height }}</span>
                        <v-text-field
                            class="property-control"
                            density="compact"
                            hide-details
                            :aria-label="t.height"
                            :min="1"
                            :model-value="Math.round(layer.height)"
                            single-line
                            type="number"
                            variant="outlined"
                            @update:model-value="updateLayer({ height: Number($event) })"
                        />
                    </div>
                </div>
                <div class="slider-field">
                    <div class="slider-heading">
                        <span>{{ t.opacity }}</span>
                        <span>{{ Math.round(layer.opacity * 100) }}%</span>
                    </div>
                    <v-slider
                        class="property-slider"
                        density="compact"
                        hide-details
                        :aria-label="t.opacity"
                        :max="100"
                        :min="0"
                        :model-value="Math.round(layer.opacity * 100)"
                        step="1"
                        thumb-label
                        @update:model-value="updateLayer({ opacity: Number($event) / 100 })"
                    />
                </div>
                <div class="slider-field">
                    <div class="slider-heading">
                        <span>{{ t.rotation }}</span>
                        <span>{{ Math.round(layer.rotation) }}°</span>
                    </div>
                    <v-slider
                        class="property-slider"
                        density="compact"
                        hide-details
                        :aria-label="t.rotation"
                        :max="180"
                        :min="-180"
                        :model-value="layer.rotation"
                        step="1"
                        thumb-label
                        @update:model-value="updateLayer({ rotation: Number($event) })"
                    />
                </div>
                <button
                    class="lock-toggle"
                    type="button"
                    :aria-pressed="layer.locked"
                    @click="updateLayer({ locked: !layer.locked })"
                >
                    <v-icon size="16">
                        {{ layer.locked ? "mdi-lock" : "mdi-lock-open-variant-outline" }}
                    </v-icon>
                    <span>{{ t.locked }}</span>
                </button>
            </div>
            <div v-else class="empty-state">{{ t.noLayerSelected }}</div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { computed } from "vue";

    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { PosterEffect, PosterLayer } from "../../../../utils/posterStudio";

    const props = defineProps<{
        layer?: PosterLayer;
    }>();

    interface EffectControl {
        param: string;
        label: string;
        min: number;
        max: number;
        step: number;
        fallback: number;
        format: "number" | "percent" | "signedPercent" | "px";
    }

    const emit = defineEmits<{
        updateLayer: [patch: Partial<PosterLayer>];
    }>();

    const { t } = useSafeI18n("poster-studio-properties-panel", {
        properties: "Properties",
        noLayerSelected: "No layer selected",
        name: "Name",
        blend: "Blend",
        x: "X",
        y: "Y",
        width: "Width",
        height: "Height",
        opacity: "Opacity",
        rotation: "Rotation",
        locked: "Locked",
        textLayer: "Text",
        textContent: "Content",
        fontFamily: "Font",
        fontSize: "Size",
        color: "Color",
        align: "Align",
        alignLeft: "Left",
        alignCenter: "Center",
        alignRight: "Right",
        transform: "Transform",
        effects: "Effects",
        effectFrosted: "Frosted",
        effectDustGrain: "White grain",
        effectSoftBlur: "Soft blur",
        effectFilmNoise: "Film noise",
        effectPunch: "Punch",
        effectRadius: "Radius",
        effectAmount: "Amount",
        effectDensity: "Density",
        effectSize: "Grain size",
        effectBrightness: "Brightness",
        effectContrast: "Contrast",
        effectSaturation: "Saturation",
        effectOpacity: "Effect opacity",
        enableEffect: "Enable effect",
        disableEffect: "Disable effect",
        removeEffect: "Remove effect",
    });
    const blendModes = ["Normal", "Multiply", "Screen", "Overlay"];
    const textLayer = computed(() =>
        props.layer?.type === "text" ? props.layer : undefined,
    );
    const imageLikeLayer = computed(() =>
        props.layer &&
        (props.layer.type === "image" ||
            props.layer.type === "frame" ||
            props.layer.type === "icon")
            ? props.layer
            : undefined,
    );
    const effectPresets = computed(() => [
        {
            id: "frosted",
            label: t.effectFrosted,
            icon: "mdi-texture-box",
        },
        {
            id: "dustGrain",
            label: t.effectDustGrain,
            icon: "mdi-dots-grid",
        },
        {
            id: "softBlur",
            label: t.effectSoftBlur,
            icon: "mdi-blur",
        },
        {
            id: "filmNoise",
            label: t.effectFilmNoise,
            icon: "mdi-grain",
        },
        {
            id: "punch",
            label: t.effectPunch,
            icon: "mdi-contrast-circle",
        },
    ]);

    function updateLayer(patch: Partial<PosterLayer>) {
        emit("updateLayer", patch);
    }

    function applyEffectPreset(preset: string) {
        emit("updateLayer", {
            effects: createPresetEffects(preset),
        });
    }

    function toggleEffect(id: string) {
        if (!props.layer) return;

        emit("updateLayer", {
            effects: props.layer.effects.map((effect) =>
                effect.id === id
                    ? {
                        ...effect,
                        enabled: effect.enabled === false,
                    }
                    : effect,
            ),
        });
    }

    function removeEffect(id: string) {
        if (!props.layer) return;

        emit("updateLayer", {
            effects: props.layer.effects.filter((effect) => effect.id !== id),
        });
    }

    function updateEffectParam(id: string, param: string, value: number) {
        if (!props.layer) return;

        emit("updateLayer", {
            effects: props.layer.effects.map((effect) =>
                effect.id === id
                    ? {
                        ...effect,
                        params: {
                            ...effect.params,
                            [param]: value,
                        },
                    }
                    : effect,
            ),
        });
    }

    function effectControls(effect: PosterEffect): EffectControl[] {
        if (effect.id === "blur") {
            return [
                control("radius", t.effectRadius, 0, 12, 0.5, 3, "px"),
            ];
        }

        if (effect.id === "noise") {
            return [
                control("amount", t.effectAmount, 0, 0.25, 0.005, 0.08, "percent"),
            ];
        }

        if (effect.id === "dustGrain") {
            return [
                control("density", t.effectDensity, 0, 0.5, 0.01, 0.14, "percent"),
                control("opacity", t.effectOpacity, 0, 0.35, 0.01, 0.16, "percent"),
                control("size", t.effectSize, 0.4, 3, 0.1, 1.1, "px"),
            ];
        }

        if (effect.id === "adjust") {
            return [
                control("brightness", t.effectBrightness, -0.5, 0.5, 0.01, 0, "signedPercent"),
                control("contrast", t.effectContrast, -0.5, 0.5, 0.01, 0, "signedPercent"),
                control("saturation", t.effectSaturation, -0.5, 0.8, 0.01, 0, "signedPercent"),
            ];
        }

        return [];
    }

    function control(
        param: string,
        label: string,
        min: number,
        max: number,
        step: number,
        fallback: number,
        format: EffectControl["format"],
    ): EffectControl {
        return {
            param,
            label,
            min,
            max,
            step,
            fallback,
            format,
        };
    }

    function formatEffectValue(control: EffectControl, value: unknown) {
        const numericValue = numberParam(value, control.fallback);

        if (control.format === "px") {
            return `${formatNumber(numericValue)} px`;
        }

        if (control.format === "percent") {
            return `${Math.round(numericValue * 100)}%`;
        }

        if (control.format === "signedPercent") {
            const rounded = Math.round(numericValue * 100);

            return `${rounded > 0 ? "+" : ""}${rounded}%`;
        }

        return formatNumber(numericValue);
    }

    function numberParam(value: unknown, fallback: number): number {
        return typeof value === "number" && Number.isFinite(value) ? value : fallback;
    }

    function formatNumber(value: number) {
        return Number.isInteger(value) ? String(value) : value.toFixed(1);
    }

    function createPresetEffects(preset: string): PosterEffect[] {
        if (preset === "frosted") {
            return [
                effect("blur", { radius: 4 }),
                effect("noise", { amount: 0.045, seed: 11 }),
                effect("dustGrain", {
                    density: 0.18,
                    size: 0.9,
                    opacity: 0.12,
                    seed: 43,
                    color: "#ffffff",
                }),
            ];
        }

        if (preset === "dustGrain") {
            return [
                effect("dustGrain", {
                    density: 0.34,
                    size: 1.05,
                    opacity: 0.18,
                    seed: 42,
                    color: "#ffffff",
                }),
            ];
        }

        if (preset === "softBlur") {
            return [effect("blur", { radius: 3 })];
        }

        if (preset === "filmNoise") {
            return [
                effect("noise", { amount: 0.08, seed: 7 }),
                effect("dustGrain", {
                    density: 0.12,
                    size: 0.8,
                    opacity: 0.1,
                    seed: 13,
                    color: "#ffffff",
                }),
            ];
        }

        return [
            effect("adjust", {
                brightness: 0.02,
                contrast: 0.18,
                saturation: 0.18,
                hue: 0,
            }),
        ];
    }

    function effect(id: string, params: PosterEffect["params"]): PosterEffect {
        return {
            id,
            enabled: true,
            params,
        };
    }

    function effectLabel(id: string) {
        const preset = effectPresets.value.find((item) => item.id === id);

        if (preset) {
            return preset.label;
        }

        if (id === "blur") return t.effectSoftBlur;
        if (id === "noise") return t.effectFilmNoise;
        if (id === "adjust") return t.effectPunch;
        if (id === "dustGrain") return t.effectDustGrain;

        return id;
    }
</script>

<style scoped>
.poster-panel {
    border: 1px solid var(--vp-c-divider);
}

.panel-title {
    min-height: 44px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--vp-c-divider);
    font-size: 15px;
    font-weight: 700;
}

.panel-body {
    padding: 12px;
}

.property-form {
    display: grid;
    gap: 12px;
    min-width: 0;
}

.property-section {
    display: grid;
    gap: 10px;
    padding-top: 2px;
}

.section-title {
    color: var(--vp-c-text-2);
    font-size: 12px;
    font-weight: 700;
}

.field-block {
    display: grid;
    gap: 4px;
    min-width: 0;
}

.field-label,
.slider-heading {
    color: var(--vp-c-text-2);
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0;
    line-height: 1.2;
}

.transform-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
}

.slider-field {
    display: grid;
    gap: 2px;
}

.slider-heading {
    display: flex;
    justify-content: space-between;
}

.property-slider {
    min-width: 0;
    padding-right: 12px;
}

.align-toggle {
    width: 100%;
}

.align-toggle :deep(.v-btn) {
    flex: 1 1 0;
    min-width: 0;
    height: 38px;
}

.effect-presets {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
}

.effect-preset,
.effect-item {
    display: flex;
    align-items: center;
    min-width: 0;
    min-height: 34px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    background: var(--vp-c-bg);
    color: var(--vp-c-text-1);
    font: inherit;
    font-size: 12px;
}

.effect-preset {
    justify-content: flex-start;
    gap: 6px;
    padding: 0 8px;
    cursor: pointer;
}

.effect-preset:hover {
    border-color: var(--vp-c-brand-1);
}

.effect-preset span,
.effect-row span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.effect-stack {
    display: grid;
    gap: 6px;
}

.effect-item {
    display: grid;
    align-items: stretch;
}

.effect-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 34px;
    padding: 0 6px 0 10px;
    color: var(--vp-c-text-1);
    font-size: 12px;
}

.effect-item.disabled {
    color: var(--vp-c-text-3);
}

.effect-controls {
    display: grid;
    gap: 6px;
    padding: 0 8px 8px;
    border-top: 1px solid var(--vp-c-divider);
}

.effect-control {
    display: grid;
    gap: 2px;
    min-width: 0;
    padding-top: 6px;
}

.effect-control__heading {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    color: var(--vp-c-text-2);
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0;
    line-height: 1.2;
}

.effect-slider {
    min-width: 0;
    padding-right: 12px;
}

.effect-actions {
    display: grid;
    grid-auto-flow: column;
    gap: 2px;
}

.effect-action {
    display: grid;
    width: 24px;
    height: 24px;
    place-items: center;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: var(--vp-c-text-2);
    cursor: pointer;
}

.effect-action:hover {
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
}

.lock-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    min-height: 38px;
    padding: 0 10px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    background: var(--vp-c-bg);
    color: var(--vp-c-text-1);
    font: inherit;
    font-size: 13px;
    cursor: pointer;
}

.lock-toggle[aria-pressed="true"] {
    border-color: var(--vp-c-brand-1);
    color: var(--vp-c-brand-1);
}

.lock-toggle:hover {
    background: var(--vp-c-bg-soft);
}

:deep(.v-input),
:deep(.v-field) {
    min-width: 0;
}

:deep(.v-field) {
    min-height: 38px;
    background: var(--vp-c-bg);
}

:deep(.v-field__field),
:deep(.v-field__input),
:deep(.v-select__selection) {
    align-items: center;
    min-height: 36px;
}

:deep(.v-field__input) {
    justify-content: flex-start;
    padding-top: 0;
    padding-left: 10px;
    padding-bottom: 0;
    text-align: left;
}

:deep(.v-textarea .v-field__input) {
    align-items: flex-start;
    padding-top: 8px;
    padding-bottom: 8px;
}

:deep(.v-field input),
:deep(.v-field textarea),
:deep(.v-select__selection-text) {
    text-align: left;
}

:deep(.v-select__selection) {
    margin-inline: 0;
}

:deep(.v-select .v-field__input) {
    justify-content: flex-start;
}

:deep(.v-field__append-inner) {
    align-items: center;
    padding-top: 0;
}

:deep(.color-control input[type="color"]) {
    min-height: 28px;
    padding: 0;
}

:deep(.v-label) {
    letter-spacing: 0;
}

.empty-state {
    min-height: 80px;
    color: var(--vp-c-text-2);
    font-size: 13px;
}
</style>
