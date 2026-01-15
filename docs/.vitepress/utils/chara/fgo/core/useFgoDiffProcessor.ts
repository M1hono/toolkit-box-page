/**
 * @fileoverview FGO Diff Processor Composable
 * @description Handles diff image processing with OpenCV template matching
 */

import { ref } from "vue";

declare global {
    interface Window {
        cv: any;
    }
}

function getColorThief() {
    if (typeof window !== "undefined" && (window as any).ColorThief) {
        return new (window as any).ColorThief();
    }
    return {
        getColor: () => [255, 255, 255],
    };
}

export function useFgoDiffProcessor() {
    const diffImages = ref<HTMLCanvasElement[]>([]);
    const currentDiffIndex = ref(0);
    const mainColor = ref({ r: 255, g: 255, b: 255 });

    async function processDiffImages(
        baseImage: HTMLImageElement,
        detectFaceCallback?: (mat: any) => any
    ): Promise<HTMLCanvasElement[]> {
        if (!window.cv || !window.cv.Mat) {
            return createBasicCanvas(baseImage);
        }

        if (!baseImage.complete || baseImage.naturalWidth === 0) {
            await new Promise((resolve) => {
                if (baseImage.complete) resolve(true);
                else {
                    baseImage.onload = () => resolve(true);
                    baseImage.onerror = () => resolve(false);
                }
            });
        }

        const is2048Width = baseImage.width === 2048;
        const displayStartX = is2048Width ? 512 : 0;
        const displayWidth = 1024;
        const displayHeight = 768;
        const diffBlockSize = 256;

        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) {
            console.error("Failed to get canvas context");
            return createBasicCanvas(baseImage);
        }

        tempCanvas.width = baseImage.width;
        tempCanvas.height = baseImage.height;

        try {
            tempCtx.drawImage(baseImage, 0, 0);
        } catch (error) {
            console.error("Failed to draw image to canvas:", error);
            return createBasicCanvas(baseImage);
        }

        // Create Mat from canvas using a wrapper to handle ImageData properly
        let baseImageMat;
        try {
            const cvCanvas = document.createElement("canvas");
            cvCanvas.width = tempCanvas.width;
            cvCanvas.height = tempCanvas.height;
            const cvCtx = cvCanvas.getContext("2d")!;
            cvCtx.drawImage(tempCanvas, 0, 0);

            const tempId = `opencv-temp-${Date.now()}`;
            cvCanvas.id = tempId;
            document.body.appendChild(cvCanvas);
            cvCanvas.style.display = "none";

            baseImageMat = window.cv.imread(tempId);

            document.body.removeChild(cvCanvas);
        } catch (error) {
            return createBasicCanvas(baseImage);
        }
        const diffs: HTMLCanvasElement[] = [];

        const bodyMat = baseImageMat.roi(
            new window.cv.Rect(displayStartX, 0, displayWidth, displayHeight)
        );

        if (detectFaceCallback) {
            detectFaceCallback(bodyMat);
        }

        let diffCount = 0;

        for (let y = displayHeight; y < baseImage.height; y += diffBlockSize) {
            for (let x = 0; x < baseImage.width; x += diffBlockSize) {
                const diffWidth = Math.min(diffBlockSize, baseImage.width - x);
                const diffHeight = Math.min(
                    diffBlockSize,
                    baseImage.height - y
                );

                if (
                    diffWidth < diffBlockSize * 0.5 ||
                    diffHeight < diffBlockSize * 0.5
                ) {
                    continue;
                }

                const diffMat = baseImageMat.roi(
                    new window.cv.Rect(x, y, diffWidth, diffHeight)
                );

                const result = new window.cv.Mat();
                window.cv.matchTemplate(
                    bodyMat,
                    diffMat,
                    result,
                    window.cv.TM_SQDIFF_NORMED
                );
                let { x: matchX, y: matchY } =
                    window.cv.minMaxLoc(result).minLoc;

                const diffCanvas = document.createElement("canvas");
                diffCanvas.width = 1024;
                diffCanvas.height = 768;
                const diffCtx = diffCanvas.getContext("2d")!;

                diffCtx.drawImage(
                    baseImage,
                    displayStartX,
                    0,
                    displayWidth,
                    displayHeight,
                    0,
                    0,
                    1024,
                    768
                );
                diffCtx.drawImage(
                    baseImage,
                    x,
                    y,
                    diffWidth,
                    diffHeight,
                    matchX,
                    matchY,
                    diffWidth,
                    diffHeight
                );

                if (!isTransparentCanvas(diffCanvas)) {
                    diffs.push(diffCanvas);
                    diffCount++;
                }

                result.delete();
                diffMat.delete();
            }
        }

        try {
            bodyMat.delete();
            baseImageMat.delete();
        } catch (error) {
            // Silently handle cleanup errors
        }

        extractMainColor(baseImage);

        if (diffs.length === 0) {
            return createBasicCanvas(baseImage);
        }

        return diffs;
    }

    function createBasicCanvas(
        baseImage: HTMLImageElement
    ): HTMLCanvasElement[] {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = 1024;
        canvas.height = 768;

        if (baseImage.width === 2048) {
            const startX = (2048 - 1024) / 2;
            ctx.drawImage(baseImage, startX, 0, 1024, 768, 0, 0, 1024, 768);
        } else if (baseImage.width === 1024) {
            ctx.drawImage(baseImage, 0, 0, 1024, 768, 0, 0, 1024, 768);
        } else {
            const startX = Math.max(0, (baseImage.width - 1024) / 2);
            ctx.drawImage(baseImage, startX, 0, 1024, 768, 0, 0, 1024, 768);
        }

        extractMainColor(baseImage);
        return [canvas];
    }

    function isTransparentCanvas(canvas: HTMLCanvasElement): boolean {
        const ctx = canvas.getContext("2d")!;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let totalAlpha = 0;
        let pixelCount = 0;

        for (let i = 3; i < data.length; i += 16) {
            totalAlpha += data[i];
            pixelCount++;
        }

        const averageAlpha = totalAlpha / pixelCount;
        return averageAlpha < 10;
    }

    function extractMainColor(image: HTMLImageElement) {
        try {
            const colorThief = getColorThief();
            const dominantColor = colorThief.getColor(image);
            mainColor.value = {
                r: dominantColor[0],
                g: dominantColor[1],
                b: dominantColor[2],
            };
        } catch (error) {
            console.warn("Main color extraction failed:", error);
        }
    }

    return {
        diffImages,
        currentDiffIndex,
        mainColor,
        processDiffImages,
    };
}
