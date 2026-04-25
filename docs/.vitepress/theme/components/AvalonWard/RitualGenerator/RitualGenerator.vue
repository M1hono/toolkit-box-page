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
                            :shape-only="ritualState.shapeOnly"
                            :json-preview="jsonPreview"
                            :kjs-code="kjsCode"
                            :pattern-rows="patternRows"
                            :display-pattern-rows="displayPatternRows"
                            :reagent-rows="reagentRows"
                            :is-valid="ritualState.isValid"
                            :locked="ritualState.locked"
                            @update:output-format="ritualState.outputFormat = $event"
                            @update:shape-only="ritualState.shapeOnly = $event"
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
        reagentPrompt: "Enter reagent key (single character):",
        valuePrompt: "Enter value (number):",
    });

    const {
        state: ritualState,
        showKeysOverlay,
        runeLetters,
        jsonPreview,
        kjsCode,
        patternRows,
        displayPatternRows,
        reagentRows,
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
                    t.reagentPrompt,
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
                t.valuePrompt,
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
                t.valuePrompt,
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
    watch(() => ritualState.parameters, validateForm, { deep: true });
    watch(() => ritualState.shapeOnly, validateForm);
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
        --ritual-shell-bg: var(--vp-c-bg);
        --ritual-accent: #d6a038;
        --ritual-accent-soft: color-mix(in srgb, var(--ritual-accent) 20%, var(--vp-c-bg) 80%);
        --ritual-surface: color-mix(in srgb, var(--vp-c-bg) 92%, var(--vp-c-bg-soft) 8%);
        --ritual-surface-muted: color-mix(
            in srgb,
            var(--vp-c-bg) 84%,
            var(--vp-c-bg-soft) 16%
        );
        --ritual-border: color-mix(in srgb, var(--vp-c-divider) 84%, var(--vp-c-text-3) 16%);
        --ritual-border-strong: color-mix(
            in srgb,
            var(--vp-c-divider) 68%,
            var(--vp-c-text-2) 32%
        );
        --ritual-grid-stage: color-mix(
            in srgb,
            var(--vp-c-bg-soft) 70%,
            var(--vp-c-bg) 30%
        );
        --ritual-grid-cell: color-mix(in srgb, var(--vp-c-bg) 88%, var(--vp-c-bg-soft) 12%);
        --ritual-grid-active: color-mix(in srgb, var(--ritual-accent) 16%, var(--vp-c-bg) 84%);
        --ritual-grid-special: color-mix(
            in srgb,
            var(--ritual-accent) 28%,
            var(--vp-c-bg) 72%
        );
        --ritual-grid-label-bg: color-mix(in srgb, var(--vp-c-bg) 76%, transparent);
        --ritual-control-bg: color-mix(in srgb, var(--vp-c-bg) 94%, var(--vp-c-bg-soft) 6%);
        --ritual-control-bg-hover: color-mix(
            in srgb,
            var(--vp-c-bg) 90%,
            var(--vp-c-bg-soft) 10%
        );
        --ritual-control-bg-disabled: color-mix(
            in srgb,
            var(--vp-c-bg) 86%,
            var(--vp-c-bg-soft) 14%
        );
        --ritual-code-bg: color-mix(in srgb, var(--vp-c-bg) 96%, var(--vp-c-bg-soft) 4%);
        background-color: var(--ritual-shell-bg);
        min-height: 100vh;
    }

    :deep(.v-card),
    :deep(.v-sheet),
    :deep(.v-alert),
    :deep(.v-chip),
    :deep(.v-btn),
    :deep(.v-text-field .v-field),
    :deep(.v-textarea .v-field),
    :deep(.v-slider),
    :deep(.v-tabs),
    :deep(.v-list-item),
    :deep(.v-switch) {
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    :deep(.v-card) {
        border: 1px solid var(--ritual-border);
        background: var(--ritual-surface);
    }

    :deep(.v-card-title) {
        padding: 16px 20px 13px !important;
        border-bottom: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        background: var(--ritual-surface-muted);
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

    :deep(.v-field) {
        background: var(--ritual-control-bg);
        min-height: 48px;
        transition:
            background-color 0.18s ease,
            border-color 0.18s ease;
    }

    :deep(.v-field:hover) {
        background: var(--ritual-control-bg-hover);
    }

    :deep(.v-field__outline) {
        color: var(--ritual-border-strong);
    }

    :deep(.v-field:hover .v-field__outline) {
        color: color-mix(in srgb, var(--vp-c-text-2) 36%, var(--ritual-border-strong));
    }

    :deep(.v-field.v-field--focused .v-field__outline) {
        color: var(--ritual-accent);
    }

    :deep(.v-field__overlay),
    :deep(.v-field__underlay) {
        background: transparent !important;
    }

    :deep(.v-field--disabled) {
        background: var(--ritual-control-bg-disabled);
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

    :deep(.v-field__append-inner),
    :deep(.v-field__prepend-inner) {
        align-items: center;
        color: var(--vp-c-text-2);
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
        border-color: var(--ritual-border-strong);
    }

    :deep(.v-btn--variant-outlined:not(.v-btn--disabled):hover) {
        background: color-mix(in srgb, var(--vp-c-bg-soft) 58%, var(--vp-c-bg));
    }

    :deep(.v-btn.v-btn--disabled) {
        opacity: 1 !important;
        color: var(--vp-c-text-3) !important;
        border-color: color-mix(in srgb, var(--ritual-border-strong) 76%, transparent) !important;
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

    :deep(.v-tabs) {
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        background: color-mix(in srgb, var(--vp-c-bg) 92%, var(--vp-c-bg-soft) 8%);
    }

    :deep(.v-tab) {
        text-transform: none;
        min-height: 42px;
        font-weight: 600;
        color: var(--vp-c-text-2);
    }

    :deep(.v-tab.v-tab--selected) {
        color: var(--ritual-accent);
        background: color-mix(in srgb, var(--ritual-accent) 14%, var(--vp-c-bg) 86%);
    }

    :deep(.v-selection-control) {
        min-height: 36px;
    }

    :deep(.v-selection-control .v-label),
    :deep(.v-list-item-title) {
        color: var(--vp-c-text-1);
        line-height: 1.45;
    }

    :deep(.text-warning),
    :deep(.text-primary) {
        color: var(--ritual-accent) !important;
    }

    :deep(.bg-warning),
    :deep(.bg-primary) {
        background-color: var(--ritual-accent) !important;
    }

    :deep(.v-list) {
        background: transparent;
    }

    :deep(.ritual-field-stack) {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    :deep(.ritual-field-label) {
        color: var(--vp-c-text-2);
        font-size: 0.76rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        line-height: 1.2;
        text-transform: uppercase;
    }

    :deep(.ritual-native-input) {
        display: block;
        width: 100%;
        min-height: 46px;
        padding: 12px 14px;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        border-radius: 12px;
        background: var(--ritual-control-bg);
        color: var(--vp-c-text-1);
        font-size: 0.95rem;
        line-height: 1.55;
        box-sizing: border-box;
        transition:
            border-color 0.18s ease,
            background-color 0.18s ease;
    }

    :deep(.ritual-native-input:hover) {
        background: var(--ritual-control-bg-hover);
    }

    :deep(.ritual-native-input:disabled) {
        background: var(--ritual-control-bg-disabled);
        color: var(--vp-c-text-3);
        cursor: not-allowed;
    }

    :deep(.ritual-native-input:focus) {
        border-color: var(--ritual-accent);
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--ritual-accent) 42%, transparent);
    }

    :deep(.ritual-native-input::placeholder) {
        color: var(--vp-c-text-3);
    }

    :deep(.ritual-native-input--mono) {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
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
        grid-template-columns: minmax(640px, 1.14fr) minmax(320px, 0.86fr);
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
