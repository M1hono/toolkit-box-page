# Mod Poster Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable `Self/PosterStudio` tool: a plain Vuetify image editor with template packages, built-in assets, user asset caching, Konva editing, PixiJS effect preview, and PNG export.

**Architecture:** Keep editor document state in TypeScript utilities under `.vitepress/utils/posterStudio`. Use Vuetify for UI panels, Konva for interactive canvas editing, IndexedDB for cached user assets/projects, and PixiJS/WebGL for initial image effect previews. Templates and assets are path-discoverable through generated indexes in `src/public/self/poster-studio`.

**Tech Stack:** VitePress, Vue 3, Vuetify, Konva, vue-konva, PixiJS, IndexedDB, Node test runner, TypeScript, existing VitePress component registry.

---

## File Structure

- Create `docs/src/<locale>/Self/PosterStudio.md`: page wrappers that mount `<PosterStudioApp />`.
- Modify `docs/src/<locale>/Self/index.md`: add links to Poster Studio.
- Modify `docs/.vitepress/utils/vitepress/componentRegistry/localToolkitComponents.ts`: register `PosterStudioApp`.
- Create `docs/.vitepress/theme/components/Self/PosterStudio/PosterStudioApp.vue`: main Vuetify workbench.
- Create `docs/.vitepress/theme/components/Self/PosterStudio/PosterAssetPanel.vue`: asset/template browser and import controls.
- Create `docs/.vitepress/theme/components/Self/PosterStudio/PosterCanvas.vue`: Konva stage wrapper.
- Create `docs/.vitepress/theme/components/Self/PosterStudio/PosterLayerPanel.vue`: layer list controls.
- Create `docs/.vitepress/theme/components/Self/PosterStudio/PosterPropertiesPanel.vue`: selected layer properties and effects.
- Create `docs/.vitepress/utils/posterStudio/types.ts`: canvas, layer, asset, template, and effect types.
- Create `docs/.vitepress/utils/posterStudio/document.ts`: document creation, layer mutation, serialization helpers.
- Create `docs/.vitepress/utils/posterStudio/templates.ts`: manifest validation and template-to-document generation.
- Create `docs/.vitepress/utils/posterStudio/assets.ts`: asset index loading helpers.
- Create `docs/.vitepress/utils/posterStudio/storage.ts`: IndexedDB storage adapter and memory adapter.
- Create `docs/.vitepress/utils/posterStudio/effects.ts`: effect definitions, validation, procedural texture helpers.
- Create `docs/.vitepress/utils/posterStudio/export.ts`: offscreen export orchestration.
- Create `docs/.vitepress/utils/posterStudio/index.ts`: public exports.
- Create `docs/.vitepress/tests/posterStudio*.test.ts`: Node tests for document, template, asset, storage, effects, and export helpers.
- Create `docs/scripts/poster-studio/sync-assets.cjs`: copies known local assets into public and writes indexes.
- Create `docs/src/public/self/poster-studio/templates/generic-frame/template.json`.
- Create `docs/src/public/self/poster-studio/templates/theme-clear-frame/template.json`.
- Create generated indexes under `docs/src/public/self/poster-studio/indexes/`.
- Modify `docs/package.json`: add dependencies and scripts.
- Modify `.gitignore`: ignore `.superpowers/` visual companion files.

## Task 1: Route And Component Registration

**Files:**
- Create: `docs/src/en-US/Self/PosterStudio.md`
- Create: `docs/src/zh-CN/Self/PosterStudio.md`
- Create: `docs/src/ja-JP/Self/PosterStudio.md`
- Modify: `docs/src/en-US/Self/index.md`
- Modify: `docs/src/zh-CN/Self/index.md`
- Modify: `docs/src/ja-JP/Self/index.md`
- Modify: `docs/.vitepress/utils/vitepress/componentRegistry/localToolkitComponents.ts`
- Create: `docs/.vitepress/theme/components/Self/PosterStudio/PosterStudioApp.vue`
- Test: `docs/.vitepress/tests/posterStudioRoute.test.ts`

- [ ] **Step 1: Write the failing route/component test**

```ts
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("PosterStudio pages exist for every supported locale", () => {
    for (const locale of ["en-US", "zh-CN", "ja-JP"]) {
        const pagePath = path.join(repoRoot, "src", locale, "Self", "PosterStudio.md");
        assert.equal(existsSync(pagePath), true);
        assert.match(readFileSync(pagePath, "utf8"), /<PosterStudioApp \/>/);
    }
});

test("Self index pages link to PosterStudio", () => {
    for (const locale of ["en-US", "zh-CN", "ja-JP"]) {
        const indexPath = path.join(repoRoot, "src", locale, "Self", "index.md");
        assert.match(readFileSync(indexPath, "utf8"), /\.\.\/Self\/PosterStudio|\.\/PosterStudio\.md|\.\/PosterStudio/);
    }
});

test("PosterStudioApp is registered as a local toolkit component", () => {
    const registry = readFileSync(
        path.join(repoRoot, ".vitepress/utils/vitepress/componentRegistry/localToolkitComponents.ts"),
        "utf8",
    );
    assert.match(registry, /const PosterStudioApp = defineAsyncComponent/);
    assert.match(registry, /PosterStudioApp,/);
});
```

- [ ] **Step 2: Run route/component test to verify it fails**

Run: `./node_modules/.bin/tsx --test .vitepress/tests/posterStudioRoute.test.ts`

Expected: FAIL because `PosterStudio.md` and `PosterStudioApp` are not present.

- [ ] **Step 3: Add the three markdown pages**

Each page should use the same shape, translated title only:

```md
---
sidebar: false
---

# Mod Poster Studio

<ClientOnly>
  <PosterStudioApp />
</ClientOnly>
```

Use `# 模组封面工作台` for zh-CN and `# Mod Poster Studio` for ja-JP unless better localized copy is added.

- [ ] **Step 4: Add links from Self index pages**

Add a `## 工具` / `## Tools` / `## ツール` entry:

```md
### Mod Poster Studio
Plain image editor and mod poster template workspace.

[Open Mod Poster Studio](./PosterStudio.md)
```

- [ ] **Step 5: Create the placeholder app component**

```vue
<template>
    <v-app class="poster-studio-app">
        <v-main>
            <v-container fluid class="pa-0 ma-0" style="max-width: 100%">
                <v-row class="mb-6 mx-0">
                    <v-col cols="12" class="px-6">
                        <div class="text-h3 font-weight-bold mb-2 app-title">
                            Mod Poster Studio
                        </div>
                        <v-divider class="theme-divider" />
                    </v-col>
                </v-row>
                <v-row class="mx-0">
                    <v-col cols="12" class="px-6">
                        <v-card>
                            <v-card-title>Workbench</v-card-title>
                            <v-card-text>
                                Poster editor shell is initializing.
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<style scoped>
.poster-studio-app {
    min-height: 100vh;
    background: var(--vp-c-bg);
}

.app-title {
    color: var(--vp-c-text-1);
}

.theme-divider {
    border-color: var(--vp-c-divider) !important;
}

:deep(.v-card),
:deep(.v-btn),
:deep(.v-field) {
    border-radius: 4px !important;
    box-shadow: none !important;
}

:deep(.v-card) {
    border: 1px solid var(--vp-c-divider);
}
</style>
```

- [ ] **Step 6: Register the component**

Add to `localToolkitComponents.ts`:

```ts
const PosterStudioApp = defineAsyncComponent(
    () => import("@components/Self/PosterStudio/PosterStudioApp.vue"),
);
```

Add `PosterStudioApp` to the exported `components` object.

- [ ] **Step 7: Run route/component test to verify it passes**

Run: `./node_modules/.bin/tsx --test .vitepress/tests/posterStudioRoute.test.ts`

Expected: PASS.

## Task 2: Poster Studio Types And Document Model

**Files:**
- Create: `docs/.vitepress/utils/posterStudio/types.ts`
- Create: `docs/.vitepress/utils/posterStudio/document.ts`
- Create: `docs/.vitepress/utils/posterStudio/index.ts`
- Test: `docs/.vitepress/tests/posterStudioDocument.test.ts`

- [ ] **Step 1: Write the failing document model tests**

```ts
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
```

- [ ] **Step 2: Run document tests to verify they fail**

Run: `./node_modules/.bin/tsx --test .vitepress/tests/posterStudioDocument.test.ts`

Expected: FAIL because `posterStudio/document` does not exist.

- [ ] **Step 3: Create shared types**

Implement unions for `PosterLayer`, `PosterDocument`, `PosterCanvasPreset`, `PosterEffect`, `PosterAsset`, and `PosterTemplateManifest`. Required presets are `curseforge` and `mcmod`.

- [ ] **Step 4: Implement immutable document helpers**

Implement:

```ts
export function createPosterDocument(preset: PosterCanvasPreset): PosterDocument
export function addImageLayer(doc: PosterDocument, input: AddImageLayerInput): PosterDocument
export function addTextLayer(doc: PosterDocument, input: AddTextLayerInput): PosterDocument
export function updateLayer(doc: PosterDocument, id: string, patch: Partial<PosterLayer>): PosterDocument
export function moveLayer(doc: PosterDocument, id: string, targetIndex: number): PosterDocument
```

Use `crypto.randomUUID()` when available, with a deterministic fallback based on timestamp and counter.

- [ ] **Step 5: Export the module**

`index.ts` should export from `types`, `document`, `templates`, `assets`, `storage`, `effects`, and `export` as those files are added. Initially export `types` and `document`.

- [ ] **Step 6: Run document tests to verify they pass**

Run: `./node_modules/.bin/tsx --test .vitepress/tests/posterStudioDocument.test.ts`

Expected: PASS.

## Task 3: Template Manifest Validation And Template Documents

**Files:**
- Create: `docs/.vitepress/utils/posterStudio/templates.ts`
- Test: `docs/.vitepress/tests/posterStudioTemplates.test.ts`

- [ ] **Step 1: Write failing template tests**

```ts
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
    parameters: [
        { id: "frameTint", type: "color", default: "#8a5a1f" },
    ],
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
    const doc = createDocumentFromTemplate(manifest, "mcmod", "/self/poster-studio/templates/theme-clear-frame/");
    assert.equal(doc.canvas.width, 720);
    assert.equal(doc.layers.some((layer) => layer.name === "Frame"), true);
    assert.equal(doc.templateId, "theme-clear-frame");
});
```

- [ ] **Step 2: Run template tests to verify they fail**

Run: `./node_modules/.bin/tsx --test .vitepress/tests/posterStudioTemplates.test.ts`

Expected: FAIL because `templates.ts` does not exist.

- [ ] **Step 3: Implement validation**

Validation must require:

- `schemaVersion === 1`
- non-empty `id`, `name`, `kind`
- `kind === "poster-template"`
- `sizes.curseforge` with `400x400` and frame path
- `sizes.mcmod` with `720x450` and frame path
- unique slot ids
- unique parameter ids

- [ ] **Step 4: Implement template document creation**

`createDocumentFromTemplate(manifest, size, basePath)` should:

- Create a document using the selected preset.
- Set `templateId`.
- Add a background placeholder layer if the manifest has a background slot.
- Add the frame as an image layer named `Frame`, locked by default.
- Add `centerIcon` as an image layer if a default exists.
- Store template parameters on the document.

- [ ] **Step 5: Run template tests to verify they pass**

Run: `./node_modules/.bin/tsx --test .vitepress/tests/posterStudioTemplates.test.ts`

Expected: PASS.

## Task 4: Asset Index Script And Built-In Manifests

**Files:**
- Create: `docs/scripts/poster-studio/sync-assets.cjs`
- Create: `docs/src/public/self/poster-studio/templates/generic-frame/template.json`
- Create: `docs/src/public/self/poster-studio/templates/theme-clear-frame/template.json`
- Create: `docs/.vitepress/tests/posterStudioAssetIndex.test.ts`
- Modify: `docs/package.json`

- [ ] **Step 1: Write failing asset index test**

```ts
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const publicRoot = path.resolve(import.meta.dirname, "../../src/public/self/poster-studio");

test("poster studio built-in indexes exist", () => {
    assert.equal(existsSync(path.join(publicRoot, "indexes/assets.json")), true);
    assert.equal(existsSync(path.join(publicRoot, "indexes/templates.json")), true);
});

test("template index includes generic-frame and theme-clear-frame", () => {
    const index = JSON.parse(readFileSync(path.join(publicRoot, "indexes/templates.json"), "utf8"));
    assert.deepEqual(
        index.templates.map((item: { id: string }) => item.id).sort(),
        ["generic-frame", "theme-clear-frame"],
    );
});
```

- [ ] **Step 2: Run asset index test to verify it fails**

Run: `./node_modules/.bin/tsx --test .vitepress/tests/posterStudioAssetIndex.test.ts`

Expected: FAIL because the indexes do not exist.

- [ ] **Step 3: Add sync script**

The script should:

- Resolve `~/Downloads/封面模板`, `~/Downloads/icons`, and `~/Downloads/字体`.
- Create `src/public/self/poster-studio/assets/frames`.
- Create `src/public/self/poster-studio/assets/game-icons`.
- Create `src/public/self/poster-studio/assets/fonts`.
- Copy frame PNGs when present.
- Copy game-icons PNGs when present, preserving relative paths.
- Copy fonts from `Downloads/字体` if present.
- Write `indexes/assets.json` with id, name, kind, url, width/height when detectable from `file` output or PNG header helper.
- Write `indexes/templates.json` from template manifests.
- Log missing optional roots without throwing.

- [ ] **Step 4: Add template manifests**

`generic-frame/template.json` uses `frames/curseforge.png` and `frames/mcmod.png`.

`theme-clear-frame/template.json` uses `frames/curseforge.png`, `frames/mcmod.png`, and optional `slots/center-icon.png`.

- [ ] **Step 5: Add package script**

Add:

```json
"assets:poster": "node scripts/poster-studio/sync-assets.cjs"
```

- [ ] **Step 6: Run asset sync**

Run: `yarn assets:poster`

Expected: copies available assets, writes indexes, logs missing `Downloads/字体` if absent.

- [ ] **Step 7: Run asset index test to verify it passes**

Run: `./node_modules/.bin/tsx --test .vitepress/tests/posterStudioAssetIndex.test.ts`

Expected: PASS.

## Task 5: IndexedDB And Memory Storage Adapters

**Files:**
- Create: `docs/.vitepress/utils/posterStudio/storage.ts`
- Test: `docs/.vitepress/tests/posterStudioStorage.test.ts`
- Modify: `docs/package.json`

- [ ] **Step 1: Write failing storage tests using the memory adapter**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { createMemoryPosterStudioStorage } from "../utils/posterStudio/storage";

test("memory storage stores and retrieves assets", async () => {
    const storage = createMemoryPosterStudioStorage();
    await storage.putAsset({
        id: "asset-1",
        name: "Icon",
        kind: "image",
        mime: "image/png",
        width: 64,
        height: 64,
        source: "import",
        createdAt: 1,
    });
    const asset = await storage.getAsset("asset-1");
    assert.equal(asset?.name, "Icon");
});

test("memory storage stores projects", async () => {
    const storage = createMemoryPosterStudioStorage();
    await storage.putProject({
        id: "project-1",
        name: "Cover",
        canvas: { width: 400, height: 400, preset: "curseforge" },
        layers: [],
        updatedAt: 1,
    });
    const projects = await storage.listProjects();
    assert.equal(projects.length, 1);
    assert.equal(projects[0].name, "Cover");
});
```

- [ ] **Step 2: Run storage tests to verify they fail**

Run: `./node_modules/.bin/tsx --test .vitepress/tests/posterStudioStorage.test.ts`

Expected: FAIL because `storage.ts` does not exist.

- [ ] **Step 3: Add storage interfaces and memory adapter**

Implement `PosterStudioStorage` with:

```ts
putAsset(asset)
getAsset(id)
listAssets()
putProject(project)
getProject(id)
listProjects()
putTemplate(template)
listTemplates()
```

- [ ] **Step 4: Add browser IndexedDB adapter**

Use `idb` when installed. Export `createIndexedDbPosterStudioStorage()` that opens `posterStudioDB` with object stores `assets`, `projects`, `templates`, `assetCollections`, and `recents`.

- [ ] **Step 5: Add dependencies**

Run: `yarn add idb`

If sandbox blocks network, rerun with escalation.

- [ ] **Step 6: Run storage tests to verify they pass**

Run: `./node_modules/.bin/tsx --test .vitepress/tests/posterStudioStorage.test.ts`

Expected: PASS.

## Task 6: Effects Registry And Procedural Dust

**Files:**
- Create: `docs/.vitepress/utils/posterStudio/effects.ts`
- Test: `docs/.vitepress/tests/posterStudioEffects.test.ts`

- [ ] **Step 1: Write failing effect tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
    createDefaultEffectStack,
    createDustGrainPoints,
    validateEffectStack,
} from "../utils/posterStudio/effects";

test("default effect stack contains adjust and dustGrain", () => {
    const stack = createDefaultEffectStack();
    assert.equal(stack[0].id, "adjust");
    assert.equal(stack.some((effect) => effect.id === "dustGrain"), true);
});

test("dust grain points are deterministic by seed", () => {
    const a = createDustGrainPoints({ seed: 42, density: 0.1, width: 100, height: 100 });
    const b = createDustGrainPoints({ seed: 42, density: 0.1, width: 100, height: 100 });
    assert.deepEqual(a.slice(0, 5), b.slice(0, 5));
});

test("validateEffectStack rejects unknown effects", () => {
    const result = validateEffectStack([{ id: "unknown", params: {} }]);
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /unknown/);
});
```

- [ ] **Step 2: Run effect tests to verify they fail**

Run: `./node_modules/.bin/tsx --test .vitepress/tests/posterStudioEffects.test.ts`

Expected: FAIL because `effects.ts` does not exist.

- [ ] **Step 3: Implement effect registry**

Include definitions for `adjust`, `blur`, `pixelate`, `noise`, `dustGrain`, `frostedGlass`, `vignette`, `glow`, and `duotone`.

- [ ] **Step 4: Implement deterministic dust point generation**

Use a small seeded PRNG. Point count should be `Math.round(width * height * density / 100)`, with `x`, `y`, `radius`, and `alpha`.

- [ ] **Step 5: Run effect tests to verify they pass**

Run: `./node_modules/.bin/tsx --test .vitepress/tests/posterStudioEffects.test.ts`

Expected: PASS.

## Task 7: Vuetify Workbench Shell

**Files:**
- Modify: `docs/.vitepress/theme/components/Self/PosterStudio/PosterStudioApp.vue`
- Create: `docs/.vitepress/theme/components/Self/PosterStudio/PosterAssetPanel.vue`
- Create: `docs/.vitepress/theme/components/Self/PosterStudio/PosterLayerPanel.vue`
- Create: `docs/.vitepress/theme/components/Self/PosterStudio/PosterPropertiesPanel.vue`

- [ ] **Step 1: Replace placeholder with three-column workbench shell**

Use Vuetify cards and simple CSS grid:

```vue
<div class="poster-workbench">
    <PosterAssetPanel />
    <div class="poster-stage-panel">
        <v-card class="fill-height">
            <v-card-title>Canvas</v-card-title>
            <v-card-text class="stage-body">
                <PosterCanvas />
            </v-card-text>
        </v-card>
    </div>
    <div class="poster-side-panel">
        <PosterLayerPanel />
        <PosterPropertiesPanel />
    </div>
</div>
```

- [ ] **Step 2: Add plain workbench CSS**

Use no gradients and no decorative shadows:

```css
.poster-workbench {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr) 320px;
    gap: 16px;
    padding: 0 24px 24px;
    min-height: calc(100vh - 148px);
}

:deep(.v-card),
:deep(.v-btn),
:deep(.v-field),
:deep(.v-chip) {
    border-radius: 4px !important;
    box-shadow: none !important;
}

:deep(.v-card) {
    border: 1px solid var(--vp-c-divider);
}
```

- [ ] **Step 3: Add responsive behavior**

At `max-width: 1100px`, collapse to one column with tabs or stacked panels. Keep text inside controls readable and avoid overlapping fixed panels.

- [ ] **Step 4: Run VitePress build smoke check**

Run: `yarn build`

Expected: build succeeds.

## Task 8: Konva Canvas Integration

**Files:**
- Create: `docs/.vitepress/theme/components/Self/PosterStudio/PosterCanvas.vue`
- Modify: `docs/package.json`

- [ ] **Step 1: Install canvas dependencies**

Run: `yarn add konva vue-konva`

If sandbox blocks network, rerun with escalation.

- [ ] **Step 2: Register vue-konva if required**

If `vue-konva` requires plugin registration, add it in `enhanceThemeApp.ts` after verifying the official Vue usage. Otherwise import components locally.

- [ ] **Step 3: Implement PosterCanvas with a sample document**

Create a Konva stage that reads a `PosterDocument`, renders image/text layers, and provides a Transformer for the selected layer.

- [ ] **Step 4: Wire selection and transform events**

On transform end, call `updateLayer` with `x`, `y`, `scaleX`, `scaleY`, and `rotation`.

- [ ] **Step 5: Run build smoke check**

Run: `yarn build`

Expected: build succeeds.

## Task 9: Asset Panel And Import Flow

**Files:**
- Modify: `docs/.vitepress/theme/components/Self/PosterStudio/PosterAssetPanel.vue`
- Modify: `docs/.vitepress/theme/components/Self/PosterStudio/PosterStudioApp.vue`
- Modify: `docs/.vitepress/utils/posterStudio/assets.ts`

- [ ] **Step 1: Load built-in asset indexes**

Implement `loadPosterAssetIndex()` that fetches `/self/poster-studio/indexes/assets.json`.

- [ ] **Step 2: Render asset categories**

Asset panel tabs: Templates, Frames, Game Icons, Imported, Fonts, Local Catalog.

- [ ] **Step 3: Add import controls**

Use `<v-file-input>` or hidden file input to import images. Provide two actions:

- `Add to Canvas`
- `Add to Library`

- [ ] **Step 4: Store imported library assets**

Use `createIndexedDbPosterStudioStorage()` in browser mode. Save blob, dimensions, name, mime, and source.

- [ ] **Step 5: Add imported image as layer**

When adding to canvas, create an object URL, create an image layer with dimensions, and add it via `addImageLayer`.

## Task 10: PixiJS Effect Preview And Export Pipeline

**Files:**
- Create: `docs/.vitepress/utils/posterStudio/effectRenderers.ts`
- Create: `docs/.vitepress/utils/posterStudio/export.ts`
- Modify: `docs/package.json`

- [ ] **Step 1: Install PixiJS**

Run: `yarn add pixi.js`

If sandbox blocks network, rerun with escalation.

- [ ] **Step 2: Implement PixiJS preview renderer**

Start with `adjust`, `blur`, `noise`, and `dustGrain`. The renderer should accept an image/canvas source and effect stack, then return a canvas or data URL.

- [ ] **Step 3: Implement export compositor**

`exportPosterDocument(document, assets, options)` should:

- Create an offscreen canvas at export dimensions.
- Render background and normal layers in order.
- For image layers with effects, render through the effect renderer before drawing.
- Draw frame overlays last when the layer order requires it.
- Return `Blob` or data URL.

- [ ] **Step 4: Add export smoke test for deterministic tiny canvas**

Test a small document with a text or shape layer and verify a non-empty data URL/blob is returned. Keep this test free of browser-only globals unless a test polyfill is added.

## Task 11: Final Verification

**Files:**
- All touched files.

- [ ] **Step 1: Run focused poster studio tests**

Run:

```bash
./node_modules/.bin/tsx --test \
  .vitepress/tests/posterStudioRoute.test.ts \
  .vitepress/tests/posterStudioDocument.test.ts \
  .vitepress/tests/posterStudioTemplates.test.ts \
  .vitepress/tests/posterStudioAssetIndex.test.ts \
  .vitepress/tests/posterStudioStorage.test.ts \
  .vitepress/tests/posterStudioEffects.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run existing test suite**

Run the same Node test command currently used for all `.vitepress/**/*.test.ts` files, or enumerate the test files as in prior verification.

Expected: all tests pass.

- [ ] **Step 3: Run build**

Run: `yarn build`

Expected: build succeeds. Existing chunk-size or Three.js dynamic import warnings are acceptable if unchanged.

- [ ] **Step 4: Start dev server**

Run: `yarn dev --host 127.0.0.1`

Open `/zh-CN/Self/PosterStudio`, `/en-US/Self/PosterStudio`, and `/ja-JP/Self/PosterStudio`.

Expected: page renders, workbench has no overlapping text, and default canvas is visible.

- [ ] **Step 5: Manual smoke**

In the browser:

- Create 400x400 from `generic-frame`.
- Create 720x450 from `theme-clear-frame`.
- Import a PNG directly to the canvas.
- Import the same PNG into the library and reuse it.
- Add dust/grain effect and export PNG.

Expected: exported PNG dimensions match the selected preset and visible effects match preview closely.

