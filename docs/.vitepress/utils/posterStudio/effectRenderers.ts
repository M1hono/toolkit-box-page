import { createDustGrainPoints, posterEffectRegistry } from "./effects";
import type { PosterEffect } from "./types";

export interface PixiEffectPipelineStep {
    id: string;
    params: Record<string, unknown>;
}

export interface PixiEffectPipelinePlan {
    renderer: "pixi.js";
    effects: PixiEffectPipelineStep[];
    warnings: string[];
}

const pixiSupportedEffects = new Set(["adjust", "blur", "noise", "dustGrain"]);

export function createPixiEffectPipelinePlan(
    effects: PosterEffect[],
): PixiEffectPipelinePlan {
    const warnings: string[] = [];
    const supportedEffects = effects
        .filter((effect) => effect.enabled !== false)
        .flatMap((effect) => {
            if (!posterEffectRegistry[effect.id]) {
                warnings.push(`unknown effect: ${effect.id}`);
                return [];
            }

            if (!pixiSupportedEffects.has(effect.id)) {
                warnings.push(`unsupported pixi effect: ${effect.id}`);
                return [];
            }

            return [{ id: effect.id, params: effect.params }];
        });

    return {
        renderer: "pixi.js",
        effects: supportedEffects,
        warnings,
    };
}

export async function renderPixiEffectPreview(
    source: CanvasImageSource,
    effects: PosterEffect[],
    options: { width: number; height: number },
): Promise<HTMLCanvasElement | string> {
    const plan = createPixiEffectPipelinePlan(effects);

    if (typeof document === "undefined") {
        return createPreviewFallbackDataUrl(plan, options);
    }

    const pixi = await import("pixi.js");
    const { Application, Sprite, Texture } = pixi;
    const canvas = document.createElement("canvas");
    canvas.width = options.width;
    canvas.height = options.height;

    const app = new Application();
    await app.init({
        canvas,
        width: options.width,
        height: options.height,
        backgroundAlpha: 0,
        antialias: true,
    });

    const sprite = new Sprite(Texture.from(source));
    sprite.width = options.width;
    sprite.height = options.height;
    sprite.filters = createPixiFilters(pixi, plan.effects) as any;
    app.stage.addChild(sprite);

    app.render();

    for (const effect of plan.effects) {
        if (effect.id === "dustGrain") {
            drawDustOverlay(canvas, effect.params);
        }
    }

    app.destroy(false);

    return canvas;
}

function createPixiFilters(
    pixi: typeof import("pixi.js"),
    effects: PixiEffectPipelineStep[],
): unknown[] {
    const filters: unknown[] = [];

    for (const effect of effects) {
        if (effect.id === "adjust") {
            const filter = new pixi.ColorMatrixFilter();
            const brightness = 1 + numberParam(effect.params.brightness, 0);
            const contrast = 1 + numberParam(effect.params.contrast, 0);
            const saturation = numberParam(effect.params.saturation, 0);
            const hue = numberParam(effect.params.hue, 0);

            filter.brightness(brightness, false);
            filter.contrast(contrast, true);
            filter.saturate(saturation, true);
            filter.hue(hue, true);
            filters.push(filter);
        }

        if (effect.id === "blur") {
            filters.push(
                new pixi.BlurFilter({
                    strength: numberParam(effect.params.radius, 0),
                    quality: 4,
                }),
            );
        }

        if (effect.id === "noise") {
            filters.push(
                new pixi.NoiseFilter({
                    noise: numberParam(effect.params.amount, 0.08),
                    seed: numberParam(effect.params.seed, 1),
                }),
            );
        }
    }

    return filters;
}

function drawDustOverlay(canvas: HTMLCanvasElement, params: Record<string, unknown>) {
    const context = canvas.getContext("2d");

    if (!context) {
        return;
    }

    const points = createDustGrainPoints({
        seed: numberParam(params.seed, 42),
        density: numberParam(params.density, 0.14),
        width: canvas.width,
        height: canvas.height,
        size: numberParam(params.size, 1.1),
        opacity: numberParam(params.opacity, 0.16),
    });

    context.save();
    context.fillStyle = stringParam(params.color, "#ffffff");

    for (const point of points) {
        context.globalAlpha = point.alpha;
        context.beginPath();
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        context.fill();
    }

    context.restore();
}

function createPreviewFallbackDataUrl(
    plan: PixiEffectPipelinePlan,
    options: { width: number; height: number },
): string {
    const payload = JSON.stringify({
        renderer: plan.renderer,
        width: options.width,
        height: options.height,
        effects: plan.effects.map((effect) => effect.id),
    });

    return `data:application/json;base64,${btoaSafe(payload)}`;
}

function numberParam(value: unknown, fallback: number): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringParam(value: unknown, fallback: string): string {
    return typeof value === "string" ? value : fallback;
}

function btoaSafe(value: string): string {
    if (typeof btoa === "function") {
        return btoa(value);
    }

    return value;
}
