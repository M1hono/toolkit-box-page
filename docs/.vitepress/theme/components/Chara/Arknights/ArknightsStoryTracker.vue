<!--
/**
 * @fileoverview Arknights Story Tracker
 * @description Track character story appearances with name-based search and disambiguation
 */
-->

<template>
    <div class="story-tracker">
        <v-card flat class="search-card">
            <v-card-text class="pa-6">
                <v-autocomplete
                    v-model="selectedName"
                    v-model:search="searchQuery"
                    :items="nameSearchItems"
                    :placeholder="t.searchPlaceholder"
                    item-title="name"
                    item-value="name"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    hide-details
                    prepend-inner-icon="mdi-magnify"
                    @update:model-value="handleNameSelect"
                >
                    <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                            <template #prepend>
                                <v-avatar size="48" rounded>
                                    <v-img :src="getThumbnailUrl(item.raw.firstVariant)">
                                        <template #error>
                                            <div class="placeholder"><v-icon>mdi-account</v-icon></div>
                                        </template>
                                    </v-img>
                                </v-avatar>
                            </template>
                            <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                            <v-list-item-subtitle>{{ t.characterCount.replace('{count}', String(item.raw.count)) }}</v-list-item-subtitle>
                        </v-list-item>
                    </template>
                </v-autocomplete>
            </v-card-text>
        </v-card>

        <div v-if="selectedCharacter" class="content-section">
            <v-row>
                <v-col cols="12" md="4">
                    <v-card>
                        <v-card-text v-if="availableCharacterIds.length > 1" class="pa-3">
                            <v-select
                                v-model="selectedCharacterId"
                                :items="availableCharacterIds"
                                :label="t.characterVariant"
                                variant="outlined"
                                density="compact"
                                hide-details
                                @update:model-value="switchCharacter"
                            >
                                <template #selection="{ item }">
                                    <v-chip>
                                        <v-avatar start>
                                            <v-img :src="getThumbnailUrl(item.raw.variant)" />
                                        </v-avatar>
                                        {{ item.value }}
                                    </v-chip>
                                </template>
                                <template #item="{ props, item }">
                                    <v-list-item v-bind="props">
                                        <template #prepend>
                                            <v-avatar>
                                                <v-img :src="getThumbnailUrl(item.raw.variant)" />
                                            </v-avatar>
                                        </template>
                                    </v-list-item>
                                </template>
                            </v-select>
                        </v-card-text>

                        <a
                            :href="`${charaFinderPath}?char=${selectedCharacter.charId}`"
                            style="text-decoration: none; color: inherit"
                        >
                            <v-img
                                :src="getFullImageUrl(selectedVariant)"
                                aspect-ratio="0.75"
                                contain
                                class="preview-image"
                            >
                                <template #error>
                                    <div class="placeholder"><v-icon size="64">mdi-image</v-icon></div>
                                </template>
                            </v-img>
                        </a>

                        <v-card-subtitle class="text-center py-2">{{ selectedVariant }}</v-card-subtitle>

                        <v-card-text class="pa-3 flex-spacer">
                            <div class="variants-grid">
                                <v-chip
                                    v-for="(variant, idx) in selectedCharacter.validVariants"
                                    :key="variant"
                                    :variant="idx === selectedVariantIndex ? 'elevated' : 'outlined'"
                                    :color="idx === selectedVariantIndex ? 'primary' : undefined"
                                    @click="selectedVariantIndex = idx"
                                    size="small"
                                >
                                    <v-avatar start size="24">
                                        <v-img :src="getThumbnailUrl(variant)" />
                                    </v-avatar>
                                    {{ getVariantLabel(variant) }}
                                </v-chip>
                            </div>
                        </v-card-text>

                        <v-divider />

                        <v-card-text class="pa-3">
                            <div class="text-subtitle-2 mb-2">{{ t.storyReader }}</div>
                            <v-btn-toggle
                                v-model="selectedReader"
                                mandatory
                                variant="outlined"
                                divided
                                color="primary"
                                class="w-100"
                            >
                                <v-btn value="textReader" class="flex-1-1">
                                    <v-icon start>mdi-book-open-variant</v-icon>
                                    {{ t.textReader }}
                                </v-btn>
                                <v-btn value="akgcc" class="flex-1-1">
                                    <v-icon start>mdi-bookshelf</v-icon>
                                    {{ t.akgcc }}
                                </v-btn>
                            </v-btn-toggle>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" md="8">
                    <v-card>
                        <v-card-title class="d-flex justify-space-between align-center">
                            <span>{{ t.storyAppearances.replace('{count}', String(characterStories.length)) }}</span>
                        </v-card-title>
                        <v-card-text class="flex-spacer">
                            <v-data-iterator
                                :items="characterStories"
                                :items-per-page="25"
                            >
                                <template #default="{ items }">
                                    <div class="stories-grid">
                                        <v-card
                                            v-for="story in items"
                                            :key="story.raw.path"
                                            class="story-card"
                                            hover
                                            @click="openStory(story.raw)"
                                        >
                                            <v-img
                                                :src="getStoryIcon(story.raw.path)"
                                                :lazy-src="`https://r2.m31ns.top/img/icons/404.png`"
                                                aspect-ratio="1"
                                                cover
                                            >
                                                <template #placeholder>
                                                    <div class="placeholder loading">
                                                        <v-progress-circular indeterminate size="24" />
                                                    </div>
                                                </template>
                                                <template #error>
                                                    <div class="placeholder">
                                                        <v-icon>mdi-book</v-icon>
                                                    </div>
                                                </template>
                                            </v-img>
                                            <div class="story-overlay">
                                                <div class="story-name">{{ getStoryName(story.raw.path) }}</div>
                                            </div>
                                        </v-card>
                                    </div>
                                </template>

                                <template #footer="{ page, pageCount, prevPage, nextPage }">
                                    <div v-if="pageCount > 1" class="d-flex align-center justify-center pa-4">
                                        <v-btn
                                            icon="mdi-chevron-left"
                                            variant="text"
                                            :disabled="page === 1"
                                            @click="prevPage"
                                        />
                                        <span class="mx-4">Page {{ page }} of {{ pageCount }}</span>
                                        <v-btn
                                            icon="mdi-chevron-right"
                                            variant="text"
                                            :disabled="page === pageCount"
                                            @click="nextPage"
                                        />
                                    </div>
                                </template>
                            </v-data-iterator>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </div>

        <div v-else class="empty-state">
            <v-icon size="80" color="grey-lighten-1">mdi-book-search</v-icon>
            <h2>{{ t.noCharacterSelected }}</h2>
            <p>{{ t.searchPrompt }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useData, useRoute } from 'vitepress';
import { useSafeI18n } from '../../../../utils/i18n/locale';
import { useArknightsData } from '../../../../utils/chara/arknights/core/useArknightsData';
import type { UnifiedCharacterData } from '../../../../utils/chara/arknights/types';
import { getLanguageByCode } from '../../../../config/project-config';

const { t } = useSafeI18n('arknights-story-tracker', {
    title: 'Story Tracker',
    searchPlaceholder: 'Search character name...',
    characterCount: '{count} character(s)',
    characterVariant: 'Character Variant',
    storyReader: 'Story Reader',
    textReader: 'Text',
    akgcc: 'akgcc',
    storyAppearances: 'Story Appearances ({count})',
    noCharacterSelected: 'No Character Selected',
    searchPrompt: 'Search for a character'
});

const { lang } = useData();
const route = useRoute();

const { loadLanguageData, getAllCharacterIdsByName, getCharacterById, getStoryReadersForCharacter, names } = useArknightsData();

const searchQuery = ref('');
const selectedName = ref<string | null>(null);
const selectedCharacterId = ref<string | null>(null);
const selectedCharacter = ref<UnifiedCharacterData | null>(null);
const selectedVariantIndex = ref(0);
const selectedReader = ref<'textReader' | 'akgcc'>('textReader');
const storySearch = ref('');

const langCode = computed(() => {
    const cfg = getLanguageByCode(lang.value);
    return cfg?.link?.split('/').filter(Boolean)[0]?.replace('-', '_').toLowerCase() || 'en_us';
});

const charaFinderPath = computed(() => {
    const langPart = lang.value === 'root' ? '' : `/${lang.value}`;
    return `${langPart}/Arknights/CharaFinder`;
});

const nameSearchItems = computed(() => {
    const nameMap = new Map<string, string[]>();
    
    for (const [id, data] of Object.entries(names.value)) {
        const name = data.displayName;
        if (!nameMap.has(name)) nameMap.set(name, []);
        nameMap.get(name)!.push(id);
    }
    
    const items = Array.from(nameMap.entries()).map(([name, ids]) => {
        const firstChar = getCharacterById(ids[0]);
        return {
            name,
            ids,
            count: ids.length,
            firstVariant: firstChar?.validVariants?.[0] || ids[0]
        };
    });
    
    return items.sort((a, b) => a.name.localeCompare(b.name));
});

const availableCharacterIds = computed(() => {
    if (!selectedName.value) return [];
    const ids = getAllCharacterIdsByName(selectedName.value);
    return ids.map(id => {
        const char = getCharacterById(id);
        return {
            value: id,
            title: id,
            variant: char?.validVariants?.[0] || id
        };
    });
});

const selectedVariant = computed(() => {
    return selectedCharacter.value?.validVariants?.[selectedVariantIndex.value] || '';
});

const characterStories = computed(() => {
    if (!selectedCharacter.value) return [];
    return getStoryReadersForCharacter(selectedCharacter.value.charId);
});

function getThumbnailUrl(variant: string): string {
    return `https://raw.githubusercontent.com/akgcc/arkdata/refs/heads/main/thumbs/${encodeURIComponent(variant.toLowerCase())}.webp`;
}

function getFullImageUrl(variant: string): string {
    return `https://raw.githubusercontent.com/akgcc/arkdata/main/assets/avg/characters/${encodeURIComponent(variant.toLowerCase())}.png`;
}

function getFirstVariant(charId: string): string {
    const char = getCharacterById(charId);
    return char?.validVariants?.[0] || charId;
}

function getStoryIcon(path: string): string {
    const parts = path.split('/');
    const filename = parts[parts.length - 1].replace('.txt', '');
    
    // Check if it's activities type
    if (parts[0] === 'activities') {
        return `https://r2.m31ns.top/img/banners/${parts[1]}.png`;
    }
    
    // Check if 'main' appears in the path (could be parts[0] or parts[1])
    const hasMain = parts.includes('main');
    const hasSt = parts.includes('st');
    
    if (hasMain || hasSt) {
        // Extract chapter number from filename: level_main_15-10_beg → 15
        const match = filename.match(/(\d+)-\d+/);  // Match first number before dash
        if (match && match[1]) {
            return `https://r2.m31ns.top/img/icons/main_${match[1]}.png`;
        }
    }
    
    // Fallback to chapter ID
    return `https://r2.m31ns.top/img/icons/${parts[1] || parts[0]}.png`;
}

function getStoryName(path: string): string {
    return path.split('/').pop()?.replace('.txt', '').replace(/_/g, ' ') || '';
}

function getVariantLabel(variant: string): string {
    const match = variant.match(/#(\d+)\$(\d+)$/);
    return match ? `F${match[1]}-B${match[2]}` : variant;
}

function handleNameSelect(name: string | null) {
    if (!name) {
        selectedCharacter.value = null;
        selectedName.value = null;
        selectedCharacterId.value = null;
        if (typeof window !== 'undefined') {
            window.history.pushState({}, '', route.path);
        }
        return;
    }
    
    selectedName.value = name;
    const ids = getAllCharacterIdsByName(name);
    
    if (ids.length > 0) {
        const firstId = ids[0];
        selectedCharacterId.value = firstId;
        loadCharacter(name, firstId);
    }
}

function switchCharacter(charId: string) {
    if (selectedName.value) {
        loadCharacter(selectedName.value, charId);
    }
}

function loadCharacter(name: string, charId: string) {
    const char = getCharacterById(charId);
    if (!char) {
        console.warn(`Character ${charId} not found in data. This may mean:
1. The data hasn't been regenerated yet with combine rules
2. The character ID doesn't exist in characters.json
Available characters for "${name}":`, getAllCharacterIdsByName(name));
        return;
    }
    
    selectedCharacter.value = char;
    selectedVariantIndex.value = 0;
    
    if (typeof window !== 'undefined') {
        const routeParam = `${encodeURIComponent(name)}_${charId}`;
        window.history.pushState({}, '', `${route.path}?char=${routeParam}`);
    }
}

function openStory(story: any) {
    const url = selectedReader.value === 'textReader' ? story.urls.textReader : story.urls.akgcc;
    window.open(url, '_blank');
}

watch(() => lang.value, async () => {
    await loadLanguageData(langCode.value);
});

watch(selectedName, (newName) => {
    if (newName && newName !== selectedCharacter.value?.displayName) {
        handleNameSelect(newName);
    }
});

onMounted(async () => {
    await loadLanguageData(langCode.value);
    
    const charParam = new URLSearchParams(window.location.search).get('char');
    if (charParam) {
        const parts = charParam.split('_');
        if (parts.length >= 2) {
            const name = decodeURIComponent(parts[0]);
            const charId = parts.slice(1).join('_');
            
            selectedName.value = name;
            selectedCharacterId.value = charId;
            loadCharacter(name, charId);
        }
    }
});
</script>

<style scoped>
.story-tracker :deep(.v-card-title),
.story-tracker :deep(h1),
.story-tracker :deep(h2),
.story-tracker :deep(h3) {
    border-top: none !important;
    border-bottom: none !important;
}

.story-tracker {
    min-height: 100vh;
    background: var(--vp-c-bg);
    padding: 16px;
}

.search-card {
    border: 1px solid var(--vp-c-divider) !important;
    border-radius: 12px !important;
    margin-bottom: 16px;
}

.content-section {
    max-width: 1400px;
    margin: 0 auto;
}

@media (min-width: 961px) {
    .content-section .v-row {
        display: flex;
        flex-direction: row;
        align-items: stretch;
    }
    
    .content-section .v-col {
        display: flex;
        flex-direction: column;
    }
    
    .content-section .v-card {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
    }
    
    .content-section .v-card-text.flex-spacer {
        flex: 1;
    }
}

.preview-image {
    cursor: pointer;
    transition: transform 0.2s;
}

.preview-image:hover {
    transform: scale(1.01);
}

.placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-text-3);
}

.placeholder.loading {
    background: transparent;
}

.variants-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
}

.flex-1-1 {
    flex: 1 1 0;
}

.stories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}

.story-card {
    position: relative;
    aspect-ratio: 1;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.2s;
}

.story-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.story-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent 60%);
    display: flex;
    align-items: flex-end;
    padding: 8px;
}

.story-name {
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    line-height: 1.1;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.empty-state {
    text-align: center;
    padding: 120px 24px;
    color: var(--vp-c-text-3);
}

.empty-state h2 {
    margin: 16px 0 8px;
    color: var(--vp-c-text-2);
}

@media (max-width: 960px) {
    .stories-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
}
</style>
