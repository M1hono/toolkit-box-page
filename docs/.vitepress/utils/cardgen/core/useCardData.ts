/**
 * @fileoverview Card Data Management Composable
 * @module cardgen/card-data
 * @description
 * Manages card data state, color options, and configuration export/import
 */

import { ref, watch } from "vue";
import type { FGOCardData } from "./useFGORenderer";

/**
 * Card data management composable
 */
export function useCardData() {
    const cardData = ref<FGOCardData>({
        starLevel: "5",
        rarityState: "rarity5_1.png",
        className: "saber",
        classVariant: "class3_1",
        frameCategory: "gold",
        name: "Artoria Pendragon",
        subname: "Saber",
        atk: 11221,
        hp: 15150,
        isGold: true,
    });

    const useNumbersForStats = ref(true);
    const customAtkText = ref("");
    const customHpText = ref("");

    const customNameColor = ref("");
    const customSubnameColor = ref("");
    const customAtkColor = ref("");
    const customHpColor = ref("");

    const resetTextColors = () => {
        customNameColor.value = "";
        customSubnameColor.value = "";
        customAtkColor.value = "";
        customHpColor.value = "";
    };

    const exportConfig = () => {
        const config = {
            cardData: cardData.value,
            useNumbersForStats: useNumbersForStats.value,
            customAtkText: customAtkText.value,
            customHpText: customHpText.value,
            customNameColor: customNameColor.value,
            customSubnameColor: customSubnameColor.value,
            customAtkColor: customAtkColor.value,
            customHpColor: customHpColor.value,
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], {
            type: "application/json",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `fgo-card-config-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const importConfig = (config: any) => {
        if (config.cardData) Object.assign(cardData.value, config.cardData);
        if (typeof config.useNumbersForStats === "boolean")
            useNumbersForStats.value = config.useNumbersForStats;
        if (config.customAtkText) customAtkText.value = config.customAtkText;
        if (config.customHpText) customHpText.value = config.customHpText;
        if (config.customNameColor)
            customNameColor.value = config.customNameColor;
        if (config.customSubnameColor)
            customSubnameColor.value = config.customSubnameColor;
        if (config.customAtkColor) customAtkColor.value = config.customAtkColor;
        if (config.customHpColor) customHpColor.value = config.customHpColor;
    };

    watch(useNumbersForStats, (newValue) => {
        if (newValue) {
            customAtkText.value = "";
            customHpText.value = "";
        }
    });

    return {
        cardData,
        useNumbersForStats,
        customAtkText,
        customHpText,
        customNameColor,
        customSubnameColor,
        customAtkColor,
        customHpColor,
        resetTextColors,
        exportConfig,
        importConfig,
    };
}
