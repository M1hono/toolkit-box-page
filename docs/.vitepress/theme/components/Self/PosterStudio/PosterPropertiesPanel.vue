<template>
    <v-card class="poster-panel">
        <v-card-title class="panel-title">{{ t.properties }}</v-card-title>
        <v-card-text class="panel-body">
            <div v-if="layer" class="property-grid">
                <v-text-field
                    density="compact"
                    hide-details
                    :label="t.name"
                    :model-value="layer.name"
                    variant="outlined"
                    @update:model-value="updateLayer({ name: String($event) })"
                />
                <v-select
                    density="compact"
                    hide-details
                    :items="blendModes"
                    :label="t.blend"
                    :model-value="layer.blendMode ?? 'Normal'"
                    variant="outlined"
                    @update:model-value="updateLayer({ blendMode: String($event) })"
                />
                <v-slider
                    hide-details
                    :label="t.opacity"
                    :max="100"
                    :min="0"
                    :model-value="Math.round(layer.opacity * 100)"
                    step="1"
                    thumb-label
                    @update:model-value="updateLayer({ opacity: Number($event) / 100 })"
                />
                <v-slider
                    hide-details
                    :label="t.rotation"
                    :max="180"
                    :min="-180"
                    :model-value="layer.rotation"
                    step="1"
                    thumb-label
                    @update:model-value="updateLayer({ rotation: Number($event) })"
                />
                <v-switch
                    color="primary"
                    density="compact"
                    hide-details
                    :label="t.locked"
                    :model-value="layer.locked"
                    @update:model-value="updateLayer({ locked: Boolean($event) })"
                />
            </div>
            <div v-else class="empty-state">{{ t.noLayerSelected }}</div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { PosterLayer } from "../../../../utils/posterStudio";

    defineProps<{
        layer?: PosterLayer;
    }>();

    const emit = defineEmits<{
        updateLayer: [patch: Partial<PosterLayer>];
    }>();

    const { t } = useSafeI18n("poster-studio-properties-panel", {
        properties: "Properties",
        noLayerSelected: "No layer selected",
        name: "Name",
        blend: "Blend",
        opacity: "Opacity",
        rotation: "Rotation",
        locked: "Locked",
    });
    const blendModes = ["Normal", "Multiply", "Screen", "Overlay"];

    function updateLayer(patch: Partial<PosterLayer>) {
        emit("updateLayer", patch);
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

.property-grid {
    display: grid;
    gap: 12px;
}

.empty-state {
    min-height: 80px;
    color: var(--vp-c-text-2);
    font-size: 13px;
}
</style>
