/**
 * @fileoverview Arknights Canvas Composable
 * @description Logic for canvas drawing, selection, and image handling
 */

import { ref, computed } from 'vue';
import type { SelectionRect, CanvasSize, Point, ImageConfig, UnifiedCharacterData } from '../types';

export const IMAGE_CONFIG: ImageConfig = {
    enableR2: true,
    useR2Priority: false,
    r2PublicUrl: 'arkimage.top',
    r2DirectUrl: 'https://arkimage.top/arknights-chara-image',
    sourceUrls: {
        primary: 'https://raw.githubusercontent.com/akgcc/arkdata/main/assets/avg/characters/',
        backup: 'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/avg/characters/'
    }
};

export function useArknightsCanvas() {
    const mainCanvas = ref<HTMLCanvasElement | null>(null);
    const previewCanvas = ref<HTMLCanvasElement | null>(null);
    const currentImage = ref<HTMLImageElement | null>(null);
    const isLoading = ref(false);
    
    const canvasSize = ref<CanvasSize>({ width: 800, height: 600 });
    const selectionRect = ref<SelectionRect>({ x: 100, y: 100, width: 200, height: 200 });
    const isSelecting = ref(false);
    const isResizing = ref(false);
    
    const backgroundColor = ref("#ffffff");
    const currentAspectRatio = ref("free");

    function getVariantImageUrl(variant: string): string {
        const filename = `${encodeURIComponent(variant)}.png`;
        if (IMAGE_CONFIG.enableR2 && !IMAGE_CONFIG.useR2Priority) {
             return `${IMAGE_CONFIG.sourceUrls.primary}${filename}`;
        }
        return `${IMAGE_CONFIG.r2DirectUrl}/${filename}`;
    }

    async function loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load: ${url}`));
            img.src = url;
        });
    }

    function drawSelection() {
        if (!mainCanvas.value || !currentImage.value) return;
        const ctx = mainCanvas.value.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvasSize.value.width, canvasSize.value.height);
        ctx.drawImage(currentImage.value, 0, 0, canvasSize.value.width, canvasSize.value.height);

        // Draw selection box
        ctx.strokeStyle = "#409EFF";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(selectionRect.value.x, selectionRect.value.y, selectionRect.value.width, selectionRect.value.height);
        ctx.setLineDash([]);
    }

    return {
        mainCanvas,
        previewCanvas,
        currentImage,
        isLoading,
        canvasSize,
        selectionRect,
        backgroundColor,
        currentAspectRatio,
        getVariantImageUrl,
        loadImage,
        drawSelection
    };
}
