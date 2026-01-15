<!--
/**
 * @fileoverview FGO Character Portrait Extractor Main Component
 * @component Fgo
 * @description Main orchestrator for FGO character portrait extraction
 */
-->

<template>
    <div class="fgo-root">
        <fgo-search-bar
            :search-results="searchResults"
            @search="handleSearch"
            @select="selectCharacter"
            @upload="handleFileUpload"
        />

        <div class="layout" :class="{ 'no-panels': !selectedCharacter }">
            <div class="top" v-if="selectedCharacter">
                <fgo-top-controls
                    :all-images="allCharacterImages"
                    :current-image-key="currentImageKey"
                    :selection="selection"
                    :current-aspect-ratio="currentAspectRatio"
                    @select-image="selectImage"
                    @set-aspect-ratio="setAspectRatio"
                    @update-selection="updateFromRect"
                />
            </div>

            <div class="workspace">
                <div v-if="!selectedCharacter" class="empty">
                    <div class="empty-title">{{ t.welcomeTitle }}</div>
                    <div class="empty-sub">{{ t.welcomeDescription }}</div>
                </div>

                <fgo-workspace
                    v-else
                    ref="workspaceRef"
                    :diff-images="diffImages"
                    :current-diff-index="currentDiffIndex"
                    :selection="selection"
                    :is-selecting="isSelecting"
                    :is-resizing="isResizing"
                    :resize-direction="resizeDirection"
                    :get-resize-direction="getResizeDirection"
                    :draw-selection-box="drawSelectionBox"
                    @start-selection="startSelection"
                    @update-selection="updateSelectionLogic"
                    @end-selection="endSelection"
                    @canvas-ready="workspaceCanvas = $event"
                />
            </div>

            <div class="bottom" v-if="selectedCharacter">
                <fgo-bottom-controls
                    :bg-color-hex="bgColorHex"
                    :background-color="backgroundColor"
                    :selection="selection"
                    :current-canvas="workspaceCanvas"
                    :has-diffs="hasDiffs"
                    :is-local-image="isLocalImage"
                    :can-save="canSave"
                    :can-batch="canBatch"
                    :can-copy="canSave"
                    :draw-preview="drawPreview"
                    @update-bg="setBgColor"
                    @prev-diff="previewPreviousDiff"
                    @next-diff="previewNextDiff"
                    @save="saveSelectedArea"
                    @copy="copyToClipboard"
                    @batch="showBatchDialog = true"
                    @detect-face="autoDetectFace"
                />
            </div>
        </div>

        <fgo-batch-dialog
            :show="showBatchDialog"
            @close="showBatchDialog = false"
            @confirm="handleBatchConfirm"
        />

        <div v-if="isLoading" class="loading-overlay">
            <div class="spinner"></div>
            <p>{{ t.loading }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, nextTick } from "vue";
    import { useData, useRoute } from "vitepress";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import { useFgoImageLoader } from "../../../../utils/chara/fgo/core/useFgoImageLoader";
    import { useFgoDiffProcessor } from "../../../../utils/chara/fgo/core/useFgoDiffProcessor";
    import { useFgoSelection } from "../../../../utils/chara/fgo/core/useFgoSelection";
    import { useFgoCanvasOps } from "../../../../utils/chara/fgo/core/useFgoCanvasOps";
    import { useFgoFaceDetection } from "../../../../utils/chara/fgo/core/useFgoFaceDetection";
    import FgoSearchBar from "./FgoSearchBar.vue";
    import FgoWorkspace from "./FgoWorkspace.vue";
    import FgoTopControls from "./FgoTopControls.vue";
    import FgoBottomControls from "./FgoBottomControls.vue";
    import FgoBatchDialog from "./FgoBatchDialog.vue";
    import type {
        FgoCharacter,
        SearchResult,
        ColorRGBA,
        SelectionRect,
    } from "../../../../utils/chara/fgo/types";

    const { t } = useSafeI18n("fgo-main", {
        appTitle: "FGO Character Portrait Extractor",
        appSubtitle:
            "Extract character portraits with diff processing and intelligent cropping",
        searchPlaceholder: "Search character name...",
        uploadImage: "Upload Image",
        welcomeTitle: "Select a character to begin",
        welcomeDescription: "Search for a character or upload an image",
        loading: "Loading...",
        imageSelection: "Image",
        aspectRatio: "Aspect Ratio",
        selection: "Selection",
        preview: "Preview",
        prevDiff: "Prev",
        nextDiff: "Next",
        bgColor: "Background",
        save: "Save",
        batch: "Batch",
        detectFace: "Detect Face",
        onlineOnly: "Online Only",
    });

    const { lang } = useData();
    const route = useRoute();

    const {
        characterData,
        isLoading,
        loadTranslations,
        fetchCharacterData,
        getCharacterName,
        loadImage: loadImageFromUrl,
        extractImageUrls,
    } = useFgoImageLoader();

    const { diffImages, currentDiffIndex, mainColor, processDiffImages } =
        useFgoDiffProcessor();

    const {
        selectionStart,
        selectionEnd,
        selection,
        isSelecting,
        isResizing,
        resizeDirection,
        currentAspectRatio,
        getResizeDirection,
        startSelection,
        updateSelection: updateSelectionLogic,
        endSelection,
        setAspectRatio: setRatio,
    } = useFgoSelection();

    const {
        saveSelectedArea: saveArea,
        batchProcess: processBatch,
        drawSelectionBox,
        drawPreview,
    } = useFgoCanvasOps();

    const {
        faceDetected,
        loadOpenCV,
        initFaceDetector,
        detectFaceInMat,
        detectFaceFromCoordinates,
    } = useFgoFaceDetection();

    const searchResults = ref<SearchResult[]>([]);
    const selectedCharacter = ref<FgoCharacter | null>(null);
    const currentImage = ref<HTMLImageElement | null>(null);
    const allCharacterImages = ref<Record<string, string>>({});
    const currentImageKey = ref("");
    const isLocalImage = ref(false);
    const showBatchDialog = ref(false);
    const bgColorHex = ref("#ffffff");

    const workspaceRef = ref<InstanceType<typeof FgoWorkspace> | null>(null);
    const workspaceCanvas = ref<HTMLCanvasElement | null>(null);

    const hasImages = computed(
        () => Object.keys(allCharacterImages.value).length > 0
    );
    const hasDiffs = computed(() => diffImages.value.length > 0);

    const canSave = computed(() => {
        return !!(
            selectedCharacter.value &&
            workspaceCanvas.value &&
            hasDiffs.value
        );
    });

    const canBatch = computed(() => {
        return !!(
            selectedCharacter.value &&
            hasDiffs.value &&
            diffImages.value.length > 1
        );
    });

    const backgroundColor = computed<ColorRGBA>(() => {
        const hex = bgColorHex.value
            .replace("#", "")
            .padEnd(6, "f")
            .slice(0, 6);
        const r = Number.parseInt(hex.slice(0, 2), 16);
        const g = Number.parseInt(hex.slice(2, 4), 16);
        const b = Number.parseInt(hex.slice(4, 6), 16);
        return { r, g, b, a: 1 };
    });

    function handleSearch(query: string) {
        const q = (query || "").trim().toLowerCase();
        if (!q) {
            searchResults.value = [];
            return;
        }
        searchResults.value = characterData.value
            .filter((char) => {
                const name = getCharacterName(char);
                return (
                    name.toLowerCase().includes(q) ||
                    char.name.toLowerCase().includes(q)
                );
            })
            .slice(0, 10)
            .map((char) => {
                // Extract first face ID from faceCoordinates for icon display
                const faceCoords = char.imageData?.faceCoordinates;
                const firstFaceId = faceCoords
                    ? Object.keys(faceCoords)[0]
                    : null;

                return {
                    id: char.id,
                    name: getCharacterName(char),
                    jpName: char.name,
                    faceId: firstFaceId ? Number(firstFaceId) : char.id,
                };
            });
    }

    async function selectCharacter(result: SearchResult) {
        const character = characterData.value.find((c) => c.id === result.id);
        if (!character) return;

        selectedCharacter.value = character;
        isLocalImage.value = false;
        searchResults.value = [];

        if (typeof window !== "undefined") {
            window.history.pushState(
                {},
                "",
                `${route.path}?char=${character.id}`
            );
        }

        const imageUrls = extractImageUrls(character);
        allCharacterImages.value = imageUrls;

        const keys = Object.keys(imageUrls);
        if (keys.length > 0) {
            currentImageKey.value = keys[0];
            await selectImage(keys[0]);
        }
    }

    async function selectImage(key: string) {
        const url = allCharacterImages.value[key];
        if (!url) {
            return;
        }

        try {
            faceDetected.value = false;
            currentImage.value = await loadImageFromUrl(url);

            diffImages.value = await processDiffImages(
                currentImage.value,
                (bodyMat: any) => {
                    const faceRect = detectFaceInMat(bodyMat);
                    if (faceRect) {
                        selectionStart.value = { x: faceRect.x, y: faceRect.y };
                        selectionEnd.value = {
                            x: faceRect.x + faceRect.width,
                            y: faceRect.y + faceRect.height,
                        };
                        faceDetected.value = true;
                    }
                }
            );

            currentDiffIndex.value = 0;

            if (!faceDetected.value && !isLocalImage.value) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                const faceRect = detectFaceFromCoordinates(
                    selectedCharacter.value!,
                    currentImageKey.value,
                    currentImage.value
                );
                if (faceRect) {
                    selectionStart.value = { x: faceRect.x, y: faceRect.y };
                    selectionEnd.value = {
                        x: faceRect.x + faceRect.width,
                        y: faceRect.y + faceRect.height,
                    };
                    faceDetected.value = true;
                }
            }

            if (!faceDetected.value) {
                selectionStart.value = { x: 256, y: 100 };
                selectionEnd.value = { x: 768, y: 600 };
            }

            await nextTick();
            workspaceRef.value?.draw?.();
        } catch (error) {
            // Silent error handling
        }
    }

    async function handleFileUpload(file: File) {
        if (!file) return;

        isLocalImage.value = true;
        selectedCharacter.value = {
            id: 0,
            name: file.name.replace(/\.(png|jpg|jpeg)$/i, ""),
            jpName: "Local",
        };
        allCharacterImages.value = {};

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const dataUrl = evt.target?.result as string;
            if (dataUrl) {
                allCharacterImages.value = { imported: dataUrl };
                currentImageKey.value = "imported";

                try {
                    currentImage.value = await loadImageFromUrl(dataUrl);
                    diffImages.value = await processDiffImages(
                        currentImage.value
                    );
                    currentDiffIndex.value = 0;
                    selectionStart.value = { x: 0, y: 0 };
                    selectionEnd.value = { x: 256, y: 256 };
                    workspaceRef.value?.draw?.();
                } catch (error) {
                    // Silent error handling
                }
            }
        };
        reader.readAsDataURL(file);
    }

    function setAspectRatio(ratio: string) {
        setRatio(ratio);
        workspaceRef.value?.draw?.();
    }

    function previewPreviousDiff() {
        if (diffImages.value.length === 0) return;
        currentDiffIndex.value =
            (currentDiffIndex.value - 1 + diffImages.value.length) %
            diffImages.value.length;
        nextTick(() => {
            workspaceRef.value?.draw?.();
        });
    }

    function previewNextDiff() {
        if (diffImages.value.length === 0) return;
        currentDiffIndex.value =
            (currentDiffIndex.value + 1) % diffImages.value.length;
        nextTick(() => {
            workspaceRef.value?.draw?.();
        });
    }

    async function saveSelectedArea() {
        if (!workspaceCanvas.value || !selectedCharacter.value) return;
        await saveArea(
            workspaceCanvas.value,
            selection.value,
            backgroundColor.value,
            `${selectedCharacter.value.name}_selected.png`
        );
    }

    async function handleBatchConfirm(type: "cropped" | "full") {
        showBatchDialog.value = false;
        if (!selectedCharacter.value || diffImages.value.length === 0) return;

        try {
            await processBatch(
                diffImages.value,
                type === "cropped" ? selection.value : null,
                backgroundColor.value,
                selectedCharacter.value.name
            );
        } catch (error) {
            // Silent error handling
        }
    }

    function autoDetectFace() {
        if (
            isLocalImage.value ||
            !selectedCharacter.value ||
            !currentImage.value
        )
            return;

        const faceRect = detectFaceFromCoordinates(
            selectedCharacter.value,
            currentImageKey.value,
            currentImage.value
        );
        if (faceRect) {
            selectionStart.value = { x: faceRect.x, y: faceRect.y };
            selectionEnd.value = {
                x: faceRect.x + faceRect.width,
                y: faceRect.y + faceRect.height,
            };
            faceDetected.value = true;
            workspaceRef.value?.draw?.();
        }
    }

    function updateFromRect(rect: SelectionRect) {
        selectionStart.value = { x: rect.x, y: rect.y };
        selectionEnd.value = {
            x: rect.x + rect.width,
            y: rect.y + rect.height,
        };
        workspaceRef.value?.draw?.();
    }

    function setBgColor(hex: string) {
        bgColorHex.value = hex;
    }

    async function copyToClipboard() {
        if (!workspaceCanvas.value || !selectedCharacter.value) return;

        const offset = 2;
        const sx = selection.value.x + offset;
        const sy = selection.value.y + offset;
        const sw = selection.value.width - 2 * offset;
        const sh = selection.value.height - 2 * offset;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = sw;
        tempCanvas.height = sh;
        const ctx = tempCanvas.getContext("2d");
        if (!ctx) return;

        const bg = backgroundColor.value;
        ctx.fillStyle = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${bg.a})`;
        ctx.fillRect(0, 0, sw, sh);
        ctx.drawImage(workspaceCanvas.value, sx, sy, sw, sh, 0, 0, sw, sh);

        try {
            const blob = await new Promise<Blob>((resolve) =>
                tempCanvas.toBlob((b) => resolve(b!))
            );
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
            ]);
        } catch (error) {
            // Silent error handling
        }
    }

    onMounted(async () => {
        await loadTranslations();
        await fetchCharacterData();
        await loadOpenCV();
        setTimeout(() => initFaceDetector(), 1000);

        const charParam = new URLSearchParams(window.location.search).get(
            "char"
        );
        if (charParam && characterData.value.length > 0) {
            const charId = Number(charParam);
            const char = characterData.value.find((c) => c.id === charId);
            if (char) {
                const result: SearchResult = {
                    id: char.id,
                    name: getCharacterName(char),
                    jpName: char.name,
                    faceId:
                        Number(
                            Object.keys(
                                char.imageData?.faceCoordinates || {}
                            )[0]
                        ) || charId,
                };
                await selectCharacter(result);
            }
        }
    });
</script>

<style scoped>
    .fgo-root :deep(.v-card-title),
    .fgo-root :deep(h1),
    .fgo-root :deep(h2),
    .fgo-root :deep(h3) {
        border-top: none !important;
        border-bottom: none !important;
    }

    .fgo-root {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .layout {
        flex: 1;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 380px;
        grid-template-areas:
            "workspace top"
            "workspace bottom";
        grid-template-rows: auto minmax(0, 1fr);
        gap: 14px;
        padding: 0 16px 16px 16px;
    }

    .layout.no-panels {
        grid-template-columns: 1fr;
        grid-template-areas: "workspace";
        grid-template-rows: 1fr;
    }

    .top {
        grid-area: top;
        align-self: end;
    }

    .workspace {
        grid-area: workspace;
        min-height: 640px;
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }

    .bottom {
        grid-area: bottom;
        align-self: start;
    }

    .empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--vp-c-bg-soft);
        border: 1px solid var(--vp-c-divider);
        border-radius: 12px;
        padding: 48px 24px;
        min-height: 400px;
    }

    .empty-title {
        font-weight: 700;
        font-size: 1.1rem;
        color: var(--vp-c-text-1);
    }

    .empty-sub {
        margin-top: 6px;
        color: var(--vp-c-text-3);
        font-size: 0.9rem;
        text-align: center;
        max-width: 520px;
    }

    .loading-overlay {
        position: fixed;
        inset: 0;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .spinner {
        width: 48px;
        height: 48px;
        border: 3px solid var(--vp-c-divider);
        border-top-color: var(--vp-c-brand-1);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .loading-overlay p {
        margin-top: 16px;
        color: var(--vp-c-text-2);
    }

    @media (max-width: 1200px) {
        .layout {
            grid-template-columns: 1fr;
            grid-template-areas:
                "top"
                "workspace"
                "bottom";
            grid-template-rows: auto auto auto;
        }

        .workspace {
            min-height: 520px;
        }
    }

    @media (max-width: 768px) {
        .workspace {
            min-height: 420px;
        }
    }

    :root.dark .loading-overlay {
        background: rgba(0, 0, 0, 0.95);
    }
</style>
