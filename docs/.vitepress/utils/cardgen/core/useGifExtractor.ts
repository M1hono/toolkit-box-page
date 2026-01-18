/**
 * @fileoverview GIF Frame Extractor
 * @module cardgen/gif-extractor
 * @description
 * Extracts first frame from GIF files for canvas rendering
 * since HTML canvas doesn't support animated GIFs natively.
 *
 * @author FGO Card Generator Team
 * @version 1.0.0
 */

/**
 * Extract first frame from GIF file
 * @param {File} file - GIF file object
 * @returns {Promise<HTMLImageElement>} First frame as image
 */
export async function extractGifFirstFrame(
    file: File
): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");

                if (ctx) {
                    ctx.drawImage(img, 0, 0);

                    const extractedImg = new Image();
                    extractedImg.onload = () => resolve(extractedImg);
                    extractedImg.onerror = reject;
                    extractedImg.src = canvas.toDataURL("image/png");
                } else {
                    reject(new Error("Could not get canvas context"));
                }
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
