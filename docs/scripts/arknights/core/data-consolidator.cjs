/**
 * @fileoverview Arknights Data Consolidator
 * @description Merges and splits character data between global metadata and language-specific names
 * IMPORTANT: Only updates/merges data, never deletes existing entries
 */

const { loadGlobalCharacters, loadLanguageNames, saveGlobalCharacters, saveLanguageNames } = require('../api/characters-api.cjs');
const { loadScanState, saveScanState, updateCharacterScanStats } = require('../api/scan-stats-api.cjs');
const { getBaseCharacterId } = require('./story-parser.cjs');

function consolidateResults(results, langCode) {
    const globalChars = loadGlobalCharacters();
    const langNames = loadLanguageNames(langCode);
    const scanState = loadScanState();

    const isMasterSource = langCode === 'zh_CN';
    let newChars = 0;
    let updatedNames = 0;

    for (const [baseId, data] of results) {
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

        if (isMasterSource) {
            updateCharacterScanStats(baseId, scanState, globalChars[baseId].validVariants.length);
        }

        if (!langNames[baseId] || data.speakerNames.length > 0) {
            langNames[baseId] = {
                speakerNames: data.speakerNames,
                searchNames: data.speakerNames,
                displayName: data.speakerNames[0] || baseId
            };
            updatedNames++;
        }
    }

    saveGlobalCharacters(globalChars);
    saveLanguageNames(langCode, langNames);
    saveScanState(scanState);
    
    console.log(`Consolidation complete for ${langCode}`);
    console.log(`   Global: ${Object.keys(globalChars).length} total (${newChars} new)`);
    console.log(`   Names: ${Object.keys(langNames).length} total (${updatedNames} updated)`);
}

module.exports = {
    consolidateResults
};
