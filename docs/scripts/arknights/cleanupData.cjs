/**
 * @fileoverview Arknights Data Cleanup Script
 * @description Lowercases all character IDs and applies specific mappings to existing data files
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../../src/public/data');
const LOGS_DIR = path.resolve(__dirname, '../../.vitepress/logs');
const GLOBAL_DIR = path.resolve(DATA_DIR, 'global/arknights');
const LANG_DIRS = [
    path.resolve(DATA_DIR, 'zh_cn/arknights'),
    path.resolve(DATA_DIR, 'en_us/arknights'),
    path.resolve(DATA_DIR, 'ja_jp/arknights')
];

const MAPPINGS = {
    "ill_amiya_normal": "char_002_amiya_1",
    "$ill_amiya_normal": "char_002_amiya_1",
    "char_2001_aya_1": "npc_2001_aya_1",
    "char_2001_aya_rock": "npc_2001_aya_rock"
};

const EXCLUDE_IDS = new Set([
    "char_1012_skadi2_1",
    "$ill_amiya_normal"
]);

function normalizeId(id) {
    if (!id) return id;
    let normalized = id.toLowerCase();
    


    const parts = normalized.split(/[#\$\.]/);
    let baseId = parts[0];
    

    if (baseId === "" && normalized.startsWith('$') && parts.length > 1) {
        baseId = '$' + parts[1];
    }

    if (MAPPINGS[baseId]) {
        normalized = normalized.replace(baseId, MAPPINGS[baseId]);
    }
    
    return normalized;
}

function processCharacters() {
    const filePath = path.resolve(GLOBAL_DIR, 'characters.json');
    if (!fs.existsSync(filePath)) return;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const newData = {};

    for (const [id, char] of Object.entries(data)) {
        const normalizedId = normalizeId(id);
        
        if (EXCLUDE_IDS.has(normalizedId)) {
            console.log(`Excluding character: ${normalizedId}`);
            continue;
        }

        const normalizedChar = {
            ...char,
            charId: normalizeId(char.charId),
            validVariants: (char.validVariants || []).map(v => normalizeId(v))
        };
        
        newData[normalizedId] = normalizedChar;
    }

    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
    console.log('Normalized characters.json');
}

function processNames() {
    for (const dir of LANG_DIRS) {
        const filePath = path.resolve(dir, 'names.json');
        if (!fs.existsSync(filePath)) continue;

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const newData = {};

        for (const [id, nameData] of Object.entries(data)) {
            const normalizedId = normalizeId(id);
            if (EXCLUDE_IDS.has(normalizedId)) continue;
            newData[normalizedId] = nameData;
        }

        fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
        console.log(`Normalized names.json in ${path.basename(path.dirname(dir))}`);
    }
}

function processStoryFiles() {
    const filePath = path.resolve(GLOBAL_DIR, 'story_files.json');
    if (!fs.existsSync(filePath)) return;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const newData = {};

    for (const [id, stories] of Object.entries(data)) {
        const normalizedId = normalizeId(id);
        if (EXCLUDE_IDS.has(normalizedId)) continue;
        
        if (newData[normalizedId]) {
            newData[normalizedId] = Array.from(new Set([...newData[normalizedId], ...stories]));
        } else {
            newData[normalizedId] = stories;
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
    console.log('Normalized story_files.json');
}

function processScanStats() {
    const filePath = path.resolve(GLOBAL_DIR, 'scan_stats.json');
    if (!fs.existsSync(filePath)) return;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const newData = {};

    for (const [id, stats] of Object.entries(data)) {
        const normalizedId = normalizeId(id);
        if (EXCLUDE_IDS.has(normalizedId)) continue;
        newData[normalizedId] = stats;
    }

    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
    console.log('Normalized scan_stats.json');
}

function processUploaded() {
    const filePath = path.resolve(LOGS_DIR, 'uploaded.json');
    if (!fs.existsSync(filePath)) return;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const newData = {};

    for (const [id, entry] of Object.entries(data)) {
        const normalizedId = normalizeId(id);
        if (EXCLUDE_IDS.has(normalizedId.split(/[#\$\.]/)[0])) continue;
        
        newData[normalizedId] = {
            ...entry,
            variant: entry.variant ? normalizeId(entry.variant) : undefined
        };
    }

    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
    console.log('Normalized uploaded.json');
}

function processFailures() {
    const filePath = path.resolve(LOGS_DIR, 'r2-sync-failures.json');
    if (!fs.existsSync(filePath)) return;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (data.downloadFailures) {
        data.downloadFailures = data.downloadFailures
            .map(f => ({
                ...f,
                variant: f.variant ? normalizeId(f.variant) : undefined,
                url: f.url ? f.url.toLowerCase() : f.url
            }))
            .filter(f => !EXCLUDE_IDS.has(f.variant));
    }
    
    if (data.uploadFailures) {
        data.uploadFailures = data.uploadFailures
            .map(f => ({
                ...f,
                key: f.key ? normalizeId(f.key) : f.key
            }))
            .filter(f => !EXCLUDE_IDS.has(f.key.split(/[#\$\.]/)[0]));
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Normalized r2-sync-failures.json');
}

function main() {
    processCharacters();
    processNames();
    processStoryFiles();
    processScanStats();
    processUploaded();
    processFailures();
    console.log('Cleanup complete!');
}

main();
