const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * GET /evaluations — List with pagination and filter (submission_id)
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const page_size = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
    const offset = (page - 1) * page_size;

    const conditions = []; const params = [];
    if (req.query.submission_id) { conditions.push('submission_id = ?'); params.push(req.query.submission_id); }
    if (req.query.trainer_id) { conditions.push('trainer_id = ?'); params.push(req.query.trainer_id); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[countResult], [evaluations]] = await Promise.all([
      pool.execute(`SELECT COUNT(*) AS total FROM evaluations ${where}`, params),
      pool.execute(`SELECT * FROM evaluations ${where} ORDER BY evaluated_at DESC LIMIT ? OFFSET ?`, [...params, String(page_size), String(offset)]),
    ]);

    res.status(200).json({ items: evaluations, page, page_size, total: countResult[0].total, pages: Math.ceil(countResult[0].total / page_size) });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM evaluations WHERE id = ?', [req.params.id]);
    if (rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Evaluation not found');
    res.status(200).json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { submission_id, trainer_id, score, feedback } = req.body;
    if (!submission_id || !trainer_id || score === undefined) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', [
        ...(!submission_id ? [{ field: 'submission_id', message: 'Submission ID is required' }] : []),
        ...(!trainer_id ? [{ field: 'trainer_id', message: 'Trainer ID is required' }] : []),
        ...(score === undefined ? [{ field: 'score', message: 'Score is required' }] : []),
      ]);
    }

    const [result] = await pool.execute(
      'INSERT INTO evaluations (submission_id, trainer_id, score, feedback) VALUES (?, ?, ?, ?)',
      [submission_id, trainer_id, score, feedback || null]
    );
    res.status(201).location(`/api/evaluations/${result.insertId}`).json({ message: 'Evaluation recorded', evaluationId: result.insertId });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM evaluations WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Evaluation not found');
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
