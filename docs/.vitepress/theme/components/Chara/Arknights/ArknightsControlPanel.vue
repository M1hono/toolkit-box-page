<!--
/**
 * @fileoverview Arknights Control Panel
 * @component ArknightsControlPanel
 * @description Selection area controls and aspect ratio settings
 */
-->

<template>
    <div class="control-panel">
        <h3 class="panel-title">{{ t.panelTitle }}</h3>

        <div class="control-section">
            <label class="section-label">{{ t.aspectRatioTitle }}</label>
            <div class="ratio-buttons">
                <button
                    v-for="ratio in ratioOptions"
                    :key="ratio.value"
                    class="ratio-btn"
                    :class="{ active: aspectRatio === ratio.value }"
                    @click="handleAspectRatioChange(ratio.value)"
                >
                    {{ ratio.label }}
                </button>
            </div>
        </div>

        <div class="control-section">
            <label class="section-label">{{ t.manualAdjustTitle }}</label>
            <div class="coords-grid">
                <div class="coord-input">
                    <label>X</label>
                    <input
                        type="number"
                        :value="Math.round(selection.x)"
                        @input="handleCoordChange('x', $event)"
                    />
                </div>
                <div class="coord-input">
                    <label>Y</label>
                    <input
                        type="number"
                        :value="Math.round(selection.y)"
                        @input="handleCoordChange('y', $event)"
                    />
                </div>
                <div class="coord-input">
                    <label>{{ t.widthLabel }}</label>
                    <input
                        type="number"
                        :value="Math.round(selection.width)"
                        @input="handleCoordChange('width', $event)"
                    />
                </div>
                <div class="coord-input">
                    <label>{{ t.heightLabel }}</label>
                    <input
                        type="number"
                        :value="Math.round(selection.height)"
                        @input="handleCoordChange('height', $event)"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted, nextTick } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type {
        SelectionRect,
        CanvasSize,
    } from "../../../../utils/chara/arknights/types";

    const { t } = useSafeI18n("arknights-controls", {
        panelTitle: "Settings",
        aspectRatioTitle: "Aspect Ratio",
        aspectRatioFree: "Free",
        manualAdjustTitle: "Selection Area",
        widthLabel: "W",
        heightLabel: "H",
    });

    const props = defineProps<{
        selection: SelectionRect;
        aspectRatio: string;
        canvasSize: CanvasSize;
        currentImage?: HTMLImageElement | null;
        backgroundColor?: string;
    }>();

    const emit = defineEmits<{
        "update:selection": [value: SelectionRect];
        "update:aspectRatio": [value: string];
    }>();

    const ratioOptions = computed(() => [
        { label: t.aspectRatioFree, value: "free" },
        { label: "1:1", value: "1:1" },
        { label: "4:3", value: "4:3" },
        { label: "16:9", value: "16:9" },
    ]);

    function handleAspectRatioChange(value: string) {
        emit("update:aspectRatio", value);
    }

    function handleCoordChange(field: keyof SelectionRect, e: Event) {
        const target = e.target as HTMLInputElement;
        const value = Math.max(
            0,
            Math.min(
                parseInt(target.value) || 0,
                field === "x" || field === "width"
                    ? props.canvasSize.width
                    : props.canvasSize.height
            )
        );
        emit("update:selection", { ...props.selection, [field]: value });
    }
</script>

<style scoped>
    .control-panel {
        background: var(--vp-c-bg);
        border: 1px solid var(--vp-c-divider);
        border-radius: 8px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .panel-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--vp-c-text-1);
        margin: 0;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--vp-c-divider);
    }

    .control-section {
        flex-shrink: 0;
    }

    .control-section:last-child {
        margin-bottom: 0;
    }

    .section-label {
        display: block;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--vp-c-text-2);
        margin-bottom: 10px;
    }

    .ratio-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .ratio-btn {
        flex: 1;
        min-width: 60px;
        padding: 8px 12px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-2);
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .ratio-btn:hover {
        border-color: var(--vp-c-brand-1);
        color: var(--vp-c-brand-1);
    }

    .ratio-btn.active {
        background: var(--vp-c-brand-1);
        border-color: var(--vp-c-brand-1);
        color: white;
    }

    .coords-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }

    .coord-input {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .coord-input label {
        font-size: 0.75rem;
        color: var(--vp-c-text-3);
        font-weight: 500;
    }

    .coord-input input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 0.9rem;
    }

    .coord-input input:focus {
        outline: none;
        border-color: var(--vp-c-brand-1);
    }

    @media (max-width: 768px) {
        .control-panel {
            padding: 16px;
        }
    }
</style>
