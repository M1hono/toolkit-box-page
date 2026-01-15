/**
 * @fileoverview Update Names.json Only
 * @description Safely updates names.json for all languages without modifying characters.json
 */

const fs = require('fs');
const path = require('path');
const PROJECT_CONFIG = require('../project-config.cjs');
const { getTargetStoryDir, getAllStoryFilesFromDir } = require('./core/story-extractor.cjs');
const { parseStory } = require('./core/story-parser.cjs');
const { 
    loadGlobalCharacters, 
    loadLanguageNames, 
    saveLanguageNames,
    saveLanguageStorys,
    saveLanguageSearchIndex,
    loadLanguageStorys
} = require('./api/characters-api.cjs');

async function updateNamesForLanguage(langCode) {
    console.log(`\nUpdating names for ${langCode}...`);
    
    const globalChars = loadGlobalCharacters();
    const validCharIds = new Set(Object.keys(globalChars));
    
    console.log(`Found ${validCharIds.size} valid character IDs in global characters.json`);
    
    const existingNames = loadLanguageNames(langCode);
    const characterStorys = loadLanguageStorys(langCode);
    
    const storyDir = getTargetStoryDir(langCode);
    const storyFiles = getAllStoryFilesFromDir(storyDir);
    
    let finalNames = { ...existingNames };
    let updatedFromStories = 0;
    
    if (storyFiles.length > 0) {
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
                        
                        // Also update story mappings
                        if (data.storyFiles && data.storyFiles.length > 0) {
                            const existing = characterStorys[charId] || [];
                            characterStorys[charId] = Array.from(new Set([...existing, ...data.storyFiles])).sort();
                        }
                    }
                }
            } catch (error) {
                console.error(`Error parsing ${storyFile}:`, error.message);
            }
        }
        
        // Merge story-extracted names with existing
        for (const [charId, data] of Object.entries(characterNames)) {
            const speakerNames = Array.from(data.speakerNames);
            finalNames[charId] = {
                speakerNames,
                searchNames: speakerNames,
                displayName: data.displayName
            };
            updatedFromStories++;
        }
        
        // Keep existing names for characters not found in stories
        for (const charId of Object.keys(existingNames)) {
            if (validCharIds.has(charId) && !finalNames[charId]) {
                finalNames[charId] = existingNames[charId];
            }
        }
        
        console.log(`Extracted names for ${Object.keys(finalNames).length} characters (${updatedFromStories} from stories, ${Object.keys(finalNames).length - updatedFromStories} kept)`);
    } else {
        console.warn(`WARNING: No story files found for ${langCode}, using existing names data`);
    }
    
    // Generate search index from final names
    const searchIndex = {};
    for (const [id, data] of Object.entries(finalNames)) {
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
    
    // Count duplicates in search index
    let duplicateCount = 0;
    for (const value of Object.values(searchIndex)) {
        if (Array.isArray(value)) duplicateCount++;
    }
    
    console.log(`Generated search index: ${Object.keys(searchIndex).length} terms (${duplicateCount} with duplicates)`);
    
    saveLanguageNames(langCode, finalNames);
    saveLanguageStorys(langCode, characterStorys);
    saveLanguageSearchIndex(langCode, searchIndex);
}

async function main() {
    const languages = ['zh_CN', 'en_US', 'ja_JP'];
    
    for (const lang of languages) {
        await updateNamesForLanguage(lang);
    }
    
    console.log('\nAll names.json files updated successfully!');
}

main().catch(console.error);
