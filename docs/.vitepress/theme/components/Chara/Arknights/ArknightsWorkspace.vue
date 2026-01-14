<!--
/**
 * @fileoverview Arknights Chara Workspace  
 * @component ArknightsWorkspace
 * @description Canvas workspace with draggable selection
 */
-->

<template>
    <div class="workspace-panel">
        <div class="workspace-header">
            <div class="header-main">
                <div class="header-left">
                    <h2 class="character-name">{{ character?.displayName || t.noSelection }}</h2>
                    <span v-if="character" class="variant-counter">
                        {{ currentVariantIndex + 1 }} / {{ character.validVariants.length }}
                    </span>
                </div>
                
                <div v-if="character" class="header-actions">
                    <button 
                        class="btn btn-icon" 
                        :disabled="currentVariantIndex <= 0"
                        @click="$emit('prev-variant')"
                    >‹</button>
                    <button 
                        class="btn btn-icon"
                        :disabled="currentVariantIndex >= character.validVariants.length - 1"
                        @click="$emit('next-variant')"
                    >›</button>
                    <button class="btn btn-primary" @click="$emit('download')">
                        {{ t.download }}
                    </button>
                    <button class="btn btn-secondary" @click="$emit('copy')">
                        {{ t.copy }}
                    </button>
                    <button class="btn btn-secondary" @click="$emit('batch')">
                        {{ t.batch }}
                    </button>
                </div>
            </div>

            <div v-if="character?.speakerNames && character.speakerNames.length > 1" class="names-box">
                <div class="names-label">{{ t.allNames }}</div>
                <div class="names-scroll">
                    <span v-for="(name, idx) in character.speakerNames" :key="idx" class="name-badge">
                        {{ name }}
                    </span>
                </div>
            </div>
        </div>

        <div v-if="character" class="workspace-toolbar">
            <select 
                class="variant-select"
                :value="variant"
                @change="handleVariantSelect"
            >
                <option v-for="(v, i) in character.validVariants" :key="v" :value="v">
                    {{ i + 1 }}. {{ v }}
                </option>
            </select>

            <div class="toolbar-actions">
                <button class="btn btn-tool" @click="$emit('detect-face')">
                    {{ t.detectFace }}
                </button>
                <button class="btn btn-tool" @click="$emit('reset-selection')">
                    {{ t.reset }}
                </button>
                <button class="btn btn-tool" @click="$emit('download-crop')">
                    {{ t.downloadCrop }}
                </button>
                <button class="btn btn-tool" @click="$emit('copy-crop')">
                    {{ t.copyCrop }}
                </button>
            </div>
        </div>

        <div v-if="character" class="preview-bar">
            <span class="preview-label">{{ t.preview }}</span>
            <canvas ref="previewCanvas" class="preview-canvas"></canvas>
            <span class="preview-size">{{ Math.round(selection.width) }}×{{ Math.round(selection.height) }}</span>
        </div>

        <div class="canvas-area" ref="canvasAreaRef" :style="{ background: backgroundColor }">
            <div v-if="isLoading" class="canvas-state">
                <div class="spinner"></div>
                <span>{{ t.loading }}</span>
            </div>
            
            <div v-else-if="!currentImage" class="canvas-state">
                <span>{{ t.noImage }}</span>
            </div>

            <canvas
                v-show="!isLoading && currentImage"
                ref="canvasRef"
                class="main-canvas"
                @mousedown="handleMouseDown"
                @mousemove="handleMouseMove"
                @mouseup="handleMouseUp"
                @mouseleave="handleMouseUp"
            ></canvas>
        </div>

        <div v-if="character" class="canvas-footer">
            <label class="color-label">{{ t.bgColor }}</label>
            <input 
                type="color" 
                :value="backgroundColor"
                @input="handleColorChange"
                class="color-input"
            />
            <span class="color-value">{{ backgroundColor }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useSafeI18n } from '../../../../utils/i18n/locale';
import { useArknightsSelection } from '../../../../utils/chara/arknights/core/useArknightsSelection';
import type { UnifiedCharacterData, SelectionRect, CanvasSize } from '../../../../utils/chara/arknights/types';

const { t } = useSafeI18n('arknights-workspace', {
    detectFace: "Detect Face",
    reset: "Reset",
    download: "Download Full",
    copy: "Copy Full",
    batch: "Batch",
    downloadCrop: "Download Crop",
    copyCrop: "Copy Crop",
    loading: "Loading...",
    noSelection: "No character selected",
    noImage: "No image",
    bgColor: "Background",
    preview: "Preview",
    allNames: "All Names:",
});

const props = defineProps<{
    character: UnifiedCharacterData | null;
    variant: string;
    currentImage: HTMLImageElement | null;
    canvasSize: CanvasSize;
    isLoading: boolean;
    selection: SelectionRect;
    aspectRatio: string;
    backgroundColor: string;
}>();

const emit = defineEmits<{
    'update:variant': [value: string];
    'update:selection': [value: SelectionRect];
    'update:backgroundColor': [value: string];
    'prev-variant': [];
    'next-variant': [];
    'detect-face': [];
    'reset-selection': [];
    'download': [];
    'download-crop': [];
    'copy': [];
    'copy-crop': [];
    'batch': [];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasAreaRef = ref<HTMLElement | null>(null);
const previewCanvas = ref<HTMLCanvasElement | null>(null);

const {
    isSelecting,
    isResizing,
    tempSelection,
    getResizeDirection,
    getCursorForDirection,
    startInteraction,
    updateInteraction,
    endInteraction
} = useArknightsSelection();

const currentVariantIndex = computed(() => {
    if (!props.character) return -1;
    return props.character.validVariants.indexOf(props.variant);
});

function handleVariantSelect(e: Event) {
    const target = e.target as HTMLSelectElement;
    emit('update:variant', target.value);
}

function handleColorChange(e: Event) {
    const target = e.target as HTMLInputElement;
    emit('update:backgroundColor', target.value);
}

function updatePreview() {
    const canvas = previewCanvas.value;
    if (!canvas || !props.currentImage) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const maxSize = 120;
    const aspectRatio = props.selection.width / props.selection.height;
    
    if (aspectRatio >= 1) {
        canvas.width = maxSize;
        canvas.height = maxSize / aspectRatio;
    } else {
        canvas.height = maxSize;
        canvas.width = maxSize * aspectRatio;
    }
    
    ctx.fillStyle = props.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const scaleX = props.currentImage.width / props.canvasSize.width;
    const scaleY = props.currentImage.height / props.canvasSize.height;
    
    try {
        ctx.drawImage(
            props.currentImage,
            props.selection.x * scaleX,
            props.selection.y * scaleY,
            props.selection.width * scaleX,
            props.selection.height * scaleY,
            0, 0,
            canvas.width,
            canvas.height
        );
    } catch (error) {
        console.error('Preview draw error:', error);
    }
}

function drawCanvas() {
    const canvas = canvasRef.value;
    const img = props.currentImage;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = props.canvasSize.width;
    canvas.height = props.canvasSize.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    drawSelection(ctx);
    updatePreview();
}

function drawSelection(ctx: CanvasRenderingContext2D) {
    const s = isSelecting.value || isResizing.value ? tempSelection.value : props.selection;
    if (s.width <= 0 || s.height <= 0) return;

    const brandColor = getComputedStyle(document.documentElement).getPropertyValue('--vp-c-brand-1').trim() || '#409EFF';
    
    ctx.strokeStyle = brandColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(s.x, s.y, s.width, s.height);
    ctx.setLineDash([]);

    ctx.fillStyle = brandColor;
    const handleSize = 8;
    const handles = [
        [s.x, s.y],
        [s.x + s.width, s.y],
        [s.x, s.y + s.height],
        [s.x + s.width, s.y + s.height],
        [s.x + s.width / 2, s.y],
        [s.x + s.width / 2, s.y + s.height],
        [s.x, s.y + s.height / 2],
        [s.x + s.width, s.y + s.height / 2],
    ];
    handles.forEach(([hx, hy]) => {
        ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
    });
}

function getCanvasCoords(e: MouseEvent) {
    const canvas = canvasRef.value;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function handleMouseDown(e: MouseEvent) {
    const coords = getCanvasCoords(e);
    startInteraction(coords.x, coords.y, props.selection);
}

function handleMouseMove(e: MouseEvent) {
    const coords = getCanvasCoords(e);
    
    if (isSelecting.value || isResizing.value) {
        updateInteraction(coords.x, coords.y, props.aspectRatio);
        drawCanvas();
    } else {
        const direction = getResizeDirection(coords.x, coords.y, props.selection);
        if (canvasRef.value) {
            canvasRef.value.style.cursor = getCursorForDirection(direction);
        }
    }
}

function handleMouseUp() {
    const result = endInteraction();
    if (result) {
        emit('update:selection', result);
    }
    if (canvasRef.value) {
        canvasRef.value.style.cursor = 'crosshair';
    }
}

watch(() => props.currentImage, () => {
    nextTick(() => drawCanvas());
}, { immediate: true });

watch(() => [props.selection, props.backgroundColor], () => {
    if (props.currentImage) drawCanvas();
}, { deep: true });

onMounted(() => {
    window.addEventListener('resize', () => {
        if (props.currentImage) drawCanvas();
    });
    if (previewCanvas.value) {
        previewCanvas.value.width = 120;
        previewCanvas.value.height = 120;
    }
});
</script>

<style scoped>
.workspace-panel {
    background: var(--vp-c-bg);
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.workspace-header {
    display: flex;
    flex-direction: column;
    padding: 16px 20px;
    border-bottom: 1px solid var(--vp-c-divider);
    gap: 12px;
    flex-shrink: 0;
}

.header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.character-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--vp-c-text-1);
    margin: 0;
}

.names-box {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 12px;
    background: var(--vp-c-bg-soft);
    border: 1px solid var(--vp-c-divider);
    border-radius: 6px;
}

.names-label {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--vp-c-text-2);
    flex-shrink: 0;
}

.names-scroll {
    flex: 1;
    display: flex;
    gap: 6px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 2px 0;
    scrollbar-width: thin;
}

.names-scroll::-webkit-scrollbar {
    height: 4px;
}

.names-scroll::-webkit-scrollbar-track {
    background: var(--vp-c-bg);
    border-radius: 2px;
}

.names-scroll::-webkit-scrollbar-thumb {
    background: var(--vp-c-divider);
    border-radius: 2px;
}

.name-badge {
    font-size: 0.75rem;
    color: var(--vp-c-text-1);
    padding: 4px 10px;
    background: var(--vp-c-bg);
    border: 1px solid var(--vp-c-divider);
    border-radius: 12px;
    white-space: nowrap;
    flex-shrink: 0;
}

.variant-counter {
    font-size: 0.8rem;
    color: var(--vp-c-text-3);
    background: var(--vp-c-bg-soft);
    padding: 2px 8px;
    border-radius: 4px;
}

.header-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.workspace-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: var(--vp-c-bg-soft);
    border-bottom: 1px solid var(--vp-c-divider);
    flex-wrap: wrap;
    gap: 12px;
    flex-shrink: 0;
}

.preview-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: var(--vp-c-bg);
    border-bottom: 1px solid var(--vp-c-divider);
    flex-shrink: 0;
}

.preview-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--vp-c-text-2);
}

.preview-canvas {
    max-width: 120px;
    max-height: 120px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    background: var(--vp-c-bg);
}

.preview-size {
    font-size: 0.75rem;
    color: var(--vp-c-text-3);
    font-family: monospace;
    margin-left: auto;
}

.variant-select {
    min-width: 240px;
    padding: 8px 12px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    background: var(--vp-c-bg);
    color: var(--vp-c-text-1);
    font-size: 0.9rem;
    cursor: pointer;
}

.variant-select:focus {
    outline: none;
    border-color: var(--vp-c-brand-1);
}

.toolbar-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.btn {
    padding: 8px 16px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    background: var(--vp-c-bg);
    color: var(--vp-c-text-1);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
}

.btn:hover:not(:disabled) {
    border-color: var(--vp-c-brand-1);
    color: var(--vp-c-brand-1);
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-icon {
    width: 36px;
    padding: 8px;
    font-size: 1.25rem;
    font-weight: 700;
}

.btn-primary {
    background: var(--vp-c-brand-1);
    border-color: var(--vp-c-brand-1);
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: var(--vp-c-brand-2);
    color: white;
}

.btn-secondary {
    background: var(--vp-c-bg-soft);
}

.btn-tool {
    background: var(--vp-c-bg);
}

.canvas-area {
    flex: 1;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s ease;
    min-height: 0;
}

.canvas-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: var(--vp-c-text-3);
}

.spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--vp-c-divider);
    border-top-color: var(--vp-c-brand-1);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.main-canvas {
    max-width: 100%;
    max-height: 100%;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
}

.canvas-footer {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    border-top: 1px solid var(--vp-c-divider);
    background: var(--vp-c-bg-soft);
    flex-shrink: 0;
}

.color-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--vp-c-text-2);
}

.color-input {
    width: 48px;
    height: 36px;
    padding: 0;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    cursor: pointer;
}

.color-input::-webkit-color-swatch-wrapper {
    padding: 2px;
}

.color-input::-webkit-color-swatch {
    border-radius: 2px;
    border: none;
}

.color-value {
    font-size: 0.85rem;
    font-family: monospace;
    color: var(--vp-c-text-2);
}

@media (max-width: 768px) {
    .workspace-header,
    .workspace-toolbar,
    .canvas-footer,
    .preview-bar {
        padding: 12px 16px;
    }

    .variant-select {
        min-width: 100%;
    }

    .header-actions {
        width: 100%;
    }

    .btn {
        padding: 6px 12px;
        font-size: 0.8rem;
    }
}
</style>
