import assert from "node:assert/strict";
import test from "node:test";

import {
    addImageLayer,
    addTextLayer,
    createPosterDocument,
    moveLayer,
    updateLayer,
} from "../utils/posterStudio/document";

test("createPosterDocument creates a 720x450 mcmod document", () => {
    const doc = createPosterDocument("mcmod");

    assert.equal(doc.canvas.width, 720);
    assert.equal(doc.canvas.height, 450);
    assert.equal(doc.layers.length, 0);
});

test("addImageLayer and addTextLayer append editable layers", () => {
    let doc = createPosterDocument("curseforge");
    doc = addImageLayer(doc, {
        name: "Icon",
        assetId: "asset-1",
        width: 64,
        height: 64,
    });
    doc = addTextLayer(doc, {
        name: "Title",
        text: "KubeJS",
        x: 32,
        y: 32,
    });

    assert.equal(doc.layers[0].type, "image");
    assert.equal(doc.layers[1].type, "text");
    assert.equal(doc.layers[1].name, "Title");
});

test("moveLayer reorders layers without mutating original document", () => {
    let doc = createPosterDocument("curseforge");
    doc = addTextLayer(doc, { name: "Bottom", text: "A" });
    doc = addTextLayer(doc, { name: "Top", text: "B" });

    const moved = moveLayer(doc, doc.layers[0].id, 1);

    assert.equal(doc.layers[0].name, "Bottom");
    assert.equal(moved.layers[1].name, "Bottom");
});

test("updateLayer merges transform values", () => {
    let doc = createPosterDocument("curseforge");
    doc = addTextLayer(doc, { name: "Title", text: "A" });

    const updated = updateLayer(doc, doc.layers[0].id, { x: 20, rotation: 45 });

    assert.equal(updated.layers[0].x, 20);
    assert.equal(updated.layers[0].rotation, 45);
});
