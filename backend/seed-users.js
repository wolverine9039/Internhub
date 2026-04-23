const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');

/**
 * Seeds all non-admin users with a real bcrypt password hash.
 * Default password for all seeded users: intern123
 * 
 * Run: node seed-users.js
 */
(async () => {
  try {
    const password = 'intern123';
    const hash = await bcrypt.hash(password, 10);

    // Update all users that have placeholder password hashes (not valid bcrypt hashes)
    const [result] = await pool.execute(
      `UPDATE users SET password_hash = ? WHERE password_hash NOT LIKE '$2a$%' AND password_hash NOT LIKE '$2b$%'`,
      [hash]
    );

    console.log(`✅ Updated ${result.affectedRows} user(s) with password: "${password}"`);
    console.log('');

    // List all users so we can see what's available
    const [users] = await pool.execute(
      'SELECT id, name, email, role, is_active FROM users ORDER BY role, id'
    );

    console.log('📋 All users in database:');
    console.log('─'.repeat(70));
    users.forEach((u) => {
      const status = u.is_active ? '✅' : '❌';
      console.log(`  ${status} [${u.role.padEnd(7)}] ${u.name.padEnd(20)} ${u.email}`);
    });
    console.log('─'.repeat(70));
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   Admin:   admin@internhub.com / admin123');
    console.log('   Others:  <email above> / intern123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
