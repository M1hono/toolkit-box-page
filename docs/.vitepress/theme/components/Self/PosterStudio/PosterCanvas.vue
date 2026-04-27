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
                        <v-image
                            v-if="isTransparentBackground()"
                            :config="checkerImageConfig"
                        />
                        <v-rect v-else :config="backgroundConfig" />
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
    import { createDustGrainPoints } from "../../../../utils/posterStudio/effects";
    import type {
        PosterDocument,
        PosterEffect,
        PosterFrameLayer,
        PosterIconLayer,
        PosterImageLayer,
        PosterLayer,
        PosterShapeLayer,
        PosterTextLayer,
    } from "../../../../utils/posterStudio/types";

    type PosterCanvasTool = "select" | "paintBrush" | "magicWand" | "pixelEraser";
    type RasterLayer = PosterImageLayer | PosterFrameLayer | PosterIconLayer;

    const props = defineProps<{
        document: PosterDocument;
        selectedLayerId?: string;
        activeTool: PosterCanvasTool;
        brushSize: number;
        brushColor: string;
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
    const imageRenderKeys = new Map<string, string>();
    const checkerPattern = ref<HTMLImageElement>();

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

    const backgroundConfig = computed(() => {
        return {
            x: 0,
            y: 0,
            width: props.document.canvas.width,
            height: props.document.canvas.height,
            fill: props.document.canvas.background ?? "#f4f4f4",
            listening: false,
        };
    });

    const checkerImageConfig = computed(() => {
        return {
            x: 0,
            y: 0,
            width: props.document.canvas.width,
            height: props.document.canvas.height,
            image: checkerPattern.value,
            listening: false,
        };
    });

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
            globalCompositeOperation: toKonvaBlendMode(textLayer.blendMode),
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
            globalCompositeOperation: toKonvaBlendMode(imageLayer.blendMode),
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
            globalCompositeOperation: toKonvaBlendMode(shapeLayer.blendMode),
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
            globalCompositeOperation: toKonvaBlendMode(shapeLayer.blendMode),
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

        if (props.activeTool === "paintBrush" && isImageLikeLayer(layer)) {
            isDrawing.value = true;
            paintImageLayerAtPointer(id, event);
            return;
        }

        if (props.activeTool === "magicWand" && isImageLikeLayer(layer)) {
            applyMagicWandErase(id, event);
            return;
        }

        if (props.activeTool === "pixelEraser" && isImageLikeLayer(layer)) {
            isDrawing.value = true;
            eraseImageLayerAtPointer(id, event);
            return;
        }

        if (isImageLikeLayer(layer) && getImagePixelAlpha(id, event) <= 8) {
            emit("update:selectedLayerId", findLayerAtPointer(id));
            return;
        }

        selectLayer(id);
    }

    function handleToolDrag(id: string, event: any) {
        if (!isDrawing.value) {
            return;
        }

        if (props.activeTool === "paintBrush") {
            paintImageLayerAtPointer(id, event);
            return;
        }

        if (props.activeTool === "pixelEraser") {
            eraseImageLayerAtPointer(id, event);
        }
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

            const renderKey = createLayerImageRenderKey(layer);

            if (imageRenderKeys.get(layer.id) === renderKey && imageElements[layer.id]) {
                continue;
            }

            const image = new window.Image();
            image.crossOrigin = "anonymous";
            image.onload = async () => {
                imageRenderKeys.set(layer.id, renderKey);
                cacheImageCanvas(layer.id, image);
                imageElements[layer.id] = await renderLayerImageElement(
                    layer as RasterLayer,
                    image,
                );
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

    async function renderLayerImageElement(
        layer: RasterLayer,
        image: HTMLImageElement,
    ): Promise<HTMLImageElement> {
        const effects = layer.effects.filter((effect) => effect.enabled !== false);

        if (effects.length === 0) {
            return image;
        }

        const canvas = window.document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(layer.width));
        canvas.height = Math.max(1, Math.round(layer.height));
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
            return image;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        applyCanvasEffects(canvas, effects);

        return loadImageFromDataUrl(canvas.toDataURL("image/png"));
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

    function paintImageLayerAtPointer(id: string, event: any) {
        const layer = props.document.layers.find((item) => item.id === id);
        const sample = getImageSample(id, event);

        if (!layer || layer.locked || !sample) {
            return;
        }

        const brushSize = Math.max(1, Math.round(props.brushSize));
        sample.context.save();
        sample.context.globalCompositeOperation = "source-over";
        sample.context.fillStyle = props.brushColor;
        sample.context.imageSmoothingEnabled = false;
        sample.context.beginPath();
        sample.context.arc(sample.x, sample.y, brushSize / 2, 0, Math.PI * 2);
        sample.context.fill();
        sample.context.restore();
        updateRasterLayerFromCanvas(id, sample.canvas);
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
        image.onload = async () => {
            cacheImageCanvas(id, image);
            const layer = props.document.layers.find((item) => item.id === id);
            imageElements[id] =
                layer && isImageLikeLayer(layer)
                    ? await renderLayerImageElement(layer, image)
                    : image;
            imageRenderKeys.delete(id);
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

    function createLayerImageRenderKey(layer: PosterLayer) {
        if (!isImageLikeLayer(layer)) {
            return "";
        }

        return [
            layer.src ?? "",
            layer.width,
            layer.height,
            JSON.stringify(layer.effects),
        ].join("|");
    }

    function toKonvaBlendMode(blendMode: string | undefined) {
        switch ((blendMode ?? "Normal").toLowerCase()) {
            case "multiply":
                return "multiply";
            case "screen":
                return "screen";
            case "overlay":
                return "overlay";
            default:
                return "source-over";
        }
    }

    function isTransparentBackground() {
        return props.document.canvas.background === "transparent";
    }

    function applyCanvasEffects(canvas: HTMLCanvasElement, effects: PosterEffect[]) {
        const filter = createCanvasFilter(effects);

        if (filter !== "none") {
            applyCanvasFilter(canvas, filter);
        }

        for (const effect of effects) {
            if (effect.id === "noise") {
                applyNoiseEffect(canvas, effect.params);
            }

            if (effect.id === "dustGrain") {
                applyDustGrainEffect(canvas, effect.params);
            }
        }
    }

    function createCanvasFilter(effects: PosterEffect[]) {
        const filterParts: string[] = [];

        for (const effect of effects) {
            if (effect.id === "adjust") {
                filterParts.push(
                    `brightness(${1 + numberParam(effect.params.brightness, 0)})`,
                    `contrast(${1 + numberParam(effect.params.contrast, 0)})`,
                    `saturate(${1 + numberParam(effect.params.saturation, 0)})`,
                    `hue-rotate(${numberParam(effect.params.hue, 0)}deg)`,
                );
            }

            if (effect.id === "blur") {
                filterParts.push(`blur(${numberParam(effect.params.radius, 0)}px)`);
            }
        }

        return filterParts.length > 0 ? filterParts.join(" ") : "none";
    }

    function applyCanvasFilter(canvas: HTMLCanvasElement, filter: string) {
        const source = window.document.createElement("canvas");
        source.width = canvas.width;
        source.height = canvas.height;
        const sourceContext = source.getContext("2d");
        const context = canvas.getContext("2d");

        if (!sourceContext || !context) {
            return;
        }

        sourceContext.drawImage(canvas, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.filter = filter;
        context.drawImage(source, 0, 0);
        context.filter = "none";
    }

    function applyNoiseEffect(canvas: HTMLCanvasElement, params: Record<string, unknown>) {
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
            return;
        }

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const amount = Math.max(0, Math.min(1, numberParam(params.amount, 0.08)));
        let random = createSeededRandom(numberParam(params.seed, 1));

        for (let index = 0; index < imageData.data.length; index += 4) {
            const delta = (random() - 0.5) * 255 * amount;
            imageData.data[index] = clampByte(imageData.data[index] + delta);
            imageData.data[index + 1] = clampByte(imageData.data[index + 1] + delta);
            imageData.data[index + 2] = clampByte(imageData.data[index + 2] + delta);
        }

        context.putImageData(imageData, 0, 0);
    }

    function applyDustGrainEffect(canvas: HTMLCanvasElement, params: Record<string, unknown>) {
        const context = canvas.getContext("2d");

        if (!context) {
            return;
        }

        const points = createDustGrainPoints({
            seed: numberParam(params.seed, 42),
            density: numberParam(params.density, 0.14),
            width: canvas.width,
            height: canvas.height,
            size: numberParam(params.size, 1.1),
            opacity: numberParam(params.opacity, 0.16),
        });

        context.save();
        context.fillStyle = stringParam(params.color, "#ffffff");

        for (const point of points) {
            context.globalAlpha = point.alpha;
            context.beginPath();
            context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
            context.fill();
        }

        context.restore();
    }

    function loadImageFromDataUrl(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve) => {
            const image = new window.Image();
            image.onload = () => resolve(image);
            image.src = src;
        });
    }

    function createCheckerPattern() {
        if (typeof window === "undefined") {
            return;
        }

        const canvas = window.document.createElement("canvas");
        const tileSize = 8;
        canvas.width = props.document.canvas.width;
        canvas.height = props.document.canvas.height;
        const context = canvas.getContext("2d");

        if (!context) {
            return;
        }

        context.fillStyle = "#fbfbfb";
        context.fillRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < canvas.height; y += tileSize) {
            for (let x = 0; x < canvas.width; x += tileSize) {
                if ((x / tileSize + y / tileSize) % 2 === 0) {
                    context.fillStyle = "#c9ced6";
                    context.fillRect(x, y, tileSize, tileSize);
                }
            }
        }

        const image = new window.Image();
        image.onload = () => {
            checkerPattern.value = image;
        };
        image.src = canvas.toDataURL("image/png");
    }

    function numberParam(value: unknown, fallback: number): number {
        return typeof value === "number" && Number.isFinite(value) ? value : fallback;
    }

    function stringParam(value: unknown, fallback: string): string {
        return typeof value === "string" ? value : fallback;
    }

    function createSeededRandom(seed: number) {
        let state = seed >>> 0;

        return () => {
            state = (state * 1664525 + 1013904223) >>> 0;
            return state / 0x100000000;
        };
    }

    function clampByte(value: number) {
        return Math.max(0, Math.min(255, Math.round(value)));
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
        createCheckerPattern();
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
        () => {
            createCheckerPattern();
            nextTick(updateCanvasScale);
        },
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
