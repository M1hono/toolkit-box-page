<template>
    <v-card class="poster-panel">
        <v-card-title class="panel-title">{{ t.layers }}</v-card-title>
        <v-card-text class="panel-body">
            <div class="layer-list">
                <button
                    v-for="layer in layers"
                    :key="layer.id"
                    class="layer-row"
                    :class="{ selected: layer.id === selectedLayerId }"
                    type="button"
                    @click="$emit('selectLayer', layer.id)"
                >
                    <v-icon size="16">{{ iconForLayer(layer.type) }}</v-icon>
                    <span class="layer-name">{{ layer.name }}</span>
                    <v-icon size="16">
                        {{ layer.visible ? "mdi-eye-outline" : "mdi-eye-off-outline" }}
                    </v-icon>
                </button>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { PosterLayer, PosterLayerType } from "../../../../utils/posterStudio";

    defineProps<{
        layers: PosterLayer[];
        selectedLayerId?: string;
    }>();

    defineEmits<{
        selectLayer: [id: string];
    }>();

    const { t } = useSafeI18n("poster-studio-layer-panel", {
        layers: "Layers",
    });

    function iconForLayer(type: PosterLayerType) {
        switch (type) {
            case "text":
                return "mdi-format-text";
            case "image":
                return "mdi-image-outline";
            case "frame":
                return "mdi-vector-square";
            case "icon":
                return "mdi-shape-outline";
            default:
                return "mdi-square-outline";
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

.layer-list {
    display: grid;
    gap: 8px;
}

.layer-row {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr) 20px;
    align-items: center;
    gap: 8px;
    min-height: 38px;
    padding: 6px 8px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    background: var(--vp-c-bg);
    color: var(--vp-c-text-1);
    cursor: pointer;
    text-align: left;
}

.layer-row:hover,
.layer-row.selected {
    border-color: var(--vp-c-brand-1);
}

.layer-name {
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
