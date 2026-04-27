<template>
    <div class="canvas-wrap">
        <div class="canvas-toolbar">
            <v-chip size="small" variant="outlined">
                {{ props.document.canvas.width }} x {{ props.document.canvas.height }}
            </v-chip>
            <v-chip size="small" variant="outlined">{{ t.zoom }} 100%</v-chip>
        </div>

        <div class="canvas-board">
            <v-stage
                :config="stageConfig"
                class="konva-stage"
                @mousedown="handleStagePointer"
                @touchstart="handleStagePointer"
            >
                <v-layer>
                    <v-rect :config="backgroundConfig" />
                    <v-rect :config="canvasGuideConfig" />

                    <template v-for="layer in props.document.layers" :key="layer.id">
                        <v-image
                            v-if="isImageLikeLayer(layer)"
                            :ref="(node) => setLayerNode(layer.id, node)"
                            :config="imageConfig(layer)"
                            @click="selectLayer(layer.id)"
                            @tap="selectLayer(layer.id)"
                            @dragend="handleDragEnd(layer.id, $event)"
                            @transformend="handleTransformEnd(layer.id)"
                        />
                        <v-text
                            v-else-if="layer.type === 'text'"
                            :ref="(node) => setLayerNode(layer.id, node)"
                            :config="textConfig(layer)"
                            @click="selectLayer(layer.id)"
                            @tap="selectLayer(layer.id)"
                            @dragend="handleDragEnd(layer.id, $event)"
                            @transformend="handleTransformEnd(layer.id)"
                        />
                        <v-ellipse
                            v-else-if="layer.type === 'shape' && layer.shape === 'ellipse'"
                            :ref="(node) => setLayerNode(layer.id, node)"
                            :config="ellipseConfig(layer)"
                            @click="selectLayer(layer.id)"
                            @tap="selectLayer(layer.id)"
                            @dragend="handleDragEnd(layer.id, $event)"
                            @transformend="handleTransformEnd(layer.id)"
                        />
                        <v-rect
                            v-else-if="layer.type === 'shape'"
                            :ref="(node) => setLayerNode(layer.id, node)"
                            :config="shapeRectConfig(layer)"
                            @click="selectLayer(layer.id)"
                            @tap="selectLayer(layer.id)"
                            @dragend="handleDragEnd(layer.id, $event)"
                            @transformend="handleTransformEnd(layer.id)"
                        />
                    </template>

                    <v-transformer
                        ref="transformerRef"
                        :config="transformerConfig"
                    />
                </v-layer>
            </v-stage>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, nextTick, reactive, ref, watch } from "vue";
    import {
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
        PosterImageLayer,
        PosterLayer,
        PosterShapeLayer,
        PosterTextLayer,
    } from "../../../../utils/posterStudio/types";

    const props = defineProps<{
        document: PosterDocument;
        selectedLayerId?: string;
    }>();
    const { t } = useSafeI18n("poster-studio-canvas", {
        zoom: "Zoom",
    });

    const emit = defineEmits<{
        "update:document": [document: PosterDocument];
        "update:selectedLayerId": [id: string | undefined];
    }>();

    const transformerRef = ref<any>();
    const layerNodes = new Map<string, any>();
    const imageElements = reactive<Record<string, HTMLImageElement>>({});

    const stageConfig = computed(() => ({
        width: props.document.canvas.width,
        height: props.document.canvas.height,
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
        const imageLayer = layer as PosterImageLayer;

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
            draggable: !imageLayer.locked,
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
            };
            image.src = layer.src;
        }
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

    watch(() => props.selectedLayerId, () => nextTick(syncTransformer), {
        immediate: true,
    });
    watch(() => props.document, () => nextTick(syncTransformer), { deep: true });
    watch(() => props.document.layers, loadLayerImages, { deep: true, immediate: true });
</script>

<style scoped>
.canvas-wrap {
    display: grid;
    width: min(100%, 840px);
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
    overflow: auto;
    padding: 20px;
    border: 1px solid var(--vp-c-divider);
    background: var(--vp-c-bg);
}

.konva-stage {
    flex: 0 0 auto;
    border: 1px solid var(--vp-c-divider);
    background: var(--vp-c-bg-soft);
}
</style>
