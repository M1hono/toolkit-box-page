/**
 * @fileoverview FGO Canvas Operations Composable
 * @description Handles download, copy, and batch processing operations
 */

import JSZip from "jszip";
import type { SelectionRect } from "../types";

export function useFgoCanvasOps() {
    async function saveSelectedArea(
        canvas: HTMLCanvasElement,
        selection: SelectionRect,
        backgroundColor: string,
        filename: string
    ) {
        const offset = 2;
        const sourceX = selection.x + offset;
        const sourceY = selection.y + offset;
        const sourceWidth = selection.width - 2 * offset;
        const sourceHeight = selection.height - 2 * offset;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = sourceWidth;
        tempCanvas.height = sourceHeight;
        const tempCtx = tempCanvas.getContext("2d", { alpha: true })!;

        tempCtx.fillStyle = backgroundColor;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(
            canvas,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            tempCanvas.width,
            tempCanvas.height
        );

        if (typeof document !== "undefined") {
            const link = document.createElement("a");
            link.download = filename;
            link.href = tempCanvas.toDataURL();
            link.click();
        }
    }

    async function batchProcess(
        diffCanvases: HTMLCanvasElement[],
        selection: SelectionRect | null,
        backgroundColor: string,
        characterName: string
    ): Promise<number> {
        const isCropped = selection !== null;

        const zip = new JSZip();

        for (let i = 0; i < diffCanvases.length; i++) {
            const sourceCanvas = diffCanvases[i];

            if (!isCropped) {
                try {
                    const blob = await new Promise<Blob>((resolve, reject) => {
                        sourceCanvas.toBlob((b) => {
                            if (b) resolve(b);
                            else reject(new Error("Failed to create blob"));
                        });
                    });
                    zip.file(
                        `${characterName}_full_${String(i + 1).padStart(
                            2,
                            "0"
                        )}.png`,
                        blob
                    );
                } catch (error) {
                }
            } else {
                const offset = 2;
                const sourceX = selection.x + offset;
                const sourceY = selection.y + offset;
                const sourceWidth = selection.width - 2 * offset;
                const sourceHeight = selection.height - 2 * offset;

                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = sourceWidth;
                tempCanvas.height = sourceHeight;
                const tempCtx = tempCanvas.getContext("2d", { alpha: true });
                if (!tempCtx) continue;

                tempCtx.fillStyle = backgroundColor;
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(
                    sourceCanvas,
                    sourceX,
                    sourceY,
                    sourceWidth,
                    sourceHeight,
                    0,
                    0,
                    tempCanvas.width,
                    tempCanvas.height
                );

                try {
                    const blob = await new Promise<Blob>((resolve, reject) => {
                        tempCanvas.toBlob((b) => {
                            if (b) resolve(b);
                            else reject(new Error("Failed to create blob"));
                        });
                    });
                    zip.file(
                        `${characterName}_cropped_${String(i + 1).padStart(
                            2,
                            "0"
                        )}.png`,
                        blob
                    );
                } catch (error) {
                }
            }
        }

        const content = await zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 6 },
        });

        if (typeof document !== "undefined") {
            const link = document.createElement("a");
            link.download = `${characterName}_batch_${Date.now()}.zip`;
            link.href = URL.createObjectURL(content);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }

        return diffCanvases.length;
    }

    function drawSelectionBox(
        ctx: CanvasRenderingContext2D,
        selection: SelectionRect
    ) {
        let brandColor = "#409EFF";
        if (typeof document !== "undefined") {
            brandColor =
                getComputedStyle(document.documentElement)
                    .getPropertyValue("--vp-c-brand-1")
                    .trim() || "#409EFF";
        }

        ctx.strokeStyle = brandColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(
            selection.x,
            selection.y,
            selection.width,
            selection.height
        );
        ctx.setLineDash([]);

        ctx.fillStyle = brandColor;
        const handleSize = 8;
        const handles = [
            [selection.x, selection.y],
            [selection.x + selection.width, selection.y],
            [selection.x, selection.y + selection.height],
            [selection.x + selection.width, selection.y + selection.height],
            [selection.x + selection.width / 2, selection.y],
            [selection.x + selection.width / 2, selection.y + selection.height],
            [selection.x, selection.y + selection.height / 2],
            [selection.x + selection.width, selection.y + selection.height / 2],
        ];
        handles.forEach(([hx, hy]) => {
            ctx.fillRect(
                hx - handleSize / 2,
                hy - handleSize / 2,
                handleSize,
                handleSize
            );
        });
    }

    function drawPreview(
        previewCanvas: HTMLCanvasElement,
        sourceCanvas: HTMLCanvasElement,
        selection: SelectionRect,
        backgroundColor: string
    ) {
        const context = previewCanvas.getContext("2d");
        if (!context) return;

        const offset = 2;
        const sourceX = selection.x + offset;
        const sourceY = selection.y + offset;
        const sourceWidth = selection.width - 2 * offset;
        const sourceHeight = selection.height - 2 * offset;

        const aspectRatio = sourceWidth / sourceHeight;
        const previewSize = 200;

        if (aspectRatio >= 1) {
            previewCanvas.width = previewSize;
            previewCanvas.height = previewSize / aspectRatio;
        } else {
            previewCanvas.height = previewSize;
            previewCanvas.width = previewSize * aspectRatio;
        }

        context.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

        context.drawImage(
            sourceCanvas,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            previewCanvas.width,
            previewCanvas.height
        );
    }

    return {
        saveSelectedArea,
        batchProcess,
        drawSelectionBox,
        drawPreview,
    };
}
