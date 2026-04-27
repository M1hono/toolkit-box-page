export type PosterCanvasPreset = "curseforge" | "mcmod";

export type PosterLayerType = "image" | "text" | "shape" | "frame" | "icon";

export interface PosterCanvas {
    width: number;
    height: number;
    preset: PosterCanvasPreset;
    background?: string;
}

export interface PosterEffect {
    id: string;
    enabled?: boolean;
    params: Record<string, unknown>;
}

export interface PosterLayerBase {
    id: string;
    type: PosterLayerType;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    opacity: number;
    visible: boolean;
    locked: boolean;
    blendMode?: string;
    effects: PosterEffect[];
}

export interface PosterImageLayer extends PosterLayerBase {
    type: "image";
    assetId: string;
    src?: string;
}

export interface PosterTextLayer extends PosterLayerBase {
    type: "text";
    text: string;
    fontFamily: string;
    fontSize: number;
    color: string;
    align: "left" | "center" | "right";
    fontWeight?: string | number;
}

export interface PosterShapeLayer extends PosterLayerBase {
    type: "shape";
    shape: "rect" | "line" | "ellipse" | "badge";
    fill: string;
    stroke?: string;
    strokeWidth?: number;
}

export interface PosterFrameLayer extends PosterLayerBase {
    type: "frame";
    assetId: string;
    src?: string;
    tint?: string;
}

export interface PosterIconLayer extends PosterLayerBase {
    type: "icon";
    assetId: string;
    src?: string;
    tint?: string;
}

export type PosterLayer =
    | PosterImageLayer
    | PosterTextLayer
    | PosterShapeLayer
    | PosterFrameLayer
    | PosterIconLayer;

export interface PosterDocument {
    id: string;
    name: string;
    canvas: PosterCanvas;
    layers: PosterLayer[];
    templateId?: string;
    templateParameters?: Record<string, string | number | boolean>;
    createdAt: number;
    updatedAt: number;
}

export type PosterAssetKind =
    | "image"
    | "icon"
    | "frame"
    | "font"
    | "tile"
    | "template"
    | "ui";

export interface PosterAsset {
    id: string;
    name: string;
    kind: PosterAssetKind;
    mime: string;
    width?: number;
    height?: number;
    url?: string;
    blob?: Blob;
    tags?: string[];
    source: "built-in" | "import" | "catalog" | "template";
    sourcePath?: string;
    createdAt: number;
}

export interface PosterTemplateSize {
    width: number;
    height: number;
    frame?: string;
}

export interface PosterTemplateSlot {
    id: string;
    type: "image" | "text" | "effect" | "color" | "font";
    required?: boolean;
    default?: string;
}

export interface PosterTemplateParameter {
    id: string;
    type: "color" | "number" | "text" | "boolean";
    default: string | number | boolean;
    min?: number;
    max?: number;
}

export interface PosterTemplateManifest {
    schemaVersion: 1;
    id: string;
    name: string;
    kind: "poster-template";
    sourcePreset?: string;
    sizes: Partial<Record<PosterCanvasPreset, PosterTemplateSize>>;
    slots?: PosterTemplateSlot[];
    parameters?: PosterTemplateParameter[];
}
