<!--
/**
 * @fileoverview Ritual Command Editor Component
 * @component RitualCommandEditor
 * @description Handles command input for ritual completion
 */
-->

<template>
    <v-card flat class="ritual-command-editor">
        <v-card-title class="text-h6"
            >{{ t.command }} ({{ t.optional }})</v-card-title
        >
        <v-card-text class="pa-5">
            <textarea
                :value="command"
                @input="
                    emit(
                        'update:command',
                        ($event.target as HTMLTextAreaElement).value
                    )
                "
                :placeholder="t.commandPlaceholder"
                rows="5"
                spellcheck="false"
                class="command-textarea"
            ></textarea>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";

    const { t } = useSafeI18n("ritual-command-editor", {
        command: "Command",
        optional: "Optional",
        commandPlaceholder: "Enter command to execute on ritual completion",
    });

    const props = defineProps<{
        command: string;
    }>();

    const emit = defineEmits<{
        "update:command": [command: string];
    }>();
</script>

<style scoped>
    .command-textarea {
        display: block;
        width: 100%;
        min-height: 132px;
        padding: 13px 14px;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        border-radius: 12px;
        background: var(--ritual-control-bg);
        color: var(--vp-c-text-1);
        resize: vertical;
        line-height: 1.6;
        font-size: 0.95rem;
        box-sizing: border-box;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        outline: none;
    }

    .command-textarea::placeholder {
        color: var(--vp-c-text-3);
    }

    .command-textarea:focus {
        border-color: var(--ritual-accent);
    }
</style>
