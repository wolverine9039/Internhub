const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// All routes require trainer (or admin) role
const guard = [authenticate, authorize('trainer', 'admin')];

/**
 * GET /trainer/stats — Dashboard KPIs scoped to the logged-in trainer
 */
router.get('/stats', ...guard, async (req, res, next) => {
  try {
    const trainerId = req.user.id;

    const [[pendingReviews], [evaluated], [avgScore], [internCount]] = await Promise.all([
      // Submissions on tasks in trainer's projects that are still pending review
      pool.execute(`
        SELECT COUNT(*) AS total
        FROM submissions s
        JOIN tasks tk ON s.task_id = tk.id
        JOIN projects p ON tk.project_id = p.id
        WHERE p.trainer_id = ? AND s.status IN ('pending', 'submitted')
      `, [trainerId]),

      // Evaluations the trainer has completed
      pool.execute(`
        SELECT COUNT(*) AS total FROM evaluations WHERE trainer_id = ?
      `, [trainerId]),

      // Average score given by this trainer
      pool.execute(`
        SELECT ROUND(AVG(score), 1) AS avg FROM evaluations WHERE trainer_id = ? AND score IS NOT NULL
      `, [trainerId]),

      // Distinct interns assigned to tasks under trainer's projects
      pool.execute(`
        SELECT COUNT(DISTINCT tk.assigned_to) AS total
        FROM tasks tk
        JOIN projects p ON tk.project_id = p.id
        WHERE p.trainer_id = ?
      `, [trainerId]),
    ]);

    res.status(200).json({
      pendingReviews: pendingReviews[0].total,
      totalEvaluated: evaluated[0].total,
      avgScore: avgScore[0].avg || 0,
      internCount: internCount[0].total,
    });
  } catch (err) { next(err); }
});

/**
 * GET /trainer/my-interns — Interns working on the trainer's projects
 */
router.get('/my-interns', ...guard, async (req, res, next) => {
  try {
    const trainerId = req.user.id;

    const [interns] = await pool.execute(`
      SELECT 
        u.id, u.name, u.email, u.is_active, u.created_at,
        c.name AS cohort_name,
        COUNT(DISTINCT tk.id) AS total_tasks,
        SUM(CASE WHEN tk.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        ROUND(AVG(ev.score), 1) AS avg_score
      FROM users u
      LEFT JOIN cohorts c ON u.cohort_id = c.id
      JOIN tasks tk ON tk.assigned_to = u.id
      JOIN projects p ON tk.project_id = p.id
      LEFT JOIN submissions s ON s.task_id = tk.id AND s.intern_id = u.id
      LEFT JOIN evaluations ev ON ev.submission_id = s.id
      WHERE p.trainer_id = ? AND u.role = 'intern'
      GROUP BY u.id, u.name, u.email, u.is_active, u.created_at, c.name
      ORDER BY u.name ASC
    `, [trainerId]);

    res.status(200).json(interns);
  } catch (err) { next(err); }
});

/**
 * GET /trainer/my-submissions — Submissions for the trainer's tasks
 * Query params: ?status=pending|submitted|reviewed|revision_requested
 */
router.get('/my-submissions', ...guard, async (req, res, next) => {
  try {
    const trainerId = req.user.id;
    const conditions = ['p.trainer_id = ?'];
    const params = [trainerId];

    if (req.query.status) {
      conditions.push('s.status = ?');
      params.push(req.query.status);
    }
    if (req.query.search) {
      conditions.push('(tk.title LIKE ? OR u.name LIKE ?)');
      params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [submissions] = await pool.execute(`
      SELECT 
        s.id, s.task_id, s.intern_id, s.attempt_no, s.github_url, s.demo_url,
        s.file_url, s.notes, s.status, s.submitted_at, s.reviewed_at, s.updated_at,
        tk.title AS task_title, u.name AS intern_name
      FROM submissions s
      JOIN tasks tk ON s.task_id = tk.id
      JOIN projects p ON tk.project_id = p.id
      LEFT JOIN users u ON s.intern_id = u.id
      ${where}
      ORDER BY s.submitted_at DESC
    `, params);

    res.status(200).json(submissions);
  } catch (err) { next(err); }
});

/**
 * GET /trainer/my-evaluations — Evaluations written by this trainer
 */
router.get('/my-evaluations', ...guard, async (req, res, next) => {
  try {
    const trainerId = req.user.id;

    const [evaluations] = await pool.execute(`
      SELECT 
        e.id, e.submission_id, e.trainer_id, e.code_quality, e.functionality,
        e.documentation, e.timeliness, e.score, e.feedback, e.strengths,
        e.improvements, e.evaluated_at, e.updated_at,
        tk.title AS task_title, u.name AS intern_name
      FROM evaluations e
      JOIN submissions s ON e.submission_id = s.id
      JOIN tasks tk ON s.task_id = tk.id
      LEFT JOIN users u ON s.intern_id = u.id
      WHERE e.trainer_id = ?
      ORDER BY e.evaluated_at DESC
    `, [trainerId]);

    res.status(200).json(evaluations);
  } catch (err) { next(err); }
});

/**
 * GET /trainer/upcoming-deadlines — Tasks due soon for trainer's projects
 */
router.get('/upcoming-deadlines', ...guard, async (req, res, next) => {
  try {
    const trainerId = req.user.id;

    const [deadlines] = await pool.execute(`
      SELECT tk.id, tk.title, tk.due_date, tk.status, p.title AS project_title,
             u.name AS assigned_to_name
      FROM tasks tk
      JOIN projects p ON tk.project_id = p.id
      LEFT JOIN users u ON tk.assigned_to = u.id
      WHERE p.trainer_id = ? 
        AND tk.due_date IS NOT NULL 
        AND tk.due_date >= CURDATE() 
        AND tk.status != 'completed'
      ORDER BY tk.due_date ASC
      LIMIT 8
    `, [trainerId]);

    res.status(200).json(deadlines);
  } catch (err) { next(err); }
});

module.exports = router;
