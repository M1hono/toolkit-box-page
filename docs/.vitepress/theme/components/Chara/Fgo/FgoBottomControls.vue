<!--
/**
 * @fileoverview FGO Bottom Controls Component
 * @component FgoBottomControls
 * @description Controls that should appear below the canvas on mobile (bg, preview, actions)
 */
-->

<template>
    <div class="bottom-controls">
        <div class="card">
            <div class="row">
                <div class="card-title">{{ t.background }}</div>
                <input
                    class="color"
                    type="color"
                    :value="bgColorHex"
                    @input="onBgColor"
                />
            </div>
            <div class="hint">{{ t.bgHint }}</div>
        </div>

        <div class="card">
            <div class="card-title">{{ t.preview }}</div>
            <div class="preview">
                <canvas ref="previewCanvasRef"></canvas>
            </div>
        </div>

        <div class="card">
            <div class="card-title">{{ t.actions }}</div>
            <div class="actions">
                <button
                    class="btn"
                    @click="handlePrevDiff"
                    :disabled="!hasDiffs"
                >
                    ‹ {{ t.prev }}
                </button>
                <button
                    class="btn"
                    @click="handleNextDiff"
                    :disabled="!hasDiffs"
                >
                    {{ t.next }} ›
                </button>
                <button class="btn" @click="$emit('save')" :disabled="!canSave">
                    {{ t.save }}
                </button>
                <button class="btn" @click="$emit('copy')" :disabled="!canCopy">
                    {{ t.copy }}
                </button>
                <button
                    class="btn"
                    @click="$emit('batch')"
                    :disabled="!canBatch"
                >
                    {{ t.batch }}
                </button>
                <button
                    class="btn"
                    @click="$emit('detect-face')"
                    :disabled="isLocalImage || !hasDiffs"
                >
                    {{ isLocalImage ? t.onlineOnly : t.detectFace }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch, nextTick, computed } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type {
        ColorRGBA,
        SelectionRect,
    } from "../../../../utils/chara/fgo/types";

    const { t } = useSafeI18n("fgo-bottom-controls", {
        background: "Background",
        bgHint: "Applied to preview/export",
        preview: "Preview",
        actions: "Actions",
        prev: "Prev",
        next: "Next",
        save: "Save",
        copy: "Copy",
        batch: "Batch",
        detectFace: "Detect Face",
        onlineOnly: "Online Only",
    });

    const props = defineProps<{
        bgColorHex: string;
        backgroundColor: ColorRGBA;
        selection: SelectionRect;
        currentCanvas: HTMLCanvasElement | null;
        hasDiffs: boolean;
        isLocalImage: boolean;
        canSave: boolean;
        canBatch: boolean;
        canCopy: boolean;
        drawPreview: (
            preview: HTMLCanvasElement,
            source: HTMLCanvasElement,
            selection: SelectionRect,
            bg: ColorRGBA
        ) => void;
    }>();

    const emit = defineEmits<{
        "update-bg": [hex: string];
        "prev-diff": [];
        "next-diff": [];
        save: [];
        copy: [];
        batch: [];
        "detect-face": [];
    }>();

    const previewCanvasRef = ref<HTMLCanvasElement | null>(null);

    function onBgColor(e: Event) {
        const el = e.target as HTMLInputElement;
        emit("update-bg", el.value || "#ffffff");
    }

    const canDrawPreview = computed(
        () => !!(previewCanvasRef.value && props.currentCanvas)
    );

    async function refreshPreview() {
        if (
            !canDrawPreview.value ||
            !previewCanvasRef.value ||
            !props.currentCanvas
        )
            return;
        props.drawPreview(
            previewCanvasRef.value,
            props.currentCanvas,
            props.selection,
            props.backgroundColor
        );
    }

    function handlePrevDiff() {
        emit("prev-diff");
        nextTick(() => refreshPreview());
    }

    function handleNextDiff() {
        emit("next-diff");
        nextTick(() => refreshPreview());
    }

    watch(
        () => [
            props.bgColorHex,
            props.backgroundColor,
            props.selection,
            props.currentCanvas,
            props.hasDiffs,
        ],
        () => nextTick(() => refreshPreview()),
        { deep: true, immediate: true }
    );
</script>

<style scoped>
    .bottom-controls {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .card {
        background: var(--vp-c-bg);
        border: 1px solid var(--vp-c-divider);
        border-radius: 10px;
        padding: 12px;
    }

    .card-title {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--vp-c-text-1);
    }

    .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }

    .hint {
        margin-top: 6px;
        font-size: 0.78rem;
        color: var(--vp-c-text-3);
    }

    .color {
        width: 52px;
        height: 34px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 8px;
        background: transparent;
        cursor: pointer;
    }

    .preview {
        margin-top: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 170px;
        background: var(--vp-c-bg-soft);
        border: 1px solid var(--vp-c-divider);
        border-radius: 10px;
        padding: 10px;
    }

    .preview canvas {
        max-width: 100%;
        max-height: 180px;
        border-radius: 8px;
    }

    .actions {
        margin-top: 10px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
    }

    .actions button:nth-child(5),
    .actions button:nth-child(6) {
        grid-column: span 1;
    }

    .btn {
        padding: 10px 12px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 10px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .btn:hover:not(:disabled) {
        border-color: var(--vp-c-brand-1);
        color: var(--vp-c-brand-1);
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 640px) {
        .actions {
            grid-template-columns: 1fr;
        }
    }
</style>
