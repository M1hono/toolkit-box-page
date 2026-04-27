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

test("PosterCanvas keeps magic wand editing without raster brush tools", () => {
    const source = readFileSync(
        path.join(
            repoRoot,
            ".vitepress/theme/components/Self/PosterStudio/PosterCanvas.vue",
        ),
        "utf8",
    );

    assert.match(source, /activeTool/);
    assert.match(source, /magicWand/);
    assert.match(source, /getImagePixelAlpha/);
    assert.match(source, /findLayerAtPointer/);
    assert.match(source, /applyMagicWandErase/);
    assert.match(source, /renderLayerImageElement/);
    assert.match(source, /globalCompositeOperation/);
    assert.doesNotMatch(source, /paintBrush/);
    assert.doesNotMatch(source, /pixelEraser/);
    assert.doesNotMatch(source, /paintImageLayerAtPointer/);
    assert.doesNotMatch(source, /eraseImageLayerAtPointer/);
    assert.doesNotMatch(source, /isDrawing/);
    assert.doesNotMatch(source, /drawingLayerId/);
});

test("PosterCanvas skips locked or transparent layers during canvas hit testing", () => {
    const source = readFileSync(
        path.join(
            repoRoot,
            ".vitepress/theme/components/Self/PosterStudio/PosterCanvas.vue",
        ),
        "utf8",
    );

    assert.match(source, /getImagePixelAlpha\(id, event\) <= 8/);
    assert.match(source, /findLayerAtPointer\(id\)/);
    assert.match(source, /layer\.locked/);
    assert.match(source, /!layer\.visible \|\| layer\.locked/);
});

test("PosterCanvas uses an image-backed checker pattern for transparent preview", () => {
    const source = readFileSync(
        path.join(
            repoRoot,
            ".vitepress/theme/components/Self/PosterStudio/PosterCanvas.vue",
        ),
        "utf8",
    );

    assert.match(source, /ref<HTMLImageElement>/);
    assert.match(source, /checkerImageConfig/);
    assert.match(source, /toDataURL\("image\/png"\)/);
    assert.match(source, /v-if="isTransparentBackground\(\)"/);
});
