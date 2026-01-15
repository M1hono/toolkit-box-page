/**
 * @fileoverview Update Names.json Only
 * @description Safely updates names.json for all languages without modifying characters.json
 */

const fs = require('fs');
const path = require('path');
const PROJECT_CONFIG = require('../project-config.cjs');
const { getTargetStoryDir, getAllStoryFilesFromDir } = require('./core/story-extractor.cjs');
const { parseStory } = require('./core/story-parser.cjs');
const { loadGlobalCharacters, loadLanguageNames, saveLanguageNames } = require('./api/characters-api.cjs');

async function updateNamesForLanguage(langCode) {
    console.log(`\nUpdating names for ${langCode}...`);
    
    const globalChars = loadGlobalCharacters();
    const validCharIds = new Set(Object.keys(globalChars));
    
    console.log(`Found ${validCharIds.size} valid character IDs in global characters.json`);
    
    const storyDir = getTargetStoryDir(langCode);
    const storyFiles = getAllStoryFilesFromDir(storyDir);
    
    if (storyFiles.length === 0) {
        console.warn(`WARNING: No story files found for ${langCode}`);
        return;
    }
    
    console.log(`Parsing ${storyFiles.length} story files...`);
    
    const characterNames = {};
    
    for (const storyFile of storyFiles) {
        try {
            const fullPath = path.resolve(storyDir, storyFile);
            const content = fs.readFileSync(fullPath, 'utf8');
            const storyId = path.basename(storyFile, '.txt');
            const parsed = parseStory(content, storyId, langCode);
            
            for (const [charId, data] of parsed) {
                if (validCharIds.has(charId)) {
                    if (!characterNames[charId]) {
                        characterNames[charId] = {
                            speakerNames: new Set(),
                            displayName: data.speakerNames[0] || charId
                        };
                    }
                    data.speakerNames.forEach(name => characterNames[charId].speakerNames.add(name));
                }
            }
        } catch (error) {
            console.error(`Error parsing ${storyFile}:`, error.message);
        }
    }
    
    const existingNames = loadLanguageNames(langCode);
    
    const finalNames = {};
    for (const [charId, data] of Object.entries(characterNames)) {
        const speakerNames = Array.from(data.speakerNames);
        finalNames[charId] = {
            speakerNames,
            searchNames: speakerNames,
            displayName: data.displayName
        };
    }
    
    for (const charId of Object.keys(existingNames)) {
        if (validCharIds.has(charId) && !finalNames[charId]) {
            finalNames[charId] = existingNames[charId];
        }
    }
    
    console.log(`Extracted names for ${Object.keys(finalNames).length} characters (updated ${Object.keys(characterNames).length}, kept ${Object.keys(finalNames).length - Object.keys(characterNames).length} existing)`);
    
    saveLanguageNames(langCode, finalNames);
}

async function main() {
    const languages = ['zh_CN', 'en_US', 'ja_JP'];
    
    for (const lang of languages) {
        await updateNamesForLanguage(lang);
    }
    
    console.log('\nAll names.json files updated successfully!');
}

main().catch(console.error);
