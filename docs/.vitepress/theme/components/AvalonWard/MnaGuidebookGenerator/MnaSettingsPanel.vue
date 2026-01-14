<!--
/**
 * @fileoverview MNA Settings Panel - Import/Export and Custom Categories
 * @component MnaSettingsPanel
 * @description Settings, file operations, and category management
 */
-->

<template>
    <v-card flat class="settings-panel">
        <v-card-title class="d-flex justify-space-between align-center">
            <div>
                <v-icon color="primary" class="mr-2">mdi-cog</v-icon>
                <span class="text-h6">{{ t.settings }}</span>
            </div>
        </v-card-title>

        <v-card-text class="pa-4">
            <!-- File Import/Export -->
            <v-row dense>
                <v-col cols="6">
                    <v-file-input
                        @update:model-value="handleSourceFile"
                        :label="t.sourceFile"
                        accept=".json"
                        prepend-icon="mdi-file-upload"
                        variant="outlined"
                        density="compact"
                        :hint="t.sourceFileHint"
                        persistent-hint
                    ></v-file-input>
                </v-col>
                <v-col cols="6">
                    <v-file-input
                        @update:model-value="handleTargetFile"
                        :label="t.targetFile"
                        accept=".json"
                        prepend-icon="mdi-file-upload"
                        variant="outlined"
                        density="compact"
                        :hint="t.targetFileHint"
                        persistent-hint
                    ></v-file-input>
                </v-col>
            </v-row>

            <!-- Translation Status -->
            <v-row v-if="hasSourceData" dense class="mt-4">
                <v-col cols="4">
                    <v-card variant="tonal" color="primary">
                        <v-card-text class="text-center pa-3">
                            <div class="text-h5">{{ sourceEntriesCount }}</div>
                            <div class="text-caption">{{ t.totalEntries }}</div>
                        </v-card-text>
                    </v-card>
                </v-col>
                <v-col cols="4">
                    <v-card variant="tonal" color="success">
                        <v-card-text class="text-center pa-3">
                            <div class="text-h5">{{ targetEntriesCount }}</div>
                            <div class="text-caption">{{ t.translated }}</div>
                        </v-card-text>
                    </v-card>
                </v-col>
                <v-col cols="4">
                    <v-card variant="tonal" color="warning">
                        <v-card-text class="text-center pa-3">
                            <div class="text-h5">{{ untranslatedCount }}</div>
                            <div class="text-caption">{{ t.untranslated }}</div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>

            <!-- Custom Categories -->
            <div class="mb-3">
                <span class="text-subtitle-2">{{ t.customCategories }}</span>
            </div>

            <div class="d-flex gap-2 mb-3">
                <v-text-field
                    v-model="newCategory"
                    :label="t.newCategory"
                    :placeholder="t.newCategoryPlaceholder"
                    variant="outlined"
                    density="compact"
                    @keyup.enter="addCategory"
                ></v-text-field>
                <v-btn
                    @click="addCategory"
                    color="primary"
                    :disabled="!newCategory"
                >
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
            </div>

            <!-- Show all categories - all deletable -->
            <div v-if="allCategories.length > 0" class="d-flex flex-wrap gap-2">
                <v-chip
                    v-for="category in allCategories"
                    :key="category"
                    closable
                    @click:close="$emit('remove-category', category)"
                    size="small"
                    :color="isDefaultCategory(category) ? 'grey-darken-1' : 'primary'"
                    :variant="isDefaultCategory(category) ? 'outlined' : 'tonal'"
                >
                    {{ category }}
                </v-chip>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { ref, computed } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { GeneratorConfig } from "../../../../utils/mnaGuidebook";

    const { t } = useSafeI18n("mna-settings-panel", {
        settings: "Settings",
        sourceFile: "Source File",
        targetFile: "Target File",
        sourceFileHint: "Original language (e.g., en_us.json)",
        targetFileHint: "Translation file (e.g., zh_cn.json)",
        totalEntries: "Total",
        translated: "Translated",
        untranslated: "Untranslated",
        customCategories: "Custom Categories",
        newCategory: "New Category",
        newCategoryPlaceholder: "Enter category name",
    });

    const props = defineProps<{
        config: GeneratorConfig;
        hasSourceData: boolean;
        sourceEntriesCount: number;
        targetEntriesCount: number;
        untranslatedCount: number;
        customCategories: string[];
        allCategories?: string[];
    }>();

    const emit = defineEmits<{
        "import-source": [file: File];
        "import-target": [file: File];
        "add-category": [category: string];
        "remove-category": [category: string];
        "update:config": [config: GeneratorConfig];
    }>();

    const newCategory = ref('');

    const defaultCategories = [
        "basics", "rituals", "spells", "items", "blocks",
        "mobs", "mechanics", "world", "enchants", "artifice"
    ];

    const allCategories = computed(() => props.allCategories || [
        ...defaultCategories,
        ...props.customCategories
    ]);

    const isDefaultCategory = (category: string) => {
        return defaultCategories.includes(category);
    };

    const handleSourceFile = (files: File[] | File | null) => {
        console.log('[MNA Settings] handleSourceFile called, files:', files);
        
        // Handle both array and single file
        const file = Array.isArray(files) ? files[0] : files;
        
        if (file) {
            console.log('[MNA Settings] Emitting import-source with file:', file.name);
            emit("import-source", file);
        } else {
            console.warn('[MNA Settings] No file to import');
        }
    };

    const handleTargetFile = (files: File[] | File | null) => {
        console.log('[MNA Settings] handleTargetFile called, files:', files);
        
        // Handle both array and single file
        const file = Array.isArray(files) ? files[0] : files;
        
        if (file) {
            console.log('[MNA Settings] Emitting import-target with file:', file.name);
            emit("import-target", file);
        } else {
            console.warn('[MNA Settings] No file to import');
        }
    };

    const addCategory = () => {
        if (newCategory.value.trim()) {
            emit("add-category", newCategory.value.trim());
            newCategory.value = '';
        }
    };
</script>

<style scoped>
    .settings-panel {
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    .v-card,
    .v-btn,
    .v-chip,
    .v-text-field .v-field,
    .v-file-input .v-field {
        border-radius: 4px !important;
        box-shadow: none !important;
    }

    .gap-2 {
        gap: 8px;
    }
</style>