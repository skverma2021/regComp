// server/verifyChain.js
const crypto = require('crypto');

function computeHash(data, prevHash) {
  const hash = crypto.createHash('sha256');
  const input = JSON.stringify(data) + prevHash;
  hash.update(input);
  return hash.digest('hex');
}

function verifyChain(chain) {
  if (!Array.isArray(chain) || chain.length === 0) return false;

  for (let i = 0; i < chain.length; i++) {
    const current = chain[i];
    const expectedHash = computeHash(JSON.stringify(current.data), current.prev_hash);
    // console.log(" theData: ", JSON.stringify(current.data), " prevHash: ", current.prev_hash, " expectedHash: ", expectedHash)
    if (current.hash !== expectedHash) {
      console.warn(`Invalid hash at block #${i + 1}`);
      return false;
    }

    if (i === 0) {
      if (current.prev_hash !== 'GENESIS') {
        console.warn('Invalid genesis block.');
        return false;
      }
    } else {
      const prev = chain[i - 1];
      if (current.prev_hash !== prev.hash) {
        console.warn(`Broken link at block #${i + 1}`);
        return false;
      }
    }
  }

  return true;
}

module.exports = { verifyChain, computeHash };
