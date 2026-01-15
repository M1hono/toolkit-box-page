/**
 * @fileoverview Git-based Arknights Story Syncer
 * @description Efficiently syncs story files by cloning entire repositories instead of individual file downloads
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ensureDir, deleteDir } = require('../../shared/file-utils.cjs');
const { extractStoryFiles, countStoryFiles } = require('./story-extractor.cjs');
const PROJECT_CONFIG = require('../../project-config.cjs');

const TEMP_DIR = PROJECT_CONFIG.TEMP_DIR;
const ARKNIGHTS_REPO_PATH = path.join(TEMP_DIR, 'arknights-gamedata');

/**
 * Clone repository with sparse checkout for story directories only
 * @param {string} repoUrl - Repository URL
 * @param {string} localPath - Local path to clone to
 * @param {string[]} storyPaths - Array of story paths to checkout
 */
async function cloneStoryDirsOnly(repoUrl, localPath, storyPaths) {
    const repoExists = fs.existsSync(path.join(localPath, '.git'));
    
    if (repoExists) {
        console.log(`Updating existing sparse repository: ${path.basename(localPath)}`);
        try {
            execSync('git pull --rebase', { 
                cwd: localPath, 
                stdio: 'pipe',
                timeout: PROJECT_CONFIG.GIT_CONFIG.PULL_TIMEOUT
            });
            return true;
        } catch (error) {
            console.warn(`WARNING: Pull failed, will re-clone: ${error.message}`);
            deleteDir(localPath);
        }
    }
    
    console.log(`Cloning repository with sparse checkout (story dirs only): ${repoUrl}`);
    ensureDir(path.dirname(localPath));
    
    try {
        execSync(`git init "${localPath}"`, { stdio: 'pipe' });
        
        execSync(`git remote add origin "${repoUrl}"`, { 
            cwd: localPath, 
            stdio: 'pipe' 
        });
        
        execSync('git config core.sparseCheckout true', { 
            cwd: localPath, 
            stdio: 'pipe' 
        });
        
        const sparseCheckoutFile = path.join(localPath, '.git', 'info', 'sparse-checkout');
        ensureDir(path.dirname(sparseCheckoutFile));
        fs.writeFileSync(sparseCheckoutFile, storyPaths.join('\n'));
        
        console.log(`   Sparse checkout paths: ${storyPaths.join(', ')}`);
        
        execSync('git pull --depth 1 origin master', { 
            cwd: localPath, 
            stdio: 'pipe',
            timeout: PROJECT_CONFIG.GIT_CONFIG.SPARSE_CHECKOUT_TIMEOUT
        });
        
        console.log(`Sparse checkout complete`);
        return true;
        
    } catch (error) {
        console.error(`ERROR: Sparse checkout failed: ${error.message}`);
        deleteDir(localPath);
        return false;
    }
}

/**
 * Sync story files for a specific language using git
 * @param {string} langCode - Language code
 * @param {boolean} [dryRun=false] - Preview mode
 * @param {boolean} [repoExists=false] - Whether repo is already cloned
 */
async function syncLanguageStories(langCode, dryRun = false, repoExists = false) {
    const repoConfig = PROJECT_CONFIG.REPOSITORIES.arknights;
    const storyPath = repoConfig.storyPaths[langCode];
    
    if (!storyPath) {
        console.error(`ERROR: Unsupported language: ${langCode}`);
        return false;
    }
    
    const sourceStoryPath = path.join(ARKNIGHTS_REPO_PATH, storyPath);
    const targetStoryPath = path.join(PROJECT_CONFIG.getDataPath(langCode, 'arknights'), 'story');
    
    console.log(`\nSyncing ${langCode} stories via git...`);
    
    if (dryRun) {
        console.log(`[DRY RUN] Would use repo at ${ARKNIGHTS_REPO_PATH}`);
        console.log(`[DRY RUN] Would copy from ${storyPath}`);
        console.log(`[DRY RUN] Would sync to ${targetStoryPath}`);
        return true;
    }
    
    if (!repoExists) {
        console.error(`ERROR: Repository not cloned yet for ${langCode}`);
        return false;
    }
    
    if (!fs.existsSync(sourceStoryPath)) {
        console.error(`ERROR: Story directory not found: ${sourceStoryPath}`);
        return false;
    }
    
    const beforeCount = countStoryFiles(targetStoryPath);
    
    console.log(`Extracting story files from ${storyPath}...`);
    const success = await extractStoryFiles(langCode, sourceStoryPath, targetStoryPath);
    
    if (!success) {
        return false;
    }
    
    const afterCount = countStoryFiles(targetStoryPath);
    
    console.log(`${langCode} stories synced: ${afterCount} files (was ${beforeCount})`);
    
    return true;
}


/**
 * Sync all supported languages
 * @param {Object} options - Sync options
 */
async function syncAllStories(options = {}) {
    const { dryRun = false, cleanup = true } = options;
    const startTime = Date.now();
    
    console.log('Starting git-based story synchronization...');
    
    if (dryRun) {
        console.log('Running in dry-run mode (preview only)');
    }
    
    const supportedLanguages = PROJECT_CONFIG.GAMES.arknights.supported_langs;
    const results = {};
    
    ensureDir(TEMP_DIR);
    
    try {
        let repoCloned = false;
        
        if (!dryRun) {
            const repoConfig = PROJECT_CONFIG.REPOSITORIES.arknights;
            const storyPaths = Object.values(repoConfig.storyPaths);
            
            console.log(`Sparse checkout repository (story dirs only): ${repoConfig.url}`);
            repoCloned = await cloneStoryDirsOnly(repoConfig.url, ARKNIGHTS_REPO_PATH, storyPaths);
            
            if (!repoCloned) {
                console.error('ERROR: Failed to sparse checkout repository, aborting...');
                return Object.fromEntries(supportedLanguages.map(lang => [lang, false]));
            }
        }
        
        for (const langCode of supportedLanguages) {
            results[langCode] = await syncLanguageStories(langCode, dryRun, repoCloned);
        }
        
        const totalTime = Date.now() - startTime;
        const successCount = Object.values(results).filter(Boolean).length;
        
        console.log('\nGit-based story sync complete!');
        console.log(`Total time: ${(totalTime / 1000).toFixed(1)}s`);
        console.log(`Success: ${successCount}/${supportedLanguages.length} languages`);
        
    } finally {
        if (cleanup && !dryRun) {
            console.log('Cleaning up temporary repositories...');
            deleteDir(TEMP_DIR);
        }
    }
    
    return results;
}

module.exports = {
    syncLanguageStories,
    syncAllStories,
    cloneStoryDirsOnly
};