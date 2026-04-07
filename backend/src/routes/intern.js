const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * GET /intern/profile — Returns the logged-in intern's profile
 * including cohort name and assigned trainer(s)
 */
router.get('/profile', authenticate, authorize('intern'), async (req, res, next) => {
  try {
    const internId = req.user.id;

    // Get intern with cohort name
    const [[intern]] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.role, u.cohort_id, u.is_active, u.created_at,
             c.name AS cohort_name, c.status AS cohort_status,
             c.start_date AS cohort_start, c.end_date AS cohort_end
      FROM users u
      LEFT JOIN cohorts c ON u.cohort_id = c.id
      WHERE u.id = ? AND u.role = 'intern'
    `, [internId]);

    if (!intern) {
      return res.status(404).json({ error: 'Intern profile not found' });
    }

    // Get trainers assigned to the intern's cohort via cohort_trainers table
    let trainers = [];
    if (intern.cohort_id) {
      const [trainerRows] = await pool.execute(`
        SELECT u.id, u.name, u.email
        FROM cohort_trainers ct
        JOIN users u ON ct.trainer_id = u.id
        WHERE ct.cohort_id = ? AND u.is_active = 1
        ORDER BY u.name
      `, [intern.cohort_id]);
      trainers = trainerRows;
    }

    // Also get trainers assigned to the intern's projects (fallback if no cohort_trainers)
    if (trainers.length === 0 && intern.cohort_id) {
      const [projectTrainers] = await pool.execute(`
        SELECT DISTINCT u.id, u.name, u.email
        FROM projects p
        JOIN users u ON p.trainer_id = u.id
        WHERE p.cohort_id = ? AND u.is_active = 1
        ORDER BY u.name
      `, [intern.cohort_id]);
      trainers = projectTrainers;
    }

    res.status(200).json({
      id: intern.id,
      name: intern.name,
      email: intern.email,
      role: intern.role,
      cohort_id: intern.cohort_id,
      cohort_name: intern.cohort_name || null,
      cohort_status: intern.cohort_status || null,
      cohort_start: intern.cohort_start || null,
      cohort_end: intern.cohort_end || null,
      trainers: trainers.map(t => ({ id: t.id, name: t.name, email: t.email })),
      created_at: intern.created_at,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
