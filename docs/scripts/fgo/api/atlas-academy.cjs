/**
 * @fileoverview Atlas Academy API Client for FGO
 * @description Interfaces with Atlas Academy API to fetch servant and game data
 */

const { fetchData } = require('../../shared/network-utils.cjs');

const BASE_URL = "https://api.atlasacademy.io";

/**
 * Get endpoint for a specific language platform
 * @param {string} platform - 'JP', 'NA', or 'CN'
 * @returns {string} - Full API URL
 */
function getNiceServantUrl(platform) {
    const p = platform.toUpperCase();
    return `${BASE_URL}/export/${p}/nice_servant.json`;
}

/**
 * Fetch servant data for a specific platform
 * @param {string} platform - Platform code
 * @returns {Promise<Object[]>}
 */
async function fetchNiceServants(platform) {
    const url = getNiceServantUrl(platform);
    return await fetchData(url);
}

module.exports = {
    fetchNiceServants
};
