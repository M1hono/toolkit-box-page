import assert from "node:assert/strict";
import test from "node:test";

import {
    addTextLayer,
    createPosterDocument,
    updateCanvas,
    updateLayer,
} from "../utils/posterStudio/document";
import {
    createExportPlan,
    exportPosterDocument,
} from "../utils/posterStudio/export";

test("createExportPlan captures dimensions and visible layers", () => {
    const doc = addTextLayer(createPosterDocument("curseforge"), {
        name: "Title",
        text: "KubeJS",
    });
    const plan = createExportPlan(doc);

    assert.equal(plan.width, 400);
    assert.equal(plan.height, 400);
    assert.equal(plan.layers.length, 1);
});

test("exportPosterDocument returns a non-empty fallback data url in Node", async () => {
    const doc = addTextLayer(createPosterDocument("curseforge"), {
        name: "Title",
        text: "KubeJS",
    });
    const result = await exportPosterDocument(doc, []);

    assert.equal(typeof result, "string");
    assert.match(result as string, /^data:image\//);
    assert.ok((result as string).length > 100);
});

test("fallback export keeps transparent documents transparent", async () => {
    const doc = addTextLayer(
        updateCanvas(createPosterDocument("curseforge"), {
            background: "transparent",
        }),
        {
            name: "Title",
            text: "KubeJS",
        },
    );
    const result = decodeURIComponent((await exportPosterDocument(doc, [])) as string);

    assert.doesNotMatch(result, /<rect width="100%" height="100%"/);
});

test("fallback export serializes blend mode hints", async () => {
    let doc = addTextLayer(createPosterDocument("curseforge"), {
        name: "Title",
        text: "KubeJS",
    });
    doc = updateLayer(doc, doc.layers[0].id, { blendMode: "Multiply" });
    const result = decodeURIComponent((await exportPosterDocument(doc, [])) as string);

    assert.match(result, /mix-blend-mode:multiply/);
});
