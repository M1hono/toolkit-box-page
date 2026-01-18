<!--
/**
 * @fileoverview FGO Control Panel Component
 * @component FgoControlPanel
 * @description All controls including image selection, aspect ratio, manual selection, preview, and actions
 */
-->

<template>
    <div class="control-panel">
        <div v-if="hasImages" class="control-card">
            <h3 class="card-title">{{ t.imageSelection }}</h3>
            <select
                :value="currentImageKey"
                @change="handleImageChange"
                class="full-width-select"
            >
                <option v-for="(url, key) in allImages" :key="key" :value="key">
                    {{ key }}
                </option>
            </select>
        </div>

        <div class="control-card">
            <h3 class="card-title">{{ t.aspectRatio }}</h3>
            <div class="aspect-grid">
                <button
                    v-for="ratio in aspectRatios"
                    :key="ratio"
                    :class="[
                        'aspect-btn',
                        { active: currentAspectRatio === ratio },
                    ]"
                    @click="$emit('set-aspect-ratio', ratio)"
                >
                    {{ ratio }}
                </button>
            </div>
        </div>

        <div class="control-card">
            <h3 class="card-title">{{ t.manualSelection }}</h3>
            <div class="manual-grid">
                <div class="input-group">
                    <label>X</label>
                    <input
                        type="number"
                        :value="Math.round(selection.x)"
                        @input="handleCoordChange('x', $event)"
                    />
                </div>
                <div class="input-group">
                    <label>Y</label>
                    <input
                        type="number"
                        :value="Math.round(selection.y)"
                        @input="handleCoordChange('y', $event)"
                    />
                </div>
                <div class="input-group">
                    <label>{{ t.width }}</label>
                    <input
                        type="number"
                        :value="Math.round(selection.width)"
                        @input="handleCoordChange('width', $event)"
                    />
                </div>
                <div class="input-group">
                    <label>{{ t.height }}</label>
                    <input
                        type="number"
                        :value="Math.round(selection.height)"
                        @input="handleCoordChange('height', $event)"
                    />
                </div>
            </div>
        </div>

        <div class="control-card">
            <h3 class="card-title">{{ t.preview }}</h3>
            <div class="preview-container">
                <canvas ref="previewCanvasRef"></canvas>
            </div>
        </div>

        <div class="control-card">
            <h3 class="card-title">{{ t.actions }}</h3>
            <div class="actions-grid">
                <button class="action-btn" @click="$emit('prev-diff')">
                    ‹ {{ t.prevDiff }}
                </button>
                <button class="action-btn" @click="$emit('next-diff')">
                    {{ t.nextDiff }} ›
                </button>
                <button class="action-btn" @click="$emit('toggle-color')">
                    {{ t.bgColor }}
                </button>
                <button class="action-btn primary" @click="$emit('save')">
                    {{ t.save }}
                </button>
                <button class="action-btn" @click="$emit('batch')">
                    {{ t.batch }}
                </button>
                <button
                    class="action-btn"
                    :disabled="isLocalImage"
                    @click="$emit('detect-face')"
                >
                    {{ isLocalImage ? t.onlineOnly : t.detectFace }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, nextTick } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type {
        SelectionRect,
        ColorRGBA,
    } from "../../../../utils/chara/fgo/types";

    const { t } = useSafeI18n("fgo-controls", {
        imageSelection: "Image Selection",
        aspectRatio: "Aspect Ratio",
        manualSelection: "Manual Selection",
        width: "Width",
        height: "Height",
        preview: "Preview",
        actions: "Actions",
        prevDiff: "Prev",
        nextDiff: "Next",
        bgColor: "Background",
        save: "Save",
        batch: "Batch",
        detectFace: "Detect Face",
        onlineOnly: "Online Only",
    });

    const props = defineProps<{
        allImages: Record<string, string>;
        currentImageKey: string;
        selection: SelectionRect;
        currentAspectRatio: string;
        backgroundColor: ColorRGBA;
        isLocalImage: boolean;
        currentCanvas: HTMLCanvasElement | null;
    }>();

    const emit = defineEmits<{
        "select-image": [key: string];
        "set-aspect-ratio": [ratio: string];
        "update-selection": [selection: SelectionRect];
        "prev-diff": [];
        "next-diff": [];
        "toggle-color": [];
        save: [];
        batch: [];
        "detect-face": [];
    }>();

    const previewCanvasRef = ref<HTMLCanvasElement | null>(null);
    const aspectRatios = ["custom", "1:1", "4:3", "16:9", "3:2", "5:4", "21:9"];

    const hasImages = computed(() => Object.keys(props.allImages).length > 0);

    function handleImageChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        emit("select-image", target.value);
    }

    function handleCoordChange(field: keyof SelectionRect, e: Event) {
        const target = e.target as HTMLInputElement;
        const value = parseInt(target.value) || 0;
        emit("update-selection", { ...props.selection, [field]: value });
    }

    function updatePreview() {
        if (!previewCanvasRef.value || !props.currentCanvas) return;

        const context = previewCanvasRef.value.getContext("2d", { alpha: true });
        if (!context) return;

        const offset = 2;
        const sourceX = props.selection.x + offset;
        const sourceY = props.selection.y + offset;
        const sourceWidth = props.selection.width - 2 * offset;
        const sourceHeight = props.selection.height - 2 * offset;

        const aspectRatio = sourceWidth / sourceHeight;
        const previewSize = 180;

        if (aspectRatio >= 1) {
            previewCanvasRef.value.width = previewSize;
            previewCanvasRef.value.height = previewSize / aspectRatio;
        } else {
            previewCanvasRef.value.height = previewSize;
            previewCanvasRef.value.width = previewSize * aspectRatio;
        }

        context.clearRect(
            0,
            0,
            previewCanvasRef.value.width,
            previewCanvasRef.value.height
        );

        const { r, g, b, a } = props.backgroundColor;
        context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        context.fillRect(
            0,
            0,
            previewCanvasRef.value.width,
            previewCanvasRef.value.height
        );

        context.drawImage(
            props.currentCanvas,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            previewCanvasRef.value.width,
            previewCanvasRef.value.height
        );
    }

    watch(
        () => [props.selection, props.backgroundColor, props.currentCanvas],
        () => {
            nextTick(() => updatePreview());
        },
        { deep: true }
    );

    defineExpose({
        updatePreview,
    });
</script>

<style scoped>
    .control-panel {
        width: 380px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: calc(100vh - 180px);
        overflow-y: auto;
        padding-right: 4px;
    }

    .control-panel::-webkit-scrollbar {
        width: 6px;
    }

    .control-panel::-webkit-scrollbar-track {
        background: var(--vp-c-bg-soft);
    }

    .control-panel::-webkit-scrollbar-thumb {
        background: var(--vp-c-divider);
        border-radius: 3px;
    }

    .control-card {
        background: var(--vp-c-bg);
        border: 1px solid var(--vp-c-divider);
        border-radius: 6px;
        padding: 12px;
    }

    .card-title {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--vp-c-text-1);
        margin: 0 0 10px 0;
    }

    .full-width-select {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 0.85rem;
    }

    .aspect-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
    }

    .aspect-btn {
        padding: 6px 4px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .aspect-btn:hover {
        border-color: var(--vp-c-brand-1);
    }

    .aspect-btn.active {
        background: var(--vp-c-brand-1);
        border-color: var(--vp-c-brand-1);
        color: white;
    }

    .manual-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .input-group label {
        font-size: 0.75rem;
        color: var(--vp-c-text-3);
    }

    .input-group input {
        padding: 6px 8px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 0.85rem;
    }

    .input-group input:focus {
        outline: none;
        border-color: var(--vp-c-brand-1);
    }

    .preview-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 160px;
        background: var(--vp-c-bg-soft);
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        padding: 8px;
    }

    .preview-container canvas {
        max-width: 100%;
        max-height: 180px;
        border-radius: 4px;
    }

    .actions-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }

    .action-btn {
        padding: 8px 12px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
    }

    .action-btn:hover:not(:disabled) {
        border-color: var(--vp-c-brand-1);
        color: var(--vp-c-brand-1);
    }

    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .action-btn.primary {
        background: var(--vp-c-brand-1);
        border-color: var(--vp-c-brand-1);
        color: white;
    }

    .action-btn.primary:hover {
        background: var(--vp-c-brand-2);
    }

    @media (max-width: 1200px) {
        .control-panel {
            width: 100%;
            max-height: 400px;
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
        }

        .control-card {
            flex: 0 0 320px;
        }
    }

    @media (max-width: 768px) {
        .control-panel {
            flex-direction: column;
            max-height: none;
            overflow-x: hidden;
        }

        .control-card {
            flex: none;
        }

        .aspect-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
</style>
