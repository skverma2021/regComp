// server/routes/add.js
const express = require('express');
const router = express.Router();
const { addEntry } = require('../utils/bChain/addEntry');

router.post('/add-compliance-entry', async (req, res) => {
  const data = {
    projId: req.body.theProj,
    compReport: req.body.theReport,
  };
//   console.log(data.field1)
//   console.log(data.field2)

  const result = await addEntry(data);

  if (result.success) {
    res.status(201).json({
      status: 'ok',
      message: 'Entry added to blockchain',
      hash: result.hash
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Failed to insert entry',
      error: result.error
    });
  }
});

module.exports = router;
