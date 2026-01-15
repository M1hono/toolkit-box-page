/**
 * @fileoverview FGO Image Loader Composable
 * @description Handles character data fetching and image loading from Atlas Academy API or local data
 */

import { ref, computed } from "vue";
import { useData } from "vitepress";
import { getLanguageByCode } from "../../../../config/project-config";
import axios from "axios";
import type { FgoCharacter } from "../types";

export function useFgoImageLoader() {
    const { lang } = useData();

    const currentLangCode = computed(() => {
        const mapping: Record<string, string> = {
            root: "en_us",
            "zh-CN": "zh_cn",
            "en-US": "en_us",
            en: "en_us",
            ja: "ja_jp",
            "ja-JP": "ja_jp",
        };
        return mapping[lang.value] || "en_us";
    });

    const characterData = ref<FgoCharacter[]>([]);
    const translations = ref<Record<string, string>>({});
    const noTranslations = ref<Record<string, string>>({});
    const isLoading = ref(false);

    async function loadTranslations() {
        try {
            const langCode = currentLangCode.value;
            console.log("Loading FGO translations for:", langCode);

            try {
                const translationsRes = await fetch(
                    `/data/${langCode}/fgo/translations.json`
                );
                if (
                    translationsRes.ok &&
                    translationsRes.headers
                        .get("content-type")
                        ?.includes("application/json")
                ) {
                    translations.value = await translationsRes.json();
                    console.log("✅ Translations loaded");
                }
            } catch (e) {
                console.log("No translation file, using defaults");
            }

            try {
                const noTranslationsRes = await fetch(
                    `/data/${langCode}/fgo/no_translation.json`
                );
                if (
                    noTranslationsRes.ok &&
                    noTranslationsRes.headers
                        .get("content-type")
                        ?.includes("application/json")
                ) {
                    noTranslations.value = await noTranslationsRes.json();
                    console.log("✅ No-translation list loaded");
                }
            } catch (e) {
                console.log("No no-translation file, using defaults");
            }
        } catch (error) {
            console.warn("⚠️ Translation load error:", error);
        }
    }

    async function fetchCharacterData() {
        try {
            isLoading.value = true;

            const langCode = currentLangCode.value;

            try {
                const response = await fetch(
                    `/data/${langCode}/fgo/servants.json`
                );
                if (
                    response.ok &&
                    response.headers
                        .get("content-type")
                        ?.includes("application/json")
                ) {
                    const data = await response.json();
                    characterData.value = Object.values(data);
                    console.log(
                        "✅ Using local FGO data for",
                        langCode,
                        "- characters:",
                        characterData.value.length
                    );
                    return;
                }
            } catch (localError) {
                console.log("Local data unavailable, trying global...");
            }

            try {
                const response = await fetch("/data/global/fgo/servants.json");
                if (
                    response.ok &&
                    response.headers
                        .get("content-type")
                        ?.includes("application/json")
                ) {
                    const data = await response.json();
                    characterData.value = Object.values(data);
                    console.log(
                        "✅ Using global FGO data - characters:",
                        characterData.value.length
                    );
                    return;
                }
            } catch (globalError) {
                console.log("Global data unavailable, using remote API...");
            }

            const response = await axios.get(
                "https://api.atlasacademy.io/export/JP/nice_servant.json"
            );
            characterData.value = response.data;
            console.log(
                "✅ Using remote FGO data, characters:",
                characterData.value.length
            );
        } catch (error) {
            console.error("❌ Failed to fetch character data:", error);
        } finally {
            isLoading.value = false;
        }
    }

    function getCharacterName(char: FgoCharacter): string {
        return (
            translations.value[char.name] ||
            noTranslations.value[char.name] ||
            char.name
        );
    }

    function loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    function extractImageUrls(character: FgoCharacter): Record<string, string> {
        if (character.imageData?.charaFigures) {
            const urls: Record<string, string> = {};

            for (const [category, categoryData] of Object.entries(
                character.imageData.charaFigures as any
            )) {
                if (!categoryData || typeof categoryData !== "object") continue;

                for (const [stage, stageData] of Object.entries(
                    categoryData as any
                )) {
                    // Our generated data stores URL as a string.
                    if (typeof stageData === "string" && stageData) {
                        urls[`${category}_${stage}`] = stageData;
                        continue;
                    }

                    // Be compatible with any upstream schema that uses `{ url: string }`.
                    if (
                        stageData &&
                        typeof stageData === "object" &&
                        typeof (stageData as any).url === "string"
                    ) {
                        urls[`${category}_${stage}`] = (stageData as any).url;
                    }
                }
            }

            return urls;
        }

        if (character.extraAssets?.charaFigure) {
            const { ascension, costume, story } =
                character.extraAssets.charaFigure;
            return { ...ascension, ...costume, ...story };
        }
        return {};
    }

    return {
        characterData,
        translations,
        noTranslations,
        isLoading,
        loadTranslations,
        fetchCharacterData,
        getCharacterName,
        loadImage,
        extractImageUrls,
    };
}
