const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');

(async () => {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    const [result] = await pool.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hash, 'admin@internhub.com']
    );
    if (result.affectedRows === 0) {
      console.log('No user found with that email, creating one...');
      await pool.execute(
        'INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
        ['Admin User', 'admin@internhub.com', hash, 'admin', true]
      );
      console.log('Admin user created!');
    } else {
      console.log('Admin password updated!');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
