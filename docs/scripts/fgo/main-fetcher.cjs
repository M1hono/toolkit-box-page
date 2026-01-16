/**
 * @fileoverview Main FGO Data Fetcher
 * @module fgo/main-fetcher
 * @description
 * Orchestrates FGO servant data fetching and processing for all platforms.
 * Fetches from Atlas Academy API and processes into language-specific files.
 * 
 * Output files:
 * - global/fgo/servants.json - All servant data
 * - {lang}/fgo/servants.json - Language-specific servant data
 * - {lang}/fgo/metadata.json - Platform metadata
 * - zh_CN/fgo/translations.json - Chinese translations
 * 
 * @example
 * const { syncPlatform } = require('./main-fetcher');
 * await syncPlatform('JP');
 */

const path = require('path');
const fs = require('fs');
const { fetchNiceServants } = require('./api/atlas-academy.cjs');
const { processServantEntry, createSearchIndex, SERVANT_TRANSLATION_OVERRIDES } = require('./core/servant-processor.cjs');
const PROJECT_CONFIG = require('../project-config.cjs');
const { ensureDir } = require('../shared/file-utils.cjs');

/**
 * Load existing translation files for zh_CN
 * @param {string} zhPath - Path to zh_CN FGO data
 * @returns {Object} - Translation data
 */
function loadTranslationFiles(zhPath) {
    const translationsFile = path.resolve(zhPath, 'translations.json');
    const noTranslationFile = path.resolve(zhPath, 'no_translation.json');
    const nameMappingFile = path.resolve(zhPath, 'nameMapping.json');
    
    return {
        translations: fs.existsSync(translationsFile) ? JSON.parse(fs.readFileSync(translationsFile, 'utf8')) : {},
        noTranslations: fs.existsSync(noTranslationFile) ? JSON.parse(fs.readFileSync(noTranslationFile, 'utf8')) : {},
        nameMapping: fs.existsSync(nameMappingFile) ? JSON.parse(fs.readFileSync(nameMappingFile, 'utf8')) : SERVANT_TRANSLATION_OVERRIDES
    };
}

/**
 * Apply Chinese translations to servant data
 * @param {Object} servants - Servant data object
 * @param {Object} translationData - Translation mappings
 * @returns {Object} - Translated servant data
 */
function applyChineseTranslations(servants, translationData) {
    const { translations, noTranslations, nameMapping } = translationData;
    const translatedServants = {};
    
    Object.entries(servants).forEach(([id, servant]) => {
        const translatedServant = { ...servant };
        
        if (nameMapping[servant.name]) {
            const [translatedName, alias] = nameMapping[servant.name];
            translatedServant.name = translatedName;
            if (alias) {
                translatedServant.alias = alias;
            }
        } else if (translations[servant.name]) {
            translatedServant.name = translations[servant.name];
        } else if (noTranslations[servant.name]) {
            translatedServant.name = noTranslations[servant.name];
        }
        
        translatedServants[id] = translatedServant;
    });
    
    return translatedServants;
}

/**
 * Fetch and process data for a single platform
 * @param {string} platform - 'JP', 'NA', or 'CN'
 */
async function syncPlatform(platform) {
    console.log(`🚀 Syncing FGO data for platform: ${platform}...`);
    
    const langCode = PROJECT_CONFIG.PLATFORM_MAPPING.fgo[platform];
    if (!langCode) {
        console.error(` No language mapping found for platform ${platform}`);
        return;
    }
    
    const outputPath = PROJECT_CONFIG.getDataPath(langCode, 'fgo');
    ensureDir(outputPath);

    try {
        const rawServants = await fetchNiceServants(platform);
        console.log(`📥 Fetched ${rawServants.length} servants for ${platform}`);
        
        const processedServants = {};
        rawServants.forEach(servant => {
            if (servant.id && servant.collectionNo > 0) {
                processedServants[servant.id] = processServantEntry(servant);
            }
        });

        let finalServants = processedServants;
        let translationData = { translations: {}, noTranslations: {}, nameMapping: SERVANT_TRANSLATION_OVERRIDES };
        
        if (langCode === 'zh_CN' && platform === 'CN') {
            translationData = loadTranslationFiles(outputPath);
            finalServants = applyChineseTranslations(processedServants, translationData);
            
            fs.writeFileSync(
                path.resolve(outputPath, 'nameMapping.json'), 
                JSON.stringify(translationData.nameMapping, null, 2),
                'utf8'
            );
            fs.writeFileSync(
                path.resolve(outputPath, 'translations.json'), 
                JSON.stringify(translationData.translations, null, 2),
                'utf8'
            );
            fs.writeFileSync(
                path.resolve(outputPath, 'no_translation.json'), 
                JSON.stringify(translationData.noTranslations, null, 2),
                'utf8'
            );
        }

        const searchIndex = createSearchIndex(finalServants, translationData.translations, translationData.noTranslations);

        const metadata = {
            lastUpdated: new Date().toISOString(),
            platform: platform,
            language: langCode,
            totalServants: Object.keys(finalServants).length,
            totalSearchEntries: searchIndex.length
        };

        fs.writeFileSync(
            path.resolve(outputPath, 'servants.json'), 
            JSON.stringify(finalServants, null, 2),
            'utf8'
        );
        
        fs.writeFileSync(
            path.resolve(outputPath, 'search_index.json'), 
            JSON.stringify(searchIndex, null, 2),
            'utf8'
        );
        
        fs.writeFileSync(
            path.resolve(outputPath, 'metadata.json'), 
            JSON.stringify(metadata, null, 2),
            'utf8'
        );
        
        console.log(` ${platform} (${langCode}): ${Object.keys(finalServants).length} servants processed`);
        console.log(` Generated search index with ${searchIndex.length} entries`);
        
    } catch (error) {
        console.error(` Failed to sync platform ${platform}:`, error.message);
    }
}

/**
 * Main entry point
 */
async function main() {
    console.log('🎮 Starting FGO multi-platform data sync...');
    
    const platforms = ['CN', 'NA', 'JP'];
    
    for (const platform of platforms) {
        await syncPlatform(platform);
    }
    
    console.log('🎉 FGO data synchronization complete!');
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ FGO sync failed:', error);
        process.exit(1);
    });
}

module.exports = { syncPlatform, main };