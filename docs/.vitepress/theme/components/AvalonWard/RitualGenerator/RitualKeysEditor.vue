<!--
/**
 * @fileoverview Ritual Keys Editor Component
 * @component RitualKeysEditor
 * @description Manages reagent keys configuration and options
 */
-->

<template>
    <v-card flat class="ritual-keys-editor">
        <v-card-title class="text-h6">{{ t.reagentKeys }}</v-card-title>
        <v-card-text class="pa-5">
            <div
                v-if="Object.keys(keys).length === 0"
                class="empty-state text-center pa-4"
            >
                {{ t.noKeys }}
            </div>
            <div v-else class="keys-list">
                <div
                    v-for="key in Object.keys(keys)"
                    :key="'key-' + key"
                    class="key-item mb-4"
                >
                    <div class="key-item__header mb-3">
                        <v-chip variant="outlined" class="key-chip mr-3">{{
                            key
                        }}</v-chip>
                        <input
                            :value="keys[key].item"
                            @input="
                                updateKeyItem(
                                    key,
                                    ($event.target as HTMLInputElement).value
                                )
                            "
                            :placeholder="t.itemIdPlaceholder"
                            type="text"
                            class="ritual-native-input key-item__input"
                        />
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
                                    color="warning"
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
                                    color="warning"
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
                                    color="warning"
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
                                    color="warning"
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
                                    color="warning"
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
    .empty-state {
        color: var(--vp-c-text-2);
        border: 1px dashed color-mix(in srgb, var(--ritual-border) 80%, transparent);
        border-radius: 12px;
        background: color-mix(in srgb, var(--vp-c-bg) 92%, var(--ritual-surface-muted) 8%);
    }

    .keys-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .key-item {
        padding: 14px;
        background-color: color-mix(
            in srgb,
            var(--vp-c-bg) 92%,
            var(--ritual-surface-muted) 8%
        );
        border-radius: 12px;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
    }

    .key-item__header {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .key-item__input {
        flex: 1 1 auto;
        min-width: 0;
    }

    .key-chip {
        min-width: 36px;
        justify-content: center;
        color: var(--vp-c-text-1);
        font-weight: 700;
    }

    .key-options :deep(.v-selection-control) {
        margin: 0;
    }
</style>
