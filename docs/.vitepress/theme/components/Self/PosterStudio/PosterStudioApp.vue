<template>
    <v-app class="poster-studio-app">
        <v-main>
            <v-container fluid class="pa-0 ma-0 poster-shell">
                <header class="poster-header">
                    <div>
                        <div class="text-h4 font-weight-bold app-title">
                            {{ t.title }}
                        </div>
                        <div class="poster-subtitle">
                            {{ t.subtitle }}
                        </div>
                    </div>
                    <div class="poster-actions">
                        <v-btn
                            variant="outlined"
                            size="small"
                            @click="resetDocument('curseforge')"
                        >
                            400 x 400
                        </v-btn>
                        <v-btn
                            variant="outlined"
                            size="small"
                            @click="resetDocument('mcmod')"
                        >
                            720 x 450
                        </v-btn>
                        <v-btn
                            variant="outlined"
                            size="small"
                            @click="addBlankLayer"
                        >
                            <v-icon start>mdi-layers-plus</v-icon>
                            {{ t.blankLayer }}
                        </v-btn>
                        <v-btn
                            :variant="transparentBackground ? 'flat' : 'outlined'"
                            size="small"
                            @click="toggleTransparentBackground"
                        >
                            <v-icon start>mdi-checkerboard</v-icon>
                            {{ transparentBackground ? t.transparentBackground : t.solidBackground }}
                        </v-btn>
                        <v-btn
                            color="primary"
                            variant="flat"
                            size="small"
                            :loading="exporting"
                            @click="exportPng"
                        >
                            {{ t.exportPng }}
                        </v-btn>
                    </div>
                </header>

                <div class="poster-workbench">
                    <PosterAssetPanel
                        :assets="builtInAssets"
                        :imported-assets="importedAssets"
                        :templates="templates"
                        @add-asset-to-canvas="addAssetToCanvas"
                        @apply-template="applyTemplate"
                        @add-file-to-canvas="addFileToCanvas"
                        @add-file-to-library="addFileToLibrary"
                    />

                    <section class="poster-stage-panel">
                        <v-card class="poster-panel fill-height">
                            <v-card-title class="panel-title">{{ t.canvas }}</v-card-title>
                            <v-card-text class="stage-body">
                                <PosterCanvas
                                    v-model:document="document"
                                    v-model:selected-layer-id="selectedLayerId"
                                    :active-tool="activeTool"
                                    :brush-size="brushSize"
                                    :brush-color="brushColor"
                                    :eraser-size="eraserSize"
                                    :wand-tolerance="wandTolerance"
                                />
                            </v-card-text>
                            <div class="tool-dock">
                                <v-btn-toggle
                                    v-model="activeTool"
                                    class="tool-toggle"
                                    divided
                                    density="compact"
                                    mandatory
                                    variant="outlined"
                                >
                                    <v-btn
                                        value="select"
                                        :aria-label="t.toolSelect"
                                        :aria-pressed="activeTool === 'select'"
                                        :title="t.toolSelect"
                                    >
                                        <v-icon>mdi-cursor-default-click-outline</v-icon>
                                    </v-btn>
                                    <v-btn
                                        value="paintBrush"
                                        :aria-label="t.toolPaintBrush"
                                        :aria-pressed="activeTool === 'paintBrush'"
                                        :title="t.toolPaintBrush"
                                    >
                                        <v-icon>mdi-brush</v-icon>
                                    </v-btn>
                                    <v-btn
                                        value="magicWand"
                                        :aria-label="t.toolMagicWand"
                                        :aria-pressed="activeTool === 'magicWand'"
                                        :title="t.toolMagicWand"
                                    >
                                        <v-icon>mdi-auto-fix</v-icon>
                                    </v-btn>
                                    <v-btn
                                        value="pixelEraser"
                                        :aria-label="t.toolPixelEraser"
                                        :aria-pressed="activeTool === 'pixelEraser'"
                                        :title="t.toolPixelEraser"
                                    >
                                        <v-icon>mdi-eraser</v-icon>
                                    </v-btn>
                                </v-btn-toggle>
                                <div class="tool-dock__controls" aria-live="polite">
                                    <div
                                        v-if="activeTool === 'select'"
                                        class="tool-status"
                                    >
                                        <v-icon size="16">mdi-cursor-move</v-icon>
                                        <span>{{ t.selectHint }}</span>
                                    </div>
                                    <div
                                        v-else-if="activeTool === 'paintBrush'"
                                        class="tool-setting tool-setting--brush"
                                    >
                                        <span class="tool-setting__label">
                                            {{ t.brushSize }}
                                        </span>
                                        <v-slider
                                            v-model="brushSize"
                                            class="tool-slider"
                                            density="compact"
                                            hide-details
                                            :aria-label="t.brushSize"
                                            :max="96"
                                            :min="1"
                                            :step="1"
                                            thumb-label
                                        />
                                        <span class="tool-setting__value">
                                            {{ brushSize }} px
                                        </span>
                                        <label class="tool-color" :title="t.brushColor">
                                            <span>{{ t.brushColor }}</span>
                                            <input v-model="brushColor" type="color" />
                                        </label>
                                    </div>
                                    <div
                                        v-else-if="activeTool === 'pixelEraser'"
                                        class="tool-setting"
                                    >
                                        <span class="tool-setting__label">
                                            {{ t.eraserSize }}
                                        </span>
                                        <v-slider
                                            v-model="eraserSize"
                                            class="tool-slider"
                                            density="compact"
                                            hide-details
                                            :aria-label="t.eraserSize"
                                            :max="72"
                                            :min="4"
                                            :step="1"
                                            thumb-label
                                        />
                                        <span class="tool-setting__value">
                                            {{ eraserSize }} px
                                        </span>
                                    </div>
                                    <div
                                        v-else-if="activeTool === 'magicWand'"
                                        class="tool-setting"
                                    >
                                        <span class="tool-setting__label">
                                            {{ t.wandTolerance }}
                                        </span>
                                        <v-slider
                                            v-model="wandTolerance"
                                            class="tool-slider"
                                            density="compact"
                                            hide-details
                                            :aria-label="t.wandTolerance"
                                            :max="96"
                                            :min="0"
                                            :step="1"
                                            thumb-label
                                        />
                                        <span class="tool-setting__value">
                                            {{ wandTolerance }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </v-card>
                    </section>

                    <aside class="poster-side-panel">
                        <PosterLayerPanel
                            :layers="document.layers"
                            :selected-layer-id="selectedLayerId"
                            @select-layer="selectedLayerId = $event"
                            @reorder-layer="reorderLayer"
                            @update-layer="updateLayerById"
                            @remove-layer="removeLayerById"
                        />
                        <PosterPropertiesPanel
                            :layer="selectedLayer"
                            @update-layer="updateSelectedLayer"
                        />
                    </aside>
                </div>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
    import { computed, onMounted, ref, shallowRef } from "vue";

    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import {
        createPosterAssetFromFile,
        loadPosterAssetIndex,
        loadPosterTemplateIndex,
        type PosterTemplateIndexItem,
    } from "../../../../utils/posterStudio/assets";
    import {
        addBlankImageLayer,
        addImageLayer,
        addTextLayer,
        createPosterDocument,
        moveLayer,
        removeLayer,
        updateCanvas,
        updateLayer,
    } from "../../../../utils/posterStudio/document";
    import {
        createIndexedDbPosterStudioStorage,
        createMemoryPosterStudioStorage,
        type PosterStudioStorage,
    } from "../../../../utils/posterStudio/storage";
    import { exportPosterDocument } from "../../../../utils/posterStudio/export";
    import { createDocumentFromTemplate } from "../../../../utils/posterStudio/templates";
    import type {
        PosterAsset,
        PosterCanvasPreset,
        PosterDocument,
        PosterLayer,
    } from "../../../../utils/posterStudio/types";

    import PosterAssetPanel from "./PosterAssetPanel.vue";
    import PosterCanvas from "./PosterCanvas.vue";
    import PosterLayerPanel from "./PosterLayerPanel.vue";
    import PosterPropertiesPanel from "./PosterPropertiesPanel.vue";

    type PosterCanvasTool = "select" | "paintBrush" | "magicWand" | "pixelEraser";

    const { t } = useSafeI18n("poster-studio-app", {
        title: "Mod Poster Studio",
        subtitle: "General image editor and mod poster templates",
        exportPng: "Export PNG",
        canvas: "Canvas",
        toolSelect: "Select",
        toolPaintBrush: "Brush",
        toolMagicWand: "Magic wand",
        toolPixelEraser: "Pixel eraser",
        brushSize: "Brush",
        brushColor: "Color",
        eraserSize: "Eraser",
        wandTolerance: "Tolerance",
        selectHint: "Select, move, and transform layers",
        blankLayer: "Blank layer",
        transparentBackground: "Transparent",
        solidBackground: "Solid background",
        defaultLayerName: "Title",
        defaultCanvasTitle: "Mod Poster Studio",
    });

    const starterLayerConfig: Record<
        PosterCanvasPreset,
        { width: number; fontSize: number }
    > = {
        curseforge: {
            width: 260,
            fontSize: 26,
        },
        mcmod: {
            width: 360,
            fontSize: 32,
        },
    };

    const document = ref(createStarterDocument("mcmod"));
    const selectedLayerId = ref<string | undefined>(document.value.layers[0]?.id);
    const builtInAssets = ref<PosterAsset[]>([]);
    const importedAssets = ref<PosterAsset[]>([]);
    const templates = ref<PosterTemplateIndexItem[]>([]);
    const exporting = ref(false);
    const activeTool = ref<PosterCanvasTool>("select");
    const brushSize = ref(18);
    const brushColor = ref("#2f6fed");
    const eraserSize = ref(20);
    const wandTolerance = ref(28);
    const storage = shallowRef<PosterStudioStorage>(createMemoryPosterStudioStorage());

    const selectedLayer = computed(
        () =>
            document.value.layers.find((layer) => layer.id === selectedLayerId.value) ??
            undefined,
    );
    const transparentBackground = computed(
        () => document.value.canvas.background === "transparent",
    );

    onMounted(async () => {
        const [assetIndex, templateIndex] = await Promise.all([
            loadPosterAssetIndex().catch(() => ({ assets: [] })),
            loadPosterTemplateIndex().catch(() => ({ templates: [] })),
        ]);

        builtInAssets.value = assetIndex.assets;
        templates.value = templateIndex.templates;

        try {
            storage.value = await createIndexedDbPosterStudioStorage();
            importedAssets.value = await storage.value.listAssets();
        } catch {
            storage.value = createMemoryPosterStudioStorage();
        }
    });

    function resetDocument(preset: PosterCanvasPreset) {
        document.value = createStarterDocument(preset);
        selectedLayerId.value = document.value.layers[0]?.id;
    }

    function addBlankLayer() {
        const nextDocument = addBlankImageLayer(document.value, {
            name: t.blankLayer,
            src: createTransparentLayerSrc(
                document.value.canvas.width,
                document.value.canvas.height,
            ),
            width: document.value.canvas.width,
            height: document.value.canvas.height,
        });

        document.value = nextDocument;
        selectedLayerId.value = nextDocument.layers[nextDocument.layers.length - 1]?.id;
        activeTool.value = "paintBrush";
    }

    function toggleTransparentBackground() {
        document.value = updateCanvas(document.value, {
            background: transparentBackground.value ? undefined : "transparent",
        });
    }

    async function addFileToCanvas(file: File) {
        const asset = await createPosterAssetFromFile(file);
        addAssetToCanvas(asset);
    }

    async function addFileToLibrary(file: File) {
        const asset = await createPosterAssetFromFile(file);
        await storage.value.putAsset(asset);
        importedAssets.value = await storage.value.listAssets();
    }

    function addAssetToCanvas(asset: PosterAsset) {
        const width = normalizedLayerSize(asset.width, document.value.canvas.width);
        const height = normalizedLayerSize(asset.height, document.value.canvas.height);
        const src = asset.url ?? (asset.blob ? URL.createObjectURL(asset.blob) : undefined);
        const nextDocument = addImageLayer(document.value, {
            name: asset.name,
            assetId: asset.id,
            src,
            width,
            height,
            x: Math.round((document.value.canvas.width - width) / 2),
            y: Math.round((document.value.canvas.height - height) / 2),
        });

        document.value = nextDocument;
        selectedLayerId.value = nextDocument.layers[nextDocument.layers.length - 1]?.id;
    }

    async function applyTemplate(template: PosterTemplateIndexItem) {
        const response = await fetch(template.manifestUrl);

        if (!response.ok) {
            throw new Error(`Failed to load poster template: ${response.status}`);
        }

        const nextDocument = createDocumentFromTemplate(
            await response.json(),
            document.value.canvas.preset,
            template.rootUrl,
        );

        document.value = nextDocument;
        selectedLayerId.value =
            nextDocument.layers.find((layer) => !layer.locked)?.id ??
            nextDocument.layers[0]?.id;
    }

    async function exportPng() {
        exporting.value = true;

        try {
            const output = await exportPosterDocument(document.value, [
                ...builtInAssets.value,
                ...importedAssets.value,
            ]);
            const url =
                typeof output === "string" ? output : URL.createObjectURL(output);
            const link = window.document.createElement("a");
            link.href = url;
            link.download = `${document.value.name || "poster"}.png`;
            link.click();

            if (typeof output !== "string") {
                URL.revokeObjectURL(url);
            }
        } finally {
            exporting.value = false;
        }
    }

    function updateSelectedLayer(patch: Partial<PosterLayer>) {
        if (!selectedLayerId.value) {
            return;
        }

        document.value = updateLayer(document.value, selectedLayerId.value, patch);
    }

    function updateLayerById(id: string, patch: Partial<PosterLayer>) {
        document.value = updateLayer(document.value, id, patch);
    }

    function reorderLayer(id: string, targetIndex: number) {
        document.value = moveLayer(document.value, id, targetIndex);
        selectedLayerId.value = id;
    }

    function removeLayerById(id: string) {
        const removedIndex = document.value.layers.findIndex((layer) => layer.id === id);
        document.value = removeLayer(document.value, id);

        if (selectedLayerId.value !== id) {
            return;
        }

        const fallbackIndex = Math.min(removedIndex, document.value.layers.length - 1);
        selectedLayerId.value =
            fallbackIndex >= 0 ? document.value.layers[fallbackIndex]?.id : undefined;
    }

    function createStarterDocument(preset: PosterCanvasPreset): PosterDocument {
        const layerConfig = starterLayerConfig[preset];

        return addTextLayer(createPosterDocument(preset), {
            name: t.defaultLayerName,
            text: t.defaultCanvasTitle,
            x: 36,
            y: 32,
            width: layerConfig.width,
            height: 48,
            fontSize: layerConfig.fontSize,
            color: "#1f1f1f",
        });
    }

    function normalizedLayerSize(value: number | undefined, canvasSize: number) {
        if (!value || value <= 0) {
            return Math.round(canvasSize * 0.38);
        }

        return Math.min(value, Math.round(canvasSize * 0.72));
    }

    function createTransparentLayerSrc(width: number, height: number) {
        if (typeof window === "undefined") {
            return undefined;
        }

        const canvas = window.document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        return canvas.toDataURL("image/png");
    }
</script>

<style scoped>
.poster-studio-app {
    --poster-slider-fill: #2f6fed;
    --poster-slider-thumb: #ffffff;
    --poster-slider-thumb-border: #2f6fed;
    --poster-slider-thumb-shadow: 0 0 0 1px rgba(47, 111, 237, 0.18),
        0 2px 6px rgba(15, 23, 42, 0.22);
    --poster-slider-track: rgba(31, 41, 55, 0.18);

    min-height: 100vh;
    background: var(--vp-c-bg);
}

:global(html.dark .poster-studio-app) {
    --poster-slider-fill: #8fb7ff;
    --poster-slider-thumb: #dbe8ff;
    --poster-slider-thumb-border: #8fb7ff;
    --poster-slider-thumb-shadow: 0 0 0 2px rgba(143, 183, 255, 0.3),
        0 2px 8px rgba(0, 0, 0, 0.55);
    --poster-slider-track: rgba(220, 229, 246, 0.32);
}

.poster-shell {
    width: min(100%, 1680px);
    max-width: 100%;
    margin: 0 auto;
}

.poster-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    padding: 24px 24px 16px;
    border-bottom: 1px solid var(--vp-c-divider);
}

.app-title {
    color: var(--vp-c-text-1);
    letter-spacing: 0;
}

.poster-subtitle {
    margin-top: 4px;
    color: var(--vp-c-text-2);
    font-size: 14px;
}

.poster-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
}

.poster-workbench {
    display: grid;
    grid-template-columns: minmax(240px, 280px) minmax(560px, 1fr) minmax(280px, 300px);
    gap: 16px;
    align-items: start;
    min-height: calc(100vh - 112px);
    padding: 16px 24px 24px;
}

.poster-stage-panel,
.poster-side-panel {
    min-width: 0;
}

.poster-side-panel {
    display: grid;
    grid-template-rows: auto auto;
    gap: 16px;
    align-content: start;
}

.poster-panel {
    border: 1px solid var(--vp-c-divider);
}

.poster-stage-panel .poster-panel {
    height: auto !important;
}

.panel-title {
    min-height: 44px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--vp-c-divider);
    font-size: 15px;
    font-weight: 700;
}

.stage-body {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    min-height: 520px;
    padding: 16px;
    background: var(--vp-c-bg-soft);
}

.tool-dock {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 10px 12px;
    border-top: 1px solid var(--vp-c-divider);
    background: var(--vp-c-bg);
}

.tool-toggle {
    flex: 0 0 auto;
}

.tool-toggle :deep(.v-btn) {
    width: 42px;
    min-width: 42px;
    height: 36px;
}

.tool-toggle :deep(.v-btn--active) {
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-brand-1);
}

.tool-dock__controls {
    display: flex;
    flex: 1 1 260px;
    align-items: center;
    min-width: 0;
}

.tool-status,
.tool-setting {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0;
}

.tool-status {
    gap: 8px;
    color: var(--vp-c-text-2);
    font-size: 13px;
}

.tool-setting {
    display: grid;
    grid-template-columns: max-content minmax(120px, 1fr) 52px;
    gap: 10px;
}

.tool-setting--brush {
    grid-template-columns: max-content minmax(120px, 1fr) 58px auto;
}

.tool-setting__label,
.tool-setting__value {
    color: var(--vp-c-text-2);
    font-size: 12px;
    font-weight: 650;
    letter-spacing: 0;
    white-space: nowrap;
}

.tool-setting__value {
    display: inline-grid;
    min-height: 28px;
    place-items: center;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
}

.tool-color {
    display: inline-grid;
    grid-template-columns: auto 28px;
    gap: 8px;
    align-items: center;
    color: var(--vp-c-text-2);
    font-size: 12px;
    font-weight: 650;
    white-space: nowrap;
}

.tool-color input {
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
}

.tool-slider {
    min-width: 0;
}

.poster-studio-app :deep(.v-slider-track__background) {
    height: 6px !important;
    border-radius: 999px;
    background-color: var(--poster-slider-track) !important;
    opacity: 1 !important;
}

.poster-studio-app :deep(.v-slider-track__fill) {
    height: 6px !important;
    border-radius: 999px;
    background-color: var(--poster-slider-fill) !important;
    opacity: 1 !important;
}

.poster-studio-app :deep(.v-slider-thumb__surface) {
    border: 2px solid var(--poster-slider-thumb-border) !important;
    background-color: var(--poster-slider-thumb) !important;
    box-shadow: var(--poster-slider-thumb-shadow) !important;
}

.poster-studio-app :deep(.v-slider-thumb__surface::before) {
    background: transparent !important;
}

:deep(.v-card),
:deep(.v-btn),
:deep(.v-field),
:deep(.v-chip),
:deep(.v-slide-group__container) {
    border-radius: 4px !important;
    box-shadow: none !important;
}

:deep(.v-card) {
    border: 1px solid var(--vp-c-divider);
}

@media (max-width: 1180px) {
    .poster-header {
        align-items: flex-start;
        flex-direction: column;
        padding: 18px 0 14px;
    }

    .poster-actions {
        justify-content: flex-start;
    }

    .poster-workbench {
        grid-template-columns: 1fr;
        gap: 16px;
        min-height: auto;
        padding: 16px 0 24px;
    }

    .poster-side-panel {
        grid-template-rows: none;
    }

    .stage-body {
        min-height: 0;
        padding: 12px;
    }

    .tool-dock,
    .tool-dock__controls {
        align-items: stretch;
    }

    .tool-setting {
        grid-template-columns: 1fr;
    }

    .tool-setting--brush {
        grid-template-columns: 1fr;
    }

    .tool-setting__value {
        width: max-content;
        min-width: 52px;
        padding: 0 8px;
    }
}
</style>
