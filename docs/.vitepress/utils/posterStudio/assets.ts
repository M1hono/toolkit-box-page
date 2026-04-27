import type { PosterAsset, PosterAssetKind } from "./types";

export interface PosterAssetIndex {
    schemaVersion: 1;
    generatedAt?: string;
    assets: PosterAsset[];
}

export interface PosterTemplateIndexItem {
    id: string;
    name: string;
    sourcePreset?: string;
    manifestUrl: string;
    rootUrl: string;
    sizes?: unknown;
}

export interface PosterTemplateIndex {
    schemaVersion: 1;
    generatedAt?: string;
    templates: PosterTemplateIndexItem[];
}

type FetchLike = (input: string) => Promise<Pick<Response, "ok" | "json" | "status">>;

export async function loadPosterAssetIndex(
    fetcher: FetchLike = defaultFetch,
    url = "/self/poster-studio/indexes/assets.json",
): Promise<PosterAssetIndex> {
    const response = await fetcher(url);

    if (!response.ok) {
        throw new Error(`Failed to load poster asset index: ${response.status}`);
    }

    const payload = await response.json();

    return {
        schemaVersion: 1,
        generatedAt: payload.generatedAt,
        assets: Array.isArray(payload.assets) ? payload.assets : [],
    };
}

export async function loadPosterTemplateIndex(
    fetcher: FetchLike = defaultFetch,
    url = "/self/poster-studio/indexes/templates.json",
): Promise<PosterTemplateIndex> {
    const response = await fetcher(url);

    if (!response.ok) {
        throw new Error(`Failed to load poster template index: ${response.status}`);
    }

    const payload = await response.json();

    return {
        schemaVersion: 1,
        generatedAt: payload.generatedAt,
        templates: Array.isArray(payload.templates) ? payload.templates : [],
    };
}

export function filterPosterAssetsByKind(
    assets: PosterAsset[],
    kind: PosterAssetKind,
): PosterAsset[] {
    return assets.filter((asset) => asset.kind === kind);
}

export async function createPosterAssetFromFile(file: File): Promise<PosterAsset> {
    const url = URL.createObjectURL(file);
    const dimensions = await readImageDimensions(url);

    return {
        id: createAssetId(file.name),
        name: file.name,
        kind: "image",
        mime: file.type || "application/octet-stream",
        width: dimensions.width,
        height: dimensions.height,
        url,
        blob: file,
        source: "import",
        createdAt: Date.now(),
    };
}

function defaultFetch(input: string) {
    if (typeof fetch !== "function") {
        throw new Error("fetch is not available in this environment");
    }

    return fetch(input);
}

function readImageDimensions(url: string): Promise<{ width: number; height: number }> {
    if (typeof Image === "undefined") {
        return Promise.resolve({ width: 0, height: 0 });
    }

    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => resolve({ width: 0, height: 0 });
        image.src = url;
    });
}

function createAssetId(name: string): string {
    const randomUUID = globalThis.crypto?.randomUUID;
    const suffix =
        typeof randomUUID === "function"
            ? randomUUID.call(globalThis.crypto)
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const safeName = name
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

    return `import-${safeName || "asset"}-${suffix}`;
}
