<!--
/**
 * @fileoverview Image Controls Component
 * @component ImageControls
 * @description Image manipulation controls and save/copy/export buttons
 */
-->

<template>
    <div v-if="activeFileIndex >= 0">
        <div class="text-subtitle-2 mb-2">{{ t.imageControls }}</div>
        <div class="d-flex justify-center align-center ga-2 mb-3">
            <v-btn
                icon="mdi-rotate-left"
                size="small"
                variant="tonal"
                @click="$emit('rotate', -90)"
            />

            <v-slider
                :model-value="currentImageScale"
                min="0.1"
                :max="maxImageScale"
                step="0.05"
                density="compact"
                hide-details
                class="flex-grow-1 mx-2"
                @update:model-value="$emit('update:scale', $event)"
            />

            <v-btn
                icon="mdi-rotate-right"
                size="small"
                variant="tonal"
                @click="$emit('rotate', 90)"
            />
        </div>

        <v-divider class="my-3" />

        <v-row dense>
            <v-col cols="6">
                <v-btn
                    color="primary"
                    prepend-icon="mdi-download"
                    size="small"
                    variant="tonal"
                    @click="$emit('save')"
                    block
                >
                    {{ t.save }}
                </v-btn>
            </v-col>
            <v-col cols="6">
                <v-btn
                    color="secondary"
                    prepend-icon="mdi-content-copy"
                    size="small"
                    variant="tonal"
                    @click="$emit('copy')"
                    block
                >
                    {{ t.copy }}
                </v-btn>
            </v-col>
        </v-row>

        <v-divider class="my-3" />

        <v-row dense>
            <v-col cols="6">
                <v-btn
                    color="success"
                    prepend-icon="mdi-export"
                    size="small"
                    variant="tonal"
                    @click="$emit('export')"
                    block
                >
                    {{ t.exportConfig }}
                </v-btn>
            </v-col>
            <v-col cols="6">
                <v-btn
                    color="info"
                    prepend-icon="mdi-import"
                    size="small"
                    variant="tonal"
                    @click="$emit('import')"
                    block
                >
                    {{ t.importConfig }}
                </v-btn>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../utils/i18n/locale";

    const { t } = useSafeI18n("fgo-image-controls", {
        imageControls: "Controls",
        save: "Save",
        copy: "Copy",
        exportConfig: "Export",
        importConfig: "Import",
        rotateLeft: "Rotate Left",
        rotateRight: "Rotate Right",
        scale: "Scale",
    });

    defineProps<{
        activeFileIndex: number;
        currentImageScale: number;
        maxImageScale: number;
    }>();

    defineEmits<{
        rotate: [degrees: number];
        "update:scale": [value: number];
        save: [];
        copy: [];
        export: [];
        import: [];
    }>();
</script>

<style scoped>
    .panel-item {
        width: 100%;
    }
</style>
