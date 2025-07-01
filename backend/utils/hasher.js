const crypto = require('crypto');

function generateHash(data, prevHash = '') {
  const input = JSON.stringify(data) + prevHash;
  return crypto.createHash('sha256').update(input).digest('hex');
}

module.exports = { generateHash };
