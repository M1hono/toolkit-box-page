import assert from "node:assert/strict";
import test from "node:test";

import {
    createDefaultEffectStack,
    createDustGrainPoints,
    validateEffectStack,
} from "../utils/posterStudio/effects";

test("default effect stack contains adjust and dustGrain", () => {
    const stack = createDefaultEffectStack();

    assert.equal(stack[0].id, "adjust");
    assert.equal(stack.some((effect) => effect.id === "dustGrain"), true);
});

test("dust grain points are deterministic by seed", () => {
    const a = createDustGrainPoints({
        seed: 42,
        density: 0.1,
        width: 100,
        height: 100,
    });
    const b = createDustGrainPoints({
        seed: 42,
        density: 0.1,
        width: 100,
        height: 100,
    });

    assert.deepEqual(a.slice(0, 5), b.slice(0, 5));
});

test("validateEffectStack rejects unknown effects", () => {
    const result = validateEffectStack([{ id: "unknown", params: {} }]);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /unknown/);
});
