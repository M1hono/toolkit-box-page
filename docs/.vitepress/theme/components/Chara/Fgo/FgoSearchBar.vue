<!--
/**
 * @fileoverview FGO Search Bar Component
 * @component FgoSearchBar
 * @description Character search with Vuetify autocomplete and servant icons
 */
-->

<template>
    <div class="search-bar-wrapper">
        <v-card flat class="search-card">
            <v-card-title class="text-center pa-8 pb-6">
                <div class="title-text">{{ t.title }}</div>
            </v-card-title>

            <v-card-text class="px-8 pb-8">
                <v-autocomplete
                    v-model:search="searchQuery"
                    v-model="selectedValue"
                    :items="resultsWithDisplay"
                    :placeholder="t.searchPlaceholder"
                    item-title="displayText"
                    item-value="id"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    hide-details
                    prepend-inner-icon="mdi-magnify"
                    class="search-autocomplete"
                    @update:model-value="handleSelect"
                >
                    <template #item="{ props, item }">
                        <v-list-item v-bind="props" class="search-result-item">
                            <template #prepend>
                                <v-avatar
                                    size="48"
                                    rounded
                                    class="servant-avatar"
                                >
                                    <v-img
                                        :src="getServantIcon(item.raw)"
                                        :alt="item.raw.name"
                                        cover
                                    >
                                        <template #error>
                                            <div class="icon-placeholder">
                                                <v-icon
                                                    >mdi-account-circle</v-icon
                                                >
                                            </div>
                                        </template>
                                    </v-img>
                                </v-avatar>
                            </template>
                            <v-list-item-title class="result-name">{{
                                item.raw.name
                            }}</v-list-item-title>
                            <v-list-item-subtitle class="result-jp-name">{{
                                item.raw.jpName
                            }}</v-list-item-subtitle>
                        </v-list-item>
                    </template>
                </v-autocomplete>

                <div class="divider-wrapper">
                    <v-divider></v-divider>
                    <span class="divider-text">{{ t.or }}</span>
                    <v-divider></v-divider>
                </div>

                <v-btn
                    block
                    color="primary"
                    size="x-large"
                    variant="elevated"
                    prepend-icon="mdi-upload"
                    @click="triggerFileInput"
                    class="upload-btn"
                >
                    {{ t.uploadImage }}
                </v-btn>

                <input
                    ref="fileInputRef"
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    @change="handleFileUpload"
                    style="display: none"
                />
            </v-card-text>
        </v-card>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch } from "vue";
    import { useData } from "vitepress";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { SearchResult } from "../../../../utils/chara/fgo/types";
    import { getLanguageByCode } from "../../../../config/project-config";

    const { t } = useSafeI18n("fgo-search", {
        title: "FGO Character Portrait Extractor",
        searchPlaceholder: "Search character name...",
        or: "OR",
        uploadImage: "Upload Image",
    });

    const props = defineProps<{
        searchResults: SearchResult[];
    }>();

    const emit = defineEmits<{
        search: [query: string];
        select: [result: SearchResult];
        upload: [file: File];
    }>();

    const { lang } = useData();
    const searchQuery = ref("");
    const selectedValue = ref<number | null>(null);
    const fileInputRef = ref<HTMLInputElement | null>(null);

    const currentRegion = computed(() => {
        const langConfig = getLanguageByCode(lang.value);
        if (lang.value === "zh-CN" || lang.value === "root") return "CN";
        if (lang.value === "ja-JP") return "JP";
        return "NA";
    });

    const resultsWithDisplay = computed(() => {
        return props.searchResults.map((r) => ({
            ...r,
            displayText: `${r.name} (${r.jpName})`,
        }));
    });

    function getServantIcon(result: any): string {
        const iconId = result.faceId || `${result.id}0`;
        return `https://static.atlasacademy.io/${currentRegion.value}/Faces/f_${iconId}.png`;
    }

    watch(searchQuery, (newValue) => {
        emit("search", newValue);
    });

    function handleSelect(value: number | null) {
        if (!value) return;
        const result = props.searchResults.find((r) => r.id === value);
        if (result) {
            emit("select", result);
            selectedValue.value = null;
            searchQuery.value = "";
        }
    }

    function triggerFileInput() {
        fileInputRef.value?.click();
    }

    function handleFileUpload(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            emit("upload", file);
            target.value = "";
        }
    }
</script>

<style scoped>
    .search-bar-wrapper {
        background: var(--vp-c-bg);
        padding: 0 16px 16px 16px;
    }

    .search-card {
        width: 100%;
        border: 1px solid var(--vp-c-divider) !important;
        border-radius: 12px !important;
    }

    .title-text {
        font-size: 2rem;
        font-weight: 700;
        line-height: 1.2;
        background: linear-gradient(135deg, var(--vp-c-brand-1), #722ed1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.5px;
    }

    .search-autocomplete {
        margin-bottom: 20px;
    }

    .search-result-item {
        padding: 12px 16px !important;
    }

    .servant-avatar {
        border: 1px solid var(--vp-c-divider);
        background: var(--vp-c-bg);
    }

    .result-name {
        font-size: 1rem;
        font-weight: 600;
        color: var(--vp-c-text-1);
        margin-bottom: 2px;
    }

    .result-jp-name {
        font-size: 0.85rem;
        color: var(--vp-c-text-3);
    }

    .servant-avatar {
        border: 1px solid var(--vp-c-divider);
        background: var(--vp-c-bg);
        flex-shrink: 0;
    }

    .icon-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--vp-c-bg-soft);
        color: var(--vp-c-text-3);
    }

    .divider-wrapper {
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 24px 0;
    }

    .divider-text {
        color: var(--vp-c-text-3);
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 2px;
        white-space: nowrap;
    }

    .upload-btn {
        font-weight: 600;
        font-size: 0.95rem;
        letter-spacing: 0.5px;
    }

    @media (max-width: 768px) {
        .search-bar-wrapper {
            padding: 16px;
        }

        .title-text {
            font-size: 1.5rem;
        }

        .search-autocomplete {
            font-size: 0.9rem;
        }
    }
</style>
