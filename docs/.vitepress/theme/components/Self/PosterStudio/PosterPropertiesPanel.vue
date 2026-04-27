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
    import type { PosterLayer } from "../../../../utils/posterStudio";

    const props = defineProps<{
        layer?: PosterLayer;
    }>();

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
    });
    const blendModes = ["Normal", "Multiply", "Screen", "Overlay"];
    const textLayer = computed(() =>
        props.layer?.type === "text" ? props.layer : undefined,
    );

    function updateLayer(patch: Partial<PosterLayer>) {
        emit("updateLayer", patch);
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
