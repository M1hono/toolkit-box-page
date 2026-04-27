import assert from "node:assert/strict";
import test from "node:test";

import {
    filterPosterAssetsByKind,
    loadPosterAssetIndex,
} from "../utils/posterStudio/assets";

test("loadPosterAssetIndex loads assets through an injected fetcher", async () => {
    const index = await loadPosterAssetIndex(async () => {
        return new Response(
            JSON.stringify({
                schemaVersion: 1,
                assets: [
                    {
                        id: "icon-1",
                        name: "Icon",
                        kind: "icon",
                        mime: "image/png",
                        url: "/icon.png",
                        source: "built-in",
                        createdAt: 0,
                    },
                ],
            }),
        );
    });

    assert.equal(index.assets.length, 1);
    assert.equal(index.assets[0].id, "icon-1");
});

test("filterPosterAssetsByKind returns only matching assets", () => {
    const assets = [
        {
            id: "frame-1",
            name: "Frame",
            kind: "frame" as const,
            mime: "image/png",
            source: "built-in" as const,
            createdAt: 0,
        },
        {
            id: "icon-1",
            name: "Icon",
            kind: "icon" as const,
            mime: "image/png",
            source: "built-in" as const,
            createdAt: 0,
        },
    ];

    assert.deepEqual(
        filterPosterAssetsByKind(assets, "icon").map((asset) => asset.id),
        ["icon-1"],
    );
});
