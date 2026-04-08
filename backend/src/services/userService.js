/**
 * User service — shared user-creation logic used by both
 * auth.js (register) and users.js (admin create).
 */
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * Validate that required user fields are present.
 * @param {object} body - { name, email, password, role }
 * @throws {AppError} with per-field details
 */
function validateUserFields({ name, email, password, role }) {
  if (!name || !email || !password || !role) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', [
      ...(!name     ? [{ field: 'name',     message: 'Name is required' }]     : []),
      ...(!email    ? [{ field: 'email',    message: 'Email is required' }]    : []),
      ...(!password ? [{ field: 'password', message: 'Password is required' }] : []),
      ...(!role     ? [{ field: 'role',     message: 'Role is required' }]     : []),
    ]);
  }
}

/**
 * Create a new user after validating, checking for duplicates, and hashing.
 * @param {{ name: string, email: string, password: string, role: string, cohort_id?: number }} data
 * @returns {Promise<number>} insertId
 */
async function createUser({ name, email, password, role, cohort_id }) {
  validateUserFields({ name, email, password, role });

  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    throw new AppError(409, 'DUPLICATE_EMAIL', 'A user with this email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password_hash, role, cohort_id) VALUES (?, ?, ?, ?, ?)',
    [name, email, hashedPassword, role, cohort_id || null]
  );

  return result.insertId;
}

module.exports = { validateUserFields, createUser };
