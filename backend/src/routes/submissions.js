const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { parsePagination, paginatedResponse } = require('../utils/queryHelpers');

// Shared JOIN fragment for submission queries
const SUBMISSION_JOIN_SQL = `
  FROM submissions s 
  LEFT JOIN users u ON s.intern_id = u.id 
  LEFT JOIN tasks t ON s.task_id = t.id
`;

/**
 * GET /submissions — List with pagination and filters
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);

    const conditions = []; const params = [];
    if (req.query.task_id) { conditions.push('s.task_id = ?'); params.push(req.query.task_id); }
    if (req.query.intern_id) { conditions.push('s.intern_id = ?'); params.push(req.query.intern_id); }
    if (req.query.status) { conditions.push('s.status = ?'); params.push(req.query.status); }
    
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[countResult], [submissions]] = await Promise.all([
      pool.execute(`SELECT COUNT(*) AS total FROM submissions s ${where}`, params),
      pool.execute(`SELECT s.*, u.name as intern_name, t.title as task_title ${SUBMISSION_JOIN_SQL} ${where} ORDER BY s.submitted_at DESC LIMIT ? OFFSET ?`,
        [...params, String(pageSize), String(offset)]),
    ]);

    res.status(200).json(paginatedResponse(submissions, page, pageSize, countResult[0].total));
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.*, u.name as intern_name, t.title as task_title ${SUBMISSION_JOIN_SQL} WHERE s.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Submission not found');
    res.status(200).json(rows[0]);
  } catch (err) { next(err); }
});

/**
 * POST /submissions — Submit work (intern only)
 */
router.post('/', authenticate, authorize('intern'), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { task_id, intern_id, github_url, demo_url, file_url, notes } = req.body;
    if (!task_id || !intern_id || !github_url) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', [
        ...(!task_id ? [{ field: 'task_id', message: 'Task ID is required' }] : []),
        ...(!intern_id ? [{ field: 'intern_id', message: 'Intern ID is required' }] : []),
        ...(!github_url ? [{ field: 'github_url', message: 'GitHub URL is required' }] : []),
      ]);
    }

    await connection.beginTransaction();

    // Get current attempt number
    const [attempts] = await connection.execute('SELECT MAX(attempt_no) as max_attempt FROM submissions WHERE task_id = ? AND intern_id = ?', [task_id, intern_id]);
    const attempt_no = (attempts[0].max_attempt || 0) + 1;

    const [result] = await connection.execute(
      'INSERT INTO submissions (task_id, intern_id, attempt_no, github_url, demo_url, file_url, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [task_id, intern_id, attempt_no, github_url, demo_url || null, file_url || null, notes || null, 'pending']
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

/**
 * PATCH /submissions/:id — Update status (admin/trainer)
 */
router.patch('/:id', authenticate, authorize('admin', 'trainer'), async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    if (!status && notes === undefined) throw new AppError(422, 'VALIDATION_ERROR', 'No valid fields provided');

    const updates = []; const params = [];
    if (status) { updates.push('status = ?'); params.push(status); }
    if (status === 'reviewed' || status === 'revision_requested') {
      updates.push('reviewed_at = CURRENT_TIMESTAMP');
    }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
    
    params.push(req.params.id);

    const [result] = await pool.execute(`UPDATE submissions SET ${updates.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Submission not found');
    res.status(200).json({ message: 'Submission updated' });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM submissions WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Submission not found');
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
