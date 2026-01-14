<!--
/**
 * @fileoverview Ritual Pattern Generator - Main Component
 * @component RitualGenerator
 * @description Main orchestrator for ritual pattern creation and code generation
 */
-->

<template>
    <v-app class="ritual-generator-app">
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
                    <!-- Left Panel (Controls & Grid) -->
                    <div class="left-panel">
                        <ritual-grid-controls
                            :grid-size="ritualState.gridSize"
                            :max-grid-size="ritualState.maxGridSize"
                            :locked="ritualState.locked"
                            :active-layer="ritualState.activeLayer"
                            :show-keys-overlay="showKeysOverlay"
                            @update:grid-size="updateGridSize"
                            @update:max-grid-size="ritualState.maxGridSize = $event"
                            @update:active-layer="ritualState.activeLayer = $event"
                            @update:show-keys-overlay="updateShowKeysOverlay"
                            @lock-size="handleLockSize"
                            @randomize-runes="randomizeRunes"
                            class="panel-item"
                        />

                        <ritual-grid
                            :grid-size="ritualState.gridSize"
                            :locked="ritualState.locked"
                            :active-layer="ritualState.activeLayer"
                            :pattern="ritualState.pattern"
                            :display-pattern="ritualState.displayPattern"
                            :reagents="ritualState.reagents"
                            :rune-assignments="ritualState.runeAssignments"
                            :rune-letters="runeLetters"
                            :show-keys-overlay="showKeysOverlay"
                            @cell-click="handleCellClick"
                            @cell-right-click="handleCellRightClick"
                            class="panel-item"
                        />

                        <ritual-code-preview
                            :output-format="ritualState.outputFormat"
                            :json-preview="jsonPreview"
                            :kjs-code="kjsCode"
                            :is-valid="ritualState.isValid"
                            :locked="ritualState.locked"
                            @update:output-format="ritualState.outputFormat = $event"
                            class="panel-item"
                        />
                    </div>

                    <!-- Right Panel (Configuration) -->
                    <div class="right-panel">
                        <ritual-keys-editor
                            :keys="ritualState.keys"
                            @update:keys="ritualState.keys = $event"
                            class="panel-item"
                        />

                        <ritual-parameters-editor
                            :parameters="ritualState.parameters"
                            @update:parameters="ritualState.parameters = $event"
                            class="panel-item"
                        />

                        <ritual-manaweave-editor
                            :patterns="ritualState.manaweavePatterns"
                            @update:patterns="ritualState.manaweavePatterns = $event"
                            class="panel-item"
                        />

                        <ritual-command-editor
                            :command="ritualState.command"
                            @update:command="ritualState.command = $event"
                            class="panel-item"
                        />
                    </div>
                </div>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
    import { reactive, watch, nextTick } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import { useRitualGenerator } from "../../../../utils/ritualGenerator";

    import RitualGridControls from "./RitualGridControls.vue";
    import RitualGrid from "./RitualGrid.vue";
    import RitualKeysEditor from "./RitualKeysEditor.vue";
    import RitualParametersEditor from "./RitualParametersEditor.vue";
    import RitualManaweaveEditor from "./RitualManaweaveEditor.vue";
    import RitualCommandEditor from "./RitualCommandEditor.vue";
    import RitualCodePreview from "./RitualCodePreview.vue";

    const { t } = useSafeI18n("ritual-generator", {
        title: "Ritual Pattern Generator",
        instructionClick:
            "Left click to toggle cells. Right click for custom values.",
        instructionWarning:
            "Pattern must have at least one non-zero value. Reagents must be placed on active pattern cells.",
    });

    const {
        state: ritualState,
        showKeysOverlay,
        runeLetters,
        jsonPreview,
        kjsCode,
        initializeGrids,
        generateRandomRunes,
        validateForm,
    } = useRitualGenerator();

    /**
     * Handles grid size updates and reinitializes grids
     * @param newSize - New grid size
     */
    const updateGridSize = (newSize: number) => {
        ritualState.gridSize = newSize;
        initializeGrids();
        nextTick(() => {
            updateGridLayout();
        });
    };

    /**
     * Updates show keys overlay settings
     * @param overlay - New overlay settings
     */
    const updateShowKeysOverlay = (overlay: any) => {
        Object.assign(showKeysOverlay, overlay);
    };

    /**
     * Handles locking the grid size
     */
    const handleLockSize = () => {
        ritualState.locked = true;
        generateRandomRunes();
    };

    /**
     * Handles cell clicks for pattern editing
     * @param row - Row index
     * @param col - Column index
     * @param event - Mouse event
     */
    const handleCellClick = (row: number, col: number, event: MouseEvent) => {
        if (!ritualState.locked) return;

        if (ritualState.activeLayer === "pattern") {
            ritualState.pattern[row][col] =
                ritualState.pattern[row][col] === 0 ? 1 : 0;
            generateRandomRunes();
            updateReagentsToMatchPattern();
        } else if (ritualState.activeLayer === "displayPattern") {
            ritualState.displayPattern[row][col] =
                ritualState.displayPattern[row][col] === 0 ? 1 : 0;
        } else if (ritualState.activeLayer === "reagents") {
            if (ritualState.pattern[row][col] !== 0) {
                const value = prompt(
                    "Enter reagent key (single character):",
                    ritualState.reagents[row][col]
                );
                if (value !== null) {
                    ritualState.reagents[row][col] =
                        value.length > 0 ? value[0] : " ";
                    updateKeysFromReagents();
                }
            }
        }
    };

    /**
     * Handles cell right clicks for custom values
     * @param row - Row index
     * @param col - Column index
     * @param event - Mouse event
     */
    const handleCellRightClick = (
        row: number,
        col: number,
        event: MouseEvent
    ) => {
        if (!ritualState.locked) return;

        if (ritualState.activeLayer === "pattern") {
            const value = prompt(
                "Enter value (number):",
                ritualState.pattern[row][col].toString()
            );
            if (value !== null) {
                const numValue = parseInt(value);
                ritualState.pattern[row][col] = isNaN(numValue)
                    ? ritualState.pattern[row][col]
                    : numValue;
            }
            generateRandomRunes();
            updateReagentsToMatchPattern();
        } else if (ritualState.activeLayer === "displayPattern") {
            const value = prompt(
                "Enter value (number):",
                ritualState.displayPattern[row][col].toString()
            );
            if (value !== null) {
                const numValue = parseInt(value);
                ritualState.displayPattern[row][col] = isNaN(numValue)
                    ? ritualState.displayPattern[row][col]
                    : numValue;
            }
        }
    };

    /**
     * Updates reagents to match current pattern
     */
    const updateReagentsToMatchPattern = () => {
        for (let i = 0; i < ritualState.gridSize; i++) {
            for (let j = 0; j < ritualState.gridSize; j++) {
                if (
                    ritualState.pattern[i][j] === 0 &&
                    ritualState.reagents[i][j] !== " "
                ) {
                    ritualState.reagents[i][j] = " ";
                }
            }
        }
    };

    /**
     * Updates keys from current reagents (only adds new keys, preserves existing)
     */
    const updateKeysFromReagents = () => {
        if (!ritualState.locked) return;

        const existingKeys = { ...ritualState.keys };

        for (let i = 0; i < ritualState.gridSize; i++) {
            for (let j = 0; j < ritualState.gridSize; j++) {
                const char = ritualState.reagents[i][j];
                if (char && char !== " " && !existingKeys[char]) {
                    existingKeys[char] = {
                        item: "",
                        optional: false,
                        consume: true,
                        is_dynamic: false,
                        dynamic_source: false,
                        manual_return: false,
                    };
                }
            }
        }

        ritualState.keys = existingKeys;
    };

    /**
     * Randomizes rune assignments
     */
    const randomizeRunes = () => {
        if (ritualState.locked) {
            generateRandomRunes();
        }
    };

    /**
     * Updates grid layout CSS variables
     */
    const updateGridLayout = () => {
        if (typeof document === "undefined") return;

        nextTick(() => {
            const cellSize = Math.min(
                Math.max(30, 600 / ritualState.gridSize),
                60
            );
            document.documentElement.style.setProperty(
                "--cell-size",
                `${cellSize}px`
            );
        });
    };

    watch(
        () => ritualState.gridSize,
        (newSize) => {
            if (typeof document !== "undefined") {
                document.documentElement.style.setProperty(
                    "--grid-size",
                    newSize.toString()
                );
            }
            initializeGrids();
            nextTick(() => {
                updateGridLayout();
            });
        },
        { immediate: true }
    );

    watch(
        () => ritualState.pattern,
        () => {
            updateReagentsToMatchPattern();
            validateForm();
        },
        { deep: true }
    );

    watch(
        () => ritualState.reagents,
        () => {
            validateForm();
        },
        { deep: true }
    );

    watch(() => ritualState.keys, validateForm, { deep: true });
    watch(
        () => ritualState.locked,
        () => {
            if (ritualState.locked) {
                validateForm();
            }
        }
    );
</script>

<style scoped>
    .ritual-generator-app {
        background-color: #ffffff;
        min-height: 100vh;
    }

    :root.dark .ritual-generator-app {
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
    .v-alert,
    .v-chip,
    .v-btn,
    .v-text-field .v-field,
    .v-textarea .v-field,
    .v-slider,
    .v-tabs {
        border-radius: 4px !important;
        box-shadow: none !important;
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
        grid-template-columns: 2fr 1fr;
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
        position: sticky;
        top: 24px;
    }

    .panel-item {
        width: 100%;
    }

    @media (max-width: 1024px) {
        .main-layout {
            grid-template-columns: 1fr;
            padding: 0 16px;
        }

        .left-panel,
        .right-panel {
            padding: 0;
            gap: 12px;
            position: static;
        }
    }

    .app-title {
        color: var(--vp-c-text-1);
    }

    .theme-divider {
        border-color: var(--vp-c-divider) !important;
    }
</style>

<style scoped></style>
