<!--
/**
 * @fileoverview JSON Output Panel Component
 * @component JsonOutputPanel
 * @description Displays generated JSON output with download functionality
 */
-->

<template>
    <v-card flat>
        <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6">{{ t.jsonOutput }}</span>
            <div class="output-actions">
                <v-btn
                    @click="$emit('generate')"
                    :disabled="!jsonOutput"
                    color="primary"
                    variant="outlined"
                    class="mr-2"
                >
                    <v-icon start>mdi-refresh</v-icon>
                    {{ t.generateJson }}
                </v-btn>
                <v-btn
                    @click="$emit('download')"
                    :disabled="!jsonOutput"
                    color="success"
                    variant="flat"
                >
                    <v-icon start>mdi-download</v-icon>
                    {{ t.downloadJson }}
                </v-btn>
            </div>
        </v-card-title>

        <v-card-text class="pa-4">
            <div v-if="!jsonOutput" class="text-center text-grey pa-8">
                <v-icon size="48" color="grey" class="mb-3"
                    >mdi-code-braces</v-icon
                >
                <div class="text-body-1">{{ t.noOutput }}</div>
            </div>

            <v-card v-else variant="outlined" class="json-container">
                <v-card-text class="pa-3">
                    <div class="d-flex justify-space-between align-center mb-2">
                        <v-chip size="small" color="success">
                            {{ targetLanguage }}.json
                        </v-chip>
                        <v-btn
                            @click="copyToClipboard"
                            icon="mdi-content-copy"
                            size="small"
                            variant="text"
                            color="primary"
                        ></v-btn>
                    </div>
                    <pre class="json-content">{{ jsonOutput }}</pre>
                </v-card-text>
            </v-card>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";

    const { t } = useSafeI18n("json-output-panel", {
        jsonOutput: "JSON Output",
        generateJson: "Generate JSON",
        downloadJson: "Download JSON",
        noOutput: "Generate JSON to see output here",
    });

    const props = defineProps<{
        jsonOutput: string;
        targetLanguage: string;
    }>();

    const emit = defineEmits<{
        generate: [];
        download: [];
    }>();

    /**
     * Copies JSON output to clipboard
     */
    const copyToClipboard = () => {
        if (
            typeof navigator !== "undefined" &&
            navigator.clipboard &&
            props.jsonOutput
        ) {
            navigator.clipboard.writeText(props.jsonOutput);
        }
    };
</script>

<style scoped>
    .output-actions {
        display: flex;
        gap: 8px;
    }

    .json-container {
        background-color: rgba(var(--v-theme-surface), 0.5);
        border: 1px solid rgba(var(--v-theme-outline), 0.3);
    }

    .json-content {
        font-family: "Courier New", monospace;
        font-size: 0.85em;
        max-height: 400px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-all;
        background-color: rgba(var(--v-theme-surface), 0.3);
        padding: 12px;
        border-radius: 8px;
        color: var(--v-theme-on-surface);
        line-height: 1.4;
    }

    :root.dark .json-content {
        color: #e2e8f0;
    }
</style>
