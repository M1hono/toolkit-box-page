<!--
/**
 * @fileoverview FGO Card Generator - Main Component
 * @component CardGenerator
 * @description Advanced FGO card generation with multi-image support and touch controls
 */
-->

<template>
    <v-app class="card-generator-app">
        <v-main>
            <v-container fluid class="pa-0 ma-0" style="max-width: 100%">
                <v-row class="mb-6 mx-0">
                    <v-col cols="12" class="px-6">
                        <div class="text-h3 font-weight-bold mb-2 app-title">
                            {{ t.title }}
                        </div>
                        <v-divider class="theme-divider"></v-divider>
                    </v-col>
                </v-row>

                <div class="main-layout">
                    <div class="left-panel">
                        <v-card class="panel-item">
                            <v-card-title class="text-h6">{{
                                t.cardSettings
                            }}</v-card-title>
                            <v-card-text>
                                <v-row dense>
                                    <v-col cols="6">
                                        <v-select
                                            v-model="cardData.className"
                                            :items="availableClasses"
                                            item-title="label"
                                            item-value="value"
                                            :label="t.class"
                                            density="compact"
                                            variant="outlined"
                                            @update:model-value="
                                                loadClassVariants
                                            "
                                        />
                                    </v-col>
                                    <v-col cols="6">
                                        <v-select
                                            v-model="cardData.classVariant"
                                            :items="classVariants"
                                            item-title="label"
                                            item-value="value"
                                            :label="t.variant"
                                            density="compact"
                                            variant="outlined"
                                            @update:model-value="
                                                renderCardPreview
                                            "
                                        />
                                    </v-col>
                                </v-row>

                                <v-row dense>
                                    <v-col cols="4">
                                        <v-select
                                            v-model="cardData.starLevel"
                                            :items="availableRarities"
                                            item-title="label"
                                            item-value="value"
                                            :label="t.rarity"
                                            density="compact"
                                            variant="outlined"
                                            @update:model-value="
                                                loadRarityVariants
                                            "
                                        />
                                    </v-col>
                                    <v-col cols="4">
                                        <v-select
                                            v-model="cardData.rarityState"
                                            :items="availableRarityStates"
                                            item-title="label"
                                            item-value="filename"
                                            :label="t.state"
                                            density="compact"
                                            variant="outlined"
                                            @update:model-value="
                                                renderCardPreview
                                            "
                                        />
                                    </v-col>
                                    <v-col cols="4">
                                        <v-select
                                            v-model="cardData.frameCategory"
                                            :items="availableFrames"
                                            item-title="label"
                                            item-value="value"
                                            :label="t.frame"
                                            density="compact"
                                            variant="outlined"
                                            @update:model-value="
                                                renderCardPreview
                                            "
                                        />
                                    </v-col>
                                </v-row>

                                <v-row dense>
                                    <v-col cols="6">
                                        <v-text-field
                                            v-model="cardData.name"
                                            :label="t.servantName"
                                            density="compact"
                                            variant="outlined"
                                            @input="renderCardPreview"
                                        />
                                    </v-col>
                                    <v-col cols="6">
                                        <v-text-field
                                            v-model="cardData.subname"
                                            :label="t.className"
                                            density="compact"
                                            variant="outlined"
                                            @input="renderCardPreview"
                                        />
                                    </v-col>
                                </v-row>

                                <v-row dense>
                                    <v-col cols="4">
                                        <v-text-field
                                            v-model.number="cardData.atk"
                                            label="ATK"
                                            type="number"
                                            density="compact"
                                            variant="outlined"
                                            @input="renderCardPreview"
                                        />
                                    </v-col>
                                    <v-col cols="4">
                                        <v-text-field
                                            v-model.number="cardData.hp"
                                            label="HP"
                                            type="number"
                                            density="compact"
                                            variant="outlined"
                                            @input="renderCardPreview"
                                        />
                                    </v-col>
                                    <v-col cols="4">
                                        <div
                                            class="d-flex align-center justify-center"
                                            style="height: 40px"
                                        >
                                            <v-switch
                                                v-model="cardData.isGold"
                                                :label="t.goldNumbers"
                                                color="warning"
                                                density="compact"
                                                hide-details
                                                @update:model-value="
                                                    renderCardPreview
                                                "
                                            />
                                        </div>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>

                        <v-card class="panel-item">
                            <v-card-title class="text-h6">{{
                                t.imageUpload
                            }}</v-card-title>
                            <v-card-text>
                                <div
                                    class="drop-zone"
                                    :class="{ dragging: isDragOver }"
                                    @dragover.prevent="isDragOver = true"
                                    @dragleave.prevent="isDragOver = false"
                                    @drop.prevent="onDrop"
                                    @click="triggerFileSelect"
                                >
                                    <v-icon size="24" color="grey"
                                        >mdi-cloud-upload</v-icon
                                    >
                                    <p class="text-caption mt-1 mb-0">
                                        {{
                                            isDragOver
                                                ? t.dropHere
                                                : t.dragOrClick
                                        }}
                                    </p>
                                </div>

                                <input
                                    ref="fileInput"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    style="display: none"
                                    @change="onFileSelect"
                                />

                                <v-list
                                    v-if="uploadedFiles.length > 0"
                                    density="compact"
                                    class="mt-2"
                                >
                                    <v-list-item
                                        v-for="(file, index) in uploadedFiles"
                                        :key="file.id"
                                        :class="{
                                            'bg-surface-variant':
                                                index === activeFileIndex,
                                        }"
                                        @click="setActiveFile(index)"
                                        class="file-item"
                                    >
                                        <template #prepend>
                                            <v-avatar size="24">
                                                <img
                                                    :src="getFilePreview(file)"
                                                    alt="preview"
                                                />
                                            </v-avatar>
                                        </template>

                                        <v-list-item-title
                                            class="text-caption"
                                            >{{
                                                file.file.name
                                            }}</v-list-item-title
                                        >

                                        <template #append>
                                            <div class="d-flex ga-1">
                                                <v-btn
                                                    icon="mdi-rotate-left"
                                                    size="x-small"
                                                    variant="text"
                                                    @click.stop="
                                                        rotateImage(-90)
                                                    "
                                                    :disabled="
                                                        index !==
                                                        activeFileIndex
                                                    "
                                                />
                                                <v-btn
                                                    icon="mdi-rotate-right"
                                                    size="x-small"
                                                    variant="text"
                                                    @click.stop="
                                                        rotateImage(90)
                                                    "
                                                    :disabled="
                                                        index !==
                                                        activeFileIndex
                                                    "
                                                />
                                                <v-btn
                                                    icon="mdi-delete"
                                                    size="x-small"
                                                    variant="text"
                                                    color="error"
                                                    @click.stop="
                                                        removeFile(index)
                                                    "
                                                />
                                            </div>
                                        </template>
                                    </v-list-item>
                                </v-list>
                            </v-card-text>
                        </v-card>

                        <v-card v-if="activeFileIndex >= 0" class="panel-item">
                            <v-card-title class="text-h6">{{
                                t.imageControls
                            }}</v-card-title>
                            <v-card-text>
                                <div
                                    class="d-flex justify-center align-center ga-2 mb-3"
                                >
                                    <v-btn
                                        icon="mdi-rotate-left"
                                        size="small"
                                        variant="tonal"
                                        @click="rotateImage(-90)"
                                    />

                                    <v-slider
                                        v-model="currentImageScale"
                                        min="0.1"
                                        max="3"
                                        step="0.1"
                                        density="compact"
                                        hide-details
                                        class="flex-grow-1 mx-2"
                                        @update:model-value="updateImageScale"
                                    />

                                    <v-btn
                                        icon="mdi-rotate-right"
                                        size="small"
                                        variant="tonal"
                                        @click="rotateImage(90)"
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
                                            @click="saveImage"
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
                                            @click="copyImage"
                                            block
                                        >
                                            {{ t.copy }}
                                        </v-btn>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>
                    </div>

                    <div class="right-panel">
                        <v-card class="panel-item">
                            <v-card-title class="text-h6">{{
                                t.preview
                            }}</v-card-title>
                            <v-card-text>
                                <div class="canvas-container">
                                    <canvas
                                        ref="previewCanvas"
                                        width="500"
                                        height="850"
                                        class="preview-canvas"
                                        @mousedown="onMouseDown"
                                        @mousemove="onMouseMove"
                                        @mouseup="onMouseUp"
                                        @mouseleave="onMouseUp"
                                        @wheel.prevent="onWheel"
                                        @touchstart.prevent="onTouchStart"
                                        @touchmove.prevent="onTouchMove"
                                        @touchend="onTouchEnd"
                                    />
                                </div>
                            </v-card-text>
                        </v-card>
                    </div>
                </div>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, nextTick, watch } from "vue";
    import {
        renderFGOCard,
        scanClassFolders,
        scanClassVariants,
        scanFrameFolders,
        scanRarityVariants,
        CLASS_OPTIONS,
        RARITY_LEVELS,
        RARITY_STATES,
        FRAME_CATEGORIES,
    } from "../../../utils/cardgen";
    import type { FGOCardData, ImageTransform } from "../../../utils/cardgen";
    import { useImageManipulation } from "../../../utils/cardgen/core/useImageManipulation";
    import { useSafeI18n } from "../../../utils/i18n/locale";
    import { getFontUrl } from "../../../utils/cardgen/core/useFGOAssetUrls";

    const { t } = useSafeI18n("fgo-card-generator", {
        title: "FGO Card Generator",
        cardSettings: "Card Settings",
        class: "Class",
        variant: "Variant",
        rarity: "Rarity",
        state: "State",
        frame: "Frame",
        servantName: "Servant",
        className: "Class",
        goldNumbers: "Gold",
        imageUpload: "Images",
        dropHere: "Drop here",
        dragOrClick: "Drag or click",
        imageControls: "Controls",
        save: "Save",
        copy: "Copy",
        preview: "Preview",
    });

    const previewCanvas = ref<HTMLCanvasElement | null>(null);
    const fileInput = ref<HTMLInputElement | null>(null);
    const isDragOver = ref(false);

    const cardData = ref<FGOCardData>({
        starLevel: "5",
        rarityState: "rarity5_1.png",
        className: "saber",
        classVariant: "class3_1",
        frameCategory: "gold",
        name: "Artoria Pendragon",
        subname: "Saber",
        atk: 11221,
        hp: 15150,
        isGold: true,
    });

    const {
        uploadedFiles,
        activeFileIndex,
        addFile,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onWheel,
        rotateImage,
        removeFile,
        setActiveFile,
    } = useImageManipulation(previewCanvas);

    const classVariants = ref<Array<{ value: string; label: string }>>([]);
    const rarityVariants = ref<Array<{ value: string; label: string }>>([]);
    const availableClasses = ref<Array<{ value: string; label: string }>>([]);
    const availableFrames = ref<Array<{ value: string; label: string }>>([]);

    const availableRarities = computed(() =>
        RARITY_LEVELS.map((level) => ({
            value: level,
            label: `${level}★`,
        }))
    );

    const availableRarityStates = computed(() => rarityVariants.value);

    const currentImageScale = computed({
        get: () =>
            activeFileIndex.value >= 0
                ? uploadedFiles.value[activeFileIndex.value]?.state.scale || 1
                : 1,
        set: (value) => updateImageScale(value),
    });

    const loadClassVariants = async () => {
        if (cardData.value.className) {
            classVariants.value = await scanClassVariants(
                cardData.value.className
            );

            const currentVariantValid = classVariants.value.some(
                (v) => v.value === cardData.value.classVariant
            );

            if (
                classVariants.value.length > 0 &&
                (!cardData.value.classVariant || !currentVariantValid)
            ) {
                cardData.value.classVariant = classVariants.value[0].value;
            }
            await nextTick();
            renderCardPreview();
        }
    };

    const loadRarityVariants = async () => {
        if (cardData.value.starLevel) {
            rarityVariants.value = await scanRarityVariants(
                cardData.value.starLevel
            );

            const currentStateValid = rarityVariants.value.some(
                (v: any) =>
                    (v.filename || v.value) === cardData.value.rarityState
            );

            if (
                rarityVariants.value.length > 0 &&
                (!cardData.value.rarityState || !currentStateValid)
            ) {
                const firstVariant = rarityVariants.value[0];
                cardData.value.rarityState =
                    (firstVariant as any).filename || firstVariant.value;
            }
            await nextTick();
            renderCardPreview();
        }
    };

    const renderCardPreview = async () => {
        if (!previewCanvas.value) return;

        const ctx = previewCanvas.value.getContext("2d");
        if (!ctx) return;

        try {
            await Promise.all([
                document.fonts.load("50px FGO"),
                document.fonts.load("22px FGO"),
            ]);

            await renderFGOCard(ctx, cardData.value, uploadedFiles.value);
        } catch (error) {
            // Render failed, continue silently
        }
    };

    const triggerFileSelect = () => {
        fileInput.value?.click();
    };

    const onFileSelect = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            const files = Array.from(input.files);
            for (const file of files) {
                await addFile(file);
            }
            renderCardPreview();
        }
        input.value = "";
    };

    const onDrop = async (event: DragEvent) => {
        isDragOver.value = false;
        if (event.dataTransfer?.files) {
            const files = Array.from(event.dataTransfer.files);
            for (const file of files) {
                if (file.type.startsWith("image/")) {
                    await addFile(file);
                }
            }
            renderCardPreview();
        }
    };

    const updateImageScale = (scale: number) => {
        if (activeFileIndex.value >= 0) {
            const file = uploadedFiles.value[activeFileIndex.value];
            file.state.scale = scale;
            file.state.width = file.image.width * scale * 0.5;
            file.state.height = file.image.height * scale * 0.5;
            renderCardPreview();
        }
    };

    const getFilePreview = (file: any): string => {
        return URL.createObjectURL(file.file);
    };

    const formatFileSize = (bytes: number): string => {
        const kb = bytes / 1024;
        return kb < 1024 ? `${Math.round(kb)}K` : `${(kb / 1024).toFixed(1)}M`;
    };

    const saveImage = () => {
        if (!previewCanvas.value) return;
        const link = document.createElement("a");
        link.download = `fgo-card-${cardData.value.name || "servant"}.png`;
        link.href = previewCanvas.value.toDataURL("image/png");
        link.click();
    };

    const copyImage = async () => {
        if (!previewCanvas.value) return;
        try {
            const blob = await new Promise<Blob | null>((resolve) =>
                previewCanvas.value!.toBlob(resolve, "image/png")
            );
            if (blob) {
                await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob }),
                ]);
            }
        } catch (err) {
            // Copy failed, continue silently
        }
    };

    watch(
        [uploadedFiles, activeFileIndex],
        () => {
            renderCardPreview();
        },
        { deep: true }
    );

    onMounted(async () => {
        try {
            await Promise.all([
                document.fonts.load("50px FGO"),
                document.fonts.load("22px FGO"),
            ]);
        } catch (error) {
            // Font loading failed, continue anyway
        }

        availableClasses.value = await scanClassFolders();
        availableFrames.value = await scanFrameFolders();
        await loadRarityVariants();
        await loadClassVariants();
        await nextTick();
        renderCardPreview();
    });
</script>

<style scoped>
    @font-face {
        font-family: "FGO";
        src: url("https://arkimage.top/fgo/font/honoka.woff") format("woff"),
            url("/Font/honoka.woff") format("woff"),
            url("https://arkimage.top/fgo/font/honoka.ttf") format("truetype"),
            url("/Font/honoka.ttf") format("truetype");
        font-weight: normal;
        font-style: normal;
    }

    .card-generator-app {
        background-color: #ffffff;
        min-height: 100vh;
    }

    :root.dark .card-generator-app {
        background-color: #1b1b1f;
    }

    .v-card {
        border: 1px solid var(--vp-c-divider);
        box-shadow: none !important;
    }

    .v-card .v-card {
        border: 1px solid var(--vp-c-divider-light);
    }

    .v-card,
    .v-sheet,
    .v-btn,
    .v-text-field .v-field,
    .v-slider {
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    .main-layout {
        display: grid;
        grid-template-columns: 1fr 1.5fr;
        gap: 16px;
        padding: 0 24px;
        min-height: auto;
        align-items: start;
    }

    .left-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .right-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
        position: sticky;
        top: 24px;
    }

    .panel-item {
        width: 100%;
    }

    .canvas-container {
        display: flex;
        justify-content: center;
        align-items: center;
        background: var(--vp-c-bg-soft);
        border-radius: 8px;
        padding: 16px;
    }

    .preview-canvas {
        max-width: 100%;
        height: auto;
        border: 2px solid var(--vp-c-divider);
        border-radius: 8px;
        cursor: grab;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .preview-canvas:active {
        cursor: grabbing;
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

    .app-title {
        color: var(--vp-c-text-1);
    }

    .theme-divider {
        border-color: var(--vp-c-divider) !important;
    }

    @media (max-width: 1024px) {
        .main-layout {
            grid-template-columns: 1fr;
            padding: 0 16px;
        }

        .left-panel,
        .right-panel {
            gap: 12px;
            position: static;
        }
    }
</style>
