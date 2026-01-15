/**
 * @fileoverview Arknights Image Loader Composable
 * @description Handles image loading with multi-tier fallback strategy
 */

import { ref } from "vue";

const imageConfig = {
    enableR2: true,
    useR2Priority: false,
    r2PublicUrl: "arkimage.top",
    r2DirectUrl: "https://arkimage.top/arknights-chara-image",
    sourceUrls: {
        primary:
            "https://raw.githubusercontent.com/akgcc/arkdata/main/assets/avg/characters/",
        backup: "https://raw.githubusercontent.com/Aceship/Arknight-Images/main/avg/characters/",
    },
};

function getSpecialImageUrls(
    variant: string
): { primary: string; fallback: string; secondary?: string } | null {
    const specialMappings: Record<string, any> = {
        "avg_npc_602_1#1$1": {
            primary:
                "https://raw.githubusercontent.com/Aceship/Arknight-Images/main/avg/characters/avg_npc_602_1%241.png",
            fallback:
                "https://raw.githubusercontent.com/akgcc/arkdata/main/assets/avg/characters/avg_npc_602_1%23%24%241.png",
            secondary: `https://${imageConfig.r2PublicUrl}/arknights/characters/avg_npc_602_1%231%241.png`,
        },
        "avg_npc_598_1#2$1": {
            primary:
                "https://raw.githubusercontent.com/Aceship/Arknight-Images/main/avg/characters/avg_npc_598_1%232%241.png",
            fallback:
                "https://raw.githubusercontent.com/akgcc/arkdata/main/assets/avg/characters/avg_npc_598_1%232%24%241.png",
            secondary: `https://${imageConfig.r2PublicUrl}/arknights/characters/avg_npc_598_1%232%241.png`,
        },
    };
    return specialMappings[variant] || null;
}

export function useArknightsImageLoader() {
    function getVariantImageUrls(variant: string): {
        primary: string;
        fallback: string;
        secondary?: string;
    } {
        const normalizedVariant = variant.toLowerCase();
        const specialUrls = getSpecialImageUrls(normalizedVariant);
        if (specialUrls) return specialUrls;

        const filename = `${encodeURIComponent(normalizedVariant)}.png`;
        if (imageConfig.enableR2 && imageConfig.useR2Priority) {
            return {
                primary: `https://${imageConfig.r2PublicUrl}/arknights/characters/${filename}`,
                fallback: `${imageConfig.sourceUrls.primary}${filename}`,
                secondary: `${imageConfig.sourceUrls.backup}${filename}`,
            };
        }

        return {
            primary: `${imageConfig.sourceUrls.primary}${filename}`,
            fallback: `${imageConfig.sourceUrls.backup}${filename}`,
            secondary: `https://${imageConfig.r2PublicUrl}/arknights/characters/${filename}`,
        };
    }

    function loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => {
                const match = url.match(/\/([^/]+)\.png$/);
                if (match) {
                    const variant = decodeURIComponent(match[1]);
                    const urls = getVariantImageUrls(variant);
                    let nextUrl = null;
                    if (url === urls.primary && urls.fallback)
                        nextUrl = urls.fallback;
                    else if (url === urls.fallback && urls.secondary)
                        nextUrl = urls.secondary;

                    if (nextUrl && nextUrl !== url) {
                        const fallbackImg = new Image();
                        fallbackImg.crossOrigin = "anonymous";
                        fallbackImg.onload = () => resolve(fallbackImg);
                        fallbackImg.onerror = () =>
                            reject(new Error(`All URLs failed`));
                        fallbackImg.src = nextUrl;
                        return;
                    }
                }
                reject(new Error(`Failed to load: ${url}`));
            };
            img.src = url;
        });
    }

    return {
        getVariantImageUrls,
        loadImage,
    };
}
