const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { authenticate } = require('../middleware/authMiddleware');
const { createUser } = require('../services/userService');

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
 * POST /auth/register — Register a new user (uses shared userService)
 */
router.post('/register', async (req, res, next) => {
  try {
    const userId = await createUser(req.body);
    res.status(201).json({ message: 'User registered', userId });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /auth/change-password — Change the authenticated user's password
 */
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Both current and new passwords are required', [
        ...(!current_password ? [{ field: 'current_password', message: 'Current password is required' }] : []),
        ...(!new_password ? [{ field: 'new_password', message: 'New password is required' }] : []),
      ]);
    }

    if (new_password.length < 6) {
      throw new AppError(422, 'VALIDATION_ERROR', 'New password must be at least 6 characters');
    }

    // Fetch user's current hash
    const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    // Verify current password
    const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!isMatch) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect');
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
