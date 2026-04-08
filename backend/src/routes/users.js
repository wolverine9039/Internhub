const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { parsePagination, parseSorting, buildPatchFields, paginatedResponse } = require('../utils/queryHelpers');
const { createUser } = require('../services/userService');

/**
 * GET /users — List users with pagination, sorting, field selection, and filtering
 * Query params: page, page_size, sort, fields, role, is_active, search
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);

    // Allowed columns for field selection & sorting (whitelist to prevent injection)
    const ALLOWED_FIELDS = ['id', 'name', 'email', 'role', 'cohort_id', 'is_active', 'created_at'];
    const selectedFields = req.query.fields
      ? req.query.fields.split(',').filter(f => ALLOWED_FIELDS.includes(f.trim()))
      : ALLOWED_FIELDS;

    const columns = selectedFields.length > 0 ? selectedFields.join(', ') : ALLOWED_FIELDS.join(', ');

    // Sorting
    const { sortField, sortOrder } = parseSorting(req.query, ALLOWED_FIELDS, 'created_at', 'ASC');

    // Filters
    const conditions = [];
    const params = [];
    if (req.query.role) { conditions.push('role = ?'); params.push(req.query.role); }
    if (req.query.is_active !== undefined) { conditions.push('is_active = ?'); params.push(req.query.is_active); }
    if (req.query.search) { conditions.push('(name LIKE ? OR email LIKE ?)'); params.push(`%${req.query.search}%`, `%${req.query.search}%`); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total for pagination (run in parallel with data query)
    const [[countResult], [users]] = await Promise.all([
      pool.execute(`SELECT COUNT(*) AS total FROM users ${whereClause}`, params),
      pool.execute(`SELECT ${columns} FROM users ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`, [...params, String(pageSize), String(offset)]),
    ]);

    res.status(200).json(paginatedResponse(users, page, pageSize, countResult[0].total));
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
 * POST /users — Create a new user (uses shared userService)
 */
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const userId = await createUser(req.body);
    res.status(201).location(`/api/users/${userId}`).json({ message: 'User created', userId });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /users/:id — Partial update a user
 */
router.patch('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { setClauses, params } = buildPatchFields(req.body, ['name', 'email', 'role', 'cohort_id', 'is_active']);

    params.push(req.params.id);
    const [result] = await pool.execute(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`, params);

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
