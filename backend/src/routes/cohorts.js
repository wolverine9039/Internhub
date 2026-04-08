const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { parsePagination, parseSorting, buildPatchFields, paginatedResponse } = require('../utils/queryHelpers');

/**
 * GET /cohorts — List cohorts with pagination and sorting
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const ALLOWED_FIELDS = ['id', 'name', 'description', 'start_date', 'end_date', 'created_at'];
    const { sortField, sortOrder } = parseSorting(req.query, ALLOWED_FIELDS);

    const conditions = [];
    const params = [];
    if (req.query.search) { conditions.push('name LIKE ?'); params.push(`%${req.query.search}%`); }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[countResult], [cohorts]] = await Promise.all([
      pool.execute(`SELECT COUNT(*) AS total FROM cohorts ${whereClause}`, params),
      pool.execute(`SELECT * FROM cohorts ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`, [...params, String(pageSize), String(offset)]),
    ]);

    res.status(200).json(paginatedResponse(cohorts, page, pageSize, countResult[0].total));
  } catch (err) { next(err); }
});

/**
 * GET /cohorts/meta/unassigned-interns — List interns not in any cohort
 * (Must be before /:id route to avoid Express matching 'meta' as an :id)
 */
router.get('/meta/unassigned-interns', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [interns] = await pool.execute(
      "SELECT id, name, email FROM users WHERE role = 'intern' AND cohort_id IS NULL AND is_active = 1 ORDER BY name"
    );
    res.json(interns);
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
    const { setClauses, params } = buildPatchFields(req.body, ['name', 'description', 'start_date', 'end_date']);

    params.push(req.params.id);
    const [result] = await pool.execute(`UPDATE cohorts SET ${setClauses.join(', ')} WHERE id = ?`, params);
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

/**
 * GET /cohorts/:id/members — List interns assigned to this cohort
 */
router.get('/:id/members', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [members] = await pool.execute(
      "SELECT id, name, email, is_active, created_at FROM users WHERE cohort_id = ? AND role = 'intern' ORDER BY name",
      [req.params.id]
    );
    res.json(members);
  } catch (err) { next(err); }
});

/**
 * POST /cohorts/:id/members — Add intern to cohort
 * Body: { intern_id }
 */
router.post('/:id/members', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { intern_id } = req.body;
    if (!intern_id) throw new AppError(422, 'VALIDATION_ERROR', 'intern_id is required');

    // Verify intern exists and is actually an intern
    const [[user]] = await pool.execute('SELECT id, role, cohort_id FROM users WHERE id = ?', [intern_id]);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
    if (user.role !== 'intern') throw new AppError(400, 'BAD_REQUEST', 'User is not an intern');

    await pool.execute('UPDATE users SET cohort_id = ? WHERE id = ?', [req.params.id, intern_id]);
    res.json({ message: 'Intern added to cohort' });
  } catch (err) { next(err); }
});

/**
 * DELETE /cohorts/:id/members/:internId — Remove intern from cohort
 */
router.delete('/:id/members/:internId', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [result] = await pool.execute(
      'UPDATE users SET cohort_id = NULL WHERE id = ? AND cohort_id = ?',
      [req.params.internId, req.params.id]
    );
    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Intern not in this cohort');
    res.json({ message: 'Intern removed from cohort' });
  } catch (err) { next(err); }
});

module.exports = router;
