<!--
/**
 * @fileoverview Custom Icon Panel Component
 * @component CustomIconPanel
 * @description Independent custom icon configuration panel
 */
-->

<template>
    <div>
        <div class="d-flex align-center ga-2 mb-2">
            <v-switch
                :model-value="useCustomIcon"
                :label="t.customIcon"
                color="secondary"
                density="compact"
                hide-details
                @update:model-value="$emit('update:useCustomIcon', $event)"
            />
            <v-chip
                :color="useCustomIcon ? 'secondary' : 'default'"
                size="small"
            >
                {{ useCustomIcon ? t.custom : t.default }}
            </v-chip>
        </div>

        <div v-if="useCustomIcon">
            <v-row dense>
                <v-col cols="12">
                    <v-select
                        :model-value="customIconMethod"
                        :items="[
                            { value: 'upload', label: t.upload },
                            { value: 'url', label: t.url },
                            { value: 'svg', label: t.svg },
                            { value: 'iconify', label: t.iconify },
                        ]"
                        item-title="label"
                        item-value="value"
                        :label="t.method"
                        density="compact"
                        variant="outlined"
                        @update:model-value="$emit('update:customIconMethod', $event)"
                    />
                </v-col>
            </v-row>

            <v-row dense v-if="customIconMethod === 'upload'">
                <v-col cols="12">
                    <v-file-input
                        :model-value="customIconFile ? [customIconFile] : []"
                        accept="image/*"
                        :label="t.upload"
                        density="compact"
                        variant="outlined"
                        @update:model-value="$emit('icon-upload', $event)"
                    />
                </v-col>
            </v-row>

            <v-row dense v-if="customIconMethod === 'url'">
                <v-col cols="12">
                    <v-text-field
                        :model-value="customIconUrl"
                        :label="t.url"
                        density="compact"
                        variant="outlined"
                        @update:model-value="$emit('update:iconUrl', $event)"
                    />
                </v-col>
            </v-row>

            <v-row dense v-if="customIconMethod === 'svg'">
                <v-col cols="12">
                    <v-textarea
                        :model-value="customIconSvgText"
                        :label="t.svgText"
                        density="compact"
                        variant="outlined"
                        rows="3"
                        @update:model-value="$emit('update:svgText', $event)"
                    />
                </v-col>
                <v-col cols="12">
                    <div class="text-caption mb-1">{{ t.svgColor }}</div>
                    <v-color-picker
                        :model-value="customIconSvgColor"
                        mode="rgba"
                        @update:model-value="$emit('update:svgColor', $event)"
                    />
                </v-col>
            </v-row>

            <v-row dense v-if="customIconMethod === 'iconify'">
                <v-col cols="12">
                    <v-autocomplete
                        :model-value="customIconifyName"
                        :items="iconifySuggestions"
                        :label="t.iconifyName"
                        placeholder="account-circle"
                        density="compact"
                        variant="outlined"
                        @update:search="$emit('search-icons', $event)"
                        @update:model-value="
                            $emit('update:iconifyName', $event)
                        "
                    />
                </v-col>
                <v-col cols="12">
                    <div class="text-caption mb-1">{{ t.iconifyColor }}</div>
                    <v-color-picker
                        :model-value="customIconifyColor"
                        mode="hex"
                        @update:model-value="
                            $emit('update:iconifyColor', $event)
                        "
                    />
                </v-col>
            </v-row>

            <v-row dense>
                <v-col cols="12">
                    <div class="text-caption mb-1">
                        {{ t.size }}: {{ customIconSize }}px
                    </div>
                    <v-slider
                        :model-value="customIconSize"
                        min="20"
                        max="200"
                        density="compact"
                        hide-details
                        @update:model-value="$emit('update:iconSize', $event)"
                    />
                </v-col>
                <v-col cols="6">
                    <div class="text-caption mb-1">{{ t.x }}: {{ customIconX }}</div>
                    <v-slider
                        :model-value="customIconX"
                        min="0"
                        max="500"
                        density="compact"
                        hide-details
                        @update:model-value="$emit('update:iconX', $event)"
                    />
                </v-col>
                <v-col cols="6">
                    <div class="text-caption mb-1">{{ t.y }}: {{ customIconY }}</div>
                    <v-slider
                        :model-value="customIconY"
                        min="0"
                        max="850"
                        density="compact"
                        hide-details
                        @update:model-value="$emit('update:iconY', $event)"
                    />
                </v-col>
            </v-row>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../utils/i18n/locale";

    const { t } = useSafeI18n("fgo-custom-icon-panel", {
        customIcon: "Custom Icon",
        custom: "Custom",
        default: "Default",
        method: "Method",
        upload: "Upload",
        url: "URL",
        svg: "SVG",
        iconify: "Iconify",
        iconSearch: "Search Icons",
        iconSize: "Size",
        iconX: "X",
        iconY: "Y",
        svgText: "SVG Text",
        svgColor: "SVG Color",
        iconifyName: "Iconify Name",
        iconifyColor: "Iconify Color",
        size: "Size",
        x: "X",
        y: "Y",
    });

    defineProps<{
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
    }>();

    defineEmits<{
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
    }>();
</script>

<style scoped>
    .panel-section {
        width: 100%;
    }
</style>
