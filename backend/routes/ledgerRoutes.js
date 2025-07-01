const express = require('express');
const { addEntry, getLedger, verifyChain } = require('../controllers/ledgerController');

const router = express.Router();

router.post('/entry', addEntry);
router.get('/ledger', getLedger);
router.get('/verify', verifyChain);

module.exports = router;
