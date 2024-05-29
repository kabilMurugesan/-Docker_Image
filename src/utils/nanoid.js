const { customAlphabet } = require('nanoid');

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
/**
 * Generate token Id for refresh tokens
 * @param {String} userId
 * @param {String} length
 * @returns {String}
 */
const tokenIdGenerator = (length, userId) => {
  const transferIdGen = customAlphabet(alphabet, length);
  return `tk_${userId}${transferIdGen()}`;
};

module.exports = { tokenIdGenerator };
