<template>
    <div class="manaweave-pattern-list-editor">
        <div class="editor-toolbar">
            <v-btn
                @click="handleAddPattern"
                variant="outlined"
                class="editor-toolbar__add"
            >
                <v-icon start>mdi-plus</v-icon>
                {{ t.addPattern }}
            </v-btn>
        </div>

        <div
            v-if="patterns.length === 0"
            class="empty-state text-center pa-4"
        >
            {{ t.noPatterns }}
        </div>
        <div v-else class="pattern-list">
            <div
                v-for="(pattern, index) in patterns"
                :key="`manaweave-pattern-${index}`"
                class="pattern-item"
            >
                <div class="pattern-item__main">
                    <v-chip
                        variant="outlined"
                        size="small"
                        class="pattern-chip"
                    >
                        {{ index + 1 }}
                    </v-chip>
                    <input
                        :value="pattern"
                        @input="
                            updatePattern(
                                index,
                                ($event.target as HTMLInputElement).value
                            )
                        "
                        :placeholder="t.patternPlaceholder"
                        type="text"
                        class="pattern-input"
                    />
                </div>

                <div class="pattern-item__actions">
                    <v-btn
                        @click="copyPattern(pattern)"
                        :disabled="!pattern.trim()"
                        variant="text"
                        size="small"
                        class="toolbar-action"
                    >
                        <v-icon start>mdi-content-copy</v-icon>
                        {{ t.copy }}
                    </v-btn>
                    <v-btn
                        @click="handleRemovePattern(index)"
                        variant="text"
                        size="small"
                        color="error"
                        class="toolbar-action"
                    >
                        <v-icon start>mdi-delete</v-icon>
                        {{ t.remove }}
                    </v-btn>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";

    const { t } = useSafeI18n("manaweave-pattern-list-editor", {
        addPattern: "Add Pattern",
        copy: "Copy",
        noPatterns: "No manaweave patterns defined.",
        patternPlaceholder: "Pattern string",
        remove: "Remove",
    });

    const props = defineProps<{
        patterns: string[];
    }>();

    const emit = defineEmits<{
        "update:patterns": [patterns: string[]];
    }>();

    const handleAddPattern = () => {
        emit("update:patterns", [...props.patterns, ""]);
    };

    const updatePattern = (index: number, value: string) => {
        const nextPatterns = [...props.patterns];
        nextPatterns[index] = value;
        emit("update:patterns", nextPatterns);
    };

    const handleRemovePattern = (index: number) => {
        emit(
            "update:patterns",
            props.patterns.filter((_, patternIndex) => patternIndex !== index)
        );
    };

    const copyPattern = (pattern: string) => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(pattern);
        }
    };
</script>

<style scoped>
    .editor-toolbar {
        margin-bottom: 16px;
    }

    .editor-toolbar__add {
        border-color: color-mix(in srgb, var(--ritual-border-strong) 92%, transparent) !important;
        background: color-mix(in srgb, var(--vp-c-bg) 94%, var(--ritual-surface-muted) 6%) !important;
        color: var(--vp-c-text-1) !important;
        font-weight: 600;
    }

    .empty-state {
        color: var(--vp-c-text-2);
        border: 1px dashed color-mix(in srgb, var(--ritual-border) 80%, transparent);
        border-radius: 12px;
        background: color-mix(in srgb, var(--vp-c-bg) 92%, var(--ritual-surface-muted) 8%);
    }

    .pattern-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .pattern-item {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        padding: 14px;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        border-radius: 12px;
        background: color-mix(in srgb, var(--vp-c-bg) 92%, var(--ritual-surface-muted) 8%);
    }

    .pattern-item__main {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1 1 340px;
        min-width: 0;
    }

    .pattern-chip {
        min-width: 36px;
        justify-content: center;
        color: var(--vp-c-text-1);
        font-weight: 700;
    }

    .pattern-input {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 44px;
        padding: 10px 12px;
        border: 1px solid color-mix(in srgb, var(--ritual-border-strong) 88%, transparent);
        border-radius: 8px;
        background: var(--ritual-control-bg);
        color: var(--vp-c-text-1);
        font-size: 0.95rem;
        line-height: 1.45;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        transition:
            border-color 0.18s ease,
            background-color 0.18s ease,
            box-shadow 0.18s ease;
    }

    .pattern-input:hover {
        background: var(--ritual-control-bg-hover);
    }

    .pattern-input:focus {
        outline: none;
        border-color: var(--ritual-accent);
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--ritual-accent) 36%, transparent);
    }

    .pattern-input::placeholder {
        color: var(--vp-c-text-3);
    }

    .pattern-item__actions {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-left: auto;
    }

    @media (max-width: 720px) {
        .pattern-item {
            align-items: stretch;
        }

        .pattern-item__main,
        .pattern-item__actions {
            width: 100%;
        }

        .pattern-item__actions {
            justify-content: flex-end;
            margin-left: 0;
        }
    }
</style>
