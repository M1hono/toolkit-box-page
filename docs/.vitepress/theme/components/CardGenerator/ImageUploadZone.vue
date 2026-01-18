<!--
/**
 * @fileoverview Image Upload Zone Component
 * @component ImageUploadZone
 * @description Drag & drop zone and uploaded files list
 */
-->

<template>
    <div>
        <div class="text-subtitle-2 mb-2">{{ t.imageUpload }}</div>
        <div
            class="drop-zone"
            :class="{ dragging: isDragOver }"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="onDrop"
            @click="$emit('trigger-select')"
        >
            <v-icon size="24" color="grey">mdi-cloud-upload</v-icon>
            <p class="text-caption mt-1 mb-0">
                {{ isDragOver ? t.dropHere : t.dragOrClick }}
            </p>
        </div>

        <v-list v-if="uploadedFiles.length > 0" density="compact" class="mt-2">
            <v-list-item
                v-for="(file, index) in uploadedFiles"
                :key="file.id"
                :class="{ 'bg-surface-variant': index === activeFileIndex }"
                @click="$emit('set-active', index)"
                class="file-item"
            >
                <template #prepend>
                    <v-avatar size="24">
                        <img :src="getFilePreview(file)" alt="preview" />
                    </v-avatar>
                </template>

                <v-list-item-title class="text-caption">
                    {{ file.file.name }}
                </v-list-item-title>

                <template #append>
                    <div class="d-flex ga-1">
                        <v-btn
                            icon="mdi-rotate-left"
                            size="x-small"
                            variant="text"
                            @click.stop="$emit('rotate', -90)"
                            :disabled="index !== activeFileIndex"
                        />
                        <v-btn
                            icon="mdi-rotate-right"
                            size="x-small"
                            variant="text"
                            @click.stop="$emit('rotate', 90)"
                            :disabled="index !== activeFileIndex"
                        />
                        <v-btn
                            icon="mdi-delete"
                            size="x-small"
                            variant="text"
                            color="error"
                            @click.stop="$emit('remove', index)"
                        />
                    </div>
                </template>
            </v-list-item>
        </v-list>
    </div>
</template>

<script setup lang="ts">
    import { ref } from "vue";
    import { useSafeI18n } from "../../../utils/i18n/locale";

    const { t } = useSafeI18n("fgo-image-upload-zone", {
        imageUpload: "Images",
        dropHere: "Drop here",
        dragOrClick: "Drag or click",
        rotate: "Rotate",
        remove: "Remove",
        active: "Active",
    });

    const isDragOver = ref(false);

    defineProps<{
        uploadedFiles: any[];
        activeFileIndex: number;
    }>();

    defineEmits<{
        "trigger-select": [];
        "set-active": [index: number];
        rotate: [degrees: number];
        remove: [index: number];
    }>();

    function onDrop(event: DragEvent) {
        isDragOver.value = false;
        const files = Array.from(event.dataTransfer?.files || []);
        if (files.length > 0) {
            // Emit files for parent to handle
            window.dispatchEvent(
                new CustomEvent("drop-files", { detail: files })
            );
        }
    }

    function getFilePreview(file: any): string {
        return URL.createObjectURL(file.file);
    }
</script>

<style scoped>
    .panel-item {
        width: 100%;
    }

    .drop-zone {
        border: 1px dashed var(--vp-c-divider);
        border-radius: 8px;
        padding: 16px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        background: var(--vp-c-bg-soft);
    }

    .drop-zone:hover,
    .drop-zone.dragging {
        border-color: var(--vp-c-brand);
        background: var(--vp-c-bg-alt);
    }

    .file-item:hover {
        background-color: var(--vp-c-bg-soft) !important;
    }

    .bg-surface-variant {
        background-color: var(--vp-c-bg-alt) !important;
    }
</style>
