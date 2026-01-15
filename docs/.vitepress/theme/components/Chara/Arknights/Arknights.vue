<!--
/**
 * @fileoverview Arknights Chara Finder Main Component
 * @component Arknights
 * @description Main orchestrator for Arknights character portrait extractor
 */
-->

<template>
    <div class="arknights-app">
        <div class="app-header">
            <div class="header-content">
                <div class="title-section">
                    <button
                        class="sidebar-toggle"
                        @click="sidebarOpen = !sidebarOpen"
                    >
                        {{ sidebarOpen ? "✕" : "☰" }} {{ t.characters }}
                    </button>
                    <h1 class="app-title">{{ t.appTitle }}</h1>
                    <p class="app-subtitle">{{ t.appSubtitle }}</p>
                </div>
                <div class="stats-section">
                    <div class="stat-item">
                        <span class="stat-value">{{ totalCharacters }}</span>
                        <span class="stat-label">{{ t.totalChars }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">{{
                            filteredCharacters.length
                        }}</span>
                        <span class="stat-label">{{ t.filtered }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="main-layout">
            <div
                class="sidebar-overlay"
                v-if="sidebarOpen"
                @click="sidebarOpen = false"
            ></div>
            <div class="left-panel" :class="{ open: sidebarOpen }">
                <arknights-sidebar
                    :characters="paginatedCharacters"
                    :selected-id="selectedCharacterId"
                    :total-count="filteredCharacters.length"
                    :current-page="currentPage"
                    :total-pages="totalPages"
                    :page-size="pageSize"
                    :get-avatar="getAvatarUrl"
                    v-model:search="searchQuery"
                    v-model:type="typeFilter"
                    @select="selectCharacter"
                    @page-change="currentPage = $event"
                />
            </div>

            <div class="right-panel">
                <div v-if="!selectedCharacter" class="empty-state">
                    <h2>{{ t.welcomeTitle }}</h2>
                    <p>{{ t.welcomeDescription }}</p>
                    <div class="welcome-stats">
                        <div>
                            <strong>{{ totalCharacters }}</strong>
                            {{ t.characters }}
                        </div>
                        <div>
                            <strong>{{ totalVariants }}</strong>
                            {{ t.variants }}
                        </div>
                    </div>
                </div>
                <template v-else>
                    <arknights-workspace
                        :character="selectedCharacter"
                        :variant="currentVariant"
                        :current-image="currentImage"
                        :canvas-size="canvasSize"
                        :is-loading="isLoading"
                        :selection="selectionRect"
                        :aspect-ratio="currentAspectRatio"
                        v-model:background-color="backgroundColor"
                        @update:variant="currentVariant = $event"
                        @update:selection="selectionRect = $event"
                        @prev-variant="prevVariant"
                        @next-variant="nextVariant"
                        @detect-face="autoDetectFace"
                        @reset-selection="resetSelection"
                        @download="handleDownloadFull"
                        @download-crop="handleDownloadCrop"
                        @copy="handleCopyFull"
                        @copy-crop="handleCopyCrop"
                        @batch="showBatchDialog = true"
                        @go-stories="goToStories"
                    />

                    <arknights-control-panel
                        :selection="selectionRect"
                        :aspect-ratio="currentAspectRatio"
                        :canvas-size="canvasSize"
                        :current-image="currentImage"
                        :background-color="backgroundColor"
                        @update:selection="selectionRect = $event"
                        @update:aspect-ratio="setAspectRatio"
                    />
                </template>
            </div>
        </div>

        <arknights-batch-dialog
            :show="showBatchDialog"
            @close="showBatchDialog = false"
            @batch-crop="handleBatchCrop"
            @batch-full="handleBatchFull"
        />

        <div
            v-if="isInitialLoading || isBatchProcessing"
            class="loading-overlay"
        >
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>
                    {{ isBatchProcessing ? t.batchProcessing : t.loadingData }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted, nextTick } from "vue";
    import { useData, useRoute } from "vitepress";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import { useArknightsImageLoader } from "../../../../utils/chara/arknights/core/useArknightsImageLoader";
    import { useArknightsCanvasOps } from "../../../../utils/chara/arknights/core/useArknightsCanvasOps";
    import { useArknightsBatchOps } from "../../../../utils/chara/arknights/core/useArknightsBatchOps";
    import { useArknightsFaceDetection } from "../../../../utils/chara/arknights/core/useArknightsFaceDetection";
    import ArknightsSidebar from "./ArknightsSidebar.vue";
    import ArknightsWorkspace from "./ArknightsWorkspace.vue";
    import ArknightsControlPanel from "./ArknightsControlPanel.vue";
    import ArknightsBatchDialog from "./ArknightsBatchDialog.vue";
    import type {
        UnifiedCharacterData,
        SelectionRect,
        CanvasSize,
    } from "../../../../utils/chara/arknights/types";
    import { getLanguageByCode } from "../../../../config/project-config";

    const { t } = useSafeI18n("arknights-main", {
        appTitle: "Arknights Character Portrait Extractor",
        appSubtitle:
            "Extract character portraits from story files with intelligent cropping and batch downloading",
        welcomeTitle: "Select a character to begin",
        welcomeDescription: "Choose a character from the left panel",
        loadingData: "Loading...",
        batchProcessing: "Processing...",
        totalChars: "Total",
        filtered: "Showing",
        characters: "characters",
        variants: "variants",
    });

    const { lang } = useData();
    const route = useRoute();

    const currentLangCode = computed(() => {
        console.log("Current VitePress lang.value:", lang.value);

        const langConfig = getLanguageByCode(lang.value);
        if (langConfig) {
            const linkPath = langConfig.link?.split("/").filter(Boolean)[0];
            if (linkPath) {
                const result = linkPath.replace("-", "_").toLowerCase();
                console.log("Mapped via project-config:", result);
                return result;
            }
        }

        const defaultLang = getLanguageByCode("en-US");
        if (lang.value === "root" && defaultLang) {
            const result =
                defaultLang.link
                    ?.split("/")
                    .filter(Boolean)[0]
                    ?.replace("-", "_")
                    .toLowerCase() || "en_us";
            console.log("Root mapped to default language:", result);
            return result;
        }

        console.log("Fallback to en_us");
        return "en_us";
    });

    const { getVariantImageUrls, loadImage } = useArknightsImageLoader();
    const {
        downloadCroppedImage,
        downloadFullImage,
        copyCroppedToClipboard,
        copyFullToClipboard,
    } = useArknightsCanvasOps();
    const { batchDownloadCropped, batchDownloadFull } = useArknightsBatchOps();
    const { detectFaceRegion, getDefaultSelection } =
        useArknightsFaceDetection();

    const isInitialLoading = ref(true);
    const isLoading = ref(false);
    const isBatchProcessing = ref(false);
    const showBatchDialog = ref(false);

    const sidebarOpen = ref(false);
    const searchQuery = ref("");
    const typeFilter = ref("");
    const currentPage = ref(1);
    const pageSize = ref(10);

    const allCharacters = ref<UnifiedCharacterData[]>([]);
    const selectedCharacter = ref<UnifiedCharacterData | null>(null);
    const selectedCharacterId = ref<string | null>(null);
    const currentVariant = ref("");
    const currentImage = ref<HTMLImageElement | null>(null);

    const canvasSize = ref<CanvasSize>({ width: 800, height: 600 });
    const selectionRect = ref<SelectionRect>({
        x: 100,
        y: 100,
        width: 200,
        height: 200,
    });
    const backgroundColor = ref("#ffffff");
    const currentAspectRatio = ref("free");

    const totalCharacters = computed(() => allCharacters.value.length);
    const totalVariants = computed(() =>
        allCharacters.value.reduce(
            (sum, char) => sum + char.validVariants.length,
            0
        )
    );

    const filteredCharacters = computed(() => {
        let chars = allCharacters.value;
        if (typeFilter.value)
            chars = chars.filter((c) => c.charType === typeFilter.value);
        if (searchQuery.value.trim()) {
            const query = searchQuery.value.toLowerCase();
            chars = chars.filter(
                (c) =>
                    c.displayName.toLowerCase().includes(query) ||
                    c.charId.toLowerCase().includes(query) ||
                    c.searchNames?.some((n: string) =>
                        n.toLowerCase().includes(query)
                    ) ||
                    c.speakerNames?.some((n: string) =>
                        n.toLowerCase().includes(query)
                    )
            );
        }
        return chars;
    });

    const paginatedCharacters = computed(() => {
        const start = (currentPage.value - 1) * pageSize.value;
        return filteredCharacters.value.slice(start, start + pageSize.value);
    });

    const totalPages = computed(() =>
        Math.ceil(filteredCharacters.value.length / pageSize.value)
    );

    function getAvatarUrl(char: UnifiedCharacterData): string {
        const variant = char.validVariants[0] || char.charId;
        return getVariantImageUrls(variant).primary;
    }

    async function selectCharacter(char: UnifiedCharacterData) {
        selectedCharacter.value = char;
        selectedCharacterId.value = char.charId;
        sidebarOpen.value = false;

        if (typeof window !== "undefined") {
            window.history.pushState(
                {},
                "",
                `${route.path}?char=${char.charId}`
            );
        }

        if (char.validVariants?.length) {
            const sorted = [...char.validVariants].sort((a, b) => {
                const matchA = a.match(/#(\d+)\$(\d+)$/);
                const matchB = b.match(/#(\d+)\$(\d+)$/);
                if (!matchA && !matchB) return a.localeCompare(b);
                if (!matchA) return 1;
                if (!matchB) return -1;
                const bodyA = parseInt(matchA[2], 10);
                const bodyB = parseInt(matchB[2], 10);
                if (bodyA !== bodyB) return bodyA - bodyB;
                return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
            });
            selectedCharacter.value.validVariants = sorted;
            currentVariant.value = sorted[0];
            await loadVariantImage();
        }
    }

    async function loadVariantImage() {
        if (!currentVariant.value) return;

        try {
            isLoading.value = true;
            const urls = getVariantImageUrls(currentVariant.value);
            const image = await loadImage(urls.primary);
            currentImage.value = image;

            const maxWidth = 800;
            const maxHeight = 600;
            const scale = Math.min(
                maxWidth / image.width,
                maxHeight / image.height,
                1
            );

            canvasSize.value = {
                width: Math.floor(image.width * scale),
                height: Math.floor(image.height * scale),
            };

            resetSelection();
            await nextTick();
            setTimeout(() => autoDetectFace(), 100);
        } catch (error) {
            console.error("Image load error:", error);
        } finally {
            isLoading.value = false;
        }
    }

    function prevVariant() {
        if (!selectedCharacter.value) return;
        const idx = selectedCharacter.value.validVariants.indexOf(
            currentVariant.value
        );
        if (idx > 0)
            currentVariant.value =
                selectedCharacter.value.validVariants[idx - 1];
    }

    function nextVariant() {
        if (!selectedCharacter.value) return;
        const idx = selectedCharacter.value.validVariants.indexOf(
            currentVariant.value
        );
        if (idx < selectedCharacter.value.validVariants.length - 1) {
            currentVariant.value =
                selectedCharacter.value.validVariants[idx + 1];
        }
    }

    function resetSelection() {
        if (!currentImage.value) return;
        const size =
            Math.min(canvasSize.value.width, canvasSize.value.height) * 0.4;
        selectionRect.value = {
            x: (canvasSize.value.width - size) / 2,
            y: (canvasSize.value.height - size) / 2,
            width: size,
            height: size,
        };
    }

    function autoDetectFace() {
        if (!currentVariant.value || !currentImage.value) return;

        const detected = detectFaceRegion(
            currentVariant.value,
            currentImage.value,
            canvasSize.value,
            2.0
        );
        if (detected) {
            selectionRect.value = detected;
        } else {
            selectionRect.value = getDefaultSelection(canvasSize.value);
        }
    }

    function setAspectRatio(ratio: string) {
        currentAspectRatio.value = ratio;
        if (ratio !== "free") {
            const ratios: Record<string, number> = {
                "1:1": 1,
                "4:3": 4 / 3,
                "16:9": 16 / 9,
                "3:4": 3 / 4,
                "9:16": 9 / 16,
            };
            const targetRatio = ratios[ratio];
            if (targetRatio) {
                const currentRatio =
                    selectionRect.value.width / selectionRect.value.height;
                if (currentRatio > targetRatio) {
                    selectionRect.value.width =
                        selectionRect.value.height * targetRatio;
                } else {
                    selectionRect.value.height =
                        selectionRect.value.width / targetRatio;
                }
            }
        }
    }

    async function handleDownloadCrop() {
        if (!currentImage.value || !selectedCharacter.value) return;
        await downloadCroppedImage(
            currentImage.value,
            selectionRect.value,
            canvasSize.value,
            backgroundColor.value,
            `${selectedCharacter.value.displayName}_${currentVariant.value}.png`
        );
    }

    async function handleDownloadFull() {
        if (!currentImage.value || !selectedCharacter.value) return;
        await downloadFullImage(
            currentImage.value,
            `${selectedCharacter.value.displayName}_${currentVariant.value}_full.png`
        );
    }

    async function handleCopyCrop() {
        if (!currentImage.value) return;
        try {
            await copyCroppedToClipboard(
                currentImage.value,
                selectionRect.value,
                canvasSize.value,
                backgroundColor.value
            );
        } catch (error) {
            console.error("Copy failed:", error);
        }
    }

    async function handleCopyFull() {
        if (!currentImage.value) return;
        try {
            await copyFullToClipboard(currentImage.value);
        } catch (error) {
            console.error("Copy failed:", error);
        }
    }

    async function handleBatchCrop() {
        if (!selectedCharacter.value) return;
        showBatchDialog.value = false;
        isBatchProcessing.value = true;

        try {
            await batchDownloadCropped(
                selectedCharacter.value.validVariants,
                loadImage,
                getVariantImageUrls,
                selectionRect.value,
                canvasSize.value,
                backgroundColor.value,
                selectedCharacter.value.displayName
            );
        } finally {
            isBatchProcessing.value = false;
        }
    }

    async function handleBatchFull() {
        if (!selectedCharacter.value) return;
        showBatchDialog.value = false;
        isBatchProcessing.value = true;

        try {
            await batchDownloadFull(
                selectedCharacter.value.validVariants,
                loadImage,
                getVariantImageUrls,
                selectedCharacter.value.displayName
            );
        } finally {
            isBatchProcessing.value = false;
        }
    }

    function goToStories() {
        if (!selectedCharacter.value) return;
        const langPart = lang.value === 'root' ? '' : `/${lang.value}`;
        const name = selectedCharacter.value.displayName;
        const charId = selectedCharacter.value.charId;
        const url = `${langPart}/Arknights/StoryTracker?char=${encodeURIComponent(name)}_${charId}`;
        window.location.href = url;
    }

    async function loadData() {
        try {
            isInitialLoading.value = true;

            const langCode = currentLangCode.value;

            const [globalRes, namesRes] = await Promise.all([
                fetch("/data/global/arknights/characters.json?t=" + Date.now()),
                fetch(`/data/${langCode}/arknights/names.json?t=` + Date.now()),
            ]);

            const globalData = await globalRes.json();
            const namesData = await namesRes.json();

            allCharacters.value = Object.keys(globalData)
                .map((id) => {
                    const normalizedId = id.toLowerCase();
                    const data = globalData[id];

                    if (data.validVariants) {
                        data.validVariants = data.validVariants.map(
                            (v: string) => v.toLowerCase()
                        );
                    }
                    if (data.charId) {
                        data.charId = data.charId.toLowerCase();
                    }

                    return {
                        ...data,
                        ...(namesData[id] ||
                            namesData[normalizedId] || {
                                displayName: normalizedId,
                                speakerNames: [],
                                searchNames: [],
                            }),
                        charId: normalizedId,
                    };
                })
                .sort((a, b) => a.displayName.localeCompare(b.displayName));

            const charParam = new URLSearchParams(window.location.search).get(
                "char"
            );
            if (charParam && allCharacters.value.length > 0) {
                const char = allCharacters.value.find(
                    (c) => c.charId === charParam
                );
                if (char) {
                    await selectCharacter(char);
                }
            }
        } catch (error) {
            // Silent error handling
        } finally {
            isInitialLoading.value = false;
        }
    }

    watch(currentVariant, () => loadVariantImage());
    watch(
        () => lang.value,
        () => loadData()
    );

    onMounted(() => loadData());
</script>

<style scoped>
    .arknights-app :deep(.v-card-title),
    .arknights-app :deep(h1),
    .arknights-app :deep(h2),
    .arknights-app :deep(h3) {
        border-top: none !important;
        border-bottom: none !important;
    }

    .arknights-app {
        min-height: 100vh;
        background: var(--vp-c-bg);
        padding: 24px;
    }

    .app-header {
        margin-bottom: 24px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--vp-c-divider);
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .app-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--vp-c-text-1);
        margin: 0 0 8px 0;
    }

    .app-subtitle {
        font-size: 0.9rem;
        color: var(--vp-c-text-2);
        margin: 0;
    }

    .stats-section {
        display: flex;
        gap: 24px;
    }

    .stat-item {
        text-align: right;
    }

    .stat-value {
        display: block;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--vp-c-brand-1);
    }

    .stat-label {
        font-size: 0.7rem;
        color: var(--vp-c-text-3);
        text-transform: uppercase;
    }

    .sidebar-toggle {
        display: none;
        padding: 8px 16px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        margin-bottom: 12px;
    }

    .sidebar-overlay {
        display: none;
    }

    .main-layout {
        display: flex;
        gap: 20px;
        min-height: calc(100vh - 140px);
        align-items: stretch;
        position: relative;
    }

    .left-panel {
        width: 340px;
        flex-shrink: 0;
        transition: transform 0.3s ease;
    }

    .right-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 0;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        background: var(--vp-c-bg-soft);
        border: 1px dashed var(--vp-c-divider);
        border-radius: 8px;
        text-align: center;
        padding: 48px 48px 20px;
    }

    .empty-state h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--vp-c-text-2);
        margin: 0 0 12px 0;
    }

    .empty-state p {
        color: var(--vp-c-text-3);
        margin: 0 0 24px 0;
    }

    .welcome-stats {
        display: flex;
        gap: 32px;
        font-size: 0.9rem;
        color: var(--vp-c-text-2);
    }

    .welcome-stats strong {
        color: var(--vp-c-brand-1);
        font-size: 1.25rem;
        display: block;
        margin-bottom: 4px;
    }

    .loading-overlay {
        position: fixed;
        inset: 0;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .loading-content {
        text-align: center;
    }

    .loading-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid var(--vp-c-divider);
        border-top-color: var(--vp-c-brand-1);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .loading-overlay p {
        color: var(--vp-c-text-2);
    }

    @media (max-width: 1024px) {
        .sidebar-toggle {
            display: block;
        }

        .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 998;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .left-panel.open ~ .sidebar-overlay,
        .sidebar-overlay:has(~ .left-panel.open) {
            opacity: 1;
            pointer-events: auto;
        }

        .left-panel {
            position: fixed;
            left: 0;
            top: 0;
            height: 100vh;
            width: 340px;
            z-index: 999;
            transform: translateX(-100%);
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
        }

        .left-panel.open {
            transform: translateX(0);
        }

        .main-layout {
            flex-direction: column;
        }

        .right-panel {
            width: 100%;
        }
    }

    @media (max-width: 768px) {
        .arknights-app {
            padding: 16px;
        }

        .app-title {
            font-size: 1.5rem;
        }

        .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
        }

        .stats-section {
            align-self: flex-end;
        }
    }

    :root.dark .loading-overlay {
        background: rgba(0, 0, 0, 0.95);
    }
</style>
