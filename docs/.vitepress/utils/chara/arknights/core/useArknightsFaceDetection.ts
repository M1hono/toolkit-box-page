/**
 * @fileoverview Arknights Face Detection Composable
 * @description Handles automatic face detection using crop data
 */

import { ref, onMounted } from "vue";
import type { SelectionRect, CanvasSize } from "../types";

export function useArknightsFaceDetection() {
    const cropData = ref<Record<string, any>>({});

    async function loadCropData() {
        try {
            const response = await fetch(
                "https://raw.githubusercontent.com/akgcc/arkdata/main/cropper_data/auto_coords.json"
            );
            if (response.ok) {
                cropData.value = await response.json();
            }
        } catch (error) {
            console.warn("Failed to load crop data:", error);
        }
    }

    function detectFaceRegion(
        variant: string,
        image: HTMLImageElement,
        canvasSize: CanvasSize,
        multiplier: number = 2.0
    ): SelectionRect | null {
        const normalizedVariant = variant.toLowerCase();
        let cropInfo = cropData.value[normalizedVariant];

        if (!cropInfo) {
            const lowerVariant = normalizedVariant.toLowerCase();
            const key = Object.keys(cropData.value).find(
                (k) => k.toLowerCase() === lowerVariant
            );
            if (key) cropInfo = cropData.value[key];
        }

        if (!cropInfo) return null;

        const { x: cropX, y: cropY, s: scale } = cropInfo;
        const canvasScale = Math.min(
            canvasSize.width / image.width,
            canvasSize.height / image.height
        );

        const originalX = -cropX / scale;
        const originalY = -cropY / scale;
        const canvasX = originalX * canvasScale;
        const canvasY = originalY * canvasScale;

        const cropSize = 96 * multiplier * canvasScale;

        const finalX = Math.max(
            0,
            Math.min(canvasX, canvasSize.width - cropSize)
        );
        const finalY = Math.max(
            0,
            Math.min(canvasY, canvasSize.height - cropSize)
        );
        const finalWidth = Math.min(cropSize, canvasSize.width - finalX);
        const finalHeight = Math.min(cropSize, canvasSize.height - finalY);

        return {
            x: Math.round(finalX),
            y: Math.round(finalY),
            width: Math.round(finalWidth),
            height: Math.round(finalHeight),
        };
    }

    function getDefaultSelection(canvasSize: CanvasSize): SelectionRect {
        const size = Math.min(canvasSize.width, canvasSize.height) * 0.35;
        return {
            x: (canvasSize.width - size) / 2,
            y: canvasSize.height * 0.05,
            width: size,
            height: size,
        };
    }

    onMounted(() => loadCropData());

    return {
        cropData,
        loadCropData,
        detectFaceRegion,
        getDefaultSelection,
    };
}
