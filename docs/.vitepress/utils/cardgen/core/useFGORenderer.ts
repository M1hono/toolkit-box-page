/**
 * @fileoverview FGO Card Renderer
 * @module cardgen/fgo-renderer
 * @description
 * Core rendering engine for FGO cards with support for multiple images,
 * transformations, and layer management. Handles frame components, rarity
 * overlays, class icons, and text rendering with proper z-index ordering.
 *
 * @example
 * import { renderFGOCard } from './useFGORenderer';
 * await renderFGOCard(ctx, cardData, uploadedFiles);
 *
 * @author FGO Card Generator Team
 * @version 2.0.0
 */

import { getUIAssetUrl } from "./useFGOAssetUrls";

/**
 * FGO card data interface
 * @interface FGOCardData
 * @property {string} starLevel - Rarity star level (0-5)
 * @property {string} rarityState - Rarity variant filename
 * @property {string} className - Servant class name
 * @property {string} classVariant - Class icon variant
 * @property {string} frameCategory - Frame category identifier
 * @property {string} name - Servant display name
 * @property {string} subname - Class display name
 * @property {number} atk - Attack value
 * @property {number} hp - Health points value
 * @property {boolean} isGold - Whether to use gold number styling
 */
export interface FGOCardData {
    starLevel: string;
    rarityState: string;
    className: string;
    classVariant: string;
    frameCategory: string;
    name: string;
    subname: string;
    atk: number;
    hp: number;
    isGold: boolean;
}

/**
 * Image transformation interface
 * @interface ImageTransform
 * @property {number} x - X coordinate position
 * @property {number} y - Y coordinate position
 * @property {number} width - Image width
 * @property {number} height - Image height
 */
export interface ImageTransform {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Frame category to frame ID mapping
 * @constant {Record<string, string>}
 */
const FRAME_ID_MAP: Record<string, string> = {
    bronze: "frame1",
    silver: "frame2",
    gold: "frame3",
    "gold-special": "frame5",
    "grand-1": "frame10000",
    "grand-2": "frame10001",
    "grand-3": "frame10002",
    "grand-4": "frame10003",
    "special-1": "frame0",
    "special-2": "frame41",
    "special-3": "frame6",
    "special-4": "frame20",
    "special-5": "frame36",
    "special-6": "frame39",
};

/**
 * Load image with R2 fallback logic
 * @param {string} assetPath - Relative asset path
 * @returns {Promise<HTMLImageElement>} Promise resolving to loaded image
 * @throws {Error} When both R2 and local images fail to load
 */
function loadImage(assetPath: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        const tryR2 = () => {
            img.onload = () => resolve(img);
            img.onerror = tryLocal;
            img.src = getUIAssetUrl(assetPath, true);
        };

        const tryLocal = () => {
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = getUIAssetUrl(assetPath, false);
        };

        tryR2();
    });
}

/**
 * Render complete FGO card with all layers
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {FGOCardData} cardData - Card configuration data
 * @param {Array} uploadedFiles - Array of uploaded file objects with transform states
 * @param {ImageTransform} [imageTransform] - Legacy single image transform (backward compatibility)
 * @param {HTMLImageElement} [uploadedImage] - Legacy single image (backward compatibility)
 * @returns {Promise<void>} Promise that resolves when rendering is complete
 * @description
 * Renders FGO card in proper layer order:
 * 1. Uploaded images (background layer)
 * 2. Frame components (border overlay)
 * 3. Rarity stars (top overlay)
 * 4. Class icon
 * 5. Text overlay (topmost)
 */
export async function renderFGOCard(
    ctx: CanvasRenderingContext2D,
    cardData: FGOCardData,
    uploadedFiles: any[] = [],
    imageTransform?: ImageTransform,
    uploadedImage?: HTMLImageElement | null
): Promise<void> {
    ctx.clearRect(0, 0, 500, 850);

    if (uploadedFiles && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
            drawImageWithTransform(ctx, file.image, file.state);
        }
    } else if (uploadedImage && imageTransform) {
        ctx.drawImage(
            uploadedImage,
            imageTransform.x,
            imageTransform.y,
            imageTransform.width,
            imageTransform.height
        );
    }

    await drawFrame(ctx, cardData.frameCategory);
    await drawStars(ctx, cardData.starLevel, cardData.rarityState);
    await drawClassIcon(ctx, cardData.className, cardData.classVariant);
    drawText(ctx, cardData);
}

/**
 * Draw image with rotation and scaling transforms
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {HTMLImageElement} image - Image element to draw
 * @param {Object} state - Transform state object
 * @param {number} state.x - X position
 * @param {number} state.y - Y position
 * @param {number} state.width - Image width
 * @param {number} state.height - Image height
 * @param {number} [state.rotation=0] - Rotation angle in degrees
 */
function drawImageWithTransform(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    state: any
): void {
    ctx.save();

    const centerX = state.x + state.width / 2;
    const centerY = state.y + state.height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate(((state.rotation || 0) * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    ctx.drawImage(image, state.x, state.y, state.width, state.height);

    ctx.restore();
}

/**
 * Draw frame components (border elements)
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {string} category - Frame category identifier
 * @returns {Promise<void>} Promise that resolves when frame is drawn
 */
async function drawFrame(
    ctx: CanvasRenderingContext2D,
    category: string
): Promise<void> {
    const frameId = FRAME_ID_MAP[category] || "frame5";
    const basePath = `/imgs/fgo/frames/${category}`;

    try {
        const [bottom, left, right, top] = await Promise.all([
            loadImage(`frames/${category}/${frameId}B.png`),
            loadImage(`frames/${category}/${frameId}L.png`),
            loadImage(`frames/${category}/${frameId}R.png`),
            loadImage(`frames/${category}/${frameId}T.png`),
        ]);

        ctx.drawImage(bottom, 0, 850 - bottom.height, 500, bottom.height);
        ctx.drawImage(left, 0, 0, left.width, 850);
        ctx.drawImage(right, 500 - right.width, 0, right.width, 850);
        ctx.drawImage(top, 0, 0, 500, top.height);
    } catch (error) {
        console.error("Failed to load frame:", error);
    }
}

/**
 * Draw rarity stars overlay
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {string} level - Star level (0-5)
 * @param {string} state - Rarity state filename
 * @returns {Promise<void>} Promise that resolves when stars are drawn
 */
async function drawStars(
    ctx: CanvasRenderingContext2D,
    level: string,
    state: string
): Promise<void> {
    try {
        const starImg = await loadImage(`rarity/${level}-star/${state}`);

        let drawWidth = starImg.width;
        let drawHeight = starImg.height;

        if (drawWidth > 500) {
            const ratio = 500 / drawWidth;
            drawWidth = 500;
            drawHeight = drawHeight * ratio;
        }

        const x = (500 - drawWidth) / 2;
        ctx.drawImage(starImg, x, 0, drawWidth, drawHeight);
    } catch (error) {
        // Star image failed to load, continue without stars
    }
}

/**
 * Draw class icon
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {string} className - Class name identifier
 * @param {string} variant - Class icon variant
 * @returns {Promise<void>} Promise that resolves when icon is drawn
 */
async function drawClassIcon(
    ctx: CanvasRenderingContext2D,
    className: string,
    variant: string
): Promise<void> {
    try {
        const iconImg = await loadImage(`classes/${className}/${variant}.png`);
        ctx.drawImage(iconImg, 213, 753, 76, 76);
    } catch (error) {
        // Class icon failed to load, continue without icon
    }
}

/**
 * Draw text overlay including class name, servant name, and stats
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {FGOCardData} cardData - Card data containing text information
 * @description
 * Renders text in three layers:
 * - Class name at Y: 727 (large, white text)
 * - Servant name at Y: 753 (small, white text)
 * - ATK/HP stats at Y: 830 (large, gradient text)
 */
function drawText(ctx: CanvasRenderingContext2D, cardData: FGOCardData): void {
    ctx.textAlign = "center";
    ctx.font = "50px FGO";
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "black";
    ctx.strokeText(cardData.subname || cardData.className, 250, 727);
    ctx.fillStyle = "white";
    ctx.fillText(cardData.subname || cardData.className, 250, 727);

    if (cardData.name) {
        ctx.font = "22px FGO";
        ctx.lineWidth = 4;
        ctx.strokeText(cardData.name, 250, 753);
        ctx.fillStyle = "white";
        ctx.fillText(cardData.name, 250, 753);
    }

    ctx.font = "50px FGO";

    ctx.strokeStyle = "black";
    ctx.strokeText(String(cardData.atk), 130, 830);

    const gradient = ctx.createLinearGradient(0, 780, 0, 830);

    if (cardData.isGold) {
        gradient.addColorStop(0.5, "#ffeb04");
        gradient.addColorStop(0.6, "#b1a300");
        gradient.addColorStop(1, "#ffeb04");
    } else {
        gradient.addColorStop(0.5, "white");
        gradient.addColorStop(0.6, "#8f8f8f");
        gradient.addColorStop(1, "white");
    }

    ctx.fillStyle = gradient;
    ctx.fillText(String(cardData.atk), 130, 830);

    ctx.strokeStyle = "black";
    ctx.strokeText(String(cardData.hp), 370, 830);
    ctx.fillStyle = gradient;
    ctx.fillText(String(cardData.hp), 370, 830);
}
