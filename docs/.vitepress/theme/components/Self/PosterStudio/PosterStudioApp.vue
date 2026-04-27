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
                                />
                            </v-card-text>
                        </v-card>
                    </section>

                    <aside class="poster-side-panel">
                        <PosterLayerPanel
                            :layers="document.layers"
                            :selected-layer-id="selectedLayerId"
                            @select-layer="selectedLayerId = $event"
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
        addImageLayer,
        addTextLayer,
        createPosterDocument,
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

    const { t } = useSafeI18n("poster-studio-app", {
        title: "Mod Poster Studio",
        subtitle: "General image editor and mod poster templates",
        exportPng: "Export PNG",
        canvas: "Canvas",
        defaultLayerName: "Title",
        defaultCanvasTitle: "Mod Poster Studio",
    });

    const document = ref(createStarterDocument("mcmod"));
    const selectedLayerId = ref<string | undefined>(document.value.layers[0]?.id);
    const builtInAssets = ref<PosterAsset[]>([]);
    const importedAssets = ref<PosterAsset[]>([]);
    const templates = ref<PosterTemplateIndexItem[]>([]);
    const exporting = ref(false);
    const storage = shallowRef<PosterStudioStorage>(createMemoryPosterStudioStorage());
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

    const selectedLayer = computed(
        () =>
            document.value.layers.find((layer) => layer.id === selectedLayerId.value) ??
            undefined,
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
</script>

<style scoped>
.poster-studio-app {
    min-height: 100vh;
    background: var(--vp-c-bg);
}

.poster-shell {
    max-width: 100%;
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
    grid-template-columns: 280px minmax(0, 1fr) 320px;
    gap: 16px;
    min-height: calc(100vh - 112px);
    padding: 16px 24px 24px;
}

.poster-stage-panel,
.poster-side-panel {
    min-width: 0;
}

.poster-side-panel {
    display: grid;
    grid-template-rows: minmax(220px, 1fr) minmax(280px, 1fr);
    gap: 16px;
}

.poster-panel {
    border: 1px solid var(--vp-c-divider);
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
    align-items: center;
    justify-content: center;
    min-height: 560px;
    padding: 16px;
    background: var(--vp-c-bg-soft);
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

@media (max-width: 1100px) {
    .poster-header {
        align-items: flex-start;
        flex-direction: column;
    }

    .poster-actions {
        justify-content: flex-start;
    }

    .poster-workbench {
        grid-template-columns: 1fr;
        min-height: auto;
    }

    .poster-side-panel {
        grid-template-rows: none;
    }

    .stage-body {
        min-height: 420px;
    }
}
</style>
