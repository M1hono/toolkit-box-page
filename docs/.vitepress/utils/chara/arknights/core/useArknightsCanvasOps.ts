/**
 * @fileoverview Arknights Canvas Operations Composable
 * @description Handles download, copy, and image operations
 */

import type { SelectionRect, CanvasSize } from "../types";

export function useArknightsCanvasOps() {
    async function downloadCroppedImage(
        image: HTMLImageElement,
        selection: SelectionRect,
        canvasSize: CanvasSize,
        backgroundColor: string,
        filename: string
    ) {
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

        const link = document.createElement("a");
        link.download = filename;
        link.href = canvas.toDataURL();
        link.click();
    }

    async function downloadFullImage(
        image: HTMLImageElement,
        filename: string
    ) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        const link = document.createElement("a");
        link.download = filename;
        link.href = canvas.toDataURL();
        link.click();
    }

    async function copyCroppedToClipboard(
        image: HTMLImageElement,
        selection: SelectionRect,
        canvasSize: CanvasSize,
        backgroundColor: string
    ) {
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

        return new Promise<void>((resolve, reject) => {
            canvas.toBlob(async (blob) => {
                if (blob) {
                    await navigator.clipboard.write([
                        new ClipboardItem({ "image/png": blob }),
                    ]);
                    resolve();
                } else {
                    reject(new Error("Failed to create blob"));
                }
            });
        });
    }

    async function copyFullToClipboard(image: HTMLImageElement) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        return new Promise<void>((resolve, reject) => {
            canvas.toBlob(async (blob) => {
                if (blob) {
                    await navigator.clipboard.write([
                        new ClipboardItem({ "image/png": blob }),
                    ]);
                    resolve();
                } else {
                    reject(new Error("Failed to create blob"));
                }
            });
        });
    }

    return {
        downloadCroppedImage,
        downloadFullImage,
        copyCroppedToClipboard,
        copyFullToClipboard,
    };
}
