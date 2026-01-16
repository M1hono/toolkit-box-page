/**
 * @fileoverview FGO Servant Processor
 * @description Processes and standardizes servant data from API sources
 */

/**
 * Extracts essential image data from servant
 * @param {Object} servant - Servant object
 * @returns {Object} - Essential image data
 */
function extractServantImages(servant) {
    return {
        id: servant.id,
        face: servant.face,
        icon: servant.icon,
        portrait: servant.portrait,
        ascensionFaces: servant.extraAssets?.faces?.ascension || {},
    };
}

/**
 * Maps servant IDs to names for translation overrides
 */
const SERVANT_TRANSLATION_OVERRIDES = {
    荆轲: ["暗匿者042", "匕见"],
    吕布奉先: ["狂战士049", "虎狼"],
    始皇帝: ["统治者227", "政"],
    武则天: ["暗匿者174", "周帝"],
    杨贵妃: ["降临者268", "玉环"],
    虞美人: ["暗匿者209", "虞"],
    西王母: ["术者322", "瑶姬"],
    项羽: ["狂战士226", "籍"],
};

/**
 * Extract face coordinates from servant data
 * @param {Object} servant - Raw servant data
 * @returns {Object} - Face coordinate mapping
 */
function extractFaceCoordinates(servant) {
    const coordinates = {};
    if (servant.charaScripts) {
        servant.charaScripts.forEach((script) => {
            if (script.faceX !== undefined && script.faceY !== undefined) {
                coordinates[script.id] = {
                    id: script.id,
                    faceX: script.faceX,
                    faceY: script.faceY,
                    scale: script.scale || 1,
                };
            }
        });
    }
    return coordinates;
}

/**
 * Extract character figure images (what the component actually needs)
 * @param {Object} servant - Raw servant data
 * @returns {Object} - Character figure URLs
 */
function extractCharaFigures(servant) {
    if (!servant.extraAssets?.charaFigure) return {};

    const { ascension, costume, story } = servant.extraAssets.charaFigure;
    return {
        ascension: ascension || {},
        costume: costume || {},
        story: story || {},
    };
}

/**
 * Standardize servant entry for component use
 * @param {Object} servant - Raw servant data
 * @returns {Object} - Optimized servant data
 */
function processServantEntry(servant) {
    const faceCoordinates = extractFaceCoordinates(servant);
    const charaFigures = extractCharaFigures(servant);

    return {
        id: servant.id,
        collectionNo: servant.collectionNo,
        name: servant.name,
        ruby: servant.ruby || "",
        className: servant.className,
        rarity: servant.rarity,
        imageData: {
            charaFigures: charaFigures,
            faceCoordinates: faceCoordinates,
        },
        extraAssets: {
            charaFigure: charaFigures,
        },
    };
}

/**
 * Create search index from servants data
 * @param {Object} servants - Processed servants object
 * @param {Object} translations - Translation mapping
 * @param {Object} noTranslations - Untranslated entries
 * @returns {Array} - Search index entries
 */
function createSearchIndex(servants, translations = {}, noTranslations = {}) {
    return Object.values(servants).map((servant) => {
        const translatedName =
            translations[servant.name] ||
            noTranslations[servant.name] ||
            servant.name;
        const overrides = SERVANT_TRANSLATION_OVERRIDES[servant.name] || [];

        return {
            id: servant.id,
            name: translatedName,
            originalName: servant.name,
            ruby: servant.ruby,
            className: servant.className,
            rarity: servant.rarity,
            searchTerms: [
                translatedName,
                servant.name,
                servant.ruby,
                servant.className,
                ...overrides,
            ]
                .filter(Boolean)
                .map((term) => term.toLowerCase()),
        };
    });
}

module.exports = {
    processServantEntry,
    createSearchIndex,
    extractFaceCoordinates,
    extractCharaFigures,
    SERVANT_TRANSLATION_OVERRIDES,
};
