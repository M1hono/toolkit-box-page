/**
 * @fileoverview Main R2 Synchronization Script
 * @description Orchestrates the upload of Arknights character images to Cloudflare R2 storage
 */

const { loadGlobalCharacters } = require('./arknights/api/characters-api.cjs');
const { processBatch } = require('./shared/r2-uploader.cjs');
const PROJECT_CONFIG = require('./project-config.cjs');

/**
 * Main R2 sync execution
 */
async function main() {
    console.log('Starting R2 image synchronization...');
    
    const characters = loadGlobalCharacters();
    const characterEntries = Object.entries(characters);
    
    if (characterEntries.length === 0) {
        console.log('WARNING: No character data found for R2 sync');
        return;
    }
    
    const characterData = characterEntries
        .map(([id, data]) => {
            // Use provided validVariants, or default to standard format for operators
            // NPCs often don't have validVariants if they don't have images
            const variants = data.validVariants && data.validVariants.length > 0 
                ? data.validVariants 
                : (data.charType === 'operator' ? [`${id}#1$1`] : []);
            
            return {
                id,
                validVariants: variants
            };
        })
        .filter(char => char.validVariants.length > 0);
    
    if (characterData.length === 0) {
        console.log('WARNING: No characters with valid variants found for R2 sync');
        return;
    }
    
    console.log(`Processing ${characterData.length} characters for R2 upload`);
    
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < characterData.length; i += batchSize) {
        batches.push(characterData.slice(i, i + batchSize));
    }
    
    let totalProcessed = 0;
    let totalUploaded = 0;
    let totalSkipped = 0;
    
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} characters)...`);
        
        const result = await processBatch(batch);
        totalProcessed += result.processed;
        totalUploaded += result.uploaded;
        totalSkipped += result.skipped;
        
        console.log(`Batch ${i + 1} complete: ${result.processed} variants processed, ${result.uploaded} uploaded, ${result.skipped} skipped`);
        
        if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    console.log('\nR2 Sync Summary:');
    console.log(`   - Total Variants Processed: ${totalProcessed}`);
    console.log(`   - Total Uploaded: ${totalUploaded}`);
    console.log(`   - Total Skipped/Failed: ${totalSkipped}`);
    console.log('R2 synchronization complete!');
}

if (require.main === module) {
    main().catch(error => {
        console.error('ERROR: R2 sync failed:', error);
        process.exit(1);
    });
}

module.exports = { main };
