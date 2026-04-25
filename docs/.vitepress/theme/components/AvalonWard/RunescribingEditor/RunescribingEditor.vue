<template>
    <v-app class="runescribing-editor-app">
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
                    <!-- Left Panel (Canvas) -->
                    <div class="left-panel">
                        <rune-canvas
                            ref="canvasRef"
                            :canvas-state="canvasState"
                            :constants="constants"
                            :values="values"
                            @update:canvas-state="canvasState = $event"
                            @update:values="values = $event"
                            class="panel-item"
                        />
                    </div>

                    <!-- Right Panel (Controls) -->
                    <div class="right-panel">
                        <rune-controls
                            :config="config"
                            :values="values"
                            :output-format="outputFormat"
                            :shape-only="shapeOnly"
                            @clear-grid="clearGrid"
                            @fill-grid="fillGrid"
                            @update:config="handleConfigUpdate"
                            @update:output-format="outputFormat = $event"
                            @update:shape-only="shapeOnly = $event"
                            class="panel-item"
                        />
                    </div>
                </div>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
    import { ref, reactive } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import RuneCanvas from "./RuneCanvas.vue";
    import RuneControls from "./RuneControls.vue";
    import type {
        CanvasState,
        CanvasConstants,
        RuneConfig,
        RuneValues,
        OutputFormat,
    } from "../../../../utils/runescribing";

    const { t } = useSafeI18n("runescribing-editor", {
        title: "Rune Scribing Editor",
    });

    const canvasRef = ref<InstanceType<typeof RuneCanvas> | null>(null);

    // Constants
    const constants: CanvasConstants = {
        rows: 7,
        cols: 8,
        canvasWidth: 450,
        canvasHeight: 450,
        cellWidth: 450 / 8,
        cellHeight: 450 / 7,
    };

    // Initialize canvas state
    const initializeCanvasState = (): CanvasState => {
        const hLines = Array(constants.rows + 1)
            .fill(null)
            .map(() => Array(constants.cols).fill(false));
        const vLines = Array(constants.rows)
            .fill(null)
            .map(() => Array(constants.cols + 1).fill(false));

        // Set boundary lines to null
        for (let i = 0; i < constants.cols; i++) {
            hLines[0][i] = null;
            hLines[constants.rows][i] = null;
        }

        for (let i = 0; i < constants.rows; i++) {
            vLines[i][0] = null;
            vLines[i][constants.cols] = null;
        }

        return {
            hLines,
            vLines,
            currentHighlight: null,
        };
    };

    // Reactive state
    const canvasState = ref<CanvasState>(initializeCanvasState());
    const values = ref<RuneValues>({ hValue: 0n, vValue: 0n });
    const config = reactive<RuneConfig>({
        output: "",
        tier: 1,
        requiredFaction: "mna:none",
    });
    const outputFormat = ref<OutputFormat>("json");
    const shapeOnly = ref(false);

    // Methods
    function clearGrid() {
        canvasRef.value?.clearGrid();
    }

    function fillGrid() {
        canvasRef.value?.fillGrid();
    }

    /**
     * Handles config updates from child components
     * @param newConfig - Updated config object
     */
    function handleConfigUpdate(newConfig: RuneConfig) {
        Object.assign(config, newConfig);
    }
</script>

<style scoped>
    .runescribing-editor-app {
        --rune-shell-bg: var(--vp-c-bg);
        --rune-accent: #d6a038;
        --rune-accent-soft: color-mix(in srgb, var(--rune-accent) 20%, var(--vp-c-bg) 80%);
        --rune-surface: color-mix(in srgb, var(--vp-c-bg) 92%, var(--vp-c-bg-soft) 8%);
        --rune-surface-muted: color-mix(
            in srgb,
            var(--vp-c-bg) 84%,
            var(--vp-c-bg-soft) 16%
        );
        --rune-border: color-mix(in srgb, var(--vp-c-divider) 84%, var(--vp-c-text-3) 16%);
        --rune-border-strong: color-mix(
            in srgb,
            var(--vp-c-divider) 68%,
            var(--vp-c-text-2) 32%
        );
        --rune-control-bg: color-mix(in srgb, var(--vp-c-bg) 94%, var(--vp-c-bg-soft) 6%);
        --rune-control-bg-hover: color-mix(
            in srgb,
            var(--vp-c-bg) 90%,
            var(--vp-c-bg-soft) 10%
        );
        --rune-control-bg-disabled: color-mix(
            in srgb,
            var(--vp-c-bg) 86%,
            var(--vp-c-bg-soft) 14%
        );
        --rune-code-bg: color-mix(in srgb, var(--vp-c-bg) 96%, var(--vp-c-bg-soft) 4%);
        --rune-canvas-grid: color-mix(in srgb, var(--vp-c-text-3) 58%, var(--vp-c-bg) 42%);
        --rune-canvas-active: var(--rune-accent);
        --rune-canvas-highlight: color-mix(in srgb, var(--rune-accent) 82%, white 18%);
        background-color: var(--rune-shell-bg);
        min-height: 100vh;
    }

    :deep(.v-card),
    :deep(.v-sheet),
    :deep(.v-alert),
    :deep(.v-chip),
    :deep(.v-btn),
    :deep(.v-text-field .v-field),
    :deep(.v-textarea .v-field),
    :deep(.v-slider) {
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    :deep(.v-card) {
        border: 1px solid var(--rune-border);
        background: var(--rune-surface);
    }

    :deep(.v-card-title) {
        padding: 16px 20px 13px !important;
        border-bottom: 1px solid color-mix(in srgb, var(--rune-border) 84%, transparent);
        background: var(--rune-surface-muted);
        color: var(--vp-c-text-1);
        font-size: 1rem !important;
        font-weight: 600 !important;
        line-height: 1.35;
        min-height: 0;
    }

    :deep(.v-card-text) {
        color: var(--vp-c-text-1);
        padding: 18px 20px 20px !important;
    }

    .v-container {
        padding: 0 !important;
        margin: 0 !important;
    }

    .v-row {
        margin-left: 0 !important;
        margin-right: 0 !important;
    }

    .main-layout {
        display: grid;
        grid-template-columns: minmax(620px, 1.05fr) minmax(360px, 0.95fr);
        gap: 18px;
        padding: 0 24px 24px;
        align-items: start;
    }

    .left-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-right: 0;
    }

    .right-panel {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding-left: 0;
        position: sticky;
        top: 18px;
    }

    .panel-item {
        width: 100%;
        min-width: 0;
    }

    @media (max-width: 1024px) {
        .main-layout {
            grid-template-columns: 1fr;
            padding: 0 16px;
            gap: 16px;
        }

        .left-panel,
        .right-panel {
            padding: 0;
            gap: 14px;
            position: static;
        }
    }

    .app-title {
        color: var(--vp-c-text-1);
    }

    .theme-divider {
        border-color: var(--vp-c-divider) !important;
    }

    :deep(.v-field) {
        background: var(--rune-control-bg);
        min-height: 48px;
        transition:
            background-color 0.18s ease,
            border-color 0.18s ease;
    }

    :deep(.v-field:hover) {
        background: var(--rune-control-bg-hover);
    }

    :deep(.v-field__outline) {
        color: var(--rune-border-strong);
    }

    :deep(.v-field:hover .v-field__outline) {
        color: color-mix(in srgb, var(--vp-c-text-2) 34%, var(--rune-border-strong));
    }

    :deep(.v-field.v-field--focused .v-field__outline) {
        color: var(--rune-accent);
    }

    :deep(.v-field__overlay),
    :deep(.v-field__underlay) {
        background: transparent !important;
    }

    :deep(.v-field--disabled) {
        background: var(--rune-control-bg-disabled);
    }

    :deep(.v-field__field) {
        align-items: center;
    }

    :deep(.v-field__input) {
        min-height: 48px;
        padding-top: 11px !important;
        padding-bottom: 11px !important;
        color: var(--vp-c-text-1);
        font-size: 0.95rem;
        line-height: 1.45;
    }

    :deep(.v-input .v-label),
    :deep(.v-input .v-messages),
    :deep(.v-input .v-field__input),
    :deep(.v-input input::placeholder),
    :deep(.v-input textarea::placeholder) {
        color: var(--vp-c-text-1);
    }

    :deep(.v-input .v-label) {
        color: var(--vp-c-text-3);
        letter-spacing: 0.01em;
    }

    :deep(.v-field--focused .v-label),
    :deep(.v-field--active .v-label) {
        color: var(--vp-c-text-2);
    }

    :deep(.v-input__details) {
        padding-top: 6px;
        min-height: 22px;
    }

    :deep(.v-btn--variant-outlined) {
        border-color: var(--rune-border-strong);
    }

    :deep(.v-btn--variant-outlined:not(.v-btn--disabled):hover) {
        background: color-mix(in srgb, var(--vp-c-bg-soft) 58%, var(--vp-c-bg));
    }

    :deep(.v-btn.v-btn--disabled) {
        opacity: 1 !important;
        color: var(--vp-c-text-3) !important;
        border-color: color-mix(in srgb, var(--rune-border-strong) 76%, transparent) !important;
        background: color-mix(in srgb, var(--vp-c-bg-soft) 78%, var(--vp-c-bg)) !important;
    }

    :deep(.v-btn.v-btn--disabled .v-btn__overlay),
    :deep(.v-btn.v-btn--disabled .v-btn__underlay) {
        display: none;
    }

    :deep(.toolbar-action) {
        background: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
        color: var(--vp-c-text-1) !important;
        min-height: 34px;
        padding-inline: 10px;
    }

    :deep(.toolbar-action .v-btn__overlay),
    :deep(.toolbar-action .v-btn__underlay) {
        display: none;
    }

    :deep(.toolbar-action:not(.v-btn--disabled):hover) {
        background: color-mix(in srgb, var(--vp-c-bg-soft) 58%, transparent) !important;
    }

    :deep(.toolbar-action.v-btn--disabled) {
        background: transparent !important;
        border-color: transparent !important;
        color: var(--vp-c-text-3) !important;
        opacity: 1 !important;
    }

    :deep(.text-warning),
    :deep(.text-primary) {
        color: var(--rune-accent) !important;
    }

    :deep(.bg-warning),
    :deep(.bg-primary) {
        background-color: var(--rune-accent) !important;
    }

    :deep(.rune-field-stack) {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    :deep(.rune-field-label) {
        color: var(--vp-c-text-2);
        font-size: 0.76rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        line-height: 1.2;
        text-transform: uppercase;
    }

    :deep(.rune-native-input) {
        display: block;
        width: 100%;
        min-height: 46px;
        padding: 12px 14px;
        border: 1px solid color-mix(in srgb, var(--rune-border) 84%, transparent);
        border-radius: 12px;
        background: var(--rune-control-bg);
        color: var(--vp-c-text-1);
        font-size: 0.95rem;
        line-height: 1.55;
        box-sizing: border-box;
        transition:
            border-color 0.18s ease,
            background-color 0.18s ease;
    }

    :deep(.rune-native-input:hover) {
        background: var(--rune-control-bg-hover);
    }

    :deep(.rune-native-input:disabled) {
        background: var(--rune-control-bg-disabled);
        color: var(--vp-c-text-3);
        cursor: not-allowed;
    }

    :deep(.rune-native-input:focus) {
        border-color: var(--rune-accent);
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--rune-accent) 42%, transparent);
    }

    :deep(.rune-native-input::placeholder) {
        color: var(--vp-c-text-3);
    }

    :deep(.rune-native-input--mono) {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }
</style>
