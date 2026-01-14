<!--
/**
 * @fileoverview Ritual Code Preview Component
 * @component RitualCodePreview
 * @description Displays JSON/KJS code output with copy functionality
 */
-->

<template>
    <v-card flat>
        <v-card-text class="pa-6">
            <div class="d-flex justify-space-between align-center mb-4">
                <h3 class="text-h6">{{ t.outputFormat }}</h3>
                <div class="format-actions">
                    <v-btn-toggle
                        :model-value="outputFormat"
                        @update:model-value="
                            $emit('update:output-format', $event)
                        "
                        mandatory
                        variant="outlined"
                        density="compact"
                        class="mr-3"
                    >
                        <v-btn value="json" size="small">JSON</v-btn>
                        <v-btn value="kjs" size="small">KubeJS</v-btn>
                    </v-btn-toggle>
                    <v-btn
                        @click="copyToClipboard()"
                        :disabled="!isValid"
                        color="primary"
                    >
                        <v-icon start>mdi-content-copy</v-icon>
                        {{ t.copyCode }}
                    </v-btn>
                </div>
            </div>

            <v-textarea
                :model-value="
                    outputFormat === 'json'
                        ? jsonPreview || t.lockSizeToSeeOutput
                        : kjsCode || t.lockSizeToSeeOutput
                "
                readonly
                variant="outlined"
                :rows="12"
                class="code-textarea"
                style="font-family: 'Courier New', monospace"
            ></v-textarea>

            <v-alert
                v-if="!isValid && locked"
                type="error"
                variant="tonal"
                class="mt-4"
            >
                <div class="d-flex align-start">
                    <v-icon class="mr-2">mdi-alert-circle</v-icon>
                    <span>{{ t.validationError }}</span>
                </div>
            </v-alert>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { OutputFormat } from "../../../../utils/ritualGenerator";

    const { t } = useSafeI18n("ritual-code-preview", {
        outputFormat: "Output Format",
        copyCode: "Copy Code",
        lockSizeToSeeOutput:
            "Lock size and configure the ritual to see output.",
        validationError:
            "Invalid configuration. Ensure pattern has at least one non-zero value and all keys have an item defined.",
    });

    const props = defineProps<{
        outputFormat: OutputFormat;
        jsonPreview: string;
        kjsCode: string;
        isValid: boolean;
        locked: boolean;
    }>();

    const emit = defineEmits<{
        "update:output-format": [format: OutputFormat];
    }>();

    /**
     * Copies code to clipboard
     */
    const copyToClipboard = () => {
        const textToCopy =
            props.outputFormat === "json" ? props.jsonPreview : props.kjsCode;

        if (
            typeof navigator !== "undefined" &&
            navigator.clipboard &&
            props.isValid
        ) {
            navigator.clipboard.writeText(textToCopy);
        }
    };
</script>

<style scoped>
    .v-card {
        border: 1px solid #bdbdbd;
        box-shadow: none !important;
    }

    .v-card,
    .v-textarea .v-field,
    .v-btn,
    .v-btn-toggle,
    .v-alert {
        border-radius: 12px !important;
    }

    .code-textarea .v-field {
        font-family: "Courier New", monospace !important;
    }

    .format-actions {
        display: flex;
        gap: 12px;
        align-items: center;
    }
</style>
