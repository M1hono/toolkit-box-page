import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("PosterStudio pages exist for every supported locale", () => {
    for (const locale of ["en-US", "zh-CN", "ja-JP"]) {
        const pagePath = path.join(repoRoot, "src", locale, "Self", "PosterStudio.md");
        const source = readFileSync(pagePath, "utf8");

        assert.equal(existsSync(pagePath), true);
        assert.match(source, /<PosterStudioApp \/>/);
        assert.match(source, /buttons: false/);
        assert.doesNotMatch(source, /^#\s/m);
    }
});

test("Self index pages link to PosterStudio", () => {
    for (const locale of ["en-US", "zh-CN", "ja-JP"]) {
        const indexPath = path.join(repoRoot, "src", locale, "Self", "index.md");

        assert.match(
            readFileSync(indexPath, "utf8"),
            /\.\/PosterStudio\.md|\.\/PosterStudio/,
        );
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

test("PickAID keeps PosterStudioApp as a component tag", () => {
    const settings = JSON.parse(
        readFileSync(path.join(repoRoot, ".pickAIDExtension/settings.json"), "utf8"),
    ) as { componentTagWhitelist?: string[] };

    assert.equal(settings.componentTagWhitelist?.includes("PosterStudioApp"), true);
});
