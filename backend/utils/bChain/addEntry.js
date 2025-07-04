// server/addEntry.js
const sql = require('mssql');
const dbConfig = require('../../db/db');
const { computeHash } = require('./verifyChain');

async function addEntry(data) {
  try {
    await sql.connect(dbConfig);

    const prevResult = await sql.query(`
      SELECT TOP 1 * FROM ComplianceLedger ORDER BY id DESC
    `);

    const prevBlock = prevResult.recordset[0];
    const prevHash = prevBlock ? prevBlock.hash : 'GENESIS';

    const currentHash = computeHash(JSON.stringify(data), prevHash);
    // console.log(" theData: ",JSON.stringify(data), " prevHash: ", prevHash," currentHash: ", currentHash);

    const insertQuery = `
      INSERT INTO ComplianceLedger (projId, compReport, hash, prev_hash)
      VALUES (@projId, @compReport, @hash, @prev_hash)
    `;

    const request = new sql.Request();
    request.input('projId', sql.VarChar, data.projId);
    request.input('compReport', sql.VarChar, data.compReport);
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
