const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * GET /evaluations — List with pagination and filters
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const page_size = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
    const offset = (page - 1) * page_size;

    const conditions = []; const params = [];
    if (req.query.submission_id) { conditions.push('e.submission_id = ?'); params.push(req.query.submission_id); }
    if (req.query.trainer_id) { conditions.push('e.trainer_id = ?'); params.push(req.query.trainer_id); }
    
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) AS total FROM evaluations e ${where}`;
    const dataQuery = `
      SELECT e.*, u.name as trainer_name, t.title as task_title, i.name as intern_name 
      FROM evaluations e 
      LEFT JOIN users u ON e.trainer_id = u.id 
      LEFT JOIN submissions s ON e.submission_id = s.id 
      LEFT JOIN tasks t ON s.task_id = t.id 
      LEFT JOIN users i ON s.intern_id = i.id
      ${where} 
      ORDER BY e.evaluated_at DESC 
      LIMIT ? OFFSET ?
    `;

    const [[countResult], [evaluations]] = await Promise.all([
      pool.execute(countQuery, params),
      pool.execute(dataQuery, [...params, String(page_size), String(offset)]),
    ]);

    res.status(200).json({ items: evaluations, page, page_size, total: countResult[0].total, pages: Math.ceil(countResult[0].total / page_size) });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT e.*, u.name as trainer_name, t.title as task_title, i.name as intern_name 
      FROM evaluations e 
      LEFT JOIN users u ON e.trainer_id = u.id 
      LEFT JOIN submissions s ON e.submission_id = s.id 
      LEFT JOIN tasks t ON s.task_id = t.id 
      LEFT JOIN users i ON s.intern_id = i.id
      WHERE e.id = ?
    `, [req.params.id]);
    if (rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Evaluation not found');
    res.status(200).json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('admin', 'trainer'), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { submission_id, trainer_id, code_quality, functionality, documentation, timeliness, score, feedback, strengths, improvements } = req.body;
    if (!submission_id || !trainer_id || score === undefined) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', [
        ...(!submission_id ? [{ field: 'submission_id', message: 'Submission ID is required' }] : []),
        ...(!trainer_id ? [{ field: 'trainer_id', message: 'Trainer ID is required' }] : []),
        ...(score === undefined ? [{ field: 'score', message: 'Score is required' }] : []),
      ]);
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO evaluations 
      (submission_id, trainer_id, code_quality, functionality, documentation, timeliness, score, feedback, strengths, improvements) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [submission_id, trainer_id, code_quality || null, functionality || null, documentation || null, timeliness || null, score, feedback || null, strengths || null, improvements || null]
    );

    // Also update submission status
    await connection.execute('UPDATE submissions SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?', ['reviewed', submission_id]);

    await connection.commit();
    res.status(201).location(`/api/evaluations/${result.insertId}`).json({ message: 'Evaluation recorded', evaluationId: result.insertId });
  } catch (err) { 
    await connection.rollback();
    next(err); 
  } finally {
    connection.release();
  }
});

router.put('/:id', authenticate, authorize('admin', 'trainer'), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { submission_id, trainer_id, code_quality, functionality, documentation, timeliness, score, feedback, strengths, improvements } = req.body;
    if (!submission_id || !trainer_id || score === undefined) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Request validation failed');
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `UPDATE evaluations 
       SET submission_id = ?, trainer_id = ?, code_quality = ?, functionality = ?, documentation = ?, timeliness = ?, score = ?, feedback = ?, strengths = ?, improvements = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [submission_id, trainer_id, code_quality || null, functionality || null, documentation || null, timeliness || null, score, feedback || null, strengths || null, improvements || null, req.params.id]
    );

    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Evaluation not found');

    await connection.commit();
    res.status(200).json({ message: 'Evaluation updated successfully' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM evaluations WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Evaluation not found');
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
