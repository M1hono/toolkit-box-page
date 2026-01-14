/**
 * @fileoverview Arknights Story Data Synchronization
 * @description Downloads and synchronizes story files from Arknights game data repositories using git-based approach
 */

const { syncAllStories } = require('./core/git-story-syncer.cjs');
const PROJECT_CONFIG = require('../project-config.cjs');

/**
 * Main story data synchronization
 * @param {Object} options - Sync options
 */
async function main(options = {}) {
    const { dryRun = false, noClean = false } = options;
    
    console.log('📚 Starting Arknights story data synchronization...');
    
    if (dryRun) {
        console.log('🔍 Running in dry-run mode (preview only)');
    }
    
    try {
        console.log('🚀 Using efficient git-based synchronization...');
        const results = await syncAllStories({ 
            dryRun, 
            cleanup: !noClean 
        });
        
        const successCount = Object.values(results).filter(Boolean).length;
        const totalLanguages = PROJECT_CONFIG.GAMES.arknights.supported_langs.length;
        
        if (successCount === totalLanguages) {
            console.log('✅ Git-based sync completed successfully for all languages');
        } else if (successCount > 0) {
            console.log(`⚠️  Git-based sync partially successful: ${successCount}/${totalLanguages} languages`);
        } else {
            console.error('❌ Git-based sync failed for all languages');
            throw new Error('Story synchronization failed');
        }
    } catch (error) {
        console.error('❌ Story sync failed:', error.message);
        throw error;
    }
    
    console.log('\n🎉 Story data synchronization complete!');
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        dryRun: args.includes('--dry-run'),
        noClean: args.includes('--no-clean')
    };
    
    main(options).catch(error => {
        console.error('❌ Story sync failed:', error);
        process.exit(1);
    });
}

module.exports = { main };