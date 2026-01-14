<!--
/**
 * @fileoverview JSON Import Panel Component
 * @component JsonImportPanel
 * @description Handles file imports, translation status display, and bulk operations
 */
-->

<template>
    <v-card flat>
        <v-card-title class="text-h6">{{ t.importFiles }}</v-card-title>
        <v-card-text class="pa-4">
            <v-row dense class="mb-4">
                <v-col cols="12" md="6">
                    <v-card variant="outlined" class="pa-4 source-card">
                        <v-card-title class="d-flex align-center mb-3">
                            <v-icon color="primary" class="mr-2"
                                >mdi-file-document-outline</v-icon
                            >
                            <span class="text-h6">{{
                                t.sourceLanguageFile
                            }}</span>
                            <v-tooltip activator="parent" location="top">
                                {{ t.sourceTooltip }}
                            </v-tooltip>
                        </v-card-title>

                        <v-file-input
                            ref="sourceFileInput"
                            :label="t.selectSourceFile"
                            variant="outlined"
                            density="compact"
                            accept=".json"
                            :disabled="isImporting"
                            @change="handleSourceFileSelect"
                            prepend-icon="mdi-upload"
                            :color="
                                config.sourceLanguage !== 'en_us'
                                    ? 'success'
                                    : 'primary'
                            "
                            class="mb-3"
                            :hint="
                                config.sourceLanguage !== 'en_us'
                                    ? `Loaded: ${config.sourceLanguage}.json`
                                    : ''
                            "
                            persistent-hint
                        ></v-file-input>

                        <v-alert
                            type="info"
                            variant="tonal"
                            density="compact"
                            class="mb-2"
                        >
                            <div class="d-flex align-start">
                                <v-icon class="mr-2 mt-1"
                                    >mdi-information</v-icon
                                >
                                <span>{{ t.sourceFileHelp }}</span>
                            </div>
                        </v-alert>

                        <v-chip
                            v-if="config.sourceLanguage !== 'en_us'"
                            color="success"
                            variant="tonal"
                            size="small"
                            class="mt-2"
                        >
                            <v-icon start>mdi-check-circle</v-icon>
                            {{ t.sourceLoaded }}: {{ config.sourceLanguage }}
                        </v-chip>
                    </v-card>
                </v-col>

                <v-col cols="12" md="6">
                    <v-card variant="outlined" class="pa-4 target-card">
                        <v-card-title class="d-flex align-center mb-3">
                            <v-icon color="warning" class="mr-2"
                                >mdi-translate</v-icon
                            >
                            <span class="text-h6">{{
                                t.targetLanguageFile
                            }}</span>
                            <v-tooltip activator="parent" location="top">
                                {{ t.targetTooltip }}
                            </v-tooltip>
                        </v-card-title>

                        <v-file-input
                            ref="targetFileInput"
                            :label="t.selectTargetFile"
                            variant="outlined"
                            density="compact"
                            accept=".json"
                            :disabled="isImporting"
                            @change="handleTargetFileSelect"
                            prepend-icon="mdi-upload"
                            :color="
                                config.targetLanguage !== 'zh_cn'
                                    ? 'success'
                                    : 'warning'
                            "
                            class="mb-3"
                            :hint="
                                config.targetLanguage !== 'zh_cn'
                                    ? `Loaded: ${config.targetLanguage}.json`
                                    : ''
                            "
                            persistent-hint
                        ></v-file-input>

                        <v-alert
                            type="warning"
                            variant="tonal"
                            density="compact"
                            class="mb-2"
                        >
                            <div class="d-flex align-start">
                                <v-icon class="mr-2 mt-1">mdi-translate</v-icon>
                                <span>{{ t.targetFileHelp }}</span>
                            </div>
                        </v-alert>

                        <v-chip
                            v-if="config.targetLanguage !== 'zh_cn'"
                            color="success"
                            variant="tonal"
                            size="small"
                            class="mt-2"
                        >
                            <v-icon start>mdi-check-circle</v-icon>
                            {{ t.targetLoaded }}: {{ config.targetLanguage }}
                        </v-chip>
                    </v-card>
                </v-col>
            </v-row>

            <v-card v-if="isImporting" variant="outlined" class="mb-4">
                <v-card-text class="pa-4">
                    <div class="d-flex align-center mb-2">
                        <v-icon class="mr-2" color="primary"
                            >mdi-cloud-upload</v-icon
                        >
                        <span class="text-body-1 font-weight-medium">{{
                            t.importing
                        }}</span>
                    </div>
                    <v-progress-linear
                        :model-value="importProgress"
                        color="primary"
                        height="8"
                        rounded
                        class="mb-2"
                    ></v-progress-linear>
                    <div class="text-caption text-center">
                        {{ Math.round(importProgress) }}% {{ t.complete }}
                    </div>
                </v-card-text>
            </v-card>

            <div
                v-if="translationStats.totalEntries > 0"
                class="translation-status"
            >
                <v-card variant="outlined" class="pa-4">
                    <v-card-subtitle class="text-h6 mb-3">{{
                        t.translationStatus
                    }}</v-card-subtitle>

                    <v-row dense class="mb-4">
                        <v-col cols="4">
                            <v-card
                                variant="tonal"
                                color="primary"
                                class="pa-3 text-center"
                            >
                                <div class="text-h5 font-weight-bold">
                                    {{ translationStats.totalEntries }}
                                </div>
                                <div class="text-caption">
                                    {{ t.totalEntries }}
                                </div>
                            </v-card>
                        </v-col>
                        <v-col cols="4">
                            <v-card
                                variant="tonal"
                                color="success"
                                class="pa-3 text-center"
                            >
                                <div class="text-h5 font-weight-bold">
                                    {{ translationStats.translatedCount }}
                                </div>
                                <div class="text-caption">
                                    {{ t.translated }}
                                </div>
                            </v-card>
                        </v-col>
                        <v-col cols="4">
                            <v-card
                                variant="tonal"
                                color="warning"
                                class="pa-3 text-center"
                            >
                                <div class="text-h5 font-weight-bold">
                                    {{ translationStats.untranslatedCount }}
                                </div>
                                <div class="text-caption">
                                    {{ t.untranslated }}
                                </div>
                            </v-card>
                        </v-col>
                    </v-row>

                    <v-row align="center" class="mb-3">
                        <v-col cols="auto">
                            <v-btn
                                @click="$emit('fill-all-from-source')"
                                :disabled="
                                    translationStats.untranslatedCount === 0
                                "
                                color="warning"
                                variant="flat"
                            >
                                <v-icon start>mdi-auto-fix</v-icon>
                                {{ t.fillAllFromSource }}
                            </v-btn>
                        </v-col>
                        <v-col>
                            <v-switch
                                :model-value="showUntranslatedOnly"
                                @update:model-value="
                                    $emit(
                                        'update:show-untranslated-only',
                                        $event
                                    )
                                "
                                :label="t.showUntranslatedOnly"
                                color="warning"
                                density="compact"
                                hide-details
                                class="mr-4"
                            ></v-switch>
                        </v-col>
                        <v-col>
                            <v-switch
                                :model-value="showTranslationPanel"
                                @update:model-value="
                                    $emit(
                                        'update:show-translation-panel',
                                        $event
                                    )
                                "
                                :label="t.showTranslationPanel"
                                color="primary"
                                density="compact"
                                hide-details
                            ></v-switch>
                        </v-col>
                    </v-row>
                </v-card>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type {
        TranslatorConfig,
        TranslationStats,
    } from "../../../../utils/jsonTranslator";

    const { t } = useSafeI18n("json-import-panel", {
        importFiles: "Import Files",
        sourceLanguageFile: "Source Language File",
        selectSourceFile: "Upload Reference File",
        sourceFileHelp:
            "Original language file (e.g. en_us.json) - used as translation reference",
        sourceTooltip:
            "This is the original language file you want to translate FROM",
        sourceLoaded: "Reference loaded",
        targetLanguageFile: "Target Language File",
        selectTargetFile: "Upload Translation File",
        targetFileHelp:
            "Your translation file (e.g. zh_cn.json) - will be edited and updated",
        targetTooltip: "This is the language file you are translating TO",
        targetLoaded: "Translation loaded",
        importing: "Importing file...",
        complete: "Complete",
        translationStatus: "Translation Status",
        totalEntries: "Total Entries",
        translated: "Translated",
        untranslated: "Untranslated",
        fillAllFromSource: "Fill All From Source",
        showUntranslatedOnly: "Show Untranslated Only",
        showTranslationPanel: "Show Translation Panel",
    });

    const props = defineProps<{
        config: TranslatorConfig;
        isImporting: boolean;
        importProgress: number;
        translationStats: TranslationStats;
        showUntranslatedOnly: boolean;
        showTranslationPanel: boolean;
    }>();

    const emit = defineEmits<{
        "import-source": [file: File];
        "import-target": [file: File];
        "fill-all-from-source": [];
        "update:show-untranslated-only": [value: boolean];
        "update:show-translation-panel": [value: boolean];
    }>();

    /**
     * Handles source file selection
     * @param event - File input change event
     */
    const handleSourceFileSelect = (event: Event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files[0]) {
            emit("import-source", files[0]);
        }
    };

    /**
     * Handles target file selection
     * @param event - File input change event
     */
    const handleTargetFileSelect = (event: Event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files[0]) {
            emit("import-target", files[0]);
        }
    };
</script>

<style scoped>
    .translation-status {
        margin-top: 20px;
    }

    .v-card.v-card--variant-tonal {
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    .source-card {
        border-left: 4px solid var(--v-theme-primary);
        background-color: rgba(var(--v-theme-primary), 0.03);
        border: 1px solid var(--vp-c-divider);
    }

    .target-card {
        border-left: 4px solid var(--v-theme-warning);
        background-color: rgba(var(--v-theme-warning), 0.03);
        border: 1px solid var(--vp-c-divider);
    }

    .source-card .v-file-input .v-field {
        background-color: transparent;
    }

    .target-card .v-file-input .v-field {
        background-color: transparent;
    }

    .source-card .v-icon {
        color: var(--v-theme-primary) !important;
    }

    .target-card .v-icon {
        color: var(--v-theme-warning) !important;
    }
</style>
