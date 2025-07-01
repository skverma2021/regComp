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

async function verifyChain(req, res) {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM ComplianceLedger ORDER BY id ASC`;
    const entries = result.recordset;

    let valid = true;
    for (let i = 1; i < entries.length; i++) {
      const prev = entries[i - 1];
      const current = entries[i];
      const expectedHash = generateHash({ industry_id: prev.industry_id, data: prev.data, timestamp: prev.timestamp }, prev.prev_hash);
      if (prev.hash !== expectedHash || current.prev_hash !== prev.hash) {
        valid = false;
        break;
      }
    }

    res.json({ valid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { addEntry, getLedger, verifyChain };

