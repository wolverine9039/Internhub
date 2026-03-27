const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * GET /admin/stats — Aggregated dashboard statistics (admin only)
 */
router.get('/stats', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [[internCount], [trainerCount], [projectCount], [cohortCount], [taskCount], [pendingSubmissions], [evalDue]] = await Promise.all([
      pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'intern' AND is_active = 1"),
      pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'trainer' AND is_active = 1"),
      pool.execute("SELECT COUNT(*) AS total FROM projects"),
      pool.execute("SELECT COUNT(*) AS total FROM cohorts"),
      pool.execute("SELECT COUNT(*) AS total FROM tasks"),
      pool.execute("SELECT COUNT(*) AS total FROM submissions WHERE status = 'pending'"),
      pool.execute("SELECT COUNT(*) AS total FROM evaluations WHERE score IS NULL"),
    ]);

    res.status(200).json({
      totalInterns: internCount[0].total,
      totalTrainers: trainerCount[0].total,
      activeProjects: projectCount[0].total,
      totalCohorts: cohortCount[0].total,
      totalTasks: taskCount[0].total,
      pendingSubmissions: pendingSubmissions[0].total,
      evaluationsDue: evalDue[0].total,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/recent-activity — Last 10 activities across all tables
 */
router.get('/recent-activity', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    // Submissions: who submitted what
    const [submissions] = await pool.execute(`
      SELECT s.id, u.name AS user_name, t.title AS task_title, s.submitted_at AS timestamp,
             'submission' AS type
      FROM submissions s
      LEFT JOIN users u ON s.intern_id = u.id
      LEFT JOIN tasks t ON s.task_id = t.id
      WHERE s.submitted_at IS NOT NULL
      ORDER BY s.submitted_at DESC LIMIT 5
    `);

    // Evaluations: who evaluated what
    const [evaluations] = await pool.execute(`
      SELECT e.id, u.name AS user_name, t.title AS task_title, e.evaluated_at AS timestamp,
             'evaluation' AS type
      FROM evaluations e
      LEFT JOIN users u ON e.trainer_id = u.id
      LEFT JOIN submissions s ON e.submission_id = s.id
      LEFT JOIN tasks t ON s.task_id = t.id
      WHERE e.evaluated_at IS NOT NULL
      ORDER BY e.evaluated_at DESC LIMIT 5
    `);

    // Tasks recently created
    const [tasks] = await pool.execute(`
      SELECT tk.id, 
             COALESCE(u.name, 'Unassigned') AS user_name, 
             tk.title AS task_title, 
             tk.created_at AS timestamp,
             'task_assigned' AS type
      FROM tasks tk
      LEFT JOIN users u ON tk.assigned_to = u.id
      WHERE tk.created_at IS NOT NULL
      ORDER BY tk.created_at DESC LIMIT 5
    `);

    // New users
    const [newUsers] = await pool.execute(`
      SELECT id, name AS user_name, CONCAT('Joined as ', role) AS task_title, created_at AS timestamp,
             'user_joined' AS type
      FROM users
      WHERE created_at IS NOT NULL
      ORDER BY created_at DESC LIMIT 5
    `);

    // Merge, sort by timestamp, take top 10
    const all = [...submissions, ...evaluations, ...tasks, ...newUsers]
      .filter(a => a.timestamp != null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    res.status(200).json(all);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/cohort-progress — All cohorts with computed progress
 */
router.get('/cohort-progress', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [cohorts] = await pool.execute('SELECT * FROM cohorts ORDER BY created_at DESC');

    const enriched = await Promise.all(cohorts.map(async (cohort) => {
      const [taskStats] = await pool.execute(`
        SELECT 
          COUNT(*) AS total_tasks,
          SUM(CASE WHEN tk.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
        FROM tasks tk
        JOIN projects p ON tk.project_id = p.id
        WHERE p.cohort_id = ?
      `, [cohort.id]);

      const total = taskStats[0]?.total_tasks || 0;
      const completed = taskStats[0]?.completed_tasks || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { ...cohort, total_tasks: total, completed_tasks: completed, progress };
    }));

    res.status(200).json(enriched);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/upcoming-deadlines — Tasks due soonest
 */
router.get('/upcoming-deadlines', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [deadlines] = await pool.execute(`
      SELECT tk.id, tk.title, tk.due_date, tk.status, p.title AS project_title
      FROM tasks tk
      LEFT JOIN projects p ON tk.project_id = p.id
      WHERE tk.due_date IS NOT NULL AND tk.due_date >= CURDATE() AND tk.status != 'completed'
      ORDER BY tk.due_date ASC
      LIMIT 8
    `);

    res.status(200).json(deadlines);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/export/:resource — Download CSV reports
 */
router.get('/export/:resource', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { resource } = req.params;
    let query = '';
    
    switch (resource) {
      case 'users':
        query = 'SELECT id, name, email, role, is_active, created_at FROM users';
        break;
      case 'tasks':
        query = 'SELECT t.id, t.title, p.title as project, u.name as assigned_to, t.priority, t.status, t.due_date FROM tasks t LEFT JOIN projects p ON t.project_id = p.id LEFT JOIN users u ON t.assigned_to = u.id';
        break;
      case 'submissions':
        query = 'SELECT s.id, u.name as intern, t.title as task, s.status, s.github_url, s.submitted_at FROM submissions s LEFT JOIN users u ON s.intern_id = u.id LEFT JOIN tasks t ON s.task_id = t.id';
        break;
      case 'evaluations':
        query = 'SELECT e.id, i.name as intern, t.title as task, tr.name as trainer, e.score, e.evaluated_at FROM evaluations e LEFT JOIN submissions s ON e.submission_id = s.id LEFT JOIN users i ON s.intern_id = i.id LEFT JOIN tasks t ON s.task_id = t.id LEFT JOIN users tr ON e.trainer_id = tr.id';
        break;
      default:
        return res.status(400).json({ error: 'Invalid resource for export' });
    }

    const [rows] = await pool.execute(query);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(','),
      ...rows.map(row => headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'string') {
          // Escape quotes and wrap in quotes
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      }).join(','))
    ];

    const csvData = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${resource}_export.csv"`);
    res.status(200).send(csvData);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/analytics — Comprehensive analytics data for the admin dashboard
 * Query params:
 *   - from (ISO date string, optional) — start date for filtering
 *   - to   (ISO date string, optional) — end date for filtering
 */
router.get('/analytics', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { from, to } = req.query;

    // Build optional date filter clauses
    const hasDateFilter = from && to;
    const taskDateClause = hasDateFilter ? 'AND tk.created_at BETWEEN ? AND ?' : '';
    const submissionDateClause = hasDateFilter ? 'AND s.submitted_at BETWEEN ? AND ?' : '';
    const evalDateClause = hasDateFilter ? 'AND e.evaluated_at BETWEEN ? AND ?' : '';
    const dateParams = hasDateFilter ? [from, to] : [];

    // ── 1) KPIs ──
    const [[taskKpi]] = await pool.execute(
      `SELECT 
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
       FROM tasks tk WHERE 1=1 ${taskDateClause}`,
      dateParams
    );

    const [[evalKpi]] = await pool.execute(
      `SELECT AVG(score) AS avgScore, COUNT(*) AS totalEvals
       FROM evaluations e WHERE 1=1 ${evalDateClause}`,
      dateParams
    );

    const [[submissionKpi]] = await pool.execute(
      `SELECT COUNT(DISTINCT task_id) AS tasksWithSubmissions
       FROM submissions s WHERE 1=1 ${submissionDateClause}`,
      dateParams
    );

    const [[internKpi]] = await pool.execute(
      `SELECT 
         COUNT(*) AS total,
         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active
       FROM users WHERE role = 'intern'`
    );

    const kpis = {
      taskCompletionRate: taskKpi.total > 0 ? Math.round((taskKpi.completed / taskKpi.total) * 100) : 0,
      avgEvaluationScore: Math.round(evalKpi.avgScore || 0),
      totalEvaluations: evalKpi.totalEvals || 0,
      submissionRate: taskKpi.total > 0 ? Math.round((submissionKpi.tasksWithSubmissions / taskKpi.total) * 100) : 0,
      activeInternCount: internKpi.active || 0,
      totalInternCount: internKpi.total || 0,
    };

    // ── 2) Task Status Breakdown ──
    const [taskStatusRows] = await pool.execute(
      `SELECT status, COUNT(*) AS count
       FROM tasks tk WHERE 1=1 ${taskDateClause}
       GROUP BY status ORDER BY FIELD(status, 'pending','in_progress','submitted','completed','overdue')`,
      dateParams
    );

    // ── 3) Score Distribution ──
    const [scoreDistRows] = await pool.execute(
      `SELECT 
         CASE 
           WHEN score BETWEEN 0 AND 20 THEN '0-20'
           WHEN score BETWEEN 21 AND 40 THEN '21-40'
           WHEN score BETWEEN 41 AND 60 THEN '41-60'
           WHEN score BETWEEN 61 AND 80 THEN '61-80'
           WHEN score BETWEEN 81 AND 100 THEN '81-100'
         END AS range_label,
         COUNT(*) AS count
       FROM evaluations e
       WHERE score IS NOT NULL ${evalDateClause}
       GROUP BY range_label
       ORDER BY MIN(score)`,
      dateParams
    );

    // Ensure all 5 buckets exist
    const allRanges = ['0-20', '21-40', '41-60', '61-80', '81-100'];
    const scoreDistribution = allRanges.map(r => ({
      range: r,
      count: scoreDistRows.find(row => row.range_label === r)?.count || 0,
    }));

    // ── 4) Score Dimension Averages ──
    const [[dimAvg]] = await pool.execute(
      `SELECT 
         ROUND(AVG(code_quality), 1) AS code_quality,
         ROUND(AVG(functionality), 1) AS functionality,
         ROUND(AVG(documentation), 1) AS documentation,
         ROUND(AVG(timeliness), 1) AS timeliness
       FROM evaluations e
       WHERE score IS NOT NULL ${evalDateClause}`,
      dateParams
    );

    const scoreDimensions = {
      code_quality: dimAvg.code_quality || 0,
      functionality: dimAvg.functionality || 0,
      documentation: dimAvg.documentation || 0,
      timeliness: dimAvg.timeliness || 0,
    };

    // ── 5) Cohort Performance ──
    const [cohortPerf] = await pool.execute(`
      SELECT 
        c.id, c.name, c.status,
        COUNT(DISTINCT CASE WHEN u.role = 'intern' AND u.is_active = 1 THEN u.id END) AS intern_count,
        COUNT(DISTINCT tk.id) AS total_tasks,
        SUM(CASE WHEN tk.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        ROUND(AVG(ev.score), 1) AS avg_score
      FROM cohorts c
      LEFT JOIN users u ON u.cohort_id = c.id
      LEFT JOIN projects p ON p.cohort_id = c.id
      LEFT JOIN tasks tk ON tk.project_id = p.id
      LEFT JOIN submissions s ON s.task_id = tk.id
      LEFT JOIN evaluations ev ON ev.submission_id = s.id
      GROUP BY c.id, c.name, c.status
      ORDER BY avg_score DESC
    `);

    const cohortPerformance = cohortPerf.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      internCount: c.intern_count || 0,
      totalTasks: c.total_tasks || 0,
      completedTasks: c.completed_tasks || 0,
      taskProgress: c.total_tasks > 0 ? Math.round((c.completed_tasks / c.total_tasks) * 100) : 0,
      avgScore: c.avg_score || 0,
    }));

    // ── 6) Top Interns (Leaderboard) ──
    const [topInterns] = await pool.execute(`
      SELECT 
        u.id, u.name, c.name AS cohort_name,
        ROUND(AVG(ev.score), 1) AS avg_score,
        COUNT(DISTINCT CASE WHEN tk.status = 'completed' THEN tk.id END) AS tasks_completed,
        COUNT(DISTINCT s.id) AS total_submissions
      FROM users u
      LEFT JOIN cohorts c ON u.cohort_id = c.id
      LEFT JOIN tasks tk ON tk.assigned_to = u.id
      LEFT JOIN submissions s ON s.intern_id = u.id
      LEFT JOIN evaluations ev ON ev.submission_id = s.id
      WHERE u.role = 'intern' AND u.is_active = 1
      GROUP BY u.id, u.name, c.name
      HAVING avg_score IS NOT NULL
      ORDER BY avg_score DESC
      LIMIT 10
    `);

    res.status(200).json({
      kpis,
      taskStatusBreakdown: taskStatusRows.map(r => ({ status: r.status, count: r.count })),
      scoreDistribution,
      scoreDimensions,
      cohortPerformance,
      topInterns: topInterns.map((t, i) => ({
        rank: i + 1,
        id: t.id,
        name: t.name,
        cohort: t.cohort_name || 'Unassigned',
        avgScore: t.avg_score,
        tasksCompleted: t.tasks_completed,
        submissions: t.total_submissions,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
