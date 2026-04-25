<template>
    <v-card flat class="manaweave-pattern-grid">
        <v-card-title class="text-h6">{{ t.grid }}</v-card-title>
        <v-card-text class="pa-6">
            <div class="grid-toolbar">
                <div class="grid-toolbar__hint">
                    {{ t.instructions }}
                </div>
                <v-btn
                    @click="emit('clear')"
                    variant="text"
                    class="toolbar-action"
                >
                    <v-icon start>mdi-broom</v-icon>
                    {{ t.clear }}
                </v-btn>
            </div>

            <div class="grid-shell">
                <div class="grid-axis grid-axis--top">
                    <span v-for="index in size" :key="`top-${index}`">
                        {{ index - 1 }}
                    </span>
                </div>

                <div class="grid-body">
                    <div class="grid-axis grid-axis--left">
                        <span v-for="index in size" :key="`left-${index}`">
                            {{ index - 1 }}
                        </span>
                    </div>

                    <div class="grid-board">
                        <div
                            v-for="(row, rowIndex) in pattern"
                            :key="`row-${rowIndex}`"
                            class="grid-row"
                        >
                            <button
                                v-for="(cell, colIndex) in row"
                                :key="`cell-${rowIndex}-${colIndex}`"
                                type="button"
                                class="grid-cell"
                                :class="{
                                    'grid-cell--active': cell !== 0,
                                    'grid-cell--special': cell > 1,
                                }"
                                @click="emit('toggle-cell', rowIndex, colIndex)"
                                @contextmenu.prevent="
                                    emit('edit-cell', rowIndex, colIndex)
                                "
                            >
                                {{ cell }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { computed } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";

    const { t } = useSafeI18n("manaweave-pattern-grid", {
        clear: "Clear",
        grid: "Pattern Grid",
        instructions:
            "Left click toggles 0/1. Right click sets a custom integer value.",
    });

    const props = defineProps<{
        pattern: number[][];
    }>();

    const emit = defineEmits<{
        clear: [];
        "edit-cell": [row: number, col: number];
        "toggle-cell": [row: number, col: number];
    }>();

    const size = computed(() => props.pattern.length);
</script>

<style scoped>
    .grid-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
    }

    .grid-toolbar__hint {
        color: var(--vp-c-text-2);
        font-size: 0.92rem;
        line-height: 1.55;
    }

    .grid-shell {
        display: inline-flex;
        flex-direction: column;
        gap: 6px;
        max-width: 100%;
    }

    .grid-body {
        display: flex;
        gap: 6px;
        align-items: flex-start;
    }

    .grid-axis {
        display: grid;
        color: var(--vp-c-text-3);
        font-size: 0.82rem;
        font-weight: 600;
        line-height: 1;
    }

    .grid-axis--top {
        grid-template-columns: repeat(11, minmax(0, 1fr));
        margin-left: 26px;
    }

    .grid-axis--left {
        grid-template-rows: repeat(11, minmax(0, 1fr));
        width: 20px;
    }

    .grid-axis--top span,
    .grid-axis--left span {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 26px;
    }

    .grid-board {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 10px;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        border-radius: 12px;
        background: color-mix(in srgb, var(--vp-c-bg) 90%, var(--ritual-surface-muted) 10%);
        overflow: auto;
    }

    .grid-row {
        display: flex;
        gap: 4px;
    }

    .grid-cell {
        width: 34px;
        height: 34px;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        border-radius: 8px;
        background: var(--ritual-control-bg);
        color: var(--vp-c-text-2);
        font-size: 0.82rem;
        font-weight: 600;
        line-height: 1;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        cursor: pointer;
        transition:
            background-color 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease;
    }

    .grid-cell:hover {
        border-color: color-mix(in srgb, var(--ritual-accent) 40%, var(--ritual-border) 60%);
        color: var(--vp-c-text-1);
    }

    .grid-cell--active {
        background: color-mix(in srgb, var(--ritual-accent) 18%, var(--vp-c-bg) 82%);
        color: var(--ritual-accent);
        border-color: color-mix(in srgb, var(--ritual-accent) 42%, var(--ritual-border) 58%);
    }

    .grid-cell--special {
        background: color-mix(in srgb, var(--ritual-accent) 30%, var(--vp-c-bg) 70%);
        color: var(--vp-c-text-1);
    }

    @media (max-width: 900px) {
        .grid-cell {
            width: 30px;
            height: 30px;
            font-size: 0.76rem;
        }

        .grid-axis--top {
            margin-left: 24px;
        }
    }
</style>
