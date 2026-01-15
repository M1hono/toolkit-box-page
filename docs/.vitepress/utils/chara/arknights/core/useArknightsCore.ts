/**
 * @fileoverview Arknights Core Composable
 * @description State management and data loading for Arknights character data
 */

import { ref, computed } from "vue";
import { useData } from "vitepress";
import type {
    CharacterData,
    CharacterNames,
    UnifiedCharacterData,
} from "../types";

export function useArknightsCore() {
    const { lang } = useData();

    // map vitepress lang to our data path code
    const langMapping: Record<string, string> = {
        "zh-CN": "zh_cn",
        "en-US": "en_us",
        "ja-JP": "ja_jp",
    };

    const currentLangCode = computed(() => langMapping[lang.value] || "zh_cn");

    const allCharacters = ref<Record<string, CharacterData>>({});
    const characterNames = ref<Record<string, CharacterNames>>({});
    const selectedCharacterId = ref<string | null>(null);
    const isInitialLoading = ref(true);

    const unifiedCharacters = computed<UnifiedCharacterData[]>(() => {
        return Object.keys(allCharacters.value)
            .map((id) => {
                const data = allCharacters.value[id];
                const names = characterNames.value[id] || {
                    displayName: id,
                    speakerNames: [],
                    searchNames: [],
                };
                return {
                    ...data,
                    ...names,
                };
            })
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
    });

    const selectedCharacter = computed(() =>
        selectedCharacterId.value
            ? unifiedCharacters.value.find(
                  (c) => c.charId === selectedCharacterId.value
              )
            : null
    );

    async function loadData() {
        try {
            isInitialLoading.value = true;

            // Load global character metadata
            const globalRes = await fetch(
                "/data/global/arknights/characters.json"
            );
            if (!globalRes.ok)
                throw new Error("Failed to load global characters");
            allCharacters.value = await globalRes.json();

            // Load language-specific names
            const namesRes = await fetch(
                `/data/${currentLangCode.value}/arknights/names.json`
            );
            if (!namesRes.ok)
                throw new Error(
                    `Failed to load names for ${currentLangCode.value}`
                );
            characterNames.value = await namesRes.json();
        } catch (error) {
            console.error("❌ Data load failed:", error);
        } finally {
            isInitialLoading.value = false;
        }
    }

    return {
        unifiedCharacters,
        selectedCharacter,
        selectedCharacterId,
        isInitialLoading,
        currentLangCode,
        loadData,
    };
}
