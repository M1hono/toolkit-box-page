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
                            @clear-grid="clearGrid"
                            @fill-grid="fillGrid"
                            @update:config="handleConfigUpdate"
                            @update:output-format="outputFormat = $event"
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
        background-color: #ffffff;
        min-height: 100vh;
    }

    :root.dark .runescribing-editor-app {
        background-color: #1b1b1f;
    }

    .v-card {
        border: 1px solid #bdbdbd;
        box-shadow: none !important;
    }

    .v-card .v-card {
        border: 1px solid #e0e0e0;
    }

    .v-card,
    .v-sheet,
    .v-alert,
    .v-chip,
    .v-btn,
    .v-text-field .v-field,
    .v-textarea .v-field,
    .v-slider {
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    .v-card {
        border: 1px solid var(--vp-c-divider);
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
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        padding: 0 24px;
        min-height: auto;
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
        gap: 16px;
        padding-left: 0;
    }

    .panel-item {
        width: 100%;
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
            gap: 16px;
        }
    }

    .app-title {
        color: var(--vp-c-text-1);
    }

    .theme-divider {
        border-color: var(--vp-c-divider) !important;
    }
</style>
