import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { PosterAsset, PosterDocument, PosterTemplateManifest } from "./types";

export interface PosterInstalledTemplate {
    id: string;
    manifest: PosterTemplateManifest;
    files?: Record<string, Blob>;
    source: "built-in" | "import" | "catalog";
    installedAt: number;
}

export interface PosterAssetCollection {
    id: string;
    name: string;
    kind: string;
    assetIds: string[];
    sourcePath?: string;
    createdAt: number;
}

export interface PosterRecentItem {
    id: string;
    refId: string;
    refType: "asset" | "template" | "project";
    usedAt: number;
}

export interface PosterStudioStorage {
    putAsset(asset: PosterAsset): Promise<void>;
    getAsset(id: string): Promise<PosterAsset | undefined>;
    listAssets(): Promise<PosterAsset[]>;
    putProject(project: PosterDocument): Promise<void>;
    getProject(id: string): Promise<PosterDocument | undefined>;
    listProjects(): Promise<PosterDocument[]>;
    putTemplate(template: PosterInstalledTemplate): Promise<void>;
    listTemplates(): Promise<PosterInstalledTemplate[]>;
}

interface PosterStudioDB extends DBSchema {
    assets: {
        key: string;
        value: PosterAsset;
    };
    projects: {
        key: string;
        value: PosterDocument;
    };
    templates: {
        key: string;
        value: PosterInstalledTemplate;
    };
    assetCollections: {
        key: string;
        value: PosterAssetCollection;
    };
    recents: {
        key: string;
        value: PosterRecentItem;
    };
}

export function createMemoryPosterStudioStorage(): PosterStudioStorage {
    const assets = new Map<string, PosterAsset>();
    const projects = new Map<string, PosterDocument>();
    const templates = new Map<string, PosterInstalledTemplate>();

    return {
        async putAsset(asset) {
            assets.set(asset.id, cloneRecord(asset));
        },
        async getAsset(id) {
            return cloneOptional(assets.get(id));
        },
        async listAssets() {
            return cloneList([...assets.values()]);
        },
        async putProject(project) {
            projects.set(project.id, cloneRecord(project));
        },
        async getProject(id) {
            return cloneOptional(projects.get(id));
        },
        async listProjects() {
            return cloneList([...projects.values()]);
        },
        async putTemplate(template) {
            templates.set(template.id, cloneRecord(template));
        },
        async listTemplates() {
            return cloneList([...templates.values()]);
        },
    };
}

export async function createIndexedDbPosterStudioStorage(
    dbName = "posterStudioDB",
): Promise<PosterStudioStorage> {
    const db = await openDB<PosterStudioDB>(dbName, 1, {
        upgrade(database) {
            createStore(database, "assets");
            createStore(database, "projects");
            createStore(database, "templates");
            createStore(database, "assetCollections");
            createStore(database, "recents");
        },
    });

    return {
        async putAsset(asset) {
            await db.put("assets", asset, asset.id);
        },
        async getAsset(id) {
            return db.get("assets", id);
        },
        async listAssets() {
            return db.getAll("assets");
        },
        async putProject(project) {
            await db.put("projects", project, project.id);
        },
        async getProject(id) {
            return db.get("projects", id);
        },
        async listProjects() {
            return db.getAll("projects");
        },
        async putTemplate(template) {
            await db.put("templates", template, template.id);
        },
        async listTemplates() {
            return db.getAll("templates");
        },
    };
}

function createStore(
    database: IDBPDatabase<PosterStudioDB>,
    storeName: keyof PosterStudioDB,
): void {
    if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName);
    }
}

function cloneOptional<T>(value: T | undefined): T | undefined {
    return value === undefined ? undefined : cloneRecord(value);
}

function cloneList<T>(values: T[]): T[] {
    return values.map((value) => cloneRecord(value));
}

function cloneRecord<T>(value: T): T {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value)) as T;
}
