/**
 * @fileoverview Arknights Story Repository Synchronizer (Legacy)
 * @module arknights/story-syncer
 * @description
 * Legacy story synchronization using direct git operations.
 * Replaced by git-story-syncer.cjs which uses improved filtering logic.
 * 
 * @deprecated Use git-story-syncer.cjs instead
 * @example
 * const { sparseCheckoutStory } = require('./story-syncer');
 * sparseCheckoutStory('zh_CN');
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const PROJECT_CONFIG = require('../project-config.cjs');
const { ensureDir } = require('../shared/file-utils.cjs');

/**
 * Execute legacy git sparse-checkout for story files
 * @deprecated Use git-story-syncer.cjs instead
 * @param {string} langCode - Language code (zh_CN, en_US, ja_JP)
 */
function sparseCheckoutStory(langCode) {
    const repoConfig = PROJECT_CONFIG.REPOSITORIES.arknights;
    const repoUrl = repoConfig.url;
    
    const langPath = PROJECT_CONFIG.getDataPath(langCode, 'arknights');
    const targetDir = path.resolve(langPath, 'story_repo');
    const finalDir = path.resolve(langPath, 'story');

    console.log(`Initializing sparse-checkout for ${langCode} from ${repoUrl}`);
    
    ensureDir(path.dirname(targetDir));
    if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });

    try {
        execSync(`git clone --no-checkout --depth 1 "${repoUrl}" "${targetDir}"`);
        process.chdir(targetDir);
        execSync('git config core.sparseCheckout true');
        
        const storyPath = repoConfig.storyPaths[langCode];
        fs.writeFileSync('.git/info/sparse-checkout', storyPath);
        
        execSync('git checkout master');
        console.log(`Story files synchronized for ${langCode}`);
        
        const sourcePath = path.resolve(targetDir, storyPath);
        if (fs.existsSync(sourcePath)) {
            ensureDir(finalDir);
            execSync(`cp -R "${sourcePath}"* "${finalDir}/"`);
        }
        
        process.chdir(__dirname);
        fs.rmSync(targetDir, { recursive: true, force: true });
    } catch (e) {
        console.error(`ERROR: Synchronization failed for ${langCode}: ${e.message}`);
    }
}

/**
 * @exports arknights/story-syncer
 * @property {Function} sparseCheckoutStory - Legacy sync function
 */
module.exports = {
    sparseCheckoutStory
};
