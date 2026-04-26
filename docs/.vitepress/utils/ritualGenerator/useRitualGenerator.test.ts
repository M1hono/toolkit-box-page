import assert from "node:assert/strict";
import test from "node:test";

import { useRitualGenerator } from "./useRitualGenerator";

test("ritual KubeJS output uses MnaRitualReagent object chains for all reagent flags", () => {
    const { state, initializeGrids, generateKjsCode } = useRitualGenerator();

    state.gridSize = 3;
    initializeGrids();
    state.locked = true;
    state.pattern = [
        [1, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];
    state.reagents = [
        ["A", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
    ];
    state.keys = {
        A: {
            item: "minecraft:amethyst_shard",
            optional: true,
            consume: false,
            is_dynamic: false,
            dynamic_source: true,
            manual_return: true,
        },
    };
    state.parameters.createsItem = "minecraft:diamond";

    const code = generateKjsCode();

    assert.match(
        code,
        /\.reagent\(MnaRitualReagent\.of\("A", "minecraft:amethyst_shard"\)\.optional\(\)\.keep\(\)\.dynamicSource\(\)\.manualReturn\(\)\)/,
    );
    assert.doesNotMatch(code, /\.dynamicSourceReagent\(/);
    assert.doesNotMatch(code, /\.reagent\('A',/);
});

