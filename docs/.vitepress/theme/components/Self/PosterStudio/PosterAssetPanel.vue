<template>
    <v-card class="poster-panel fill-height">
        <v-card-title class="panel-title">{{ t.assets }}</v-card-title>
        <v-card-text class="panel-body">
            <v-tabs
                v-model="tab"
                density="compact"
                show-arrows
                class="asset-tabs"
            >
                <v-tab value="templates">{{ t.templates }}</v-tab>
                <v-tab value="frames">{{ t.frames }}</v-tab>
                <v-tab value="icons">{{ t.gameIcons }}</v-tab>
                <v-tab value="imported">{{ t.imported }}</v-tab>
                <v-tab value="fonts">{{ t.fonts }}</v-tab>
                <v-tab value="catalog">{{ t.localCatalog }}</v-tab>
            </v-tabs>

            <div class="import-box">
                <input
                    ref="fileInput"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    class="file-input"
                    type="file"
                    @change="handleFileChange"
                />
                <v-btn block variant="outlined" size="small" @click="openFilePicker">
                    {{ t.importImage }}
                </v-btn>
                <div class="import-actions">
                    <v-btn
                        variant="outlined"
                        size="small"
                        :disabled="!selectedFile"
                        @click="emitFileToCanvas"
                    >
                        {{ t.addToCanvas }}
                    </v-btn>
                    <v-btn
                        variant="outlined"
                        size="small"
                        :disabled="!selectedFile"
                        @click="emitFileToLibrary"
                    >
                        {{ t.addToLibrary }}
                    </v-btn>
                </div>
                <div v-if="selectedFile" class="selected-file">
                    {{ selectedFile.name }}
                </div>
            </div>

            <v-window v-model="tab" class="mt-3">
                <v-window-item value="templates">
                    <div class="asset-list">
                        <button
                            v-for="template in templates"
                            :key="template.id"
                            class="asset-row"
                            type="button"
                            @click="$emit('applyTemplate', template)"
                        >
                            <span class="asset-name">{{ template.name }}</span>
                            <span class="asset-meta">{{ template.sourcePreset }}</span>
                        </button>
                    </div>
                </v-window-item>

                <v-window-item value="frames">
                    <div class="asset-list">
                        <button
                            v-for="asset in frameAssets"
                            :key="asset.id"
                            class="asset-row"
                            type="button"
                            @click="$emit('addAssetToCanvas', asset)"
                        >
                            <span class="asset-name">{{ asset.name }}</span>
                            <span class="asset-meta">{{ asset.width }} x {{ asset.height }}</span>
                        </button>
                    </div>
                </v-window-item>

                <v-window-item value="icons">
                    <div class="asset-toolbar">
                        <v-text-field
                            v-model="search"
                            density="compact"
                            hide-details
                            :label="t.search"
                            variant="outlined"
                        />
                    </div>
                    <div class="asset-grid" aria-label="icon asset list">
                        <button
                            v-for="asset in visibleIconAssets"
                            :key="asset.id"
                            class="icon-tile"
                            type="button"
                            @click="$emit('addAssetToCanvas', asset)"
                        >
                            <img v-if="asset.url" :src="asset.url" alt="" />
                        </button>
                    </div>
                </v-window-item>

                <v-window-item value="imported">
                    <div class="asset-list">
                        <button
                            v-for="asset in importedAssets"
                            :key="asset.id"
                            class="asset-row"
                            type="button"
                            @click="$emit('addAssetToCanvas', asset)"
                        >
                            <span class="asset-name">{{ asset.name }}</span>
                            <span class="asset-meta">{{ asset.width }} x {{ asset.height }}</span>
                        </button>
                    </div>
                </v-window-item>

                <v-window-item value="fonts">
                    <div class="asset-list">
                        <div v-for="asset in fontAssets" :key="asset.id" class="asset-row">
                            <span class="asset-name">{{ asset.name }}</span>
                            <span class="asset-meta">Font</span>
                        </div>
                    </div>
                </v-window-item>

                <v-window-item value="catalog">
                    <div class="asset-list">
                        <div v-for="asset in catalogAssets" :key="asset.id" class="asset-row">
                            <span class="asset-name">{{ asset.name }}</span>
                            <span class="asset-meta">{{ asset.kind }}</span>
                        </div>
                    </div>
                </v-window-item>
            </v-window>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { computed, ref } from "vue";

    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import { filterPosterAssetsByKind } from "../../../../utils/posterStudio/assets";
    import type {
        PosterAsset,
        PosterTemplateIndexItem,
    } from "../../../../utils/posterStudio";

    const props = defineProps<{
        assets: PosterAsset[];
        importedAssets: PosterAsset[];
        templates: PosterTemplateIndexItem[];
    }>();

    const emit = defineEmits<{
        addAssetToCanvas: [asset: PosterAsset];
        applyTemplate: [template: PosterTemplateIndexItem];
        addFileToCanvas: [file: File];
        addFileToLibrary: [file: File];
    }>();

    const tab = ref("templates");
    const search = ref("");
    const fileInput = ref<HTMLInputElement>();
    const selectedFile = ref<File>();
    const { t } = useSafeI18n("poster-studio-asset-panel", {
        assets: "Assets",
        templates: "Templates",
        frames: "Frames",
        gameIcons: "Game Icons",
        imported: "Imported",
        fonts: "Fonts",
        localCatalog: "Local Catalog",
        importImage: "Import Image",
        addToCanvas: "Add to Canvas",
        addToLibrary: "Add to Library",
        search: "Search",
    });

    const frameAssets = computed(() => filterPosterAssetsByKind(props.assets, "frame"));
    const iconAssets = computed(() => filterPosterAssetsByKind(props.assets, "icon"));
    const fontAssets = computed(() => filterPosterAssetsByKind(props.assets, "font"));
    const catalogAssets = computed(() =>
        props.assets.filter((asset) => asset.kind === "tile" || asset.kind === "ui"),
    );
    const visibleIconAssets = computed(() => {
        const query = search.value.trim().toLowerCase();
        const source = query
            ? iconAssets.value.filter((asset) => asset.name.toLowerCase().includes(query))
            : iconAssets.value;

        return source.slice(0, 60);
    });

    function openFilePicker() {
        fileInput.value?.click();
    }

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        selectedFile.value = input.files?.[0];
    }

    function emitFileToCanvas() {
        if (selectedFile.value) {
            emit("addFileToCanvas", selectedFile.value);
        }
    }

    function emitFileToLibrary() {
        if (selectedFile.value) {
            emit("addFileToLibrary", selectedFile.value);
        }
    }
</script>

<style scoped>
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

.panel-body {
    padding: 12px;
}

.asset-tabs {
    border: 1px solid var(--vp-c-divider);
}

.asset-tabs :deep(.v-tab) {
    min-width: 78px;
    padding: 0 10px;
    letter-spacing: 0;
}

.import-box {
    display: grid;
    gap: 8px;
    margin-top: 12px;
    padding: 10px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
}

.file-input {
    display: none;
}

.import-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.selected-file {
    overflow: hidden;
    color: var(--vp-c-text-2);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.asset-list {
    display: grid;
    gap: 8px;
    max-height: 58vh;
    overflow: auto;
}

.asset-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 42px;
    padding: 8px 10px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    background: var(--vp-c-bg);
    color: var(--vp-c-text-1);
    cursor: pointer;
    text-align: left;
}

.asset-row:hover {
    border-color: var(--vp-c-brand-1);
}

.asset-name {
    min-width: 0;
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.asset-meta {
    flex: 0 0 auto;
    color: var(--vp-c-text-2);
    font-size: 12px;
}

.asset-toolbar {
    display: grid;
    gap: 8px;
}

.asset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(34px, 1fr));
    gap: 6px;
    margin-top: 12px;
    max-height: 58vh;
    overflow: auto;
}

.icon-tile {
    display: grid;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    background: var(--vp-c-bg-soft);
    cursor: pointer;
}

.icon-tile img {
    width: 70%;
    height: 70%;
    object-fit: contain;
}
</style>
