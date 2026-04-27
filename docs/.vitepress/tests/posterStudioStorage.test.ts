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
        createdAt: 1,
        updatedAt: 1,
    });

    const projects = await storage.listProjects();
    assert.equal(projects.length, 1);
    assert.equal(projects[0].name, "Cover");
});
