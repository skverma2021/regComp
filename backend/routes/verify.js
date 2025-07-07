// server/routes/verify.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');

const dbConfig = require('../db/db')

const { verifyChain } = require('../utils/bChain/verifyChain');

router.get('/verify-chain', async (req, res) => {
  try {
    await sql.connect(dbConfig);
    const result = await sql.query('SELECT * FROM ComplianceLedger ORDER BY projId ASC');
    // console.log(result.recordset);
    const chain = result.recordset.map(block => ({
      data: {
        projId: block.projId,
        compReport: block.compReport,
      },
      hash: block.hash,
      prev_hash: block.prev_hash
    }));

    const isValid = verifyChain(chain);

    if (isValid) {
      res.status(200).json({ status: 'ok', message: 'Blockchain is valid ✅', theChain:result.recordset});
    //   res.json(result);
    } else {
      res.status(409).json({ status: 'fail', message: 'Blockchain is compromised ❌' });
    }
  } catch (err) {
    console.error('Error verifying chain:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

module.exports = router;
