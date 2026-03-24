const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * GET /projects — List with pagination, sorting, and cohort_id filter
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const page_size = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
    const offset = (page - 1) * page_size;

    const ALLOWED_SORT = ['id', 'title', 'cohort_id', 'created_at'];
    let sortField = 'created_at';
    let sortOrder = 'DESC';
    if (req.query.sort) {
      const raw = req.query.sort;
      sortField = raw.startsWith('-') ? raw.slice(1) : raw;
      sortOrder = raw.startsWith('-') ? 'DESC' : 'ASC';
      if (!ALLOWED_SORT.includes(sortField)) sortField = 'created_at';
    }

    const conditions = []; const params = [];
    if (req.query.cohort_id) { conditions.push('cohort_id = ?'); params.push(req.query.cohort_id); }
    if (req.query.trainer_id) { conditions.push('trainer_id = ?'); params.push(req.query.trainer_id); }
    if (req.query.search) { conditions.push('title LIKE ?'); params.push(`%${req.query.search}%`); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[countResult], [projects]] = await Promise.all([
      pool.execute(`SELECT COUNT(*) AS total FROM projects ${where}`, params),
      pool.execute(`SELECT * FROM projects ${where} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`, [...params, String(page_size), String(offset)]),
    ]);

    res.status(200).json({ items: projects, page, page_size, total: countResult[0].total, pages: Math.ceil(countResult[0].total / page_size) });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Project not found');
    res.status(200).json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, cohort_id, trainer_id } = req.body;
    if (!title || !cohort_id) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', [
        ...(!title ? [{ field: 'title', message: 'Title is required' }] : []),
        ...(!cohort_id ? [{ field: 'cohort_id', message: 'Cohort ID is required' }] : []),
      ]);
    }
    const [result] = await pool.execute(
      'INSERT INTO projects (title, description, cohort_id, trainer_id) VALUES (?, ?, ?, ?)',
      [title, description || null, cohort_id, trainer_id || null]
    );
    res.status(201).location(`/api/projects/${result.insertId}`).json({ message: 'Project created', projectId: result.insertId });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const ALLOWED = ['title', 'description', 'cohort_id', 'trainer_id'];
    const updates = []; const params = [];
    for (const f of ALLOWED) { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); } }
    if (updates.length === 0) throw new AppError(422, 'VALIDATION_ERROR', 'No valid fields provided');

    params.push(req.params.id);
    const [result] = await pool.execute(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Project not found');

    const [rows] = await pool.execute('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.status(200).json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM projects WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Project not found');
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
