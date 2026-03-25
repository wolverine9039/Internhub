const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * GET /users — List users with pagination, sorting, field selection, and filtering
 * Query params: page, page_size, sort, fields, role, is_active, search
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const page_size = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
    const offset = (page - 1) * page_size;

    // Allowed columns for field selection & sorting (whitelist to prevent injection)
    const ALLOWED_FIELDS = ['id', 'name', 'email', 'role', 'cohort_id', 'is_active', 'created_at'];
    const selectedFields = req.query.fields
      ? req.query.fields.split(',').filter(f => ALLOWED_FIELDS.includes(f.trim()))
      : ALLOWED_FIELDS;

    const columns = selectedFields.length > 0 ? selectedFields.join(', ') : ALLOWED_FIELDS.join(', ');

    // Sorting
    let sortField = 'created_at';
    let sortOrder = 'ASC';
    if (req.query.sort) {
      const raw = req.query.sort;
      if (raw.startsWith('-')) {
        sortField = raw.slice(1);
        sortOrder = 'DESC';
      } else {
        sortField = raw;
      }
      if (!ALLOWED_FIELDS.includes(sortField)) sortField = 'created_at';
    }

    // Filters
    const conditions = [];
    const params = [];
    if (req.query.role) { conditions.push('role = ?'); params.push(req.query.role); }
    if (req.query.is_active !== undefined) { conditions.push('is_active = ?'); params.push(req.query.is_active); }
    if (req.query.search) { conditions.push('(name LIKE ? OR email LIKE ?)'); params.push(`%${req.query.search}%`, `%${req.query.search}%`); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total for pagination (run in parallel with data query)
    const countQuery = `SELECT COUNT(*) AS total FROM users ${whereClause}`;
    const dataQuery = `SELECT ${columns} FROM users ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`;

    const [[countResult], [users]] = await Promise.all([
      pool.execute(countQuery, params),
      pool.execute(dataQuery, [...params, String(page_size), String(offset)]),
    ]);

    const total = countResult[0].total;

    res.status(200).json({
      items: users,
      page,
      page_size,
      total,
      pages: Math.ceil(total / page_size),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /users/:id — Get a single user by ID
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, cohort_id, is_active, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'User not found');
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /users — Create a new user
 */
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
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

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role, cohort_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, role, cohort_id || null]
    );

    res.status(201).location(`/api/users/${result.insertId}`).json({ message: 'User created', userId: result.insertId });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /users/:id — Partial update a user
 */
router.patch('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const ALLOWED_UPDATES = ['name', 'email', 'role', 'cohort_id', 'is_active'];
    const updates = [];
    const params = [];

    for (const field of ALLOWED_UPDATES) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      throw new AppError(422, 'VALIDATION_ERROR', 'No valid fields provided for update');
    }

    params.push(req.params.id);
    const [result] = await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'User not found');

    const [rows] = await pool.execute('SELECT id, name, email, role, cohort_id, is_active, created_at FROM users WHERE id = ?', [req.params.id]);
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /users/:id — Delete a user
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'User not found');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
