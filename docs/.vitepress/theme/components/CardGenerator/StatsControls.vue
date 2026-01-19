<!--
/**
 * @fileoverview Stats Controls Component
 * @component StatsControls
 * @description ATK/HP controls with color pickers and mode switcher
 */
-->

<template>
    <div>
        <v-row dense>
            <v-col cols="12">
                <div class="d-flex align-center ga-2 mb-2">
                    <v-switch
                        :model-value="useNumbersForStats"
                        :label="t.statsMode"
                        color="primary"
                        density="compact"
                        hide-details
                        @update:model-value="
                            $emit('update:useNumbersForStats', $event)
                        "
                    />
                    <v-chip
                        :color="useNumbersForStats ? 'primary' : 'default'"
                        size="small"
                    >
                        {{ useNumbersForStats ? t.useNumbers : t.useText }}
                    </v-chip>
                </div>
            </v-col>
        </v-row>

        <v-row dense v-if="useNumbersForStats">
            <v-col cols="4">
                <div class="input-with-color">
                    <v-text-field
                        :model-value="cardData.atk"
                        :label="t.atk"
                        type="number"
                        density="compact"
                        variant="outlined"
                        @update:model-value="
                            $emit('update:atk', Number($event))
                        "
                    />
                    <v-menu :close-on-content-click="false">
                        <template #activator="{ props }">
                            <div
                                v-bind="props"
                                class="color-picker-trigger"
                                :style="{
                                    background: customAtkColor || '#ffeb04',
                                }"
                            />
                        </template>
                        <v-card>
                            <v-card-text class="pa-2">
                                <v-color-picker
                                    :model-value="customAtkColor"
                                    mode="rgba"
                                    @update:model-value="
                                        $emit('update:atkColor', $event)
                                    "
                                />
                            </v-card-text>
                        </v-card>
                    </v-menu>
                </div>
            </v-col>
            <v-col cols="4">
                <div class="input-with-color">
                    <v-text-field
                        :model-value="cardData.hp"
                        label="HP"
                        type="number"
                        density="compact"
                        variant="outlined"
                        @update:model-value="$emit('update:hp', Number($event))"
                    />
                    <v-menu :close-on-content-click="false">
                        <template #activator="{ props }">
                            <div
                                v-bind="props"
                                class="color-picker-trigger"
                                :style="{
                                    background: customHpColor || '#ffeb04',
                                }"
                            />
                        </template>
                        <v-card>
                            <v-card-text class="pa-2">
                                <v-color-picker
                                    :model-value="customHpColor"
                                    mode="rgba"
                                    @update:model-value="
                                        $emit('update:hpColor', $event)
                                    "
                                />
                            </v-card-text>
                        </v-card>
                    </v-menu>
                </div>
            </v-col>
            <v-col cols="4">
                <div
                    class="d-flex align-center justify-start"
                    style="height: 40px; padding-left: 8px"
                >
                    <v-switch
                        :model-value="cardData.isGold"
                        :label="t.goldNumbers"
                        color="warning"
                        density="compact"
                        hide-details
                        :disabled="!!(customAtkColor || customHpColor)"
                        @update:model-value="$emit('update:isGold', $event)"
                    />
                </div>
            </v-col>
        </v-row>

        <v-row dense v-else>
            <v-col cols="6">
                <div class="input-with-color">
                    <v-text-field
                        :model-value="customAtkText"
                        :label="t.atkText"
                        density="compact"
                        variant="outlined"
                        @update:model-value="$emit('update:atkText', $event)"
                    />
                    <v-menu :close-on-content-click="false">
                        <template #activator="{ props }">
                            <div
                                v-bind="props"
                                class="color-picker-trigger"
                                :style="{
                                    background: customAtkColor || 'white',
                                }"
                            />
                        </template>
                        <v-card>
                            <v-card-text class="pa-2">
                                <v-color-picker
                                    :model-value="customAtkColor"
                                    mode="rgba"
                                    @update:model-value="
                                        $emit('update:atkColor', $event)
                                    "
                                />
                            </v-card-text>
                        </v-card>
                    </v-menu>
                </div>
            </v-col>
            <v-col cols="6">
                <div class="input-with-color">
                    <v-text-field
                        :model-value="customHpText"
                        :label="t.hpText"
                        density="compact"
                        variant="outlined"
                        @update:model-value="$emit('update:hpText', $event)"
                    />
                    <v-menu :close-on-content-click="false">
                        <template #activator="{ props }">
                            <div
                                v-bind="props"
                                class="color-picker-trigger"
                                :style="{
                                    background: customHpColor || 'white',
                                }"
                            />
                        </template>
                        <v-card>
                            <v-card-text class="pa-2">
                                <v-color-picker
                                    :model-value="customHpColor"
                                    mode="rgba"
                                    @update:model-value="
                                        $emit('update:hpColor', $event)
                                    "
                                />
                            </v-card-text>
                        </v-card>
                    </v-menu>
                </div>
            </v-col>
        </v-row>

        <v-row dense>
            <v-col cols="12">
                <v-btn
                    size="small"
                    variant="outlined"
                    prepend-icon="mdi-refresh"
                    @click="$emit('reset-colors')"
                    block
                >
                    {{ t.resetColors }}
                </v-btn>
            </v-col>
        </v-row>
    </div>
</template>

<style scoped>
    @media (max-width: 768px) {
        .v-switch {
            font-size: 0.85rem;
        }

        .v-switch .v-label {
            font-size: 0.85rem !important;
        }
    }

    @media (max-width: 600px) {
        .v-switch {
            font-size: 0.8rem;
        }

        .v-switch .v-label {
            font-size: 0.8rem !important;
            white-space: nowrap;
            overflow: visible;
        }
    }
</style>

<script setup lang="ts">
    import { useSafeI18n } from "../../../utils/i18n/locale";
    import type { FGOCardData } from "../../../utils/cardgen";

    const { t } = useSafeI18n("fgo-stats-controls", {
        statsMode: "Stats Mode",
        useNumbers: "Numbers",
        useText: "Custom Text",
        atk: "ATK",
        hp: "HP",
        atkText: "ATK Text",
        hpText: "HP Text",
        goldNumbers: "Gold",
        resetColors: "Reset All Text Colors",
    });

    defineProps<{
        cardData: FGOCardData;
        useNumbersForStats: boolean;
        customAtkText: string;
        customHpText: string;
        customNameColor: string;
        customSubnameColor: string;
        customAtkColor: string;
        customHpColor: string;
    }>();

    defineEmits<{
        "update:className": [value: string];
        "update:classVariant": [value: string];
        "update:starLevel": [value: string];
        "update:rarityState": [value: string];
        "update:frameCategory": [value: string];
        "update:name": [value: string];
        "update:subname": [value: string];
        "update:atk": [value: number];
        "update:hp": [value: number];
        "update:isGold": [value: boolean];
        "update:useNumbersForStats": [value: boolean];
        "update:atkText": [value: string];
        "update:hpText": [value: string];
        "update:nameColor": [value: string];
        "update:subnameColor": [value: string];
        "update:atkColor": [value: string];
        "update:hpColor": [value: string];
        "reset-colors": [];
    }>();
</script>

<style scoped>
    .panel-item {
        width: 100%;
    }

    .input-with-color {
        position: relative;
    }

    .color-picker-trigger {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 28px;
        height: 28px;
        border: 2px solid white;
        border-radius: 4px;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        z-index: 10;
        transition: transform 0.2s ease;
    }

    .color-picker-trigger:hover {
        transform: scale(1.1);
    }

    .v-switch {
        min-width: fit-content;
    }

    .v-switch .v-label {
        white-space: nowrap;
        overflow: visible;
    }
</style>
