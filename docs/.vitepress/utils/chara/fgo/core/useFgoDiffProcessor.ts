/**
 * @fileoverview FGO Diff Processor Composable
 * @description Handles diff image processing with OpenCV template matching
 */

import { ref } from 'vue';

declare global {
    interface Window {
        cv: any;
    }
}

const ColorThief = (window as any).ColorThief || class {
    getColor() {return [255, 255, 255];}
};

export function useFgoDiffProcessor() {
    const diffImages = ref<HTMLCanvasElement[]>([]);
    const currentDiffIndex = ref(0);
    const mainColor = ref({ r: 255, g: 255, b: 255 });

    async function processDiffImages(
        baseImage: HTMLImageElement,
        detectFaceCallback?: (mat: any) => any
    ): Promise<HTMLCanvasElement[]> {
        console.log("🔄 Processing diff images...");
        console.log(`📏 Image size: ${baseImage.width}x${baseImage.height}`);

        if (!window.cv || !window.cv.Mat) {
            console.warn("⚠️ OpenCV not fully loaded, using basic processing");
            return createBasicCanvas(baseImage);
        }

        if (!baseImage.complete || baseImage.naturalWidth === 0) {
            console.warn("⚠️ Image not fully loaded, waiting...");
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

        console.log(`🎯 Processing mode: ${is2048Width ? "2048 width" : "1024 width"}`);

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

        let baseImageMat;
        try {
            baseImageMat = window.cv.imread(tempCanvas);
        } catch (error) {
            console.error("OpenCV imread failed:", error);
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
                const diffHeight = Math.min(diffBlockSize, baseImage.height - y);

                if (diffWidth < diffBlockSize * 0.3 || diffHeight < diffBlockSize * 0.3) {
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

                let minMax = window.cv.minMaxLoc(result);
                let { x: matchX, y: matchY } = minMax.minLoc;

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
                    x, y,
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
            console.warn("Failed to delete OpenCV mats:", error);
        }

        extractMainColor(baseImage);

        console.log(`✅ Processing complete! Input ${baseImage.width}x${baseImage.height} → Output ${diffs.length} 1024x768 diffs`);
        
        if (diffs.length === 0) {
            console.warn("No diffs generated, falling back to basic canvas");
            return createBasicCanvas(baseImage);
        }
        
        return diffs;
    }

    function createBasicCanvas(baseImage: HTMLImageElement): HTMLCanvasElement[] {
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
            const colorThief = new ColorThief();
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
        processDiffImages
    };
}
