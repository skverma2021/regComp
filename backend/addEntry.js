// server/addEntry.js
const sql = require('mssql');
const dbConfig = require('./db');
const { computeHash } = require('./verifyChain');

async function addEntry(data) {
  try {
    await sql.connect(dbConfig);

    const prevResult = await sql.query(`
      SELECT TOP 1 * FROM ComplianceLedger ORDER BY id DESC
    `);

    const prevBlock = prevResult.recordset[0];
    const prevHash = prevBlock ? prevBlock.hash : 'GENESIS';

    const currentHash = computeHash(data, prevHash);

    const insertQuery = `
      INSERT INTO ComplianceLedger (field1, field2, hash, prev_hash)
      VALUES (@field1, @field2, @hash, @prev_hash)
    `;

    const request = new sql.Request();
    request.input('field1', sql.VarChar, data.field1);
    request.input('field2', sql.VarChar, data.field2);
    request.input('hash', sql.VarChar, currentHash);
    request.input('prev_hash', sql.VarChar, prevHash);

    await request.query(insertQuery);

    return { success: true, hash: currentHash };
  } catch (err) {
    console.error('❌ Error inserting block:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { addEntry };
