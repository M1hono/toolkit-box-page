<!--
/**
 * @fileoverview FGO Search Bar Component
 * @component FgoSearchBar
 * @description Character search and file upload functionality
 */
-->

<template>
    <div class="search-bar">
        <h1 class="title">{{ t.title }}</h1>
        <div class="input-methods">
            <input
                v-model="searchQuery"
                @input="handleSearch"
                :placeholder="t.searchPlaceholder"
                class="search-input"
            />
            <span class="or-text">{{ t.or }}</span>
            <label class="file-upload-btn">
                {{ t.uploadImage }}
                <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    @change="handleFileUpload"
                    style="display: none"
                />
            </label>
        </div>

        <div v-if="searchResults.length > 0" class="search-results">
            <div
                v-for="result in searchResults"
                :key="result.id"
                class="result-item"
                @click="$emit('select', result)"
            >
                {{ result.name }} ({{ result.jpName }})
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { SearchResult } from "../../../../utils/chara/fgo/types";

    const { t } = useSafeI18n("fgo-search", {
        title: "FGO Character Portrait Extractor",
        searchPlaceholder: "Search character name...",
        or: "or",
        uploadImage: "Upload Image",
    });

    defineProps<{
        searchResults: SearchResult[];
    }>();

    const emit = defineEmits<{
        search: [query: string];
        select: [result: SearchResult];
        upload: [file: File];
    }>();

    const searchQuery = ref("");

    function handleSearch() {
        emit("search", searchQuery.value);
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
    .search-bar {
        background: var(--vp-c-bg);
        padding: 20px;
        border-bottom: 1px solid var(--vp-c-divider);
    }

    .title {
        text-align: center;
        margin: 0 0 16px 0;
        font-size: 1.75rem;
        font-weight: 600;
        background: linear-gradient(135deg, var(--vp-c-brand-1), #722ed1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .input-methods {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        flex-wrap: wrap;
    }

    .search-input {
        flex: 1;
        max-width: 400px;
        min-width: 200px;
        padding: 10px 12px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 0.9rem;
    }

    .search-input:focus {
        outline: none;
        border-color: var(--vp-c-brand-1);
    }

    .or-text {
        font-size: 0.9rem;
        color: var(--vp-c-text-3);
    }

    .file-upload-btn {
        padding: 10px 20px;
        background: var(--vp-c-brand-1);
        color: white;
        border: 1px solid var(--vp-c-brand-1);
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .file-upload-btn:hover {
        background: var(--vp-c-brand-2);
        border-color: var(--vp-c-brand-2);
    }

    .search-results {
        margin-top: 16px;
        max-height: 200px;
        overflow-y: auto;
        background: var(--vp-c-bg-soft);
        border: 1px solid var(--vp-c-divider);
        border-radius: 6px;
    }

    .result-item {
        padding: 10px 16px;
        cursor: pointer;
        border-bottom: 1px solid var(--vp-c-divider);
        transition: background 0.15s ease;
    }

    .result-item:hover {
        background: var(--vp-c-bg);
    }

    .result-item:last-child {
        border-bottom: none;
    }

    @media (max-width: 768px) {
        .input-methods {
            flex-direction: column;
            align-items: stretch;
        }

        .search-input {
            max-width: none;
        }

        .or-text {
            display: none;
        }
    }
</style>
