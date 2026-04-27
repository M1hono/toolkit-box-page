import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const publicRoot = path.resolve(
    import.meta.dirname,
    "../../src/public/self/poster-studio",
);

test("poster studio built-in indexes exist", () => {
    assert.equal(existsSync(path.join(publicRoot, "indexes/assets.json")), true);
    assert.equal(existsSync(path.join(publicRoot, "indexes/templates.json")), true);
});

test("template index includes generic-frame and theme-clear-frame", () => {
    const index = JSON.parse(
        readFileSync(path.join(publicRoot, "indexes/templates.json"), "utf8"),
    );

    assert.deepEqual(
        index.templates.map((item: { id: string }) => item.id).sort(),
        ["generic-frame", "theme-clear-frame"],
    );
});

test("game icon index excludes non-icon root screenshots", () => {
    const index = JSON.parse(
        readFileSync(path.join(publicRoot, "indexes/assets.json"), "utf8"),
    ) as { assets: Array<{ kind: string; url?: string; width?: number; height?: number }> };

    const rootGameIconImages = index.assets.filter(
        (asset) =>
            asset.kind === "icon" &&
            /^\/self\/poster-studio\/assets\/game-icons\/[^/]+\.png$/.test(
                asset.url ?? "",
            ),
    );

    assert.deepEqual(rootGameIconImages, []);
});
