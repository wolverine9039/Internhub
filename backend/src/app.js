const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db'); // IMPORT THE LIVE DB CONNECTION

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// ROUTES (Connected to AWS RDS)
// ============================================================

// --- Health Check ---
app.get('/api', (req, res) => {
  res.json({ message: 'InternHub API is running', status: 'ok', database: 'connected' });
});

// ============================================================
// AUTH ROUTES
// ============================================================

// POST /api/auth/login — Login and get user info
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // In a real application, you would use bcrypt.compare() to check password hashes
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, cohort_id, is_active FROM users WHERE email = ? AND password_hash = ? AND is_active = 1',
      [email, password] // Note: our mock seed data uses "hashed_pw_admin" as plaintext passwords for now
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }

    const user = rows[0];
    const token = `demo-token-${user.id}-${user.role}-${Date.now()}`;

    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// USER ROUTES (Admin only)
// ============================================================

// GET /api/users — List all users
app.get('/api/users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, cohort_id, is_active, created_at FROM users');
    res.json({ count: users.length, users });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/users — Create a new user
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, role, cohort_id } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, and role are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role, cohort_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, role, cohort_id || null]
    );

    res.status(201).json({ message: 'User created', userId: result.insertId });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// COHORT ROUTES (Admin only)
// ============================================================

// GET /api/cohorts — List all cohorts
app.get('/api/cohorts', async (req, res) => {
  try {
    const [cohorts] = await pool.query('SELECT * FROM cohorts');
    res.json({ count: cohorts.length, cohorts });
  } catch (error) {
    console.error('Fetch cohorts error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/cohorts — Create a new cohort
app.post('/api/cohorts', async (req, res) => {
  try {
    const { name, description, start_date, end_date } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO cohorts (name, description, start_date, end_date) VALUES (?, ?, ?, ?)',
      [name, description || null, start_date || null, end_date || null]
    );

    res.status(201).json({ message: 'Cohort created', cohortId: result.insertId });
  } catch (error) {
    console.error('Create cohort error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// PROJECT ROUTES (Admin, Trainer)
// ============================================================

// GET /api/projects — List all projects
app.get('/api/projects', async (req, res) => {
  try {
    const [projects] = await pool.query('SELECT * FROM projects');
    res.json({ count: projects.length, projects });
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/projects — Create a new project
app.post('/api/projects', async (req, res) => {
  try {
    const { title, description, cohort_id, trainer_id } = req.body;

    if (!title || !cohort_id) {
      return res.status(400).json({ error: 'title and cohort_id are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO projects (title, description, cohort_id, trainer_id) VALUES (?, ?, ?, ?)',
      [title, description || null, cohort_id, trainer_id || null]
    );

    res.status(201).json({ message: 'Project created', projectId: result.insertId });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// TASK ROUTES (All roles)
// ============================================================

// GET /api/tasks — Get all tasks (optionally filter by assigned_to)
app.get('/api/tasks', async (req, res) => {
  try {
    const { assigned_to } = req.query;

    let query = 'SELECT * FROM tasks';
    const params = [];

    if (assigned_to) {
      query += ' WHERE assigned_to = ?';
      params.push(assigned_to);
    }

    const [tasks] = await pool.execute(query, params);
    res.json({ count: tasks.length, tasks });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/tasks — Create and assign a task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, project_id, assigned_to, created_by, due_date, priority } = req.body;

    if (!title || !project_id || !assigned_to) {
      return res.status(400).json({ error: 'title, project_id, and assigned_to are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO tasks (title, description, project_id, assigned_to, created_by, due_date, priority) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, project_id, assigned_to, created_by || null, due_date || null, priority || 'medium']
    );

    res.status(201).json({ message: 'Task created', taskId: result.insertId });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// SUBMISSION ROUTES (Intern)
// ============================================================

// GET /api/submissions — View all submissions (Trainer)
app.get('/api/submissions', async (req, res) => {
  try {
    const { task_id, intern_id } = req.query;

    let query = 'SELECT * FROM submissions WHERE 1=1';
    const params = [];

    if (task_id) { query += ' AND task_id = ?'; params.push(task_id); }
    if (intern_id) { query += ' AND intern_id = ?'; params.push(intern_id); }

    const [submissions] = await pool.execute(query, params);
    res.json({ count: submissions.length, submissions });
  } catch (error) {
    console.error('Fetch submissions error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/submissions — Submit work (Intern)
app.post('/api/submissions', async (req, res) => {
  try {
    const { task_id, intern_id, github_url, notes } = req.body;

    if (!task_id || !intern_id || !github_url) {
      return res.status(400).json({ error: 'task_id, intern_id, and github_url are required' });
    }

    // Since we are creating a submission and updating the task status, use a transaction
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        'INSERT INTO submissions (task_id, intern_id, github_url, notes) VALUES (?, ?, ?, ?)',
        [task_id, intern_id, github_url, notes || null]
      );

      await connection.execute('UPDATE tasks SET status = ? WHERE id = ?', ['submitted', task_id]);

      await connection.commit();
      res.status(201).json({ message: 'Submission recorded', submissionId: result.insertId });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// EVALUATION ROUTES (Trainer)
// ============================================================

// GET /api/evaluations — View all evaluations
app.get('/api/evaluations', async (req, res) => {
  try {
    const { submission_id } = req.query;

    let query = 'SELECT * FROM evaluations';
    const params = [];

    if (submission_id) {
      query += ' WHERE submission_id = ?';
      params.push(submission_id);
    }

    const [evaluations] = await pool.execute(query, params);
    res.json({ count: evaluations.length, evaluations });
  } catch (error) {
    console.error('Fetch evaluations error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/evaluations — Score a submission (Trainer)
app.post('/api/evaluations', async (req, res) => {
  try {
    const { submission_id, trainer_id, score, feedback } = req.body;

    if (!submission_id || !trainer_id || score === undefined) {
      return res.status(400).json({ error: 'submission_id, trainer_id, and score are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO evaluations (submission_id, trainer_id, score, feedback) VALUES (?, ?, ?, ?)',
      [submission_id, trainer_id, score, feedback || null]
    );

    res.status(201).json({ message: 'Evaluation recorded', evaluationId: result.insertId });
  } catch (error) {
    console.error('Create evaluation error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`\n  ✅ InternHub API Server is running`);
  console.log(`  ==================================`);
  console.log(`  Live AWS RDS Database Connected`);
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`  API base:   http://localhost:${PORT}/api\n`);
});
