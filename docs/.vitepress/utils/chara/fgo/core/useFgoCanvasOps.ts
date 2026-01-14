/**
 * @fileoverview FGO Canvas Operations Composable
 * @description Handles download, copy, and batch processing operations
 */

import JSZip from 'jszip';
import type { SelectionRect, ColorRGBA } from '../types';

export function useFgoCanvasOps() {
    async function saveSelectedArea(
        canvas: HTMLCanvasElement,
        selection: SelectionRect,
        backgroundColor: ColorRGBA,
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
        const tempCtx = tempCanvas.getContext("2d")!;

        const { r, g, b, a } = backgroundColor;
        tempCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
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

        if (typeof document !== 'undefined') {
            const link = document.createElement("a");
            link.download = filename;
            link.href = tempCanvas.toDataURL();
            link.click();
        }
    }

    async function batchProcess(
        diffCanvases: HTMLCanvasElement[],
        selection: SelectionRect | null,
        backgroundColor: ColorRGBA,
        characterName: string
    ): Promise<number> {
        const isCropped = selection !== null;
        console.log(`🎨 Starting batch process (${isCropped ? 'cropped' : 'full'}): ${diffCanvases.length} images`);
        
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
                    zip.file(`${characterName}_full_${String(i + 1).padStart(2, '0')}.png`, blob);
                    console.log(`✅ Added full image ${i + 1}/${diffCanvases.length}`);
                } catch (error) {
                    console.error(`Failed to process full image ${i + 1}:`, error);
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
                const tempCtx = tempCanvas.getContext("2d");
                if (!tempCtx) continue;

                const { r, g, b, a } = backgroundColor;
                tempCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
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
                    zip.file(`${characterName}_cropped_${String(i + 1).padStart(2, '0')}.png`, blob);
                    console.log(`✅ Added cropped image ${i + 1}/${diffCanvases.length}`);
                } catch (error) {
                    console.error(`Failed to process cropped image ${i + 1}:`, error);
                }
            }
        }

        console.log('📦 Generating ZIP...');
        const content = await zip.generateAsync({ 
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 6 }
        });
        
        if (typeof document !== 'undefined') {
            const link = document.createElement("a");
            link.download = `${characterName}_batch_${Date.now()}.zip`;
            link.href = URL.createObjectURL(content);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            console.log(`✅ Downloaded: ${link.download}`);
        }

        return diffCanvases.length;
    }

    function drawSelectionBox(ctx: CanvasRenderingContext2D, selection: SelectionRect) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
        ctx.setLineDash([]);
    }

    function drawPreview(
        previewCanvas: HTMLCanvasElement,
        sourceCanvas: HTMLCanvasElement,
        selection: SelectionRect,
        backgroundColor: ColorRGBA
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
        const { r, g, b, a } = backgroundColor;
        context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
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
        drawPreview
    };
}
