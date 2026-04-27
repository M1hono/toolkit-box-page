import type {
    PosterCanvas,
    PosterCanvasPreset,
    PosterDocument,
    PosterEffect,
    PosterImageLayer,
    PosterLayer,
    PosterTextLayer,
} from "./types";

export interface AddImageLayerInput {
    name: string;
    assetId: string;
    src?: string;
    x?: number;
    y?: number;
    width: number;
    height: number;
    effects?: PosterEffect[];
}

export interface AddTextLayerInput {
    name: string;
    text: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    align?: "left" | "center" | "right";
    effects?: PosterEffect[];
}

const presetCanvases: Record<PosterCanvasPreset, PosterCanvas> = {
    curseforge: {
        width: 400,
        height: 400,
        preset: "curseforge",
    },
    mcmod: {
        width: 720,
        height: 450,
        preset: "mcmod",
    },
};

let fallbackIdCounter = 0;

export function createPosterDocument(preset: PosterCanvasPreset): PosterDocument {
    const now = Date.now();
    const canvas = presetCanvases[preset];

    return {
        id: createId("poster-document"),
        name: preset === "mcmod" ? "MCMOD Cover" : "CurseForge Cover",
        canvas: { ...canvas },
        layers: [],
        createdAt: now,
        updatedAt: now,
    };
}

export function addImageLayer(
    doc: PosterDocument,
    input: AddImageLayerInput,
): PosterDocument {
    const layer: PosterImageLayer = {
        ...createBaseLayer("image", input.name, input.width, input.height),
        assetId: input.assetId,
        src: input.src,
        x: input.x ?? 0,
        y: input.y ?? 0,
        effects: input.effects ?? [],
    };

    return appendLayer(doc, layer);
}

export function addTextLayer(
    doc: PosterDocument,
    input: AddTextLayerInput,
): PosterDocument {
    const fontSize = input.fontSize ?? 32;
    const layer: PosterTextLayer = {
        ...createBaseLayer(
            "text",
            input.name,
            input.width ?? Math.max(160, input.text.length * fontSize * 0.6),
            input.height ?? fontSize * 1.4,
        ),
        text: input.text,
        x: input.x ?? 0,
        y: input.y ?? 0,
        fontFamily: input.fontFamily ?? "sans-serif",
        fontSize,
        color: input.color ?? "#ffffff",
        align: input.align ?? "left",
        effects: input.effects ?? [],
    };

    return appendLayer(doc, layer);
}

export function updateLayer(
    doc: PosterDocument,
    id: string,
    patch: Partial<PosterLayer>,
): PosterDocument {
    return touchDocument({
        ...doc,
        layers: doc.layers.map((layer) =>
            layer.id === id ? ({ ...layer, ...patch, id: layer.id } as PosterLayer) : layer,
        ),
    });
}

export function moveLayer(
    doc: PosterDocument,
    id: string,
    targetIndex: number,
): PosterDocument {
    const currentIndex = doc.layers.findIndex((layer) => layer.id === id);

    if (currentIndex === -1) {
        return doc;
    }

    const nextLayers = [...doc.layers];
    const [layer] = nextLayers.splice(currentIndex, 1);
    const boundedIndex = Math.max(0, Math.min(targetIndex, nextLayers.length));
    nextLayers.splice(boundedIndex, 0, layer);

    return touchDocument({
        ...doc,
        layers: nextLayers,
    });
}

function appendLayer(doc: PosterDocument, layer: PosterLayer): PosterDocument {
    return touchDocument({
        ...doc,
        layers: [...doc.layers, layer],
    });
}

function createBaseLayer(
    type: PosterLayer["type"],
    name: string,
    width: number,
    height: number,
): Omit<PosterLayer, "type"> & { type: PosterLayer["type"] } {
    return {
        id: createId(`poster-${type}`),
        type,
        name,
        x: 0,
        y: 0,
        width,
        height,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        effects: [],
    } as Omit<PosterLayer, "type"> & { type: PosterLayer["type"] };
}

function touchDocument(doc: PosterDocument): PosterDocument {
    return {
        ...doc,
        updatedAt: Date.now(),
    };
}

function createId(prefix: string): string {
    const randomUUID = globalThis.crypto?.randomUUID;

    if (typeof randomUUID === "function") {
        return `${prefix}-${randomUUID.call(globalThis.crypto)}`;
    }

    fallbackIdCounter += 1;
    return `${prefix}-${Date.now()}-${fallbackIdCounter}`;
}
