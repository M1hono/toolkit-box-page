/**
 * @fileoverview Arknights Data Consolidator
 * @description Merges and splits character data between global metadata and language-specific names
 * IMPORTANT: Only updates/merges data, never deletes existing entries
 */

const { 
    loadGlobalCharacters, 
    loadLanguageNames, 
    loadLanguageStorys,
    saveGlobalCharacters, 
    saveLanguageNames,
    saveLanguageStorys,
    saveLanguageSearchIndex
} = require('../api/characters-api.cjs');
const { loadScanState, saveScanState, updateCharacterScanStats } = require('../api/scan-stats-api.cjs');
const { getBaseCharacterId } = require('./story-parser.cjs');

function consolidateResults(results, langCode) {
    const globalChars = loadGlobalCharacters();
    const langNames = loadLanguageNames(langCode);
    const langStorys = loadLanguageStorys(langCode);
    const scanState = loadScanState();

    const isMasterSource = langCode === 'zh_CN';
    let newChars = 0;
    let updatedNames = 0;

    for (const [baseId, data] of results) {
        // Update global character metadata
        if (isMasterSource || !globalChars[baseId]) {
            if (!globalChars[baseId]) {
                globalChars[baseId] = {
                    charId: baseId,
                    validVariants: data.validVariants || [`${baseId}#1$1`],
                    charType: baseId.startsWith('char_') ? 'operator' : 'npc',
                    dialogCount: 0 
                };
                newChars++;
            } else {
                if (data.validVariants && data.validVariants.length > 0) {
                    const existingVariants = new Set(globalChars[baseId].validVariants);
                    data.validVariants.forEach(v => existingVariants.add(v));
                    globalChars[baseId].validVariants = Array.from(existingVariants).sort();
                }
            }
        }

        // Update scan stats if this is the master source
        if (isMasterSource) {
            updateCharacterScanStats(baseId, scanState, globalChars[baseId].validVariants.length);
        }

        // Update language-specific names
        if (!langNames[baseId] || (data.speakerNames && data.speakerNames.length > 0)) {
            const existingNames = langNames[baseId]?.speakerNames || [];
            const newNames = data.speakerNames || [];
            const mergedNames = Array.from(new Set([...existingNames, ...newNames])).filter(Boolean);
            
            langNames[baseId] = {
                speakerNames: mergedNames,
                searchNames: mergedNames,
                displayName: mergedNames[0] || langNames[baseId]?.displayName || baseId
            };
            updatedNames++;
        }

        // Update language-specific story mappings
        if (data.storyFiles && data.storyFiles.length > 0) {
            const existingStorys = langStorys[baseId] || [];
            langStorys[baseId] = Array.from(new Set([...existingStorys, ...data.storyFiles])).sort();
        }
    }

    // Generate search index: name -> charId (or array of charIds if duplicate names exist)
    const searchIndex = {};
    for (const [id, data] of Object.entries(langNames)) {
        const names = new Set();
        if (data.displayName) names.add(data.displayName);
        if (data.speakerNames) data.speakerNames.forEach(n => names.add(n));
        if (data.searchNames) data.searchNames.forEach(n => names.add(n));
        
        for (const name of names) {
            if (!name || name.trim() === "") continue;
            
            // Support multiple characters with the same name
            if (!searchIndex[name]) {
                searchIndex[name] = id;
            } else if (typeof searchIndex[name] === 'string') {
                // Convert single ID to array when duplicate found
                searchIndex[name] = [searchIndex[name], id];
            } else if (Array.isArray(searchIndex[name])) {
                // Add to existing array
                searchIndex[name].push(id);
            }
        }
    }

    saveGlobalCharacters(globalChars);
    saveLanguageNames(langCode, langNames);
    saveLanguageStorys(langCode, langStorys);
    saveLanguageSearchIndex(langCode, searchIndex);
    saveScanState(scanState);
    
    console.log(`Consolidation complete for ${langCode}`);
    console.log(`   Global: ${Object.keys(globalChars).length} total (${newChars} new)`);
    console.log(`   Names: ${Object.keys(langNames).length} total (${updatedNames} updated)`);
    console.log(`   Stories Mapped: ${Object.keys(langStorys).length} characters`);
    console.log(`   Search Index: ${Object.keys(searchIndex).length} terms`);
}

module.exports = {
    consolidateResults
};
