<!--
/**
 * @fileoverview JSON Entry Editor Component
 * @component JsonEntryEditor
 * @description Handles editing of individual translation entries with source reference
 */
-->

<template>
    <v-card flat>
        <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6">{{ t.editEntry }}</span>
            <div class="editor-actions">
                <v-btn
                    @click="$emit('save')"
                    color="success"
                    variant="flat"
                    class="mr-2"
                >
                    <v-icon start>mdi-content-save</v-icon>
                    {{ t.save }}
                </v-btn>
                <v-btn
                    @click="$emit('cancel')"
                    color="error"
                    variant="outlined"
                >
                    <v-icon start>mdi-close</v-icon>
                    {{ t.cancel }}
                </v-btn>
            </div>
        </v-card-title>

        <v-card-text class="pa-4">
            <v-alert type="info" variant="tonal" class="mb-4">
                <strong>{{ t.editingKey }}:</strong> {{ currentKey }}
            </v-alert>

            <v-textarea
                :model-value="currentValue"
                @update:model-value="$emit('update:current-value', $event)"
                :label="t.translation"
                :placeholder="t.translationPlaceholder"
                variant="outlined"
                :rows="5"
                auto-grow
                class="mb-4"
            ></v-textarea>

            <v-card
                v-if="sourceValue"
                variant="outlined"
                class="source-reference"
            >
                <v-card-subtitle class="text-body-2 font-weight-medium">
                    {{ t.sourceValue }}
                </v-card-subtitle>
                <v-card-text class="pa-3">
                    <div class="source-content">{{ sourceValue }}</div>
                    <v-btn
                        @click="$emit('use-source')"
                        color="info"
                        variant="outlined"
                        size="small"
                        class="mt-3"
                    >
                        <v-icon start>mdi-content-copy</v-icon>
                        {{ t.useSourceValue }}
                    </v-btn>
                </v-card-text>
            </v-card>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";

    const { t } = useSafeI18n("json-entry-editor", {
        editEntry: "Edit Entry",
        save: "Save",
        cancel: "Cancel",
        editingKey: "Editing Key",
        translation: "Translation",
        translationPlaceholder: "Enter translation...",
        sourceValue: "Source Value",
        useSourceValue: "Use Source Value",
    });

    const props = defineProps<{
        currentKey: string;
        currentValue: string;
        sourceValue?: string;
    }>();

    const emit = defineEmits<{
        "update:current-value": [value: string];
        save: [];
        cancel: [];
        "use-source": [];
    }>();
</script>

<style scoped>
    .editor-actions {
        display: flex;
        gap: 8px;
    }

    .source-reference {
        background-color: rgba(var(--v-theme-info), 0.04);
        border-color: rgba(var(--v-theme-info), 0.2);
    }

    .source-content {
        background-color: rgba(var(--v-theme-surface), 0.5);
        padding: 12px;
        border-radius: 8px;
        font-family: "Courier New", monospace;
        font-size: 0.9em;
        white-space: pre-wrap;
        word-break: break-all;
        border: 1px solid rgba(var(--v-theme-outline), 0.2);
    }
</style>
