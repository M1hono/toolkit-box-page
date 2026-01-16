<!--
/**
 * @fileoverview FGO Workspace Component
 * @component FgoWorkspace
 * @description Main canvas workspace with selection and preview
 */
-->

<template>
    <div class="workspace">
        <div class="canvas-container">
            <canvas
                ref="canvasRef"
                width="1024"
                height="768"
                @mousedown="handleMouseDown"
                @mousemove="handleMouseMove"
                @mouseup="handleMouseUp"
                @mouseleave="handleMouseUp"
                @touchstart.prevent="handleMouseDown"
                @touchmove.prevent="handleMouseMove"
                @touchend="handleMouseUp"
            ></canvas>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch, nextTick } from "vue";
    import type { SelectionRect } from "../../../../utils/chara/fgo/types";

    const props = defineProps<{
        diffImages: HTMLCanvasElement[];
        currentDiffIndex: number;
        selection: SelectionRect;
        tempSelection: SelectionRect;
        isSelecting: boolean;
        isResizing: boolean;
        getResizeDirection: (x: number, y: number, sel?: SelectionRect) => string;
        getCursorForDirection: (direction: string) => string;
        drawSelectionBox: (
            ctx: CanvasRenderingContext2D,
            selection: SelectionRect
        ) => void;
    }>();

    const emit = defineEmits<{
        "start-selection": [x: number, y: number];
        "update-selection": [x: number, y: number];
        "end-selection": [];
        "canvas-ready": [canvas: HTMLCanvasElement];
        draw: [];
    }>();

    const canvasRef = ref<HTMLCanvasElement | null>(null);

    function getCanvasCoords(event: MouseEvent | TouchEvent): {
        x: number;
        y: number;
    } {
        if (!canvasRef.value) return { x: 0, y: 0 };

        const rect = canvasRef.value.getBoundingClientRect();
        const clientX = event instanceof TouchEvent ? event.touches[0]?.clientX ?? 0 : event.clientX;
        const clientY = event instanceof TouchEvent ? event.touches[0]?.clientY ?? 0 : event.clientY;

        const scaleX = canvasRef.value.width / rect.width;
        const scaleY = canvasRef.value.height / rect.height;

        return {
            x: Math.floor((clientX - rect.left) * scaleX),
            y: Math.floor((clientY - rect.top) * scaleY),
        };
    }

    function handleMouseDown(event: MouseEvent | TouchEvent) {
        const coords = getCanvasCoords(event);
        emit("start-selection", coords.x, coords.y);
        if (event instanceof TouchEvent) event.preventDefault();
    }

    function handleMouseMove(event: MouseEvent | TouchEvent) {
            const coords = getCanvasCoords(event);
        
        if (props.isSelecting || props.isResizing) {
            emit("update-selection", coords.x, coords.y);
            draw();
        } else {
            const direction = props.getResizeDirection(coords.x, coords.y, props.selection);
            if (canvasRef.value) {
                canvasRef.value.style.cursor = props.getCursorForDirection(direction);
            }
        }
    }

    function handleMouseUp() {
        emit("end-selection");
        if (canvasRef.value) {
            canvasRef.value.style.cursor = 'crosshair';
        }
    }

    function draw() {
        const canvas = canvasRef.value;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const frame = props.diffImages?.[props.currentDiffIndex];
        if (!frame) return;

        ctx.drawImage(frame, 0, 0);
        
        const selToDraw = (props.isSelecting || props.isResizing) 
            ? props.tempSelection 
            : props.selection;
        props.drawSelectionBox(ctx, selToDraw);
        emit("draw");
    }

    watch(
        () => canvasRef.value,
        (canvas) => {
            if (canvas) emit("canvas-ready", canvas);
        },
        { immediate: true }
    );

    watch(
        () => props.diffImages,
        () => {
            nextTick(() => draw());
        },
        { deep: true }
    );

    watch(
        () => props.currentDiffIndex,
        () => {
            nextTick(() => draw());
        }
    );

    watch(
        () => props.selection,
        () => nextTick(() => draw()),
        { deep: true }
    );

    defineExpose({
        canvasRef,
        draw,
    });
</script>

<style scoped>
    .workspace {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        background: var(--vp-c-bg);
        padding: 16px;
        border-radius: 8px;
        border: 1px solid var(--vp-c-divider);
        box-sizing: border-box;
        overflow: hidden;
    }

    .canvas-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 100%;
    }

    canvas {
        max-width: 100%;
        max-height: 100%;
        border-radius: 8px;
        border: 2px solid var(--vp-c-divider);
        cursor: crosshair;
        transition: border-color 0.2s ease;
        display: block;
    }

    canvas:hover {
        border-color: var(--vp-c-brand-1);
    }

    @media (max-width: 640px) {
        .workspace {
            padding: 12px;
        }
    }
</style>
