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
