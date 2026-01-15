const fs = require('fs');
const path = require('path');

/**
 * Migrate char_002_amiya_2 back to char_002_amiya_1
 * Correct direction: amiya_2 → amiya_1 (not the reverse)
 */

function loadExcludeRules(langCode) {
    const langMap = { 'zh_cn': 'zh-CN', 'en_us': 'en-US', 'ja_jp': 'ja' };
    const configLang = langMap[langCode] || langCode;
    const excludePath = path.resolve(__dirname, `../../.vitepress/config/locale/${configLang}/arknights-search-exclude.json`);
    if (fs.existsSync(excludePath)) {
        return JSON.parse(fs.readFileSync(excludePath, 'utf8'));
    }
    return {};
}

console.log('\n🔄 Migrating Amiya back to char_002_amiya_1...\n');

// Update characters.json
const charsPath = path.resolve(__dirname, '../../src/public/data/global/arknights/characters.json');
const chars = JSON.parse(fs.readFileSync(charsPath, 'utf8'));

if (chars['char_002_amiya_2']) {
    console.log('📦 Combining char_002_amiya_2 → char_002_amiya_1 in characters.json');
    
    // Generate all 11 variants for char_002_amiya_1
    const amiya1Variants = [];
    for (let i = 1; i <= 11; i++) {
        amiya1Variants.push(`char_002_amiya_1#${i}$1`);
    }
    
    chars['char_002_amiya_1'] = {
        charId: 'char_002_amiya_1',
        validVariants: amiya1Variants.sort(),
        charType: 'operator',
        dialogCount: 0
    };
    
    delete chars['char_002_amiya_2'];
    console.log(`  ✅ Created char_002_amiya_1 with ${amiya1Variants.length} variants`);
    console.log('  ✅ Deleted char_002_amiya_2');
    
    fs.writeFileSync(charsPath, JSON.stringify(chars, null, 2), 'utf8');
}

// Update names.json for all languages
const languages = ['zh_cn', 'en_us', 'ja_jp'];

for (const lang of languages) {
    const namesPath = path.resolve(__dirname, `../../src/public/data/${lang}/arknights/names.json`);
    if (!fs.existsSync(namesPath)) continue;
    
    const names = JSON.parse(fs.readFileSync(namesPath, 'utf8'));
    const excludeRules = loadExcludeRules(lang);
    let updated = false;
    
    // Clean up speakerNames based on exclude rules
    // If charId is excluded from a name's search, remove that name from the character's speakerNames
    for (const [name, excludedCharIds] of Object.entries(excludeRules)) {
        for (const charId of excludedCharIds) {
            if (names[charId] && names[charId].speakerNames) {
                const before = names[charId].speakerNames.length;
                names[charId].speakerNames = names[charId].speakerNames.filter(n => n !== name);
                names[charId].searchNames = names[charId].speakerNames;
                
                if (names[charId].speakerNames.length < before) {
                    console.log(`  Removed "${name}" from ${charId} speakerNames`);
                    updated = true;
                }
            }
        }
    }
    
    if (names['char_002_amiya_2']) {
        console.log(`\n📝 Migrating ${lang}/names.json`);
        
        // Merge amiya_2 into amiya_1
        if (!names['char_002_amiya_1']) {
            names['char_002_amiya_1'] = names['char_002_amiya_2'];
        } else {
            const combined = new Set([
                ...(names['char_002_amiya_1'].speakerNames || []),
                ...(names['char_002_amiya_2'].speakerNames || [])
            ]);
            names['char_002_amiya_1'].speakerNames = Array.from(combined);
            names['char_002_amiya_1'].searchNames = names['char_002_amiya_1'].speakerNames;
        }
        
        delete names['char_002_amiya_2'];
        console.log('  ✅ Deleted char_002_amiya_2');
        updated = true;
    }
    
    if (updated) {
        fs.writeFileSync(namesPath, JSON.stringify(names, null, 2), 'utf8');
        console.log(`  ✅ Updated ${lang}/names.json`);
    }
}

// Update storys.json for all languages
for (const lang of languages) {
    const storysPath = path.resolve(__dirname, `../../src/public/data/${lang}/arknights/storys.json`);
    if (!fs.existsSync(storysPath)) continue;
    
    const storys = JSON.parse(fs.readFileSync(storysPath, 'utf8'));
    let updated = false;
    
    if (storys['char_002_amiya_2']) {
        console.log(`\n📖 Migrating ${lang}/storys.json`);
        
        // Merge into amiya_1
        if (!storys['char_002_amiya_1']) {
            storys['char_002_amiya_1'] = storys['char_002_amiya_2'];
        } else {
            const combined = new Set([
                ...storys['char_002_amiya_1'],
                ...storys['char_002_amiya_2']
            ]);
            storys['char_002_amiya_1'] = Array.from(combined).sort();
        }
        
        delete storys['char_002_amiya_2'];
        console.log('  ✅ Deleted char_002_amiya_2');
        updated = true;
    }
    
    if (updated) {
        fs.writeFileSync(storysPath, JSON.stringify(storys, null, 2), 'utf8');
    }
}

console.log('\n✅ Migration Complete!\n');
