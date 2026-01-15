/**
 * @fileoverview Arknights Story Repository Synchronizer
 * @description Specialized logic for cloning and sparse-checking out story text from remote repositories
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const PROJECT_CONFIG = require('../project-config.cjs');
const { ensureDir } = require('../shared/file-utils.cjs');

/**
 * Executes a localized Git sparse-checkout session
 * @param {string} langCode - Source language platform
 */
function sparseCheckoutStory(langCode) {
    const repoUrl = langCode === 'zh_CN' 
        ? "https://github.com/Kengxxiao/ArknightsGameData.git"
        : "https://github.com/ArknightsAssets/ArknightsGamedata.git";
    
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
        
        const pathFilter = langCode === 'zh_CN' ? 'zh_CN/gamedata/story/' : 'en/gamedata/story/';
        fs.writeFileSync('.git/info/sparse-checkout', pathFilter);
        
        execSync('git checkout master');
        console.log(`Identification baseline synchronized for ${langCode}`);
        
        const sourcePath = path.resolve(targetDir, pathFilter);
        if (fs.existsSync(sourcePath)) {
            ensureDir(finalDir);
            execSync(`cp -R "${sourcePath}"* "${finalDir}/"`);
        }
        
        process.chdir(__dirname); // Restore context
        fs.rmSync(targetDir, { recursive: true, force: true });
    } catch (e) {
        console.error(`ERROR: Synchronization session failed for ${langCode}: ${e.message}`);
    }
}

module.exports = {
    sparseCheckoutStory
};
