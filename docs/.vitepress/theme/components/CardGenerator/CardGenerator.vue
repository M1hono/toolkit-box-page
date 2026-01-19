<!--
/**
 * @fileoverview FGO Card Generator - Main Component
 * @component CardGenerator
 * @description Two-panel layout: Settings (left) + Preview (right)
 */
-->

<template>
    <v-app class="card-generator-app">
        <v-main>
            <v-container fluid class="pa-0 ma-0" style="max-width: 100%">
                <v-row class="mb-6 mx-0">
                    <v-col cols="12" class="px-6">
                        <div class="text-h3 font-weight-bold mb-2 app-title">
                            {{ t.cardGenerator }}
                        </div>
                        <v-divider class="theme-divider"></v-divider>
                    </v-col>
                </v-row>

                <div class="main-content">
                    <div
                        class="sidebar"
                        :class="{ 'sidebar-open': sidebarOpen }"
                    >
                        <div class="sidebar-content">
                            <CardSettings
                                v-bind="allProps"
                                @update:class-name="onClassNameChange"
                                @update:class-variant="
                                    cardData.classVariant = $event;
                                    renderCardPreview();
                                "
                                @update:star-level="onRarityChange"
                                @update:rarity-state="
                                    cardData.rarityState = $event;
                                    renderCardPreview();
                                "
                                @update:frame-category="
                                    cardData.frameCategory = $event;
                                    renderCardPreview();
                                "
                                @update:name="
                                    cardData.name = $event;
                                    renderCardPreview();
                                "
                                @update:subname="
                                    cardData.subname = $event;
                                    renderCardPreview();
                                "
                                @update:name-color="
                                    colorState.customNameColor.value = $event;
                                    renderCardPreview();
                                "
                                @update:subname-color="
                                    colorState.customSubnameColor.value =
                                        $event;
                                    renderCardPreview();
                                "
                                @update:atk="
                                    cardData.atk = $event;
                                    renderCardPreview();
                                "
                                @update:hp="
                                    cardData.hp = $event;
                                    renderCardPreview();
                                "
                                @update:is-gold="
                                    cardData.isGold = $event;
                                    renderCardPreview();
                                "
                                @update:use-numbers-for-stats="
                                    statsState.useNumbersForStats.value =
                                        $event;
                                    renderCardPreview();
                                "
                                @update:atk-text="
                                    statsState.customAtkText.value = $event
                                "
                                @update:hp-text="
                                    statsState.customHpText.value = $event
                                "
                                @update:atk-color="
                                    colorState.customAtkColor.value = $event;
                                    renderCardPreview();
                                "
                                @update:hp-color="
                                    colorState.customHpColor.value = $event;
                                    renderCardPreview();
                                "
                                @reset-colors="resetAllColors"
                                @update:use-custom-icon="
                                    customIconState.useCustomIcon.value =
                                        $event;
                                    renderCardPreview();
                                "
                                @update:custom-icon-method="
                                    customIconState.customIconMethod.value =
                                        $event;
                                    onIconMethodChange();
                                "
                                @update:icon-url="
                                    customIconState.customIconUrl.value =
                                        $event;
                                    renderCardPreview();
                                "
                                @update:svg-text="
                                    customIconState.customIconSvgText.value =
                                        $event
                                "
                                @update:svg-color="
                                    customIconState.customIconSvgColor.value =
                                        $event;
                                    renderCardPreview();
                                "
                                @update:iconify-name="
                                    customIconState.customIconifyName.value =
                                        $event;
                                    renderCardPreview();
                                "
                                @update:iconify-color="
                                    customIconState.customIconifyColor.value =
                                        $event;
                                    renderCardPreview();
                                "
                                @update:icon-size="
                                    customIconState.customIconSize.value =
                                        $event;
                                    renderCardPreview();
                                "
                                @update:icon-x="
                                    customIconState.customIconX.value = $event;
                                    renderCardPreview();
                                "
                                @update:icon-y="
                                    customIconState.customIconY.value = $event;
                                    renderCardPreview();
                                "
                                @method-change="onIconMethodChange"
                                @icon-upload="onCustomIconUpload"
                                @search-icons="searchIconify"
                                @trigger-select="triggerFileSelect"
                                @set-active="setActiveFile"
                                @rotate="rotateImage"
                                @remove="removeFile"
                                @update:scale="updateImageScale"
                                @save="saveImage"
                                @copy="copyImage"
                                @export="exportConfig"
                                @import="triggerConfigImport"
                            />
                        </div>
                    </div>

                    <div
                        class="content-area"
                        :class="{ 'sidebar-open': sidebarOpen }"
                    >
                        <div class="preview-section">
                            <v-card class="panel-section">
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
                </div>
            </v-container>
        </v-main>

        <button
            class="floating-sidebar-toggle"
            @click="sidebarOpen = !sidebarOpen"
            :title="sidebarOpen ? 'Hide Settings' : 'Show Settings'"
        >
            <v-icon>mdi-menu</v-icon>
        </button>

        <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*"
            style="display: none"
            @change="onFileSelect"
        />
        <input
            ref="configFileInput"
            type="file"
            accept=".json"
            style="display: none"
            @change="importConfig"
        />
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
        RARITY_LEVELS,
    } from "../../../utils/cardgen";
    import type { FGOCardData } from "../../../utils/cardgen";
    import { useImageManipulation } from "../../../utils/cardgen/core/useImageManipulation";
    import { useIconifyAutocomplete } from "../../../utils/cardgen/core/useIconifyAutocomplete";
    import CardSettings from "./CardSettings.vue";
    import { useSafeI18n } from "../../../utils/i18n/locale";

    const previewCanvas = ref<HTMLCanvasElement | null>(null);
    const fileInput = ref<HTMLInputElement | null>(null);
    const configFileInput = ref<HTMLInputElement | null>(null);

    const { t } = useSafeI18n("fgo-card-generator", {
        cardGenerator: "FGO 从者卡片生成器",
        preview: "预览",
    });

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

    const statsState = {
        useNumbersForStats: ref(true),
        customAtkText: ref(""),
        customHpText: ref(""),
    };

    const colorState = {
        customNameColor: ref(""),
        customSubnameColor: ref(""),
        customAtkColor: ref(""),
        customHpColor: ref(""),
    };

    const customIconState = {
        useCustomIcon: ref(false),
        customIconMethod: ref("upload"),
        customIconUrl: ref(""),
        customIconSvgText: ref(""),
        customIconSvgColor: ref("rgba(0, 0, 0, 1)"),
        customIconifyName: ref(""),
        customIconifyColor: ref("#000000"),
        customIconFile: ref<File | undefined>(undefined),
        customIconSize: ref(76),
        customIconX: ref(213),
        customIconY: ref(753),
    };

    const maxImageScale = ref(5);
    const classVariants = ref<Array<{ value: string; label: string }>>([]);
    const rarityVariants = ref<Array<{ value: string; label: string }>>([]);
    const availableClasses = ref<Array<{ value: string; label: string }>>([]);
    const availableFrames = ref<Array<{ value: string; label: string }>>([]);
    const sidebarOpen = ref(true);

    const { suggestions: iconifySuggestions, search: searchIconify } =
        useIconifyAutocomplete();
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

    const availableRarities = computed(() =>
        RARITY_LEVELS.map((l) => ({ value: l, label: `${l}★` }))
    );
    const availableRarityStates = computed(() => rarityVariants.value);
    const currentImageScale = computed({
        get: () =>
            activeFileIndex.value >= 0
                ? uploadedFiles.value[activeFileIndex.value]?.state.scale || 1
                : 1,
        set: (value) => updateImageScale(value),
    });

    const allProps = computed(() => ({
        cardData: cardData.value,
        availableClasses: availableClasses.value,
        classVariants: classVariants.value,
        availableRarities: availableRarities.value,
        availableRarityStates: availableRarityStates.value,
        availableFrames: availableFrames.value,
        useCustomIcon: customIconState.useCustomIcon.value,
        customIconMethod: customIconState.customIconMethod.value,
        customIconUrl: customIconState.customIconUrl.value,
        customIconSvgText: customIconState.customIconSvgText.value,
        customIconSvgColor: customIconState.customIconSvgColor.value,
        customIconifyName: customIconState.customIconifyName.value,
        customIconifyColor: customIconState.customIconifyColor.value,
        customIconFile: customIconState.customIconFile.value,
        customIconSize: customIconState.customIconSize.value,
        customIconX: customIconState.customIconX.value,
        customIconY: customIconState.customIconY.value,
        iconifySuggestions: iconifySuggestions.value,
        useNumbersForStats: statsState.useNumbersForStats.value,
        customAtkText: statsState.customAtkText.value,
        customHpText: statsState.customHpText.value,
        customNameColor: colorState.customNameColor.value,
        customSubnameColor: colorState.customSubnameColor.value,
        customAtkColor: colorState.customAtkColor.value,
        customHpColor: colorState.customHpColor.value,
        uploadedFiles: uploadedFiles.value,
        activeFileIndex: activeFileIndex.value,
        currentImageScale: currentImageScale.value,
        maxImageScale: maxImageScale.value,
    }));

    async function onClassNameChange(className: string) {
        cardData.value.className = className;
        classVariants.value = await scanClassVariants(className);
        if (classVariants.value.length > 0) {
            cardData.value.classVariant = classVariants.value[0].value;
        }
        renderCardPreview();
    }

    async function onRarityChange(starLevel: string) {
        cardData.value.starLevel = starLevel;
        rarityVariants.value = await scanRarityVariants(starLevel);
        if (rarityVariants.value.length > 0) {
            const first = rarityVariants.value[0];
            cardData.value.rarityState = (first as any).filename || first.value;
        }
        renderCardPreview();
    }

    async function renderCardPreview() {
        if (!previewCanvas.value) return;
        const ctx = previewCanvas.value.getContext("2d");
        if (!ctx) return;

        try {
            await Promise.all([
                document.fonts.load("50px FGO"),
                document.fonts.load("22px FGO"),
            ]);
            await renderFGOCard(
                ctx,
                cardData.value,
                uploadedFiles.value,
                undefined,
                undefined,
                {
                    useNumbersForStats: statsState.useNumbersForStats.value,
                    customAtkText: statsState.customAtkText.value,
                    customHpText: statsState.customHpText.value,
                    useCustomIcon: customIconState.useCustomIcon.value,
                    customIconMethod: customIconState.customIconMethod.value,
                    customIconUrl: customIconState.customIconUrl.value,
                    customIconSvgText: customIconState.customIconSvgText.value,
                    customIconSvgColor:
                        customIconState.customIconSvgColor.value,
                    customIconMdi: customIconState.customIconifyName.value,
                    customIconMdiColor:
                        customIconState.customIconifyColor.value,
                    customIconifyName: customIconState.customIconifyName.value,
                    customIconifyColor:
                        customIconState.customIconifyColor.value,
                    customIconFile: customIconState.customIconFile.value,
                    customIconSize: customIconState.customIconSize.value,
                    customIconX: customIconState.customIconX.value,
                    customIconY: customIconState.customIconY.value,
                    customNameColor: colorState.customNameColor.value,
                    customSubnameColor: colorState.customSubnameColor.value,
                    customAtkColor: colorState.customAtkColor.value,
                    customHpColor: colorState.customHpColor.value,
                }
            );
        } catch (error) {
            // Render failed
        }
    }

    function onIconMethodChange() {
        customIconState.customIconUrl.value = "";
        customIconState.customIconSvgText.value = "";
        customIconState.customIconifyName.value = "";
        customIconState.customIconFile.value = undefined;
        renderCardPreview();
    }

    async function onCustomIconUpload(files: File[] | File | null) {
        if (files) {
            let file: File | null = null;
            if (Array.isArray(files) && files.length > 0) file = files[0];
            else if (files instanceof File) file = files;

            if (file) {
                customIconState.customIconFile.value = file;
                renderCardPreview();
            }
        } else {
            customIconState.customIconFile.value = undefined;
        }
    }

    function triggerFileSelect() {
        fileInput.value?.click();
    }

    async function onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            for (const file of Array.from(input.files)) {
                await addFile(file);
            }
            renderCardPreview();
        }
        input.value = "";
    }

    function updateImageScale(scale: number) {
        if (activeFileIndex.value >= 0) {
            const file = uploadedFiles.value[activeFileIndex.value];
            file.state.scale = scale;
            file.state.width = file.image.width * scale * 0.5;
            file.state.height = file.image.height * scale * 0.5;
            renderCardPreview();
        }
    }

    function resetAllColors() {
        colorState.customNameColor.value = "";
        colorState.customSubnameColor.value = "";
        colorState.customAtkColor.value = "";
        colorState.customHpColor.value = "";
        renderCardPreview();
    }

    function saveImage() {
        if (!previewCanvas.value) return;
        const link = document.createElement("a");
        link.download = `fgo-card-${cardData.value.name || "servant"}.png`;
        link.href = previewCanvas.value.toDataURL("image/png");
        link.click();
    }

    async function copyImage() {
        if (!previewCanvas.value) return;
        try {
            const blob = await new Promise<Blob | null>((r) =>
                previewCanvas.value!.toBlob(r, "image/png")
            );
            if (blob) {
                await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob }),
                ]);
            }
        } catch (error) {
            // Copy failed
        }
    }

    function exportConfig() {
        const config = {
            cardData: {
                starLevel: cardData.value.starLevel,
                rarityState: cardData.value.rarityState,
                className: cardData.value.className,
                classVariant: cardData.value.classVariant,
                frameCategory: cardData.value.frameCategory,
                name: cardData.value.name,
                subname: cardData.value.subname,
                atk: cardData.value.atk,
                hp: cardData.value.hp,
                isGold: cardData.value.isGold,
            },
            stats: {
                useNumbersForStats: statsState.useNumbersForStats.value,
                customAtkText: statsState.customAtkText.value,
                customHpText: statsState.customHpText.value,
            },
            colors: {
                customNameColor: colorState.customNameColor.value,
                customSubnameColor: colorState.customSubnameColor.value,
                customAtkColor: colorState.customAtkColor.value,
                customHpColor: colorState.customHpColor.value,
            },
            customIcon: {
                useCustomIcon: customIconState.useCustomIcon.value,
                customIconMethod: customIconState.customIconMethod.value,
                customIconUrl: customIconState.customIconUrl.value,
                customIconSvgText: customIconState.customIconSvgText.value,
                customIconSvgColor: customIconState.customIconSvgColor.value,
                customIconifyName: customIconState.customIconifyName.value,
                customIconifyColor: customIconState.customIconifyColor.value,
                customIconSize: customIconState.customIconSize.value,
                customIconX: customIconState.customIconX.value,
                customIconY: customIconState.customIconY.value,
            },
            uploadedImages: uploadedFiles.value.map((file) => ({
                id: file.id,
                state: { ...file.state },
            })),
        };

        try {
            const blob = new Blob([JSON.stringify(config, null, 2)], {
                type: "application/json",
            });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `fgo-card-config-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Export failed:", error);
        }
    }

    function triggerConfigImport() {
        configFileInput.value?.click();
    }

    function importConfig(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target?.result as string);
                    if (config.cardData)
                        Object.assign(cardData.value, config.cardData);
                    if (config.useNumbersForStats)
                        statsState.useNumbersForStats.value =
                            config.useNumbersForStats.value;
                    Object.assign(colorState, config);
                    if (config.customIcon)
                        Object.assign(customIconState, config.customIcon);
                    renderCardPreview();
                } catch (error) {
                    // Import failed
                }
            };
            reader.readAsText(input.files[0]);
        }
        input.value = "";
    }

    watch(
        uploadedFiles,
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
            // Font loading failed
        }

        availableClasses.value = await scanClassFolders();
        availableFrames.value = await scanFrameFolders();
        if (cardData.value.starLevel) {
            rarityVariants.value = await scanRarityVariants(
                cardData.value.starLevel
            );
        }
        if (cardData.value.className) {
            classVariants.value = await scanClassVariants(
                cardData.value.className
            );
        }
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

    .main-content {
        display: flex;
        height: calc(100vh - 160px);
        position: relative;
        overflow: hidden;
    }

    .sidebar {
        width: 520px;
        background: var(--vp-c-bg);
        border-right: 1px solid var(--vp-c-divider);
        transition: transform 0.3s ease;
        position: relative;
        z-index: 10;
        height: 100%;
        flex-shrink: 0;
    }

    .sidebar-content {
        padding: 16px;
        max-height: calc(100vh - 160px);
        overflow-y: auto;
        display: block;
    }

    .content-area {
        flex: 1;
        transition: margin-left 0.3s ease;
        background: var(--vp-c-bg);
        height: 100%;
        overflow: hidden;
        min-width: 0;
    }

    .content-area.sidebar-open {
        margin-left: 0;
    }

    .preview-section {
        padding: 16px;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .panel-section {
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .panel-section {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .panel-section .v-card-title {
        flex-shrink: 0;
        padding: 16px 16px 8px 16px;
    }

    .panel-section .v-card-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 8px 16px 16px 16px;
        min-height: 0;
    }

    .canvas-container {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        background: var(--vp-c-bg-soft);
        border-radius: 8px;
        padding: 16px;
    }

    .floating-sidebar-toggle {
        display: none;
    }

    .floating-sidebar-toggle:hover {
        background-color: var(--vp-c-brand-1-dark, #a38348);
        transform: scale(1.1);
    }

    .floating-sidebar-toggle .v-icon {
        font-size: 24px;
    }

    .canvas-container {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        background: var(--vp-c-bg-soft);
        border-radius: 8px;
        padding: 16px;
        min-height: 0;
    }

    .preview-canvas {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
        border: 2px solid var(--vp-c-divider);
        border-radius: 8px;
        cursor: grab;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .preview-canvas:active {
        cursor: grabbing;
    }

    .app-title {
        color: var(--vp-c-text-1);
    }

    .theme-divider {
        border-color: var(--vp-c-divider) !important;
    }

    @media (max-width: 1200px) {
        .sidebar {
            width: 480px;
        }
    }

    @media (max-width: 1024px) {
        .sidebar {
            position: fixed;
            left: -480px;
            top: 0;
            height: 100vh;
            z-index: 1000;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
            width: 480px;
        }

        .sidebar.sidebar-open {
            left: 0;
        }

        .content-area {
            margin-left: 0;
        }

        .sidebar-content {
            max-height: 100vh;
            padding: 12px;
            overflow-y: auto;
            display: block;
        }

        .floating-sidebar-toggle {
            display: flex;
            position: fixed;
            top: 80px;
            right: 16px;
            z-index: 1000;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: var(--vp-c-brand-1, #c5a16b);
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
            align-items: center;
            justify-content: center;
            color: white;
        }

        .floating-sidebar-toggle:hover {
            background-color: var(--vp-c-brand-1-dark, #a38348);
            transform: scale(1.1);
        }

        .floating-sidebar-toggle .v-icon {
            font-size: 24px;
        }
    }

    @media (max-width: 768px) {
        .sidebar {
            width: 100vw;
            left: -100vw;
        }

        .sidebar.sidebar-open {
            left: 0;
        }

        .sidebar-content {
            padding: 8px;
        }

        .floating-sidebar-toggle {
            top: 80px;
            right: 12px;
            width: 44px;
            height: 44px;
        }

        .floating-sidebar-toggle .v-icon {
            font-size: 20px;
        }
    }

    @media (max-width: 480px) {
        .preview-section {
            padding: 8px;
        }

        .canvas-container {
            padding: 8px;
        }

        .sidebar-content {
            padding: 6px;
        }
    }
</style>
