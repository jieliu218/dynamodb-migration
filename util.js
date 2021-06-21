/**
 * Get hexed key value from catalog ID
 *
 * @param {number} catalogId
 * @param {string} [region]
 * @returns {string}
 */
function getHexedKey(catalogId, region = REGION) {
    return Buffer.from(`${region}-${catalogId}`, 'utf8').toString('hex');
}


module.exports = {
    getHexedKey
}
