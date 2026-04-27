import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { createPixiEffectPipelinePlan } from "../utils/posterStudio/effectRenderers";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("PixiJS dependency is declared", () => {
    const packageJson = JSON.parse(
        readFileSync(path.join(repoRoot, "package.json"), "utf8"),
    );

    assert.ok(packageJson.dependencies["pixi.js"]);
});

test("pixi effect pipeline supports the initial poster effects", () => {
    const plan = createPixiEffectPipelinePlan([
        { id: "adjust", params: { brightness: 0.1 } },
        { id: "blur", params: { radius: 2 } },
        { id: "noise", params: { amount: 0.08 } },
        { id: "dustGrain", params: { density: 0.1 } },
    ]);

    assert.deepEqual(
        plan.effects.map((effect) => effect.id),
        ["adjust", "blur", "noise", "dustGrain"],
    );
});

test("pixi effect renderer wires built-in filter adapters", () => {
    const source = readFileSync(
        path.join(repoRoot, ".vitepress/utils/posterStudio/effectRenderers.ts"),
        "utf8",
    );

    assert.match(source, /ColorMatrixFilter/);
    assert.match(source, /BlurFilter/);
    assert.match(source, /NoiseFilter/);
    assert.match(source, /drawDustOverlay\(canvas/);
});
