// server/db.js
module.exports = {
  user: process.env.DB_USER || 'your_user',
  password: process.env.DB_PASSWORD || 'your_password',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'compliance_db',
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};