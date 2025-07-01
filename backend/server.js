const express = require('express');
const cors = require('cors');
const ledgerRoutes = require('./routes/ledgerRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', ledgerRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
