import type { PosterEffect } from "./types";

export interface PosterEffectDefinition {
    id: string;
    name: string;
    category: "adjust" | "blur" | "texture" | "style" | "color";
    params: Record<string, number | string | boolean>;
}

export interface DustGrainOptions {
    seed: number;
    density: number;
    width: number;
    height: number;
    size?: number;
    opacity?: number;
}

export interface DustGrainPoint {
    x: number;
    y: number;
    radius: number;
    alpha: number;
}

export interface EffectValidationResult {
    ok: boolean;
    errors: string[];
}

export const posterEffectRegistry: Record<string, PosterEffectDefinition> = {
    adjust: {
        id: "adjust",
        name: "Adjust",
        category: "adjust",
        params: {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            hue: 0,
        },
    },
    blur: {
        id: "blur",
        name: "Blur",
        category: "blur",
        params: {
            radius: 0,
        },
    },
    pixelate: {
        id: "pixelate",
        name: "Pixelate",
        category: "style",
        params: {
            size: 4,
        },
    },
    noise: {
        id: "noise",
        name: "Noise",
        category: "texture",
        params: {
            amount: 0.08,
            seed: 1,
        },
    },
    dustGrain: {
        id: "dustGrain",
        name: "Dust Grain",
        category: "texture",
        params: {
            density: 0.14,
            size: 1.1,
            opacity: 0.16,
            seed: 42,
            color: "#ffffff",
        },
    },
    frostedGlass: {
        id: "frostedGlass",
        name: "Frosted Glass",
        category: "style",
        params: {
            blur: 8,
            noise: 0.08,
            tint: "#ffffff",
            opacity: 0.18,
        },
    },
    vignette: {
        id: "vignette",
        name: "Vignette",
        category: "style",
        params: {
            strength: 0.25,
            radius: 0.72,
        },
    },
    glow: {
        id: "glow",
        name: "Glow",
        category: "style",
        params: {
            radius: 12,
            intensity: 0.35,
            color: "#ffffff",
        },
    },
    duotone: {
        id: "duotone",
        name: "Duotone",
        category: "color",
        params: {
            shadow: "#161616",
            highlight: "#f4f0e8",
            strength: 0.8,
        },
    },
};

export function createDefaultEffectStack(): PosterEffect[] {
    return [
        {
            id: "adjust",
            enabled: true,
            params: { ...posterEffectRegistry.adjust.params },
        },
        {
            id: "dustGrain",
            enabled: false,
            params: { ...posterEffectRegistry.dustGrain.params },
        },
    ];
}

export function validateEffectStack(stack: PosterEffect[]): EffectValidationResult {
    const errors: string[] = [];

    for (const effect of stack) {
        if (!posterEffectRegistry[effect.id]) {
            errors.push(`unknown effect: ${effect.id}`);
        }

        if (!effect.params || typeof effect.params !== "object") {
            errors.push(`effect ${effect.id} must define params`);
        }
    }

    return {
        ok: errors.length === 0,
        errors,
    };
}

export function createDustGrainPoints(options: DustGrainOptions): DustGrainPoint[] {
    const size = options.size ?? 1;
    const opacity = options.opacity ?? 0.16;
    const count = Math.round((options.width * options.height * options.density) / 100);
    const random = createSeededRandom(options.seed);
    const points: DustGrainPoint[] = [];

    for (let index = 0; index < count; index += 1) {
        points.push({
            x: round(random() * options.width),
            y: round(random() * options.height),
            radius: round((0.45 + random() * 0.85) * size),
            alpha: round((0.35 + random() * 0.65) * opacity),
        });
    }

    return points;
}

function createSeededRandom(seed: number): () => number {
    let state = seed >>> 0;

    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

function round(value: number): number {
    return Math.round(value * 1000) / 1000;
}
