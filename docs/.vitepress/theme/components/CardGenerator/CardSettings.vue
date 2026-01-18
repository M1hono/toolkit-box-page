<!--
/**
 * @fileoverview Card Settings - Complete Left Panel
 * @component CardSettings
 * @description All card configuration controls in one organized panel
 */
-->

<template>
    <v-card class="panel-section">
        <v-card-title class="text-h6">{{ t.cardSettings }}</v-card-title>
        <v-card-text>
            <v-row dense>
                <v-col cols="6">
                    <v-select
                        :model-value="cardData.className"
                        :items="availableClasses"
                        item-title="label"
                        item-value="value"
                        :label="t.class"
                        density="compact"
                        variant="outlined"
                        :disabled="useCustomIcon"
                        @update:model-value="$emit('update:className', $event)"
                    />
                </v-col>
                <v-col cols="6">
                    <v-select
                        :model-value="cardData.classVariant"
                        :items="classVariants"
                        item-title="label"
                        item-value="value"
                        :label="t.variant"
                        density="compact"
                        variant="outlined"
                        :disabled="useCustomIcon"
                        @update:model-value="
                            $emit('update:classVariant', $event)
                        "
                    />
                </v-col>
            </v-row>

            <v-row dense>
                <v-col cols="4">
                    <v-select
                        :model-value="cardData.starLevel"
                        :items="availableRarities"
                        item-title="label"
                        item-value="value"
                        :label="t.rarity"
                        density="compact"
                        variant="outlined"
                        @update:model-value="$emit('update:starLevel', $event)"
                    />
                </v-col>
                <v-col cols="4">
                    <v-select
                        :model-value="cardData.rarityState"
                        :items="availableRarityStates"
                        item-title="label"
                        item-value="filename"
                        :label="t.state"
                        density="compact"
                        variant="outlined"
                        @update:model-value="
                            $emit('update:rarityState', $event)
                        "
                    />
                </v-col>
                <v-col cols="4">
                    <v-select
                        :model-value="cardData.frameCategory"
                        :items="availableFrames"
                        item-title="label"
                        item-value="value"
                        :label="t.frame"
                        density="compact"
                        variant="outlined"
                        @update:model-value="
                            $emit('update:frameCategory', $event)
                        "
                    />
                </v-col>
            </v-row>

            <v-row dense>
                <v-col cols="6">
                    <div class="input-with-color">
                        <v-text-field
                            :model-value="cardData.name"
                            :label="t.servantName"
                            density="compact"
                            variant="outlined"
                            @update:model-value="$emit('update:name', $event)"
                        />
                        <v-menu :close-on-content-click="false">
                            <template #activator="{ props }">
                                <div
                                    v-bind="props"
                                    class="color-trigger"
                                    :style="{
                                        background: customNameColor || 'white',
                                    }"
                                />
                            </template>
                            <v-card>
                                <v-card-text class="pa-2">
                                    <v-color-picker
                                        :model-value="customNameColor"
                                        mode="rgba"
                                        @update:model-value="
                                            $emit('update:nameColor', $event)
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
                            :model-value="cardData.subname"
                            :label="t.subname"
                            density="compact"
                            variant="outlined"
                            @update:model-value="
                                $emit('update:subname', $event)
                            "
                        />
                        <v-menu :close-on-content-click="false">
                            <template #activator="{ props }">
                                <div
                                    v-bind="props"
                                    class="color-trigger"
                                    :style="{
                                        background:
                                            customSubnameColor || 'white',
                                    }"
                                />
                            </template>
                            <v-card>
                                <v-card-text class="pa-2">
                                    <v-color-picker
                                        :model-value="customSubnameColor"
                                        mode="rgba"
                                        @update:model-value="
                                            $emit('update:subnameColor', $event)
                                        "
                                    />
                                </v-card-text>
                            </v-card>
                        </v-menu>
                    </div>
                </v-col>
            </v-row>

            <v-divider class="my-4" />

            <!-- Stats Section -->
            <StatsControls
                :card-data="cardData"
                :use-numbers-for-stats="useNumbersForStats"
                :custom-atk-text="customAtkText"
                :custom-hp-text="customHpText"
                :custom-name-color="customNameColor"
                :custom-subname-color="customSubnameColor"
                :custom-atk-color="customAtkColor"
                :custom-hp-color="customHpColor"
                @update:atk="$emit('update:atk', $event)"
                @update:hp="$emit('update:hp', $event)"
                @update:is-gold="$emit('update:isGold', $event)"
                @update:use-numbers-for-stats="
                    $emit('update:useNumbersForStats', $event)
                "
                @update:atk-text="$emit('update:atkText', $event)"
                @update:hp-text="$emit('update:hpText', $event)"
                @update:atk-color="$emit('update:atkColor', $event)"
                @update:hp-color="$emit('update:hpColor', $event)"
                @reset-colors="$emit('reset-colors')"
            />

            <v-divider class="my-4" />

            <!-- Custom Icon Section -->
            <CustomIconPanel
                :use-custom-icon="useCustomIcon"
                :custom-icon-method="customIconMethod"
                :custom-icon-url="customIconUrl"
                :custom-icon-svg-text="customIconSvgText"
                :custom-icon-svg-color="customIconSvgColor"
                :custom-iconify-name="customIconifyName"
                :custom-iconify-color="customIconifyColor"
                :custom-icon-file="customIconFile"
                :custom-icon-size="customIconSize"
                :custom-icon-x="customIconX"
                :custom-icon-y="customIconY"
                :iconify-suggestions="iconifySuggestions"
                @update:use-custom-icon="$emit('update:useCustomIcon', $event)"
                @update:custom-icon-method="$emit('update:customIconMethod', $event)"
                @update:icon-url="$emit('update:iconUrl', $event)"
                @update:svg-text="$emit('update:svgText', $event)"
                @update:svg-color="$emit('update:svgColor', $event)"
                @update:iconify-name="$emit('update:iconifyName', $event)"
                @update:iconify-color="$emit('update:iconifyColor', $event)"
                @update:icon-size="$emit('update:iconSize', $event)"
                @update:icon-x="$emit('update:iconX', $event)"
                @update:icon-y="$emit('update:iconY', $event)"
                @method-change="$emit('method-change')"
                @icon-upload="$emit('icon-upload', $event)"
                @search-icons="$emit('search-icons', $event)"
            />

            <v-divider class="my-4" />

            <!-- Image Upload Section -->
            <ImageUploadZone
                :uploaded-files="uploadedFiles"
                :active-file-index="activeFileIndex"
                @trigger-select="$emit('trigger-select')"
                @set-active="$emit('set-active', $event)"
                @rotate="$emit('rotate', $event)"
                @remove="$emit('remove', $event)"
            />

            <v-divider class="my-4" />

            <!-- Image Controls Section -->
            <ImageControls
                :active-file-index="activeFileIndex"
                :current-image-scale="currentImageScale"
                :max-image-scale="maxImageScale"
                @rotate="$emit('rotate', $event)"
                @update:scale="$emit('update:scale', $event)"
                @save="$emit('save')"
                @copy="$emit('copy')"
                @export="$emit('export')"
                @import="$emit('import')"
            />
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import type { FGOCardData } from "../../../utils/cardgen";
    import { useSafeI18n } from "../../../utils/i18n/locale";
    import StatsControls from "./StatsControls.vue";
    import CustomIconPanel from "./CustomIconPanel.vue";
    import ImageUploadZone from "./ImageUploadZone.vue";
    import ImageControls from "./ImageControls.vue";

    const { t } = useSafeI18n("fgo-card-settings", {
        cardSettings: "Card Settings",
        class: "Class",
        variant: "Variant",
        rarity: "Rarity",
        state: "State",
        frame: "Frame",
        servantName: "Servant",
        className: "Class",
        goldNumbers: "Gold",
        customIcon: "Custom Icon",
        iconMethod: "Icon Method",
        upload: "Upload",
        url: "URL",
        svg: "SVG",
        iconify: "Iconify",
        iconSearch: "Search Icons",
        iconSize: "Size",
        iconX: "X",
        iconY: "Y",
        name: "Name",
        subname: "Subname",
        atk: "ATK",
        hp: "HP",
        resetColors: "Reset Colors",
    });

    defineProps<{
        cardData: FGOCardData;
        availableClasses: Array<{ value: string; label: string }>;
        classVariants: Array<{ value: string; label: string }>;
        availableRarities: Array<{ value: string; label: string }>;
        availableRarityStates: Array<{ value: string; label: string }>;
        availableFrames: Array<{ value: string; label: string }>;
        useCustomIcon: boolean;
        customIconMethod: string;
        customIconUrl: string;
        customIconSvgText: string;
        customIconSvgColor: string;
        customIconifyName: string;
        customIconifyColor: string;
        customIconFile: File | undefined;
        customIconSize: number;
        customIconX: number;
        customIconY: number;
        iconifySuggestions: string[];
        useNumbersForStats: boolean;
        customAtkText: string;
        customHpText: string;
        customNameColor: string;
        customSubnameColor: string;
        customAtkColor: string;
        customHpColor: string;
        uploadedFiles: any[];
        activeFileIndex: number;
        currentImageScale: number;
        maxImageScale: number;
    }>();

    defineEmits<{
        "update:className": [value: string];
        "update:classVariant": [value: string];
        "update:starLevel": [value: string];
        "update:rarityState": [value: string];
        "update:frameCategory": [value: string];
        "update:name": [value: string];
        "update:subname": [value: string];
        "update:nameColor": [value: string];
        "update:subnameColor": [value: string];
        "update:atk": [value: number];
        "update:hp": [value: number];
        "update:isGold": [value: boolean];
        "update:useNumbersForStats": [value: boolean];
        "update:atkText": [value: string];
        "update:hpText": [value: string];
        "update:atkColor": [value: string];
        "update:hpColor": [value: string];
        "reset-colors": [];
        "update:useCustomIcon": [value: boolean];
        "update:customIconMethod": [value: string];
        "update:iconUrl": [value: string];
        "update:svgText": [value: string];
        "update:svgColor": [value: string];
        "update:iconifyName": [value: string];
        "update:iconifyColor": [value: string];
        "update:iconSize": [value: number];
        "update:iconX": [value: number];
        "update:iconY": [value: number];
        "method-change": [];
        "icon-upload": [files: File[] | null];
        "search-icons": [query: string];
        "trigger-select": [];
        "set-active": [index: number];
        rotate: [degrees: number];
        remove: [index: number];
        "update:scale": [value: number];
        save: [];
        copy: [];
        export: [];
        import: [];
    }>();
</script>

<style scoped>
    .settings-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .panel-section {
        width: 100%;
    }

    .input-with-color {
        position: relative;
    }

    .color-trigger {
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

    .color-trigger:hover {
        transform: scale(1.1);
    }
</style>
