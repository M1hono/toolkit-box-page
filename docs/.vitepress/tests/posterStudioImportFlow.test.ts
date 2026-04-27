import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const componentRoot = path.resolve(
    import.meta.dirname,
    "../theme/components/Self/PosterStudio",
);

test("asset panel exposes import actions and required catalog tabs", () => {
    const source = readFileSync(path.join(componentRoot, "PosterAssetPanel.vue"), "utf8");

    for (const label of [
        "Templates",
        "Frames",
        "Game Icons",
        "Imported",
        "Fonts",
        "Local Catalog",
        "Add to Canvas",
        "Add to Library",
    ]) {
        assert.match(source, new RegExp(label));
    }
});

test("PosterStudioApp wires imported files through storage and document layers", () => {
    const source = readFileSync(path.join(componentRoot, "PosterStudioApp.vue"), "utf8");

    assert.match(source, /createIndexedDbPosterStudioStorage/);
    assert.match(source, /createPosterAssetFromFile/);
    assert.match(source, /addImageLayer/);
    assert.match(source, /putAsset/);
});

test("PosterCanvas renders image layers with vue-konva", () => {
    const source = readFileSync(path.join(componentRoot, "PosterCanvas.vue"), "utf8");

    assert.match(source, /Image as VImage/);
    assert.match(source, /<v-image/);
});
