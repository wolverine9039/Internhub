const mysql = require('mysql2/promise');
require('dotenv').config();

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
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
    console.error('Make sure your RDS credentials in the .env file are correct and the security group allows access.');
  }
})();

module.exports = pool;
