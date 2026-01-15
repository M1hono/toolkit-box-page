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
                @touchstart="handleMouseDown"
                @touchmove="handleMouseMove"
                @touchend="handleMouseUp"
                :style="{ cursor: currentCursor }"
            ></canvas>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, nextTick } from "vue";
    import type { SelectionRect } from "../../../../utils/chara/fgo/types";

    const props = defineProps<{
        diffImages: HTMLCanvasElement[];
        currentDiffIndex: number;
        selection: SelectionRect;
        isSelecting: boolean;
        isResizing: boolean;
        resizeDirection: string;
        getResizeDirection: (x: number, y: number) => string;
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

    const currentCursor = computed(() => {
        if (props.isSelecting || props.isResizing) {
            return "crosshair";
        }

        const cursorMap: Record<string, string> = {
            nw: "nw-resize",
            ne: "ne-resize",
            sw: "sw-resize",
            se: "se-resize",
            n: "n-resize",
            s: "s-resize",
            w: "w-resize",
            e: "e-resize",
        };

        return cursorMap[props.resizeDirection] || "crosshair";
    });

    function getCanvasCoords(event: MouseEvent | TouchEvent): {
        x: number;
        y: number;
    } {
        if (!canvasRef.value) return { x: 0, y: 0 };

        const rect = canvasRef.value.getBoundingClientRect();
        const { clientX, clientY } =
            event instanceof TouchEvent ? event.touches[0] : event;

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
        if (!props.isSelecting && !props.isResizing) {
            const coords = getCanvasCoords(event);
            props.getResizeDirection(coords.x, coords.y);
        } else {
            const coords = getCanvasCoords(event);
            emit("update-selection", coords.x, coords.y);
            draw();
        }
    }

    function handleMouseUp() {
        emit("end-selection");
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
        props.drawSelectionBox(ctx, props.selection);
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
        min-width: 600px;
        background: var(--vp-c-bg);
        padding: 24px;
        border-radius: 8px;
        border: 1px solid var(--vp-c-divider);
    }

    .canvas-container {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    canvas {
        max-width: 100%;
        max-height: 100%;
        border-radius: 8px;
        border: 2px solid var(--vp-c-divider);
        cursor: crosshair;
        transition: border-color 0.2s ease;
    }

    canvas:hover {
        border-color: var(--vp-c-brand-1);
    }

    @media (max-width: 1200px) {
        .workspace {
            min-width: auto;
        }
    }

    @media (max-width: 768px) {
        .workspace {
            padding: 16px;
        }

        canvas {
            max-width: 95%;
        }
    }
</style>
