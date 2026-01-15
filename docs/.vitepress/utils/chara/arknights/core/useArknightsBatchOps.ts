/**
 * @fileoverview Arknights Batch Operations Composable
 * @description Handles batch downloading of multiple variants
 */

import JSZip from "jszip";
import type { SelectionRect, CanvasSize } from "../types";

export function useArknightsBatchOps() {
    async function batchDownloadCropped(
        variants: string[],
        loadImage: (url: string) => Promise<HTMLImageElement>,
        getUrls: (variant: string) => { primary: string },
        selection: SelectionRect,
        canvasSize: CanvasSize,
        backgroundColor: string,
        folderName: string
    ): Promise<number> {
        const zip = new JSZip();
        const folder = zip.folder(folderName)!;
        let successCount = 0;

        for (const variant of variants) {
            const normalizedVariant = variant.toLowerCase();

            try {
                const urls = getUrls(normalizedVariant);
                const image = await loadImage(urls.primary);
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d")!;

                canvas.width = selection.width;
                canvas.height = selection.height;
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const scaleX = image.width / canvasSize.width;
                const scaleY = image.height / canvasSize.height;

                ctx.drawImage(
                    image,
                    selection.x * scaleX,
                    selection.y * scaleY,
                    selection.width * scaleX,
                    selection.height * scaleY,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                canvas.toBlob((blob) => {
                    if (blob) {
                        folder.file(`${normalizedVariant}.png`, blob);
                        successCount++;
                    }
                });

                await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (error) {
                console.warn(`Variant ${variant} failed:`, error);
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (successCount > 0) {
            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = `${folderName}_cropped.zip`;
            link.click();
        }

        return successCount;
    }

    async function batchDownloadFull(
        variants: string[],
        loadImage: (url: string) => Promise<HTMLImageElement>,
        getUrls: (variant: string) => { primary: string },
        folderName: string
    ): Promise<number> {
        const zip = new JSZip();
        const folder = zip.folder(folderName)!;
        let successCount = 0;

        for (const variant of variants) {
            const normalizedVariant = variant.toLowerCase();

            try {
                const urls = getUrls(normalizedVariant);
                const image = await loadImage(urls.primary);
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d")!;

                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);

                canvas.toBlob((blob) => {
                    if (blob) {
                        folder.file(`${normalizedVariant}.png`, blob);
                        successCount++;
                    }
                });

                await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (error) {
                console.warn(`Variant ${variant} failed:`, error);
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (successCount > 0) {
            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = `${folderName}_full.zip`;
            link.click();
        }

        return successCount;
    }

    return {
        batchDownloadCropped,
        batchDownloadFull,
    };
}
