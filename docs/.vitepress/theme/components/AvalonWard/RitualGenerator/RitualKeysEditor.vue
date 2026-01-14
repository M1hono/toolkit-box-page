<!--
/**
 * @fileoverview Ritual Keys Editor Component
 * @component RitualKeysEditor
 * @description Manages reagent keys configuration and options
 */
-->

<template>
    <v-card flat>
        <v-card-title class="text-h6">{{ t.reagentKeys }}</v-card-title>
        <v-card-text>
            <div
                v-if="Object.keys(keys).length === 0"
                class="text-center text-grey pa-4"
            >
                {{ t.noKeys }}
            </div>
            <div v-else class="keys-list">
                <div
                    v-for="key in Object.keys(keys)"
                    :key="'key-' + key"
                    class="key-item mb-4"
                >
                    <div class="d-flex align-center mb-2">
                        <v-chip color="primary" class="mr-3">{{ key }}</v-chip>
                        <v-text-field
                            :model-value="keys[key].item"
                            @update:model-value="updateKeyItem(key, $event)"
                            :placeholder="t.itemIdPlaceholder"
                            variant="outlined"
                            density="compact"
                            hide-details
                            class="flex-grow-1"
                        ></v-text-field>
                    </div>
                    <div class="key-options">
                        <v-row dense>
                            <v-col cols="6">
                                <v-checkbox
                                    :model-value="keys[key].optional"
                                    @update:model-value="
                                        updateKeyOption(key, 'optional', $event)
                                    "
                                    :label="t.optional"
                                    density="compact"
                                    hide-details
                                ></v-checkbox>
                            </v-col>
                            <v-col cols="6">
                                <v-checkbox
                                    :model-value="keys[key].consume"
                                    @update:model-value="
                                        updateKeyOption(key, 'consume', $event)
                                    "
                                    :label="t.consume"
                                    density="compact"
                                    hide-details
                                ></v-checkbox>
                            </v-col>
                            <v-col cols="6">
                                <v-checkbox
                                    :model-value="keys[key].is_dynamic"
                                    @update:model-value="
                                        updateKeyOption(
                                            key,
                                            'is_dynamic',
                                            $event
                                        )
                                    "
                                    :label="t.dynamic"
                                    density="compact"
                                    hide-details
                                ></v-checkbox>
                            </v-col>
                            <v-col cols="6">
                                <v-checkbox
                                    :model-value="keys[key].dynamic_source"
                                    @update:model-value="
                                        updateKeyOption(
                                            key,
                                            'dynamic_source',
                                            $event
                                        )
                                    "
                                    :label="t.dynamicSource"
                                    density="compact"
                                    hide-details
                                ></v-checkbox>
                            </v-col>
                            <v-col cols="12">
                                <v-checkbox
                                    :model-value="keys[key].manual_return"
                                    @update:model-value="
                                        updateKeyOption(
                                            key,
                                            'manual_return',
                                            $event
                                        )
                                    "
                                    :label="t.manualReturn"
                                    density="compact"
                                    hide-details
                                ></v-checkbox>
                            </v-col>
                        </v-row>
                    </div>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type {
        RitualKeys,
        RitualKeyConfig,
    } from "../../../../utils/ritualGenerator";

    const { t } = useSafeI18n("ritual-keys-editor", {
        reagentKeys: "Reagent Keys",
        noKeys: "No keys defined. Add reagents to the grid first.",
        itemIdPlaceholder: "Item ID (required)",
        optional: "Optional",
        consume: "Consume",
        dynamic: "Dynamic",
        dynamicSource: "Dynamic Source",
        manualReturn: "Manual Return",
    });

    const props = defineProps<{
        keys: RitualKeys;
    }>();

    const emit = defineEmits<{
        "update:keys": [keys: RitualKeys];
    }>();

    /**
     * Updates item for a specific key
     * @param key - Key identifier
     * @param item - New item value
     */
    const updateKeyItem = (key: string, item: string) => {
        const newKeys = { ...props.keys };
        newKeys[key] = { ...newKeys[key], item };
        emit("update:keys", newKeys);
    };

    /**
     * Updates option for a specific key
     * @param key - Key identifier
     * @param option - Option name to update
     * @param value - New option value
     */
    const updateKeyOption = (
        key: string,
        option: keyof RitualKeyConfig,
        value: any
    ) => {
        const newKeys = { ...props.keys };
        newKeys[key] = { ...newKeys[key], [option]: value };
        emit("update:keys", newKeys);
    };
</script>

<style scoped>
    .v-card {
        border: 1px solid #bdbdbd;
        box-shadow: none !important;
    }

    .key-item {
        padding: 12px;
        background-color: rgba(var(--v-theme-surface), 0.5);
        border-radius: 12px;
        border: 1px solid #e0e0e0;
    }

    .v-card,
    .v-text-field .v-field,
    .v-btn,
    .v-chip,
    .key-item {
        border-radius: 12px !important;
    }
</style>
