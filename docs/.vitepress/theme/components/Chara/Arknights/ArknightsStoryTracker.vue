<!--
/**
 * @fileoverview Arknights Story Tracker Component
 * @component ArknightsStoryTracker
 * @description Track character story appearances and link to external readers
 */
-->

<template>
    <div class="story-tracker">
        <div class="tracker-header">
            <h1 class="title">{{ t.title }}</h1>
            <p class="subtitle">{{ t.subtitle }}</p>
        </div>

        <div class="search-container">
            <v-autocomplete
                v-model="selectedId"
                v-model:search="searchQuery"
                :items="searchItems"
                :placeholder="t.searchPlaceholder"
                item-title="label"
                item-value="id"
                variant="outlined"
                density="comfortable"
                clearable
                hide-details
                class="search-input"
                @update:model-value="handleSelect"
            >
                <template #item="{ props, item }">
                    <v-list-item
                        v-bind="props"
                        :title="item.raw.name"
                        :subtitle="item.raw.subtitle"
                    >
                        <template #prepend>
                            <v-avatar size="40">
                                <v-img :src="getThumbnailUrl(item.raw.id)" />
                            </v-avatar>
                        </template>
                    </v-list-item>
                </template>
            </v-autocomplete>
        </div>

        <div v-if="selectedCharacter" class="character-content">
            <div class="character-header">
                <div class="char-info">
                    <h2 class="char-name">{{ selectedCharacter.displayName }}</h2>
                    <div class="char-meta">
                        <v-chip size="small" :color="selectedCharacter.charType === 'operator' ? 'success' : 'info'">
                            {{ selectedCharacter.charType }}
                        </v-chip>
                        <span class="meta-text">{{ selectedCharacter.speakerNames?.length || 0 }} names</span>
                        <span class="meta-text">{{ characterStories.length }} stories</span>
                    </div>
                </div>
            </div>

            <div class="variants-section">
                <h3 class="section-title">{{ t.variantsTitle }}</h3>
                <div class="variants-grid">
                    <div
                        v-for="variant in selectedCharacter.validVariants"
                        :key="variant"
                        class="variant-item"
                        @click="showPreviewVariant(variant)"
                    >
                        <v-img
                            :src="getThumbnailUrl(variant)"
                            aspect-ratio="1"
                            class="variant-thumb"
                            cover
                        >
                            <template #placeholder>
                                <div class="placeholder">
                                    <v-icon>mdi-image</v-icon>
                                </div>
                            </template>
                        </v-img>
                        <div class="variant-label">{{ getVariantLabel(variant) }}</div>
                    </div>
                </div>
            </div>

            <div class="reader-section">
                <h3 class="section-title">{{ t.readerTitle }}</h3>
                <v-btn-toggle
                    v-model="selectedReader"
                    mandatory
                    variant="outlined"
                    divided
                    class="reader-toggle"
                >
                    <v-btn value="textReader">
                        <v-icon start>mdi-book-open-variant</v-icon>
                        Text Reader
                    </v-btn>
                    <v-btn value="akgcc">
                        <v-icon start>mdi-bookshelf</v-icon>
                        akgcc Reader
                    </v-btn>
                </v-btn-toggle>
            </div>

            <div class="stories-section">
                <h3 class="section-title">{{ t.storiesTitle }} ({{ characterStories.length }})</h3>
                <div class="stories-grid">
                    <div
                        v-for="(story, idx) in characterStories"
                        :key="idx"
                        class="story-card"
                        @click="openStory(story)"
                    >
                        <div class="story-icon">
                            <v-img
                                :src="getStoryIconUrl(story.path)"
                                aspect-ratio="1"
                                cover
                            >
                                <template #placeholder>
                                    <div class="icon-placeholder">
                                        <v-icon>mdi-book</v-icon>
                                    </div>
                                </template>
                            </v-img>
                        </div>
                        <div class="story-info">
                            <div class="story-name">{{ getStoryDisplayName(story.path) }}</div>
                            <div class="story-path">{{ story.path }}</div>
                        </div>
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            class="story-action"
                        >
                            <v-icon>mdi-open-in-new</v-icon>
                        </v-btn>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="empty-state">
            <v-icon size="80" color="grey-lighten-1">mdi-book-search</v-icon>
            <h2>{{ t.emptyTitle }}</h2>
            <p>{{ t.emptyDescription }}</p>
        </div>

        <v-dialog v-model="previewDialog" max-width="800">
            <v-card>
                <v-card-title class="preview-title">
                    {{ previewVariant }}
                    <v-btn icon size="small" @click="previewDialog = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                <v-card-text class="preview-content">
                    <v-img
                        :src="getFullImageUrl(previewVariant)"
                        contain
                    />
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useData } from 'vitepress';
import { useSafeI18n } from '../../../../utils/i18n/locale';
import { useArknightsData } from '../../../../utils/chara/arknights/core/useArknightsData';
import { useArknightsStoryReader } from '../../../../utils/chara/arknights/core/useArknightsStoryReader';
import type { UnifiedCharacterData } from '../../../../utils/chara/arknights/types';
import { getLanguageByCode } from '../../../../config/project-config';

const { t } = useSafeI18n('arknights-story-tracker', {
    title: 'Arknights Story Tracker',
    subtitle: 'Track character appearances across story files and link to external readers',
    searchPlaceholder: 'Search character name...',
    variantsTitle: 'Character Variants',
    readerTitle: 'Story Reader',
    storiesTitle: 'Story Appearances',
    emptyTitle: 'No Character Selected',
    emptyDescription: 'Search for a character to view their story appearances',
});

const { lang } = useData();
const {
    loadLanguageData,
    getAllCharacterIdsByName,
    getCharacterById,
    getStoryReadersForCharacter,
    names,
    stats
} = useArknightsData();

const { getStoryReaderUrls } = useArknightsStoryReader();

const searchQuery = ref('');
const selectedId = ref<string | null>(null);
const selectedCharacter = ref<UnifiedCharacterData | null>(null);
const selectedReader = ref<'textReader' | 'akgcc'>('textReader');
const previewDialog = ref(false);
const previewVariant = ref('');

const currentLangCode = computed(() => {
    const langConfig = getLanguageByCode(lang.value);
    if (langConfig) {
        const linkPath = langConfig.link?.split('/').filter(Boolean)[0];
        if (linkPath) {
            return linkPath.replace('-', '_').toLowerCase();
        }
    }
    return 'en_us';
});

const searchItems = computed(() => {
    const items: Array<{ id: string; label: string; name: string; subtitle: string }> = [];
    
    for (const [id, nameData] of Object.entries(names.value)) {
        const allNames = [
            nameData.displayName,
            ...(nameData.speakerNames || []),
            ...(nameData.searchNames || [])
        ].filter((v, i, a) => v && a.indexOf(v) === i);
        
        items.push({
            id,
            label: nameData.displayName,
            name: nameData.displayName,
            subtitle: allNames.slice(1, 3).join(', ') || id
        });
    }
    
    return items.sort((a, b) => a.name.localeCompare(b.name));
});

const characterStories = computed(() => {
    if (!selectedCharacter.value) return [];
    return getStoryReadersForCharacter(selectedCharacter.value.charId);
});

function getThumbnailUrl(variant: string): string {
    const encoded = encodeURIComponent(variant.toLowerCase());
    return `https://raw.githubusercontent.com/akgcc/arkdata/refs/heads/main/thumbs/${encoded}.webp`;
}

function getFullImageUrl(variant: string): string {
    const encoded = encodeURIComponent(variant.toLowerCase());
    return `https://raw.githubusercontent.com/akgcc/arkdata/main/assets/avg/characters/${encoded}.png`;
}

function getStoryIconUrl(storyPath: string): string {
    const type = storyPath.split('/')[0];
    return `https://r2.m31ns.top/img/icons/${type}_0.png`;
}

function getStoryDisplayName(storyPath: string): string {
    const parts = storyPath.split('/');
    const filename = parts[parts.length - 1].replace('.txt', '');
    return filename.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getVariantLabel(variant: string): string {
    const match = variant.match(/#(\d+)\$(\d+)$/);
    if (!match) return variant;
    return `Face ${match[1]} Body ${match[2]}`;
}

function handleSelect(id: string | null) {
    if (!id) {
        selectedCharacter.value = null;
        return;
    }
    
    const char = getCharacterById(id);
    if (char) {
        selectedCharacter.value = char;
    }
}

function showPreviewVariant(variant: string) {
    previewVariant.value = variant;
    previewDialog.value = true;
}

function openStory(story: { path: string; urls: any }) {
    const url = selectedReader.value === 'textReader' ? story.urls.textReader : story.urls.akgcc;
    window.open(url, '_blank');
}

watch(() => lang.value, async () => {
    await loadLanguageData(currentLangCode.value);
});

onMounted(async () => {
    await loadLanguageData(currentLangCode.value);
});
</script>

<style scoped>
.story-tracker {
    min-height: 100vh;
    background: var(--vp-c-bg);
    padding: 24px;
}

.tracker-header {
    text-align: center;
    margin-bottom: 32px;
}

.title {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 8px 0;
    background: linear-gradient(135deg, var(--vp-c-brand-1), #1890ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.subtitle {
    font-size: 0.95rem;
    color: var(--vp-c-text-2);
    margin: 0;
}

.search-container {
    max-width: 700px;
    margin: 0 auto 32px;
}

.character-content {
    max-width: 1200px;
    margin: 0 auto;
}

.character-header {
    background: var(--vp-c-bg-soft);
    border: 1px solid var(--vp-c-divider);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
}

.char-name {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 12px 0;
    color: var(--vp-c-text-1);
}

.char-meta {
    display: flex;
    align-items: center;
    gap: 12px;
}

.meta-text {
    font-size: 0.9rem;
    color: var(--vp-c-text-2);
}

.variants-section,
.reader-section,
.stories-section {
    margin-bottom: 32px;
}

.section-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: var(--vp-c-text-1);
}

.variants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 16px;
}

.variant-item {
    cursor: pointer;
    transition: transform 0.2s ease;
    border-radius: 8px;
    overflow: hidden;
    background: var(--vp-c-bg-soft);
    border: 2px solid transparent;
}

.variant-item:hover {
    transform: translateY(-4px);
    border-color: var(--vp-c-brand-1);
}

.variant-thumb {
    border-radius: 8px 8px 0 0;
}

.placeholder,
.icon-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--vp-c-bg-soft);
}

.variant-label {
    padding: 8px;
    text-align: center;
    font-size: 0.75rem;
    color: var(--vp-c-text-2);
    background: var(--vp-c-bg);
}

.reader-toggle {
    width: 100%;
}

.stories-grid {
    display: grid;
    gap: 12px;
}

.story-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    background: var(--vp-c-bg-soft);
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.story-card:hover {
    background: var(--vp-c-bg);
    border-color: var(--vp-c-brand-1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.story-icon {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    border-radius: 6px;
    overflow: hidden;
    background: var(--vp-c-bg);
}

.story-info {
    flex: 1;
    min-width: 0;
}

.story-name {
    font-weight: 500;
    margin-bottom: 4px;
    color: var(--vp-c-text-1);
}

.story-path {
    font-size: 0.8rem;
    color: var(--vp-c-text-3);
    font-family: monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.story-action {
    flex-shrink: 0;
}

.empty-state {
    text-align: center;
    padding: 80px 24px;
    color: var(--vp-c-text-3);
}

.empty-state h2 {
    margin: 16px 0 8px;
    color: var(--vp-c-text-2);
}

.empty-state p {
    margin: 0;
}

.preview-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.preview-content {
    padding: 0;
}

@media (max-width: 768px) {
    .story-tracker {
        padding: 16px;
    }
    
    .variants-grid {
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    }
    
    .story-card {
        flex-direction: column;
        text-align: center;
    }
    
    .story-icon {
        width: 100%;
        height: 80px;
    }
}
</style>
