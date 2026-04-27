#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const docsRoot = path.resolve(__dirname, "../..");
const publicRoot = path.join(docsRoot, "src/public/self/poster-studio");
const downloadsRoot = path.join(os.homedir(), "Downloads");
const coverTemplateRoot = path.join(downloadsRoot, "封面模板");
const gameIconsRoot = path.join(downloadsRoot, "icons");
const fontsRoot = path.join(downloadsRoot, "字体");

const assetRoot = path.join(publicRoot, "assets");
const frameAssetRoot = path.join(assetRoot, "frames");
const gameIconAssetRoot = path.join(assetRoot, "game-icons");
const fontAssetRoot = path.join(assetRoot, "fonts");
const templateRoot = path.join(publicRoot, "templates");
const indexRoot = path.join(publicRoot, "indexes");

const assets = [];
const messages = [];

main();

function main() {
    ensureDir(frameAssetRoot);
    ensureDir(gameIconAssetRoot);
    ensureDir(fontAssetRoot);
    ensureDir(indexRoot);

    syncFrames();
    syncGameIcons();
    syncFonts();
    writeTemplateIndex();
    writeAssetIndex();

    for (const message of messages) {
        console.log(message);
    }
}

function syncFrames() {
    if (!fs.existsSync(coverTemplateRoot)) {
        messages.push(`missing optional frame root: ${coverTemplateRoot}`);
        return;
    }

    const frameMap = [
        {
            id: "generic-frame-curseforge",
            name: "Generic CurseForge Frame",
            file: "框.png",
            preset: "curseforge",
        },
        {
            id: "generic-frame-mcmod",
            name: "Generic MCMOD Frame",
            file: "框架mcmod.png",
            preset: "mcmod",
        },
    ];

    for (const frame of frameMap) {
        const source = path.join(coverTemplateRoot, frame.file);

        if (!fs.existsSync(source)) {
            messages.push(`missing frame source: ${source}`);
            continue;
        }

        const assetDest = path.join(frameAssetRoot, `${frame.preset}.png`);
        copyFile(source, assetDest);
        addAssetFromFile({
            id: frame.id,
            name: frame.name,
            kind: "frame",
            filePath: assetDest,
            url: toPublicUrl(assetDest),
            sourcePath: source,
        });

        copyFrameToTemplatePackage("generic-frame", frame.preset, source);
        copyFrameToTemplatePackage("theme-clear-frame", frame.preset, source);
    }
}

function syncGameIcons() {
    if (!fs.existsSync(gameIconsRoot)) {
        messages.push(`missing optional game-icons root: ${gameIconsRoot}`);
        return;
    }

    let copied = 0;

    for (const source of walkFiles(gameIconsRoot)) {
        if (path.extname(source).toLowerCase() !== ".png") {
            continue;
        }

        const relativePath = path.relative(gameIconsRoot, source);
        const dest = path.join(gameIconAssetRoot, relativePath);
        copyFile(source, dest);
        copied += 1;

        const id = `game-icons-${toAssetId(relativePath)}`;
        addAssetFromFile({
            id,
            name: path.basename(relativePath, ".png"),
            kind: "icon",
            filePath: dest,
            url: toPublicUrl(dest),
            sourcePath: source,
        });
    }

    messages.push(`synced game-icons png files: ${copied}`);
}

function syncFonts() {
    if (!fs.existsSync(fontsRoot)) {
        messages.push(`missing optional font root: ${fontsRoot}`);
        return;
    }

    let copied = 0;
    const fontExtensions = new Set([".ttf", ".otf", ".woff", ".woff2"]);

    for (const source of walkFiles(fontsRoot)) {
        if (!fontExtensions.has(path.extname(source).toLowerCase())) {
            continue;
        }

        const relativePath = path.relative(fontsRoot, source);
        const dest = path.join(fontAssetRoot, relativePath);
        copyFile(source, dest);
        copied += 1;

        assets.push({
            id: `font-${toAssetId(relativePath)}`,
            name: path.basename(relativePath),
            kind: "font",
            mime: fontMimeType(path.extname(source).toLowerCase()),
            url: toPublicUrl(dest),
            source: "built-in",
            sourcePath: source,
            createdAt: 0,
        });
    }

    messages.push(`synced font files: ${copied}`);
}

function writeTemplateIndex() {
    const templates = [];

    for (const templateDir of listDirectories(templateRoot)) {
        const manifestPath = path.join(templateDir, "template.json");

        if (!fs.existsSync(manifestPath)) {
            continue;
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        templates.push({
            id: manifest.id,
            name: manifest.name,
            sourcePreset: manifest.sourcePreset,
            manifestUrl: toPublicUrl(manifestPath),
            rootUrl: toPublicUrl(templateDir),
            sizes: manifest.sizes,
        });
    }

    templates.sort((a, b) => a.id.localeCompare(b.id));
    writeJson(path.join(indexRoot, "templates.json"), {
        schemaVersion: 1,
        generatedAt: new Date(0).toISOString(),
        templates,
    });
}

function writeAssetIndex() {
    assets.sort((a, b) => a.id.localeCompare(b.id));
    writeJson(path.join(indexRoot, "assets.json"), {
        schemaVersion: 1,
        generatedAt: new Date(0).toISOString(),
        assets,
    });
}

function copyFrameToTemplatePackage(templateId, preset, source) {
    const dest = path.join(templateRoot, templateId, "frames", `${preset}.png`);
    copyFile(source, dest);
}

function addAssetFromFile({ id, name, kind, filePath, url, sourcePath }) {
    const dimensions = readPngDimensions(filePath);

    assets.push({
        id,
        name,
        kind,
        mime: "image/png",
        width: dimensions?.width,
        height: dimensions?.height,
        url,
        source: "built-in",
        sourcePath,
        createdAt: 0,
    });
}

function readPngDimensions(filePath) {
    const header = Buffer.alloc(24);
    const fd = fs.openSync(filePath, "r");

    try {
        fs.readSync(fd, header, 0, 24, 0);
    } finally {
        fs.closeSync(fd);
    }

    if (header.toString("ascii", 1, 4) !== "PNG") {
        return undefined;
    }

    return {
        width: header.readUInt32BE(16),
        height: header.readUInt32BE(20),
    };
}

function walkFiles(root) {
    const result = [];

    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        const fullPath = path.join(root, entry.name);

        if (entry.isDirectory()) {
            result.push(...walkFiles(fullPath));
        } else if (entry.isFile()) {
            result.push(fullPath);
        }
    }

    return result;
}

function listDirectories(root) {
    if (!fs.existsSync(root)) {
        return [];
    }

    return fs
        .readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(root, entry.name));
}

function copyFile(source, dest) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(source, dest);
}

function writeJson(filePath, value) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(value, null, 4)}\n`);
    fs.renameSync(`${filePath}.tmp`, filePath);
}

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function toPublicUrl(filePath) {
    return `/${path.relative(path.join(docsRoot, "src/public"), filePath).split(path.sep).join("/")}`;
}

function toAssetId(value) {
    return value
        .replace(/\.[^.]+$/, "")
        .split(path.sep)
        .join("-")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function fontMimeType(extension) {
    switch (extension) {
        case ".otf":
            return "font/otf";
        case ".woff":
            return "font/woff";
        case ".woff2":
            return "font/woff2";
        default:
            return "font/ttf";
    }
}
