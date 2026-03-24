const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Attempt to load the AWS SSL Certificate
let sslConfig = undefined;
try {
  const certPath = path.join(__dirname, 'global-bundle.pem');
  if (fs.existsSync(certPath)) {
    sslConfig = {
      rejectUnauthorized: false,
      ca: fs.readFileSync(certPath)
    };
  }
} catch (error) {
  console.warn('⚠️ Could not load SSL certificate bundle.', error.message);
}

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test the connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to the RDS MySQL database.');
    connection.release();
  } catch (error) {
    console.error('❌ Error connecting to the database:', error.message);
    console.error('Please verify your .env file credentials.');
  }
})();

module.exports = pool;