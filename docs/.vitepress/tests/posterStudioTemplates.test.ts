import assert from "node:assert/strict";
import test from "node:test";

import {
    createDocumentFromTemplate,
    validateTemplateManifest,
} from "../utils/posterStudio/templates";

const manifest = {
    schemaVersion: 1,
    id: "theme-clear-frame",
    name: "Theme Clear Frame",
    kind: "poster-template",
    sourcePreset: "kubejs",
    sizes: {
        curseforge: { width: 400, height: 400, frame: "frames/curseforge.png" },
        mcmod: { width: 720, height: 450, frame: "frames/mcmod.png" },
    },
    slots: [
        { id: "background", type: "image", required: false },
        { id: "centerIcon", type: "image", default: "slots/center-icon.png" },
    ],
    parameters: [{ id: "frameTint", type: "color", default: "#8a5a1f" }],
};

test("validateTemplateManifest accepts the theme clear frame manifest", () => {
    const result = validateTemplateManifest(manifest);

    assert.equal(result.ok, true);
});

test("validateTemplateManifest rejects templates without both poster sizes", () => {
    const broken = { ...manifest, sizes: { curseforge: manifest.sizes.curseforge } };
    const result = validateTemplateManifest(broken);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /mcmod/);
});

test("createDocumentFromTemplate adds a frame layer for the selected size", () => {
    const doc = createDocumentFromTemplate(
        manifest,
        "mcmod",
        "/self/poster-studio/templates/theme-clear-frame/",
    );

    assert.equal(doc.canvas.width, 720);
    assert.equal(doc.layers.some((layer) => layer.name === "Frame"), true);
    assert.equal(doc.templateId, "theme-clear-frame");
});
