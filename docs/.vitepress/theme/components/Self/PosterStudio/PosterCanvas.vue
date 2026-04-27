<template>
    <div class="canvas-wrap">
        <div class="canvas-toolbar">
            <v-chip size="small" variant="outlined">
                {{ props.document.canvas.width }} x {{ props.document.canvas.height }}
            </v-chip>
            <v-chip size="small" variant="outlined">
                {{ t.zoom }} {{ Math.round(canvasScale * 100) }}%
            </v-chip>
        </div>

        <div ref="boardRef" class="canvas-board">
            <v-stage
                :config="stageConfig"
                class="konva-stage"
                @mousedown="handleStagePointer"
                @mouseup="isDrawing = false"
                @touchstart="handleStagePointer"
                @touchend="isDrawing = false"
            >
                <v-layer>
                    <v-group :config="viewportConfig">
                        <v-rect :config="backgroundConfig" />
                        <v-rect :config="canvasGuideConfig" />

                        <template v-for="layer in props.document.layers" :key="layer.id">
                            <v-image
                                v-if="isImageLikeLayer(layer)"
                                :ref="(node) => setLayerNode(layer.id, node)"
                                :config="imageConfig(layer)"
                                @click="handleLayerPointer(layer.id, $event)"
                                @tap="handleLayerPointer(layer.id, $event)"
                                @mousedown="handleLayerPointer(layer.id, $event)"
                                @touchstart="handleLayerPointer(layer.id, $event)"
                                @mousemove="handleToolDrag(layer.id, $event)"
                                @touchmove="handleToolDrag(layer.id, $event)"
                                @dragstart="handleImageDragStart(layer.id, $event)"
                                @dragend="handleDragEnd(layer.id, $event)"
                                @transformend="handleTransformEnd(layer.id)"
                            />
                            <v-text
                                v-else-if="layer.type === 'text'"
                                :ref="(node) => setLayerNode(layer.id, node)"
                                :config="textConfig(layer)"
                                @click="handleLayerPointer(layer.id, $event)"
                                @tap="handleLayerPointer(layer.id, $event)"
                                @dragend="handleDragEnd(layer.id, $event)"
                                @transformend="handleTransformEnd(layer.id)"
                            />
                            <v-ellipse
                                v-else-if="layer.type === 'shape' && layer.shape === 'ellipse'"
                                :ref="(node) => setLayerNode(layer.id, node)"
                                :config="ellipseConfig(layer)"
                                @click="handleLayerPointer(layer.id, $event)"
                                @tap="handleLayerPointer(layer.id, $event)"
                                @dragend="handleDragEnd(layer.id, $event)"
                                @transformend="handleTransformEnd(layer.id)"
                            />
                            <v-rect
                                v-else-if="layer.type === 'shape'"
                                :ref="(node) => setLayerNode(layer.id, node)"
                                :config="shapeRectConfig(layer)"
                                @click="handleLayerPointer(layer.id, $event)"
                                @tap="handleLayerPointer(layer.id, $event)"
                                @dragend="handleDragEnd(layer.id, $event)"
                                @transformend="handleTransformEnd(layer.id)"
                            />
                        </template>

                        <v-transformer
                            ref="transformerRef"
                            :config="transformerConfig"
                        />
                    </v-group>
                </v-layer>
            </v-stage>
        </div>
    </div>
</template>

<script setup lang="ts">
    import {
        computed,
        nextTick,
        onBeforeUnmount,
        onMounted,
        reactive,
        ref,
        watch,
    } from "vue";
    import {
        Group as VGroup,
        Image as VImage,
        Ellipse as VEllipse,
        Layer as VLayer,
        Rect as VRect,
        Stage as VStage,
        Text as VText,
        Transformer as VTransformer,
    } from "vue-konva";

    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import { updateLayer } from "../../../../utils/posterStudio/document";
    import type {
        PosterDocument,
        PosterFrameLayer,
        PosterIconLayer,
        PosterImageLayer,
        PosterLayer,
        PosterShapeLayer,
        PosterTextLayer,
    } from "../../../../utils/posterStudio/types";

    type PosterCanvasTool = "select" | "magicWand" | "pixelEraser";
    type RasterLayer = PosterImageLayer | PosterFrameLayer | PosterIconLayer;

    const props = defineProps<{
        document: PosterDocument;
        selectedLayerId?: string;
        activeTool: PosterCanvasTool;
        eraserSize: number;
        wandTolerance: number;
    }>();
    const { t } = useSafeI18n("poster-studio-canvas", {
        zoom: "Zoom",
    });

    const emit = defineEmits<{
        "update:document": [document: PosterDocument];
        "update:selectedLayerId": [id: string | undefined];
    }>();

    const transformerRef = ref<any>();
    const boardRef = ref<HTMLElement>();
    const canvasScale = ref(1);
    let resizeObserver: ResizeObserver | undefined;
    const isDrawing = ref(false);
    const layerNodes = new Map<string, any>();
    const imageElements = reactive<Record<string, HTMLImageElement>>({});
    const imageHitCanvases = new Map<string, HTMLCanvasElement>();

    const stageConfig = computed(() => ({
        width: Math.round(props.document.canvas.width * canvasScale.value),
        height: Math.round(props.document.canvas.height * canvasScale.value),
    }));

    const viewportConfig = computed(() => ({
        x: 0,
        y: 0,
        scaleX: canvasScale.value,
        scaleY: canvasScale.value,
    }));

    const backgroundConfig = computed(() => ({
        x: 0,
        y: 0,
        width: props.document.canvas.width,
        height: props.document.canvas.height,
        fill: "#f4f4f4",
        listening: false,
    }));

    const canvasGuideConfig = computed(() => ({
        x: 0,
        y: 0,
        width: props.document.canvas.width,
        height: props.document.canvas.height,
        stroke: "#c9c9c9",
        strokeWidth: 1,
        listening: false,
    }));

    const transformerConfig = {
        rotateEnabled: true,
        enabledAnchors: [
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "middle-left",
            "middle-right",
        ],
        anchorSize: 8,
        borderStroke: "#2f6fed",
        anchorStroke: "#2f6fed",
        anchorFill: "#ffffff",
    };

    function textConfig(layer: PosterLayer) {
        const textLayer = layer as PosterTextLayer;

        return {
            x: textLayer.x,
            y: textLayer.y,
            width: textLayer.width,
            height: textLayer.height,
            scaleX: textLayer.scaleX,
            scaleY: textLayer.scaleY,
            rotation: textLayer.rotation,
            opacity: textLayer.opacity,
            visible: textLayer.visible,
            draggable: !textLayer.locked,
            text: textLayer.text,
            fontFamily: textLayer.fontFamily,
            fontSize: textLayer.fontSize,
            fill: textLayer.color,
            align: textLayer.align,
        };
    }

    function imageConfig(layer: PosterLayer) {
        const imageLayer = layer as RasterLayer;

        return {
            x: imageLayer.x,
            y: imageLayer.y,
            width: imageLayer.width,
            height: imageLayer.height,
            scaleX: imageLayer.scaleX,
            scaleY: imageLayer.scaleY,
            rotation: imageLayer.rotation,
            opacity: imageLayer.opacity,
            visible: imageLayer.visible,
            draggable: !imageLayer.locked && props.activeTool === "select",
            image: imageElements[imageLayer.id],
        };
    }

    function shapeRectConfig(layer: PosterLayer) {
        const shapeLayer = layer as PosterShapeLayer;

        return {
            x: shapeLayer.x,
            y: shapeLayer.y,
            width: shapeLayer.width,
            height: shapeLayer.height,
            scaleX: shapeLayer.scaleX,
            scaleY: shapeLayer.scaleY,
            rotation: shapeLayer.rotation,
            opacity: shapeLayer.opacity,
            visible: shapeLayer.visible,
            draggable: !shapeLayer.locked,
            fill: shapeLayer.fill,
            stroke: shapeLayer.stroke,
            strokeWidth: shapeLayer.strokeWidth,
        };
    }

    function ellipseConfig(layer: PosterLayer) {
        const shapeLayer = layer as PosterShapeLayer;

        return {
            x: shapeLayer.x + shapeLayer.width / 2,
            y: shapeLayer.y + shapeLayer.height / 2,
            radiusX: shapeLayer.width / 2,
            radiusY: shapeLayer.height / 2,
            scaleX: shapeLayer.scaleX,
            scaleY: shapeLayer.scaleY,
            rotation: shapeLayer.rotation,
            opacity: shapeLayer.opacity,
            visible: shapeLayer.visible,
            draggable: !shapeLayer.locked,
            fill: shapeLayer.fill,
            stroke: shapeLayer.stroke,
            strokeWidth: shapeLayer.strokeWidth,
        };
    }

    function isImageLikeLayer(layer: PosterLayer) {
        return layer.type === "image" || layer.type === "frame" || layer.type === "icon";
    }

    function selectLayer(id: string) {
        emit("update:selectedLayerId", id);
    }

    function handleStagePointer(event: any) {
        if (event.target === event.target.getStage()) {
            emit("update:selectedLayerId", undefined);
        }
    }

    function handleLayerPointer(id: string, event: any) {
        event.cancelBubble = true;

        const layer = props.document.layers.find((item) => item.id === id);

        if (!layer || layer.locked) {
            emit("update:selectedLayerId", findLayerAtPointer(id));
            return;
        }

        if (isImageLikeLayer(layer) && getImagePixelAlpha(id, event) <= 8) {
            emit("update:selectedLayerId", findLayerAtPointer(id));
            return;
        }

        if (props.activeTool === "pixelEraser" && isImageLikeLayer(layer)) {
            isDrawing.value = true;
            eraseImageLayerAtPointer(id, event);
            return;
        }

        if (props.activeTool === "magicWand" && isImageLikeLayer(layer)) {
            applyMagicWandErase(id, event);
            return;
        }

        selectLayer(id);
    }

    function handleToolDrag(id: string, event: any) {
        if (!isDrawing.value || props.activeTool !== "pixelEraser") {
            return;
        }

        eraseImageLayerAtPointer(id, event);
    }

    function handleImageDragStart(id: string, event: any) {
        if (getImagePixelAlpha(id, event) <= 8) {
            event.target.stopDrag();
            event.cancelBubble = true;
        }
    }

    function handleDragEnd(id: string, event: any) {
        const node = event.target;
        const layer = props.document.layers.find((item) => item.id === id);
        const isEllipse = layer?.type === "shape" && layer.shape === "ellipse";

        emit(
            "update:document",
            updateLayer(props.document, id, {
                x: isEllipse && layer ? node.x() - layer.width / 2 : node.x(),
                y: isEllipse && layer ? node.y() - layer.height / 2 : node.y(),
            }),
        );
    }

    function handleTransformEnd(id: string) {
        const node = layerNodes.get(id)?.getNode();

        if (!node) {
            return;
        }

        const layer = props.document.layers.find((item) => item.id === id);
        const isEllipse = layer?.type === "shape" && layer.shape === "ellipse";

        emit(
            "update:document",
            updateLayer(props.document, id, {
                x: isEllipse && layer ? node.x() - layer.width / 2 : node.x(),
                y: isEllipse && layer ? node.y() - layer.height / 2 : node.y(),
                scaleX: node.scaleX(),
                scaleY: node.scaleY(),
                rotation: node.rotation(),
            }),
        );
    }

    function setLayerNode(id: string, node: any) {
        if (node) {
            layerNodes.set(id, node);
        } else {
            layerNodes.delete(id);
        }
    }

    function loadLayerImages() {
        if (typeof window === "undefined") {
            return;
        }

        for (const layer of props.document.layers) {
            if (!isImageLikeLayer(layer) || !("src" in layer) || !layer.src) {
                continue;
            }

            if (imageElements[layer.id]) {
                continue;
            }

            const image = new window.Image();
            image.crossOrigin = "anonymous";
            image.onload = () => {
                imageElements[layer.id] = image;
                cacheImageCanvas(layer.id, image);
            };
            image.src = layer.src;
        }
    }

    function cacheImageCanvas(id: string, image: HTMLImageElement) {
        const canvas = window.document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context || canvas.width <= 0 || canvas.height <= 0) {
            return;
        }

        context.imageSmoothingEnabled = false;
        context.drawImage(image, 0, 0);
        imageHitCanvases.set(id, canvas);
    }

    function getImagePixelAlpha(id: string, event: any): number {
        const sample = getImageSample(id, event);

        if (!sample) {
            return 255;
        }

        return sample.data[3] ?? 255;
    }

    function getImageSample(id: string, event: any) {
        const layer = props.document.layers.find((item) => item.id === id);
        const node = layerNodes.get(id)?.getNode();
        const canvas = imageHitCanvases.get(id);

        if (!layer || !node || !canvas) {
            return undefined;
        }

        const localPoint = getLocalPointer(node, event);

        if (!localPoint || !isPointInLayerBounds(layer, localPoint)) {
            return undefined;
        }

        const x = Math.floor((localPoint.x / layer.width) * canvas.width);
        const y = Math.floor((localPoint.y / layer.height) * canvas.height);
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
            return undefined;
        }

        return {
            x: Math.max(0, Math.min(canvas.width - 1, x)),
            y: Math.max(0, Math.min(canvas.height - 1, y)),
            canvas,
            context,
            data: context.getImageData(
                Math.max(0, Math.min(canvas.width - 1, x)),
                Math.max(0, Math.min(canvas.height - 1, y)),
                1,
                1,
            ).data,
        };
    }

    function findLayerAtPointer(skipLayerId?: string) {
        for (const layer of [...props.document.layers].reverse()) {
            if (layer.id === skipLayerId || !layer.visible || layer.locked) {
                continue;
            }

            const node = layerNodes.get(layer.id)?.getNode();

            if (!node) {
                continue;
            }

            if (isImageLikeLayer(layer)) {
                if (getImagePixelAlpha(layer.id, { target: node }) > 8) {
                    return layer.id;
                }
                continue;
            }

            const stagePointer = node.getStage()?.getPointerPosition();

            if (stagePointer && node.intersects(stagePointer)) {
                return layer.id;
            }
        }

        return undefined;
    }

    function eraseImageLayerAtPointer(id: string, event: any) {
        const layer = props.document.layers.find((item) => item.id === id);
        const sample = getImageSample(id, event);

        if (!layer || layer.locked || !sample) {
            return;
        }

        const brushSize = Math.max(1, Math.round(props.eraserSize));
        const halfBrush = Math.floor(brushSize / 2);
        sample.context.clearRect(
            sample.x - halfBrush,
            sample.y - halfBrush,
            brushSize,
            brushSize,
        );
        updateRasterLayerFromCanvas(id, sample.canvas);
    }

    function applyMagicWandErase(id: string, event: any) {
        const layer = props.document.layers.find((item) => item.id === id);
        const sample = getImageSample(id, event);

        if (!layer || layer.locked || !sample || sample.data[3] <= 8) {
            return;
        }

        const imageData = sample.context.getImageData(
            0,
            0,
            sample.canvas.width,
            sample.canvas.height,
        );
        const tolerance = Math.max(0, Math.min(255, props.wandTolerance));
        const toleranceSquared = tolerance * tolerance * 3;
        const target = sample.data;
        const queue = [[sample.x, sample.y]];
        const visited = new Uint8Array(sample.canvas.width * sample.canvas.height);

        while (queue.length > 0) {
            const point = queue.pop();
            if (!point) continue;
            const [x, y] = point;

            if (x < 0 || y < 0 || x >= sample.canvas.width || y >= sample.canvas.height) {
                continue;
            }

            const index = y * sample.canvas.width + x;
            if (visited[index]) continue;
            visited[index] = 1;

            const pixelIndex = index * 4;
            const alpha = imageData.data[pixelIndex + 3];
            const distance =
                (imageData.data[pixelIndex] - target[0]) ** 2 +
                (imageData.data[pixelIndex + 1] - target[1]) ** 2 +
                (imageData.data[pixelIndex + 2] - target[2]) ** 2;

            if (alpha <= 8 || distance > toleranceSquared) {
                continue;
            }

            imageData.data[pixelIndex + 3] = 0;
            queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }

        sample.context.putImageData(imageData, 0, 0);
        updateRasterLayerFromCanvas(id, sample.canvas);
    }

    function updateRasterLayerFromCanvas(id: string, canvas: HTMLCanvasElement) {
        const nextSrc = canvas.toDataURL("image/png");
        const image = new window.Image();
        image.onload = () => {
            imageElements[id] = image;
            cacheImageCanvas(id, image);
        };
        image.src = nextSrc;

        emit("update:document", updateLayer(props.document, id, { src: nextSrc }));
    }

    function getLocalPointer(node: any, event: any) {
        const stage = event.target?.getStage?.() ?? node.getStage?.();
        const pointer = stage?.getPointerPosition();

        if (!pointer) {
            return undefined;
        }

        const transform = node.getAbsoluteTransform().copy();
        transform.invert();

        return transform.point(pointer);
    }

    function isPointInLayerBounds(layer: PosterLayer, point: { x: number; y: number }) {
        return point.x >= 0 && point.y >= 0 && point.x <= layer.width && point.y <= layer.height;
    }

    function syncTransformer() {
        const transformer = transformerRef.value?.getNode();
        const selectedNode = props.selectedLayerId
            ? layerNodes.get(props.selectedLayerId)?.getNode()
            : undefined;

        if (!transformer) {
            return;
        }

        transformer.nodes(selectedNode ? [selectedNode] : []);
        transformer.getLayer()?.batchDraw();
    }

    function updateCanvasScale() {
        const board = boardRef.value;

        if (!board) {
            return;
        }

        const availableWidth = Math.max(240, board.clientWidth - 32);
        canvasScale.value = Math.min(1, availableWidth / props.document.canvas.width);
    }

    onMounted(() => {
        updateCanvasScale();

        if (typeof ResizeObserver !== "undefined" && boardRef.value) {
            resizeObserver = new ResizeObserver(updateCanvasScale);
            resizeObserver.observe(boardRef.value);
        }
    });

    onBeforeUnmount(() => {
        resizeObserver?.disconnect();
    });

    watch(() => props.selectedLayerId, () => nextTick(syncTransformer), {
        immediate: true,
    });
    watch(() => props.document, () => nextTick(syncTransformer), { deep: true });
    watch(
        () => [props.document.canvas.width, props.document.canvas.height],
        () => nextTick(updateCanvasScale),
    );
    watch(() => props.document.layers, loadLayerImages, { deep: true, immediate: true });
</script>

<style scoped>
.canvas-wrap {
    display: grid;
    width: 100%;
    gap: 12px;
}

.canvas-toolbar {
    display: flex;
    justify-content: center;
    gap: 8px;
}

.canvas-board {
    display: flex;
    justify-content: center;
    min-width: 0;
    overflow: hidden;
    padding: 16px;
    border: 1px solid var(--vp-c-divider);
    background: var(--vp-c-bg);
}

.konva-stage {
    flex: 0 0 auto;
    border: 1px solid var(--vp-c-divider);
    background: var(--vp-c-bg-soft);
}
</style>
