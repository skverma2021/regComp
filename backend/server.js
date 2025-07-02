// server/server.js
require('dotenv').config(); // Optional: only if using .env
const express = require('express');
const cors = require('cors');

const addRoute = require('./routes/add');
const verifyRoute = require('./routes/verify');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/', addRoute);
app.use('/', verifyRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

