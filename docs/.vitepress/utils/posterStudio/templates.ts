import { createPosterDocument } from "./document";
import type {
    PosterCanvasPreset,
    PosterDocument,
    PosterFrameLayer,
    PosterImageLayer,
    PosterShapeLayer,
    PosterTemplateManifest,
    PosterTemplateParameter,
    PosterTemplateSize,
    PosterTemplateSlot,
} from "./types";

export interface ValidationResult {
    ok: boolean;
    errors: string[];
}

export function validateTemplateManifest(input: unknown): ValidationResult {
    const errors: string[] = [];

    if (!isRecord(input)) {
        return { ok: false, errors: ["manifest must be an object"] };
    }

    if (input.schemaVersion !== 1) {
        errors.push("schemaVersion must be 1");
    }

    if (!isNonEmptyString(input.id)) {
        errors.push("id is required");
    }

    if (!isNonEmptyString(input.name)) {
        errors.push("name is required");
    }

    if (input.kind !== "poster-template") {
        errors.push("kind must be poster-template");
    }

    validateSize(input.sizes, "curseforge", 400, 400, errors);
    validateSize(input.sizes, "mcmod", 720, 450, errors);
    validateUniqueIds(input.slots, "slots", errors);
    validateUniqueIds(input.parameters, "parameters", errors);

    return {
        ok: errors.length === 0,
        errors,
    };
}

export function createDocumentFromTemplate(
    manifest: unknown,
    preset: PosterCanvasPreset,
    basePath: string,
): PosterDocument {
    const result = validateTemplateManifest(manifest);

    if (!result.ok) {
        throw new Error(result.errors.join("\n"));
    }

    const typedManifest = manifest as PosterTemplateManifest;
    const size = typedManifest.sizes[preset] as PosterTemplateSize;
    const doc = createPosterDocument(preset);
    const layers = [...doc.layers];
    const backgroundSlot = typedManifest.slots?.find((slot) => slot.id === "background");
    const centerIconSlot = typedManifest.slots?.find((slot) => slot.id === "centerIcon");

    if (backgroundSlot) {
        layers.push(createBackgroundLayer(preset, size, backgroundSlot));
    }

    layers.push(createFrameLayer(typedManifest, preset, size, basePath));

    if (centerIconSlot?.default) {
        layers.push(createCenterIconLayer(typedManifest, preset, size, centerIconSlot, basePath));
    }

    return {
        ...doc,
        name: typedManifest.name,
        templateId: typedManifest.id,
        templateParameters: createTemplateParameters(typedManifest.parameters ?? []),
        layers,
        updatedAt: Date.now(),
    };
}

function validateSize(
    sizes: unknown,
    preset: PosterCanvasPreset,
    width: number,
    height: number,
    errors: string[],
): void {
    if (!isRecord(sizes) || !isRecord(sizes[preset])) {
        errors.push(`sizes.${preset} is required`);
        return;
    }

    const size = sizes[preset];

    if (size.width !== width || size.height !== height) {
        errors.push(`sizes.${preset} must be ${width}x${height}`);
    }

    if (!isNonEmptyString(size.frame)) {
        errors.push(`sizes.${preset}.frame is required`);
    }
}

function validateUniqueIds(value: unknown, label: string, errors: string[]): void {
    if (value === undefined) {
        return;
    }

    if (!Array.isArray(value)) {
        errors.push(`${label} must be an array`);
        return;
    }

    const seen = new Set<string>();

    for (const item of value) {
        if (!isRecord(item) || !isNonEmptyString(item.id)) {
            errors.push(`${label} entries must have ids`);
            continue;
        }

        if (seen.has(item.id)) {
            errors.push(`${label}.${item.id} is duplicated`);
        }

        seen.add(item.id);
    }
}

function createBackgroundLayer(
    preset: PosterCanvasPreset,
    size: PosterTemplateSize,
    slot: PosterTemplateSlot,
): PosterShapeLayer {
    return {
        id: createId(`template-${preset}-${slot.id}`),
        type: "shape",
        name: "Background",
        shape: "rect",
        fill: "#101010",
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        effects: [],
    };
}

function createFrameLayer(
    manifest: PosterTemplateManifest,
    preset: PosterCanvasPreset,
    size: PosterTemplateSize,
    basePath: string,
): PosterFrameLayer {
    return {
        id: createId(`template-${preset}-frame`),
        type: "frame",
        name: "Frame",
        assetId: `${manifest.id}:${preset}:frame`,
        src: resolveTemplateAsset(basePath, size.frame ?? ""),
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: true,
        effects: [],
    };
}

function createCenterIconLayer(
    manifest: PosterTemplateManifest,
    preset: PosterCanvasPreset,
    size: PosterTemplateSize,
    slot: PosterTemplateSlot,
    basePath: string,
): PosterImageLayer {
    const iconSize = Math.round(Math.min(size.width, size.height) * 0.32);

    return {
        id: createId(`template-${preset}-${slot.id}`),
        type: "image",
        name: "Center Icon",
        assetId: `${manifest.id}:${preset}:${slot.id}`,
        src: resolveTemplateAsset(basePath, slot.default ?? ""),
        x: Math.round((size.width - iconSize) / 2),
        y: Math.round((size.height - iconSize) / 2),
        width: iconSize,
        height: iconSize,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        effects: [],
    };
}

function createTemplateParameters(
    parameters: PosterTemplateParameter[],
): Record<string, string | number | boolean> {
    return Object.fromEntries(
        parameters.map((parameter) => [parameter.id, parameter.default]),
    );
}

function resolveTemplateAsset(basePath: string, relativePath: string): string {
    const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;

    return `${normalizedBase}${relativePath}`.replaceAll(/\/{2,}/g, "/");
}

function createId(prefix: string): string {
    const randomUUID = globalThis.crypto?.randomUUID;

    if (typeof randomUUID === "function") {
        return `${prefix}-${randomUUID.call(globalThis.crypto)}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}
