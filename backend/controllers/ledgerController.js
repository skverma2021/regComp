const sql = require('mssql');
const config = require('../db/sqlConfig');
const { generateHash } = require('../utils/hasher');

async function addEntry(req, res) {
  const { industry_id, data } = req.body;

  try {
    await sql.connect(config);

    const prevResult = await sql.query`SELECT TOP 1 * FROM ComplianceLedger ORDER BY id DESC`;
    const prevHash = prevResult.recordset[0]?.hash || '';

    const hash = generateHash({ industry_id, data, timestamp: new Date() }, prevHash);

    await sql.query`
      INSERT INTO ComplianceLedger (industry_id, data, hash, prev_hash)
      VALUES (${industry_id}, ${data}, ${hash}, ${prevHash})
    `;

    res.status(201).json({ message: 'Entry added successfully', hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getLedger(req, res) {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM ComplianceLedger ORDER BY id ASC`;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function verifyChain(chain) {
    for (let i = 1; i < chain.length; i++) {
        const current = chain[i];
        const prev = chain[i - 1];

        // Recompute current hash
        const expectedHash = computeHash(current.data, current.prev_hash); // your hash logic

        // ✅ Now verify:
        if (prev.hash !== current.prev_hash || current.hash !== expectedHash) {
            return false;
        }
    }
    return true;
}

module.exports = { addEntry, getLedger, verifyChain };

