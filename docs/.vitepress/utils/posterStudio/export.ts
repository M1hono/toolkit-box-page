import { renderPixiEffectPreview } from "./effectRenderers";
import type {
    PosterAsset,
    PosterDocument,
    PosterFrameLayer,
    PosterIconLayer,
    PosterImageLayer,
    PosterLayer,
    PosterShapeLayer,
    PosterTextLayer,
} from "./types";

type RasterLayer = PosterImageLayer | PosterFrameLayer | PosterIconLayer;

export interface PosterExportOptions {
    pixelRatio?: number;
}

export interface PosterExportPlan {
    width: number;
    height: number;
    pixelRatio: number;
    layers: Array<{
        id: string;
        name: string;
        type: PosterLayer["type"];
    }>;
}

export function createExportPlan(
    document: PosterDocument,
    options: PosterExportOptions = {},
): PosterExportPlan {
    return {
        width: document.canvas.width,
        height: document.canvas.height,
        pixelRatio: options.pixelRatio ?? 1,
        layers: document.layers
            .filter((layer) => layer.visible)
            .map((layer) => ({
                id: layer.id,
                name: layer.name,
                type: layer.type,
            })),
    };
}

export async function exportPosterDocument(
    document: PosterDocument,
    assets: PosterAsset[],
    options: PosterExportOptions = {},
): Promise<string | Blob> {
    if (canUseBrowserCanvas()) {
        return exportWithBrowserCanvas(document, assets, options);
    }

    return exportFallbackDataUrl(document, options);
}

async function exportWithBrowserCanvas(
    document: PosterDocument,
    assets: PosterAsset[],
    options: PosterExportOptions,
): Promise<string> {
    const pixelRatio = options.pixelRatio ?? 1;
    const canvas = window.document.createElement("canvas");
    canvas.width = document.canvas.width * pixelRatio;
    canvas.height = document.canvas.height * pixelRatio;

    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Canvas 2D context is not available");
    }

    context.scale(pixelRatio, pixelRatio);

    if (!isTransparentBackground(document.canvas.background)) {
        context.fillStyle = document.canvas.background ?? "#f4f4f4";
        context.fillRect(0, 0, document.canvas.width, document.canvas.height);
    }

    for (const layer of document.layers) {
        if (!layer.visible) {
            continue;
        }

        if (layer.type === "text") {
            drawTextLayer(context, layer);
        } else if (layer.type === "shape") {
            drawShapeLayer(context, layer);
        } else if (isImageLikeLayer(layer)) {
            await drawImageLayer(context, layer, assets);
        }
    }

    return canvas.toDataURL("image/png");
}

function drawTextLayer(context: CanvasRenderingContext2D, layer: PosterTextLayer) {
    context.save();
    applyLayerTransform(context, layer);
    applyLayerComposite(context, layer);
    context.globalAlpha = layer.opacity;
    context.fillStyle = layer.color;
    context.font = `${layer.fontWeight ?? 700} ${layer.fontSize}px ${layer.fontFamily}`;
    context.textAlign = layer.align;
    context.textBaseline = "top";
    context.fillText(layer.text, 0, 0, layer.width);
    context.restore();
}

function drawShapeLayer(context: CanvasRenderingContext2D, layer: PosterShapeLayer) {
    context.save();
    applyLayerTransform(context, layer);
    applyLayerComposite(context, layer);
    context.globalAlpha = layer.opacity;
    context.fillStyle = layer.fill;

    if (layer.shape === "ellipse") {
        context.beginPath();
        context.ellipse(
            layer.width / 2,
            layer.height / 2,
            layer.width / 2,
            layer.height / 2,
            0,
            0,
            Math.PI * 2,
        );
        context.fill();
    } else {
        context.fillRect(0, 0, layer.width, layer.height);
    }

    if (layer.stroke && layer.strokeWidth) {
        context.strokeStyle = layer.stroke;
        context.lineWidth = layer.strokeWidth;
        context.strokeRect(0, 0, layer.width, layer.height);
    }

    context.restore();
}

async function drawImageLayer(
    context: CanvasRenderingContext2D,
    layer: RasterLayer,
    assets: PosterAsset[],
) {
    const source = await loadImageSource(layer, assets);

    if (!source) {
        return;
    }

    let drawSource: CanvasImageSource = source;

    if (layer.effects.some((effect) => effect.enabled !== false)) {
        const preview = await renderPixiEffectPreview(source, layer.effects, {
            width: layer.width,
            height: layer.height,
        });

        if (typeof preview !== "string") {
            drawSource = preview;
        }
    }

    context.save();
    applyLayerTransform(context, layer);
    applyLayerComposite(context, layer);
    context.globalAlpha = layer.opacity;
    context.drawImage(drawSource, 0, 0, layer.width, layer.height);
    context.restore();
}

function applyLayerTransform(
    context: CanvasRenderingContext2D,
    layer: PosterLayer,
) {
    context.translate(layer.x, layer.y);
    context.rotate((layer.rotation * Math.PI) / 180);
    context.scale(layer.scaleX, layer.scaleY);
}

function applyLayerComposite(
    context: CanvasRenderingContext2D,
    layer: PosterLayer,
) {
    context.globalCompositeOperation = toCanvasCompositeOperation(layer.blendMode);
}

function toCanvasCompositeOperation(
    blendMode: string | undefined,
): GlobalCompositeOperation {
    switch ((blendMode ?? "Normal").toLowerCase()) {
        case "multiply":
            return "multiply";
        case "screen":
            return "screen";
        case "overlay":
            return "overlay";
        default:
            return "source-over";
    }
}

function isImageLikeLayer(layer: PosterLayer): layer is RasterLayer {
    return layer.type === "image" || layer.type === "frame" || layer.type === "icon";
}

function loadImageSource(
    layer: RasterLayer,
    assets: PosterAsset[],
): Promise<HTMLImageElement | undefined> {
    const asset = assets.find((item) => item.id === layer.assetId);
    const source = layer.src ?? asset?.url ?? (asset?.blob ? URL.createObjectURL(asset.blob) : undefined);

    if (!source) {
        return Promise.resolve(undefined);
    }

    return new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => resolve(undefined);
        image.src = source;
    });
}

function exportFallbackDataUrl(
    document: PosterDocument,
    options: PosterExportOptions,
): string {
    const plan = createExportPlan(document, options);
    const text = document.layers
        .filter((layer): layer is PosterTextLayer => layer.visible && layer.type === "text")
        .map(
            (layer) =>
                `<text x="${layer.x}" y="${layer.y}" font-size="${layer.fontSize}" style="${toSvgBlendStyle(
                    layer.blendMode,
                )}" fill="${escapeXml(
                    layer.color,
                )}">${escapeXml(layer.text)}</text>`,
        )
        .join("");
    const background = isTransparentBackground(document.canvas.background)
        ? ""
        : `<rect width="100%" height="100%" fill="${escapeXml(
            document.canvas.background ?? "#f4f4f4",
        )}"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${plan.width}" height="${plan.height}" viewBox="0 0 ${plan.width} ${plan.height}">${background}${text}</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function isTransparentBackground(background: string | undefined): boolean {
    return background === "transparent";
}

function toSvgBlendStyle(blendMode: string | undefined): string {
    const operation = toCanvasCompositeOperation(blendMode);

    return operation === "source-over" ? "" : `mix-blend-mode:${operation}`;
}

function canUseBrowserCanvas(): boolean {
    return typeof window !== "undefined" && typeof window.document !== "undefined";
}

function escapeXml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
