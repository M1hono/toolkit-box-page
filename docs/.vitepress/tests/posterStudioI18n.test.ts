import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const componentRoot = path.resolve(
    import.meta.dirname,
    "../theme/components/Self/PosterStudio",
);

const expectedComponents = [
    {
        file: "PosterStudioApp.vue",
        id: "poster-studio-app",
        keys: ["title", "subtitle", "exportPng"],
    },
    {
        file: "PosterAssetPanel.vue",
        id: "poster-studio-asset-panel",
        keys: ["assets", "templates", "addToCanvas", "addToLibrary"],
    },
    {
        file: "PosterCanvas.vue",
        id: "poster-studio-canvas",
        keys: ["zoom"],
    },
    {
        file: "PosterLayerPanel.vue",
        id: "poster-studio-layer-panel",
        keys: ["layers"],
    },
    {
        file: "PosterPropertiesPanel.vue",
        id: "poster-studio-properties-panel",
        keys: ["properties", "noLayerSelected"],
    },
];

test("Poster Studio components use the project i18n system", () => {
    for (const component of expectedComponents) {
        const source = readFileSync(path.join(componentRoot, component.file), "utf8");

        assert.match(source, /useSafeI18n/);
        assert.match(source, new RegExp(`useSafeI18n\\("${component.id}"`));

        for (const key of component.keys) {
            assert.match(source, new RegExp(`${key}:\\s*"`));
        }
    }
});
