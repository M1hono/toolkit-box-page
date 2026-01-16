/**
 * @fileoverview Extract Problem Story Files for Kal'tsit
 * @description Find and copy story files where Kal'tsit appears with wrong names
 */

const fs = require('fs');
const path = require('path');
const { getAllStoryFilesFromDir, getTargetStoryDir } = require('./core/story-extractor.cjs');
const { ensureDir } = require('../shared/file-utils.cjs');

const WRONG_NAMES = {
    'zh_CN': ['嘉维尔', '莉莉娅', '魏彦吾', '沉默的过路人'],
    'en_US': ['Gavial', 'Lillia', 'Wei Yenwu'],
    'ja_JP': ['ガヴィル']
};

async function extractProblemFiles(langCode) {
    console.log(`\nSearching for problematic Kal'tsit files in ${langCode}...`);
    
    const storyDir = getTargetStoryDir(langCode);
    const storyFiles = getAllStoryFilesFromDir(storyDir);
    
    if (storyFiles.length === 0) {
        console.log(`No story files found`);
        return [];
    }

    const wrongNames = WRONG_NAMES[langCode] || [];
    const problemFiles = [];
    const debugDir = path.resolve(__dirname, `../../.debug/kalts-stories/${langCode}`);
    ensureDir(debugDir);

    for (const storyFile of storyFiles) {
        try {
            const fullPath = path.resolve(storyDir, storyFile);
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Check if file contains char_003_kalts AND any wrong names
            const hasKalts = content.includes('char_003_kalts') || 
                            content.includes('npc_003_kalts') ||
                            content.includes('kalts');
            
            if (!hasKalts) continue;
            
            const hasWrongNames = wrongNames.some(name => content.includes(`[name="${name}"]`));
            
            if (hasWrongNames) {
                problemFiles.push({
                    file: storyFile,
                    wrongNames: wrongNames.filter(name => content.includes(`[name="${name}"]`))
                });
                
                // Copy story file to debug folder
                const debugFilePath = path.join(debugDir, storyFile.replace(/\//g, '_'));
                ensureDir(path.dirname(debugFilePath));
                fs.copyFileSync(fullPath, debugFilePath);
            }
        } catch (error) {
            console.error(`Error processing ${storyFile}:`, error.message);
        }
    }

    console.log(`Found ${problemFiles.length} problematic files`);
    return problemFiles;
}

async function main() {
    const languages = ['zh_CN', 'en_US', 'ja_JP'];
    const allResults = {};

    for (const lang of languages) {
        const files = await extractProblemFiles(lang);
        if (files.length > 0) {
            allResults[lang] = files;
        }
    }

    // Always save manifest (even if empty) so artifact upload succeeds
    const manifestFile = path.resolve(__dirname, '../../.debug/kalts-problem-files.json');
    ensureDir(path.dirname(manifestFile));
    fs.writeFileSync(manifestFile, JSON.stringify(allResults, null, 2), 'utf8');
    
    // Also create a summary file
    const summaryFile = path.resolve(__dirname, '../../.debug/summary.txt');
    const totalFiles = Object.values(allResults).reduce((sum, files) => sum + files.length, 0);
    fs.writeFileSync(summaryFile, 
        `Kal'tsit Debug Extraction\n` +
        `========================\n\n` +
        `Total problematic files: ${totalFiles}\n\n` +
        Object.entries(allResults).map(([lang, files]) => 
            `${lang}: ${files.length} files`
        ).join('\n'),
        'utf8'
    );
    
    console.log(`\n✅ Problem files extracted to: docs/.debug/kalts-stories/`);
    console.log(`✅ Manifest saved to: docs/.debug/kalts-problem-files.json`);
    
    // Print summary
    console.log('\n=== Summary ===');
    for (const [lang, files] of Object.entries(allResults)) {
        console.log(`${lang}: ${files.length} files`);
        files.slice(0, 5).forEach(f => 
            console.log(`  - ${f.file} (names: ${f.wrongNames.join(', ')})`)
        );
        if (files.length > 5) {
            console.log(`  ... and ${files.length - 5} more`);
        }
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { extractProblemFiles };
