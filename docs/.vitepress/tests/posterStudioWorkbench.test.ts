import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const componentRoot = path.resolve(
    import.meta.dirname,
    "../theme/components/Self/PosterStudio",
);

test("PosterStudio workbench components exist", () => {
    for (const file of [
        "PosterAssetPanel.vue",
        "PosterCanvas.vue",
        "PosterLayerPanel.vue",
        "PosterPropertiesPanel.vue",
    ]) {
        assert.equal(existsSync(path.join(componentRoot, file)), true);
    }
});

test("PosterStudioApp renders the plain three-column workbench shell", () => {
    const source = readFileSync(path.join(componentRoot, "PosterStudioApp.vue"), "utf8");

    assert.match(source, /class="poster-workbench"/);
    assert.match(source, /<PosterAssetPanel/);
    assert.match(source, /@apply-template="applyTemplate"/);
    assert.match(source, /<PosterCanvas/);
    assert.match(source, /<PosterLayerPanel/);
    assert.match(source, /<PosterPropertiesPanel/);
    assert.doesNotMatch(source, /gradient/i);
});

test("PosterStudioApp wires layer editing commands", () => {
    const source = readFileSync(path.join(componentRoot, "PosterStudioApp.vue"), "utf8");

    assert.match(source, /@reorder-layer="reorderLayer"/);
    assert.match(source, /@update-layer="updateLayerById"/);
    assert.match(source, /@remove-layer="removeLayerById"/);
    assert.match(source, /moveLayer/);
    assert.match(source, /removeLayer/);
});

test("PosterLayerPanel supports drag sorting and common layer buttons", () => {
    const source = readFileSync(path.join(componentRoot, "PosterLayerPanel.vue"), "utf8");

    assert.match(source, /draggable="true"/);
    assert.match(source, /@dragstart/);
    assert.match(source, /@drop/);
    assert.match(source, /reorderLayer/);
    for (const icon of [
        "mdi-arrow-up",
        "mdi-arrow-down",
        "mdi-eye-outline",
        "mdi-lock-outline",
        "mdi-delete-outline",
    ]) {
        assert.match(source, new RegExp(icon));
    }
});

test("PosterCanvas scales responsively instead of overflowing narrow screens", () => {
    const source = readFileSync(path.join(componentRoot, "PosterCanvas.vue"), "utf8");

    assert.match(source, /ResizeObserver/);
    assert.match(source, /canvasScale/);
    assert.match(source, /<v-group/);
});

test("PosterPropertiesPanel exposes numeric transform fields", () => {
    const source = readFileSync(path.join(componentRoot, "PosterPropertiesPanel.vue"), "utf8");

    for (const key of ["x", "y", "width", "height"]) {
        assert.match(source, new RegExp(`\\b${key}: Number\\(\\$event\\)`));
    }
});

test("PosterPropertiesPanel uses external field labels and text controls", () => {
    const source = readFileSync(path.join(componentRoot, "PosterPropertiesPanel.vue"), "utf8");

    assert.match(source, /class="field-label"/);
    assert.match(source, /:aria-label="t\.name"/);
    assert.match(source, /textLayer/);
    assert.match(source, /v-textarea/);
    assert.match(source, /mdi-format-align-left/);
});

test("PosterPropertiesPanel exposes raster effect presets", () => {
    const source = readFileSync(path.join(componentRoot, "PosterPropertiesPanel.vue"), "utf8");

    assert.match(source, /effectPresets/);
    assert.match(source, /applyEffectPreset/);
    assert.match(source, /dustGrain/);
    assert.match(source, /frosted/);
    assert.match(source, /effectControls/);
    assert.match(source, /updateEffectParam/);
});

test("PosterStudioApp renders the bottom editor tool dock without brush or eraser", () => {
    const source = readFileSync(path.join(componentRoot, "PosterStudioApp.vue"), "utf8");

    assert.match(source, /class="tool-dock"/);
    assert.match(source, /v-model="activeTool"/);
    assert.match(source, /mdi-auto-fix/);
    assert.match(source, /:active-tool="activeTool"/);
    assert.match(source, /activeTool === 'magicWand'/);
    assert.match(source, /selectHint/);
    assert.doesNotMatch(source, /mdi-eraser/);
    assert.doesNotMatch(source, /mdi-brush/);
    assert.doesNotMatch(source, /paintBrush/);
    assert.doesNotMatch(source, /pixelEraser/);
    assert.doesNotMatch(source, /brushSize/);
    assert.doesNotMatch(source, /eraserSize/);
});

test("PosterStudioApp gives Vuetify sliders visible dark theme contrast", () => {
    const source = readFileSync(path.join(componentRoot, "PosterStudioApp.vue"), "utf8");

    assert.match(source, /--poster-slider-track/);
    assert.match(source, /:global\(html\.dark \.poster-studio-app\)/);
    assert.match(source, /v-slider-track__fill/);
    assert.match(source, /v-slider-thumb__surface/);
});

test("PosterStudioApp wires blank layer and transparent background commands", () => {
    const source = readFileSync(path.join(componentRoot, "PosterStudioApp.vue"), "utf8");

    assert.match(source, /addBlankLayer/);
    assert.match(source, /addBlankImageLayer/);
    assert.match(source, /toggleTransparentBackground/);
    assert.match(source, /transparentBackground/);
});

test("PosterStudioApp declares starter layer config before the initial document", () => {
    const source = readFileSync(path.join(componentRoot, "PosterStudioApp.vue"), "utf8");
    const configIndex = source.indexOf("const starterLayerConfig");
    const documentIndex = source.indexOf('ref(createStarterDocument("mcmod"))');

    assert.notEqual(configIndex, -1);
    assert.notEqual(documentIndex, -1);
    assert.ok(configIndex < documentIndex);
});

test("content metadata components avoid deprecated Vuetify row gutters", () => {
    const contentRoot = path.resolve(
        import.meta.dirname,
        "../theme/components/content",
    );

    for (const file of ["ArticleMetadata.vue", "ResponsibleEditor.vue"]) {
        const source = readFileSync(path.join(contentRoot, file), "utf8");

        assert.doesNotMatch(source, /no-gutters/);
    }
});
