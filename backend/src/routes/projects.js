const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { parsePagination, parseSorting, buildPatchFields, paginatedResponse } = require('../utils/queryHelpers');

/**
 * GET /projects — List with pagination, sorting, and cohort_id filter
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const { sortField, sortOrder } = parseSorting(req.query, ['id', 'title', 'cohort_id', 'created_at']);

    const conditions = []; const params = [];
    if (req.query.cohort_id) { conditions.push('cohort_id = ?'); params.push(req.query.cohort_id); }
    if (req.query.trainer_id) { conditions.push('trainer_id = ?'); params.push(req.query.trainer_id); }
    if (req.query.search) { conditions.push('title LIKE ?'); params.push(`%${req.query.search}%`); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[countResult], [projects]] = await Promise.all([
      pool.execute(`SELECT COUNT(*) AS total FROM projects ${where}`, params),
      pool.execute(`SELECT * FROM projects ${where} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`, [...params, String(pageSize), String(offset)]),
    ]);

    res.status(200).json(paginatedResponse(projects, page, pageSize, countResult[0].total));
  } catch (err) { next(err); }
});

const { getById, patchById, deleteById } = require('../utils/crudFactory');

router.get('/:id', authenticate, getById('projects', 'Project'));

router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { title, description, cohort_id, trainer_id } = req.body;
    if (!title || !cohort_id) {
      const errorDetails = [];
      if (!title) errorDetails.push({ field: 'title', message: 'Title is required' });
      if (!cohort_id) errorDetails.push({ field: 'cohort_id', message: 'Cohort ID is required' });
      throw new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', errorDetails);
    }
    const [result] = await pool.execute(
      'INSERT INTO projects (title, description, cohort_id, trainer_id) VALUES (?, ?, ?, ?)',
      [title, description || null, cohort_id, trainer_id || null]
    );
    res.status(201).location(`/api/projects/${result.insertId}`).json({ message: 'Project created', projectId: result.insertId });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, authorize('admin'), patchById('projects', 'Project', ['title', 'description', 'cohort_id', 'trainer_id']));

router.delete('/:id', authenticate, authorize('admin'), deleteById('projects', 'Project'));

module.exports = router;
