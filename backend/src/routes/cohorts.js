const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * GET /cohorts — List cohorts with pagination and sorting
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const page_size = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
    const offset = (page - 1) * page_size;

    const ALLOWED_FIELDS = ['id', 'name', 'description', 'start_date', 'end_date', 'created_at'];
    let sortField = 'created_at';
    let sortOrder = 'DESC';
    if (req.query.sort) {
      const raw = req.query.sort;
      sortField = raw.startsWith('-') ? raw.slice(1) : raw;
      sortOrder = raw.startsWith('-') ? 'DESC' : 'ASC';
      if (!ALLOWED_FIELDS.includes(sortField)) sortField = 'created_at';
    }

    const conditions = [];
    const params = [];
    if (req.query.search) { conditions.push('name LIKE ?'); params.push(`%${req.query.search}%`); }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[countResult], [cohorts]] = await Promise.all([
      pool.execute(`SELECT COUNT(*) AS total FROM cohorts ${whereClause}`, params),
      pool.execute(`SELECT * FROM cohorts ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`, [...params, String(page_size), String(offset)]),
    ]);

    res.status(200).json({ items: cohorts, page, page_size, total: countResult[0].total, pages: Math.ceil(countResult[0].total / page_size) });
  } catch (err) { next(err); }
});

/**
 * GET /cohorts/:id — Get single cohort
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM cohorts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Cohort not found');
    res.status(200).json(rows[0]);
  } catch (err) { next(err); }
});

/**
 * POST /cohorts — Create a new cohort
 */
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name, description, start_date, end_date } = req.body;
    if (!name) throw new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', [{ field: 'name', message: 'Name is required' }]);

    const [result] = await pool.execute(
      'INSERT INTO cohorts (name, description, start_date, end_date) VALUES (?, ?, ?, ?)',
      [name, description || null, start_date || null, end_date || null]
    );
    res.status(201).location(`/api/cohorts/${result.insertId}`).json({ message: 'Cohort created', cohortId: result.insertId });
  } catch (err) { next(err); }
});

/**
 * PATCH /cohorts/:id — Partial update
 */
router.patch('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const ALLOWED = ['name', 'description', 'start_date', 'end_date'];
    const updates = []; const params = [];
    for (const f of ALLOWED) { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); } }
    if (updates.length === 0) throw new AppError(422, 'VALIDATION_ERROR', 'No valid fields provided');

    params.push(req.params.id);
    const [result] = await pool.execute(`UPDATE cohorts SET ${updates.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Cohort not found');

    const [rows] = await pool.execute('SELECT * FROM cohorts WHERE id = ?', [req.params.id]);
    res.status(200).json(rows[0]);
  } catch (err) { next(err); }
});

/**
 * DELETE /cohorts/:id
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM cohorts WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Cohort not found');
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
