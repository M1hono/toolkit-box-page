<template>
    <v-card class="poster-panel">
        <v-card-title class="panel-title">{{ t.layers }}</v-card-title>
        <v-card-text class="panel-body">
            <div class="layer-list">
                <div
                    v-for="layer in displayLayers"
                    :key="layer.id"
                    class="layer-row"
                    :class="{
                        selected: layer.id === selectedLayerId,
                        'drag-over': layer.id === dragOverLayerId,
                    }"
                    draggable="true"
                    role="button"
                    tabindex="0"
                    @click="$emit('selectLayer', layer.id)"
                    @dragstart="handleDragStart(layer.id, $event)"
                    @dragover.prevent="dragOverLayerId = layer.id"
                    @dragleave="dragOverLayerId = undefined"
                    @drop="handleDrop(layer.id)"
                    @keydown.enter="$emit('selectLayer', layer.id)"
                >
                    <v-icon class="layer-kind" size="16">
                        {{ iconForLayer(layer.type) }}
                    </v-icon>
                    <span class="layer-name">{{ layer.name }}</span>
                    <div class="layer-actions">
                        <button
                            class="layer-action"
                            type="button"
                            :aria-label="t.moveUp"
                            :disabled="isTopLayer(layer.id)"
                            @click.stop="moveLayer(layer.id, 1)"
                        >
                            <v-icon size="15">mdi-arrow-up</v-icon>
                        </button>
                        <button
                            class="layer-action"
                            type="button"
                            :aria-label="t.moveDown"
                            :disabled="isBottomLayer(layer.id)"
                            @click.stop="moveLayer(layer.id, -1)"
                        >
                            <v-icon size="15">mdi-arrow-down</v-icon>
                        </button>
                        <button
                            class="layer-action"
                            type="button"
                            :aria-label="layer.visible ? t.hideLayer : t.showLayer"
                            @click.stop="$emit('updateLayer', layer.id, { visible: !layer.visible })"
                        >
                            <v-icon size="15">
                                {{ layer.visible ? "mdi-eye-outline" : "mdi-eye-off-outline" }}
                            </v-icon>
                        </button>
                        <button
                            class="layer-action"
                            type="button"
                            :aria-label="layer.locked ? t.unlockLayer : t.lockLayer"
                            @click.stop="$emit('updateLayer', layer.id, { locked: !layer.locked })"
                        >
                            <v-icon size="15">
                                {{ layer.locked ? "mdi-lock" : "mdi-lock-outline" }}
                            </v-icon>
                        </button>
                        <button
                            class="layer-action danger"
                            type="button"
                            :aria-label="t.deleteLayer"
                            @click.stop="$emit('removeLayer', layer.id)"
                        >
                            <v-icon size="15">mdi-delete-outline</v-icon>
                        </button>
                    </div>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { computed, ref } from "vue";

    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { PosterLayer, PosterLayerType } from "../../../../utils/posterStudio";

    const props = defineProps<{
        layers: PosterLayer[];
        selectedLayerId?: string;
    }>();

    const emit = defineEmits<{
        selectLayer: [id: string];
        reorderLayer: [id: string, targetIndex: number];
        updateLayer: [id: string, patch: Partial<PosterLayer>];
        removeLayer: [id: string];
    }>();

    const { t } = useSafeI18n("poster-studio-layer-panel", {
        layers: "Layers",
        moveUp: "Move up",
        moveDown: "Move down",
        showLayer: "Show layer",
        hideLayer: "Hide layer",
        lockLayer: "Lock layer",
        unlockLayer: "Unlock layer",
        deleteLayer: "Delete layer",
    });
    const draggedLayerId = ref<string>();
    const dragOverLayerId = ref<string>();

    const displayLayers = computed(() => [...props.layers].reverse());

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

    function layerIndex(id: string) {
        return props.layers.findIndex((layer) => layer.id === id);
    }

    function isTopLayer(id: string) {
        return layerIndex(id) === props.layers.length - 1;
    }

    function isBottomLayer(id: string) {
        return layerIndex(id) <= 0;
    }

    function moveLayer(id: string, offset: number) {
        const currentIndex = layerIndex(id);

        if (currentIndex === -1) {
            return;
        }

        emit("reorderLayer", id, currentIndex + offset);
    }

    function handleDragStart(id: string, event: DragEvent) {
        draggedLayerId.value = id;
        event.dataTransfer?.setData("text/plain", id);
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
        }
    }

    function handleDrop(targetId: string) {
        const sourceId = draggedLayerId.value;
        draggedLayerId.value = undefined;
        dragOverLayerId.value = undefined;

        if (!sourceId || sourceId === targetId) {
            return;
        }

        const targetIndex = layerIndex(targetId);

        if (targetIndex !== -1) {
            emit("reorderLayer", sourceId, targetIndex);
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
    max-height: 320px;
    overflow: auto;
}

.layer-list {
    display: grid;
    gap: 6px;
}

.layer-row {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr) auto;
    align-items: center;
    gap: 6px;
    min-height: 42px;
    padding: 6px 8px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    background: var(--vp-c-bg);
    color: var(--vp-c-text-1);
    cursor: grab;
    text-align: left;
}

.layer-row:active {
    cursor: grabbing;
}

.layer-row:hover,
.layer-row.selected {
    border-color: var(--vp-c-brand-1);
}

.layer-row.drag-over {
    border-color: var(--vp-c-brand-1);
    background: var(--vp-c-bg-soft);
}

.layer-kind {
    color: var(--vp-c-text-2);
}

.layer-name {
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.layer-actions {
    display: grid;
    grid-auto-flow: column;
    gap: 2px;
}

.layer-action {
    display: grid;
    width: 24px;
    height: 24px;
    place-items: center;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: var(--vp-c-text-2);
    cursor: pointer;
}

.layer-action:hover:not(:disabled) {
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
}

.layer-action:disabled {
    cursor: default;
    opacity: 0.32;
}

.layer-action.danger:hover {
    color: #b42318;
}
</style>
