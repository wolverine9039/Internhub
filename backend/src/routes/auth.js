const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * POST /auth/login — Authenticate user and return JWT
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', [
        ...(!email ? [{ field: 'email', message: 'Email is required' }] : []),
        ...(!password ? [{ field: 'password', message: 'Password is required' }] : []),
      ]);
    }

    // Fetch user by email
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, cohort_id, is_active, password_hash FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const user = rows[0];

    if (!user.is_active) {
      throw new AppError(403, 'ACCOUNT_INACTIVE', 'Account is deactivated. Contact an administrator.');
    }

    // Compare password with bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Sign JWT
    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Return user without password_hash
    const { password_hash, ...safeUser } = user;

    res.status(200).json({ message: 'Login successful', token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/register — Register a new user (admin-only in production, open for dev seed)
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, cohort_id } = req.body;

    if (!name || !email || !password || !role) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', [
        ...(!name ? [{ field: 'name', message: 'Name is required' }] : []),
        ...(!email ? [{ field: 'email', message: 'Email is required' }] : []),
        ...(!password ? [{ field: 'password', message: 'Password is required' }] : []),
        ...(!role ? [{ field: 'role', message: 'Role is required' }] : []),
      ]);
    }

    // Check duplicate email
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new AppError(409, 'DUPLICATE_EMAIL', 'A user with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role, cohort_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, cohort_id || null]
    );

    res.status(201).json({ message: 'User registered', userId: result.insertId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
