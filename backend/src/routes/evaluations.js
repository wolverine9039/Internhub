const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { parsePagination, paginatedResponse } = require('../utils/queryHelpers');

// Shared JOIN fragment for evaluation queries
const EVAL_JOIN_SQL = `
  FROM evaluations e 
  LEFT JOIN users u ON e.trainer_id = u.id 
  LEFT JOIN submissions s ON e.submission_id = s.id 
  LEFT JOIN tasks t ON s.task_id = t.id 
  LEFT JOIN users i ON s.intern_id = i.id
`;

/**
 * GET /evaluations — List with pagination and filters
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);

    const conditions = []; const params = [];
    if (req.query.submission_id) { conditions.push('e.submission_id = ?'); params.push(req.query.submission_id); }
    if (req.query.trainer_id) { conditions.push('e.trainer_id = ?'); params.push(req.query.trainer_id); }
    
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[countResult], [evaluations]] = await Promise.all([
      pool.execute(`SELECT COUNT(*) AS total FROM evaluations e ${where}`, params),
      pool.execute(`SELECT e.*, u.name as trainer_name, t.title as task_title, i.name as intern_name ${EVAL_JOIN_SQL} ${where} ORDER BY e.evaluated_at DESC LIMIT ? OFFSET ?`,
        [...params, String(pageSize), String(offset)]),
    ]);

    res.status(200).json(paginatedResponse(evaluations, page, pageSize, countResult[0].total));
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT e.*, u.name as trainer_name, t.title as task_title, i.name as intern_name ${EVAL_JOIN_SQL} WHERE e.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Evaluation not found');
    res.status(200).json(rows[0]);
  } catch (err) { next(err); }
});

/**
 * Validate required evaluation fields.
 */
function validateEvalFields({ submission_id, trainer_id, score }) {
  if (!submission_id || !trainer_id || score === undefined) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', [
      ...(!submission_id ? [{ field: 'submission_id', message: 'Submission ID is required' }] : []),
      ...(!trainer_id   ? [{ field: 'trainer_id',   message: 'Trainer ID is required' }]   : []),
      ...(score === undefined ? [{ field: 'score', message: 'Score is required' }] : []),
    ]);
  }
}

/**
 * Extract evaluation column values in a consistent order.
 */
function evalColumnValues(body) {
  const { code_quality, functionality, documentation, timeliness, score, feedback, strengths, improvements } = body;
  return [code_quality || null, functionality || null, documentation || null, timeliness || null, score, feedback || null, strengths || null, improvements || null];
}

/**
 * Run a callback inside a DB transaction with automatic rollback/release.
 */
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

router.post('/', authenticate, authorize('admin', 'trainer'), async (req, res, next) => {
  try {
    validateEvalFields(req.body);
    const { submission_id, trainer_id } = req.body;

    const insertId = await withTransaction(async (conn) => {
      const [result] = await conn.execute(
        `INSERT INTO evaluations 
        (submission_id, trainer_id, code_quality, functionality, documentation, timeliness, score, feedback, strengths, improvements) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [submission_id, trainer_id, ...evalColumnValues(req.body)]
      );
      await conn.execute('UPDATE submissions SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?', ['reviewed', submission_id]);
      return result.insertId;
    });

    res.status(201).location(`/api/evaluations/${insertId}`).json({ message: 'Evaluation recorded', evaluationId: insertId });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('admin', 'trainer'), async (req, res, next) => {
  try {
    validateEvalFields(req.body);
    const { submission_id, trainer_id } = req.body;

    await withTransaction(async (conn) => {
      const [result] = await conn.execute(
        `UPDATE evaluations 
         SET submission_id = ?, trainer_id = ?, code_quality = ?, functionality = ?, documentation = ?, timeliness = ?, score = ?, feedback = ?, strengths = ?, improvements = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [submission_id, trainer_id, ...evalColumnValues(req.body), req.params.id]
      );
      if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Evaluation not found');
    });

    res.status(200).json({ message: 'Evaluation updated successfully' });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM evaluations WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Evaluation not found');
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
