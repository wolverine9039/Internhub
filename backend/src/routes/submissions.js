const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * GET /submissions — List with pagination and filters (task_id, intern_id)
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const page_size = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
    const offset = (page - 1) * page_size;

    const conditions = []; const params = [];
    if (req.query.task_id) { conditions.push('task_id = ?'); params.push(req.query.task_id); }
    if (req.query.intern_id) { conditions.push('intern_id = ?'); params.push(req.query.intern_id); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[countResult], [submissions]] = await Promise.all([
      pool.execute(`SELECT COUNT(*) AS total FROM submissions ${where}`, params),
      pool.execute(`SELECT * FROM submissions ${where} ORDER BY submitted_at DESC LIMIT ? OFFSET ?`, [...params, String(page_size), String(offset)]),
    ]);

    res.status(200).json({ items: submissions, page, page_size, total: countResult[0].total, pages: Math.ceil(countResult[0].total / page_size) });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM submissions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Submission not found');
    res.status(200).json(rows[0]);
  } catch (err) { next(err); }
});

/**
 * POST /submissions — Submit work (uses a transaction to also update task status)
 */
router.post('/', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { task_id, intern_id, github_url, notes } = req.body;
    if (!task_id || !intern_id || !github_url) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', [
        ...(!task_id ? [{ field: 'task_id', message: 'Task ID is required' }] : []),
        ...(!intern_id ? [{ field: 'intern_id', message: 'Intern ID is required' }] : []),
        ...(!github_url ? [{ field: 'github_url', message: 'GitHub URL is required' }] : []),
      ]);
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      'INSERT INTO submissions (task_id, intern_id, github_url, notes) VALUES (?, ?, ?, ?)',
      [task_id, intern_id, github_url, notes || null]
    );
    await connection.execute('UPDATE tasks SET status = ? WHERE id = ?', ['submitted', task_id]);

    await connection.commit();
    res.status(201).location(`/api/submissions/${result.insertId}`).json({ message: 'Submission recorded', submissionId: result.insertId });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM submissions WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Submission not found');
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
