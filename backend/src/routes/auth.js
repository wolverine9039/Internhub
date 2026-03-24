const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * POST /auth/login — Authenticate user and return token
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

    const [rows] = await pool.execute(
      'SELECT id, name, email, role, cohort_id, is_active FROM users WHERE email = ? AND password_hash = ? AND is_active = 1',
      [email, password]
    );

    if (rows.length === 0) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials or inactive account');
    }

    const user = rows[0];
    const token = `demo-token-${user.id}-${user.role}-${Date.now()}`;

    res.status(200).json({ message: 'Login successful', token, user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
