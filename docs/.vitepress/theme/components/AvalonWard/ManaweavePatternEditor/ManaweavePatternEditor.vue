<template>
    <v-app class="manaweave-pattern-editor-app">
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
                        <manaweave-pattern-grid
                            :pattern="pattern"
                            @toggle-cell="toggleCell"
                            @edit-cell="editCell"
                            @clear="clearPattern"
                            class="panel-item"
                        />
                    </div>

                    <div class="right-panel">
                        <v-card flat class="panel-item config-card">
                            <v-card-text class="pa-6">
                                <div class="section-heading">
                                    {{ t.recipeConfiguration }}
                                </div>
                                <div class="field-stack">
                                    <div class="field-group">
                                        <span class="field-label">{{
                                            t.tier
                                        }}</span>
                                        <input
                                            :value="tier"
                                            @input="
                                                updateTier(
                                                    ($event.target as HTMLInputElement)
                                                        .value
                                                )
                                            "
                                            type="number"
                                            min="1"
                                            max="5"
                                            step="1"
                                            class="native-input native-input--mono"
                                        />
                                    </div>
                                    <div class="field-group">
                                        <span class="field-label">{{
                                            t.requiredFaction
                                        }}</span>
                                        <input
                                            :value="requiredFaction"
                                            @input="
                                                requiredFaction = (
                                                    $event.target as HTMLInputElement
                                                ).value
                                            "
                                            :placeholder="t.requiredFactionPlaceholder"
                                            type="text"
                                            class="native-input native-input--mono"
                                        />
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>

                        <manaweave-pattern-output
                            :pattern="pattern"
                            :tier="tier"
                            :required-faction="requiredFaction"
                            :output-format="outputFormat"
                            :shape-only="shapeOnly"
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
    import { ref } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { ManaweaveOutputFormat } from "../../../../utils/manaweavePatternEditor";
    import {
        createManaweavingPatternGrid,
        cloneManaweavingPatternGrid,
        DEFAULT_MANAWEAVING_FACTION,
        DEFAULT_MANAWEAVING_TIER,
    } from "../../../../utils/manaweavePatternEditor";
    import ManaweavePatternGrid from "./ManaweavePatternGrid.vue";
    import ManaweavePatternOutput from "./ManaweavePatternOutput.vue";

    const { t } = useSafeI18n("manaweave-pattern-editor", {
        customValuePrompt: "Enter an integer value for this cell",
        recipeConfiguration: "Recipe Configuration",
        requiredFaction: "Required Faction",
        requiredFactionPlaceholder: "e.g. mna:none",
        tier: "Tier",
        title: "Manaweaving Pattern Recipe Editor",
    });

    const pattern = ref<number[][]>(createManaweavingPatternGrid());
    const tier = ref(DEFAULT_MANAWEAVING_TIER);
    const requiredFaction = ref(DEFAULT_MANAWEAVING_FACTION);
    const outputFormat = ref<ManaweaveOutputFormat>("json");
    const shapeOnly = ref(false);

    const toggleCell = (row: number, col: number) => {
        const nextPattern = cloneManaweavingPatternGrid(pattern.value);
        nextPattern[row][col] = nextPattern[row][col] === 0 ? 1 : 0;
        pattern.value = nextPattern;
    };

    const editCell = (row: number, col: number) => {
        const currentValue = pattern.value[row]?.[col] ?? 0;
        const input = prompt(t.customValuePrompt, currentValue.toString());
        if (input === null) {
            return;
        }

        const parsedValue = Number.parseInt(input, 10);
        if (!Number.isFinite(parsedValue)) {
            return;
        }

        const nextPattern = cloneManaweavingPatternGrid(pattern.value);
        nextPattern[row][col] = parsedValue;
        pattern.value = nextPattern;
    };

    const clearPattern = () => {
        pattern.value = createManaweavingPatternGrid();
    };

    const updateTier = (rawValue: string) => {
        const parsedValue = Number.parseInt(rawValue, 10);
        if (!Number.isFinite(parsedValue)) {
            return;
        }

        tier.value = Math.min(5, Math.max(1, parsedValue));
    };
</script>

<style scoped>
    .manaweave-pattern-editor-app {
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
        --ritual-control-bg: color-mix(in srgb, var(--vp-c-bg) 94%, var(--vp-c-bg-soft) 6%);
        --ritual-control-bg-hover: color-mix(
            in srgb,
            var(--vp-c-bg) 90%,
            var(--vp-c-bg-soft) 10%
        );
        --ritual-code-bg: color-mix(in srgb, var(--vp-c-bg) 96%, var(--vp-c-bg-soft) 4%);
        background-color: var(--ritual-shell-bg);
        min-height: 100vh;
    }

    :deep(.v-card),
    :deep(.v-sheet),
    :deep(.v-alert),
    :deep(.v-chip),
    :deep(.v-btn) {
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

    :deep(.toolbar-action) {
        min-height: 0;
        padding-inline: 10px !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        color: var(--vp-c-text-2) !important;
        text-transform: none;
    }

    :deep(.toolbar-action .v-btn__overlay),
    :deep(.toolbar-action .v-btn__underlay) {
        display: none !important;
    }

    :deep(.toolbar-action:not(.v-btn--disabled):hover) {
        color: var(--vp-c-text-1) !important;
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
        grid-template-columns: minmax(620px, 1.08fr) minmax(380px, 0.92fr);
        gap: 18px;
        padding: 0 24px 24px;
        align-items: start;
    }

    .left-panel,
    .right-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 0;
    }

    .right-panel {
        position: sticky;
        top: 18px;
    }

    .panel-item {
        width: 100%;
        min-width: 0;
    }

    .field-stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .section-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid color-mix(in srgb, var(--ritual-border) 86%, transparent);
        color: var(--vp-c-text-1);
        font-size: 1.02rem;
        font-weight: 600;
        line-height: 1.35;
    }

    .field-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 14px;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 86%, transparent);
        border-radius: 10px;
        background: color-mix(in srgb, var(--vp-c-bg) 92%, var(--ritual-surface-muted) 8%);
    }

    .field-label {
        color: var(--vp-c-text-2);
        font-size: 0.76rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        line-height: 1.2;
        text-transform: uppercase;
    }

    .native-input {
        display: block;
        width: 100%;
        min-height: 46px;
        padding: 12px 14px;
        border: 1px solid color-mix(in srgb, var(--ritual-border-strong) 88%, transparent);
        border-radius: 12px;
        background: var(--ritual-control-bg);
        color: var(--vp-c-text-1);
        font-size: 0.95rem;
        line-height: 1.55;
        box-sizing: border-box;
        transition:
            border-color 0.18s ease,
            background-color 0.18s ease,
            box-shadow 0.18s ease;
    }

    .native-input:hover {
        background: var(--ritual-control-bg-hover);
    }

    .native-input:focus {
        outline: none;
        border-color: var(--ritual-accent);
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--ritual-accent) 36%, transparent);
    }

    .native-input::placeholder {
        color: var(--vp-c-text-3);
    }

    .native-input--mono {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }

    .app-title {
        color: var(--vp-c-text-1);
    }

    @media (max-width: 1100px) {
        .main-layout {
            grid-template-columns: 1fr;
            padding: 0 16px 16px;
            gap: 16px;
        }

        .right-panel {
            position: static;
        }
    }
</style>
