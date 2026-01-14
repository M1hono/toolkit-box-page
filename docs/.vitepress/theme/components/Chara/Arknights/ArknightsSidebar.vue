<!--
/**
 * @fileoverview Arknights Chara Sidebar
 * @component ArknightsSidebar
 * @description Character list with search, filter and pagination
 */
-->

<template>
    <div class="sidebar-panel">
        <div class="sidebar-header">
            <h3 class="sidebar-title">{{ t.listHeader }}</h3>
            <span class="count-badge">{{ totalCount }}</span>
        </div>

        <div class="sidebar-filters">
            <input
                type="text"
                class="search-input"
                :placeholder="t.searchPlaceholder"
                :value="search"
                @input="handleSearch"
            />
            <select
                class="type-select"
                :value="type"
                @change="handleTypeChange"
            >
                <option value="">{{ t.typeAll }}</option>
                <option value="operator">{{ t.typeOperator }}</option>
                <option value="npc">{{ t.typeNpc }}</option>
            </select>
        </div>

        <div class="character-list">
            <div v-if="characters.length === 0" class="empty-list">
                <span>{{ t.noResults }}</span>
            </div>

            <div
                v-for="char in characters"
                :key="char.charId"
                class="character-item"
                :class="{ 'is-selected': selectedId === char.charId }"
                @click="$emit('select', char)"
            >
                <div class="char-avatar">
                    <img
                        :src="getAvatar(char)"
                        :alt="char.displayName"
                        loading="lazy"
                        @error="handleImageError"
                    />
                </div>
                <div class="char-info">
                    <div class="char-name">
                        {{ char.displayName }}
                    </div>
                    <div class="char-meta">
                        <span class="char-type" :class="char.charType">
                            {{
                                char.charType === "operator"
                                    ? t.typeOperator
                                    : t.typeNpc
                            }}
                        </span>
                        <span class="char-scenes"
                            >{{ char.dialogCount || 0 }}{{ t.scenesUnit }}</span
                        >
                    </div>
                    <div
                        v-if="char.speakerNames && char.speakerNames.length > 1"
                        class="char-aliases"
                    >
                        {{ char.speakerNames.slice(1, 3).join(", ") }}
                        <span v-if="char.speakerNames.length > 3"
                            >+{{ char.speakerNames.length - 3 }}</span
                        >
                    </div>
                </div>
                <div class="char-variants">{{ char.validVariants.length }}</div>
            </div>
        </div>

        <div class="sidebar-pagination">
            <span class="page-info">{{ paginationText }}</span>
            <div class="page-controls">
                <button
                    class="page-btn"
                    :disabled="currentPage <= 1"
                    @click="$emit('page-change', currentPage - 1)"
                >
                    ‹
                </button>
                <span class="page-current">{{ currentPage }}</span>
                <button
                    class="page-btn"
                    :disabled="currentPage >= totalPages"
                    @click="$emit('page-change', currentPage + 1)"
                >
                    ›
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { UnifiedCharacterData } from "../../../../utils/chara/arknights/types";

    const { t } = useSafeI18n("arknights-sidebar", {
        searchPlaceholder: "Search character...",
        typeAll: "All",
        typeOperator: "Operator",
        typeNpc: "NPC",
        listHeader: "Characters",
        scenesUnit: " scenes",
        noResults: "No characters found",
        allNames: "All Names:",
    });

    const props = defineProps<{
        characters: UnifiedCharacterData[];
        selectedId: string | null;
        totalCount: number;
        currentPage: number;
        totalPages: number;
        pageSize: number;
        getAvatar: (char: UnifiedCharacterData) => string;
        search?: string;
        type?: string;
    }>();

    const emit = defineEmits<{
        select: [char: UnifiedCharacterData];
        "update:search": [value: string];
        "update:type": [value: string];
        "page-change": [page: number];
    }>();

    const paginationText = computed(() => {
        if (props.totalCount === 0) return "0";
        const start = (props.currentPage - 1) * props.pageSize + 1;
        const end = Math.min(
            props.currentPage * props.pageSize,
            props.totalCount
        );
        return `${start}-${end} / ${props.totalCount}`;
    });

    function handleSearch(e: Event) {
        const target = e.target as HTMLInputElement;
        emit("update:search", target.value);
        emit("page-change", 1);
    }

    function handleTypeChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        emit("update:type", target.value);
        emit("page-change", 1);
    }

    function handleImageError(e: Event) {
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
    }
</script>

<style scoped>
    .sidebar-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--vp-c-bg);
        border: 1px solid var(--vp-c-divider);
        border-radius: 8px;
        overflow: hidden;
    }

    .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--vp-c-divider);
        flex-shrink: 0;
    }

    .sidebar-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--vp-c-text-1);
        margin: 0;
    }

    .count-badge {
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--vp-c-brand-1);
        background: var(--vp-c-brand-soft);
        padding: 2px 10px;
        border-radius: 10px;
    }

    .sidebar-filters {
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        border-bottom: 1px solid var(--vp-c-divider);
        flex-shrink: 0;
    }

    .search-input,
    .type-select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 0.9rem;
    }

    .search-input:focus,
    .type-select:focus {
        outline: none;
        border-color: var(--vp-c-brand-1);
    }

    .character-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        background: var(--vp-c-bg);
        min-height: 0;
    }

    .character-list::-webkit-scrollbar {
        width: 6px;
    }

    .character-list::-webkit-scrollbar-track {
        background: var(--vp-c-bg-soft);
    }

    .character-list::-webkit-scrollbar-thumb {
        background: var(--vp-c-divider);
        border-radius: 3px;
    }

    .empty-list {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: var(--vp-c-text-3);
        font-size: 0.9rem;
    }

    .character-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
        margin-bottom: 4px;
        background: var(--vp-c-bg);
        border: 1px solid transparent;
        position: relative;
    }

    .character-item:hover {
        background: var(--vp-c-bg-soft);
        border-color: var(--vp-c-divider);
    }

    .character-item.is-selected {
        background: var(--vp-c-brand-soft);
        border-color: var(--vp-c-brand-1) !important;
        border-width: 2px !important;
    }

    .char-avatar {
        width: 44px;
        height: 44px;
        border-radius: 6px;
        overflow: hidden;
        background: var(--vp-c-bg-soft);
        flex-shrink: 0;
    }

    .char-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .char-info {
        flex: 1;
        min-width: 0;
        position: relative;
    }

    .char-name {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--vp-c-text-1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .char-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
    }

    .char-type {
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 500;
    }

    .char-type.operator {
        background: #d1fae5;
        color: #047857;
    }

    .char-type.npc {
        background: #dbeafe;
        color: #1d4ed8;
    }

    .char-scenes {
        font-size: 0.75rem;
        color: var(--vp-c-text-3);
    }

    .char-aliases {
        font-size: 0.7rem;
        color: var(--vp-c-text-3);
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .char-variants {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--vp-c-bg-soft);
        border-radius: 50%;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--vp-c-text-2);
        flex-shrink: 0;
    }

    .sidebar-pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-top: 1px solid var(--vp-c-divider);
        flex-shrink: 0;
    }

    .page-info {
        font-size: 0.8rem;
        color: var(--vp-c-text-3);
    }

    .page-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .page-btn {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--vp-c-divider);
        border-radius: 4px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .page-btn:hover:not(:disabled) {
        border-color: var(--vp-c-brand-1);
        color: var(--vp-c-brand-1);
    }

    .page-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .page-current {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--vp-c-text-1);
        min-width: 24px;
        text-align: center;
    }

    :root.dark .char-type.operator {
        background: #064e3b;
        color: #6ee7b7;
    }

    :root.dark .char-type.npc {
        background: #1e3a8a;
        color: #93c5fd;
    }
</style>
