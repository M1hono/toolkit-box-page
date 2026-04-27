import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("canvas dependencies are declared", () => {
    const packageJson = JSON.parse(
        readFileSync(path.join(repoRoot, "package.json"), "utf8"),
    );

    assert.ok(packageJson.dependencies.konva);
    assert.ok(packageJson.dependencies["vue-konva"]);
});

test("PosterCanvas renders a vue-konva stage", () => {
    const source = readFileSync(
        path.join(
            repoRoot,
            ".vitepress/theme/components/Self/PosterStudio/PosterCanvas.vue",
        ),
        "utf8",
    );

    assert.match(source, /vue-konva/);
    assert.match(source, /<v-stage/);
    assert.match(source, /<v-transformer/);
});

test("PosterCanvas renders image and shape layers", () => {
    const source = readFileSync(
        path.join(
            repoRoot,
            ".vitepress/theme/components/Self/PosterStudio/PosterCanvas.vue",
        ),
        "utf8",
    );

    assert.match(source, /<v-image/);
    assert.match(source, /shapeRectConfig/);
    assert.match(source, /ellipseConfig/);
});
