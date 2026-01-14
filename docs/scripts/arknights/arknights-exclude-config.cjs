const EXCLUDE_MAPPINGS = {
    char_010_chen: ["埃内斯托", "林雨霞"],
    char_010_chen_summer: ["埃内斯托", "林雨霞"],
    char_010_chen_1: ["埃内斯托", "林雨霞"],
    avg_1013_spchen_1: ["埃内斯托", "林雨霞"],
    avg_npc_003: ["格拉尼"],
    avg_npc_010: ["格拉尼"],
};

/**
 * Check if a character should be excluded from the mapping
 * @param {string} charId - Character ID (will automatically extract base ID)
 * @param {string} speakerName - Speaker name
 * @returns {boolean} - Whether this mapping should be excluded
 */
function shouldExcludeMapping(charId, speakerName) {
    if (!charId || !speakerName) return false;
    const baseCharId = charId.split("#")[0];
    const excludeList = EXCLUDE_MAPPINGS[baseCharId];
    return excludeList ? excludeList.includes(speakerName) : false;
}

/**
 * Get the stats of the exclude mapping
 * @returns {Object} - The stats of the exclude mapping
 */
function getExcludeStats() {
    const charCount = Object.keys(EXCLUDE_MAPPINGS).length;
    const totalExclusions = Object.values(EXCLUDE_MAPPINGS).reduce(
        (sum, list) => sum + list.length,
        0
    );

    return {
        characterCount: charCount,
        totalExclusions: totalExclusions,
        averageExclusionsPerChar:
            charCount > 0
                ? Math.round((totalExclusions / charCount) * 10) / 10
                : 0,
    };
}

module.exports = {
    EXCLUDE_MAPPINGS,
    shouldExcludeMapping,
    getExcludeStats,
};