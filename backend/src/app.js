const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// DEMO DATA (in-memory mock data — replace with MySQL later)
// ============================================================

let users = [
  { id: 1, name: 'Admin User', email: 'admin@internhub.com', password: 'admin123', role: 'admin' },
  { id: 2, name: 'Trainer One', email: 'trainer@internhub.com', password: 'trainer123', role: 'trainer' },
  { id: 3, name: 'Intern One', email: 'intern@internhub.com', password: 'intern123', role: 'intern' },
  { id: 4, name: 'Intern Two', email: 'intern2@internhub.com', password: 'intern123', role: 'intern' },
];

let cohorts = [
  { id: 1, name: 'Cohort 2026 - Batch A', trainer_id: 2, created_at: '2026-03-01' },
  { id: 2, name: 'Cohort 2026 - Batch B', trainer_id: 2, created_at: '2026-03-15' },
];

let projects = [
  { id: 1, name: 'InternHub Platform', description: 'Full stack internship management app', cohort_id: 1, created_at: '2026-03-01' },
  { id: 2, name: 'E-Commerce Dashboard', description: 'Analytics dashboard for e-commerce', cohort_id: 2, created_at: '2026-03-15' },
];

let tasks = [
  { id: 1, title: 'Setup Repository', description: 'Initialize repo with folder structure', project_id: 1, assigned_to: 3, status: 'completed', due_date: '2026-03-07' },
  { id: 2, title: 'Build Admin Dashboard', description: 'Create admin panel with CRUD operations', project_id: 1, assigned_to: 3, status: 'in-progress', due_date: '2026-03-14' },
  { id: 3, title: 'Design Database Schema', description: 'Create MySQL schema for all tables', project_id: 1, assigned_to: 4, status: 'pending', due_date: '2026-03-14' },
];

let submissions = [
  { id: 1, task_id: 1, intern_id: 3, link: 'https://github.com/org/internhub', notes: 'Initial setup complete', submitted_at: '2026-03-06' },
];

let evaluations = [
  { id: 1, submission_id: 1, trainer_id: 2, score: 9, feedback: 'Excellent repo structure!', evaluated_at: '2026-03-07' },
];

// Auto-increment IDs
let nextId = {
  users: 5,
  cohorts: 3,
  projects: 3,
  tasks: 4,
  submissions: 2,
  evaluations: 2,
};

// ============================================================
// ROUTES
// ============================================================

// --- Health Check ---
app.get('/api', (req, res) => {
  res.json({ message: 'InternHub API is running', status: 'ok' });
});

// ============================================================
// AUTH ROUTES
// ============================================================

// POST /api/auth/login — Login and get user info
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Demo token (replace with real JWT later)
  const token = `demo-token-${user.id}-${user.role}-${Date.now()}`;

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// ============================================================
// USER ROUTES (Admin only)
// ============================================================

// GET /api/users — List all users
app.get('/api/users', (req, res) => {
  const safeUsers = users.map(({ password, ...rest }) => rest);
  res.json({ count: safeUsers.length, users: safeUsers });
});

// POST /api/users — Create a new user
app.post('/api/users', (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are required' });
  }

  if (!['admin', 'trainer', 'intern'].includes(role)) {
    return res.status(400).json({ error: 'role must be admin, trainer, or intern' });
  }

  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const newUser = { id: nextId.users++, name, email, password, role };
  users.push(newUser);

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ message: 'User created', user: safeUser });
});

// ============================================================
// COHORT ROUTES (Admin only)
// ============================================================

// GET /api/cohorts — List all cohorts
app.get('/api/cohorts', (req, res) => {
  res.json({ count: cohorts.length, cohorts });
});

// POST /api/cohorts — Create a new cohort
app.post('/api/cohorts', (req, res) => {
  const { name, trainer_id } = req.body;

  if (!name || !trainer_id) {
    return res.status(400).json({ error: 'name and trainer_id are required' });
  }

  const newCohort = {
    id: nextId.cohorts++,
    name,
    trainer_id,
    created_at: new Date().toISOString().split('T')[0],
  };
  cohorts.push(newCohort);

  res.status(201).json({ message: 'Cohort created', cohort: newCohort });
});

// ============================================================
// PROJECT ROUTES (Admin, Trainer)
// ============================================================

// GET /api/projects — List all projects
app.get('/api/projects', (req, res) => {
  res.json({ count: projects.length, projects });
});

// POST /api/projects — Create a new project
app.post('/api/projects', (req, res) => {
  const { name, description, cohort_id } = req.body;

  if (!name || !cohort_id) {
    return res.status(400).json({ error: 'name and cohort_id are required' });
  }

  const newProject = {
    id: nextId.projects++,
    name,
    description: description || '',
    cohort_id,
    created_at: new Date().toISOString().split('T')[0],
  };
  projects.push(newProject);

  res.status(201).json({ message: 'Project created', project: newProject });
});

// ============================================================
// TASK ROUTES (All roles)
// ============================================================

// GET /api/tasks — Get all tasks (optionally filter by assigned_to)
app.get('/api/tasks', (req, res) => {
  const { assigned_to } = req.query;

  let result = tasks;
  if (assigned_to) {
    result = tasks.filter(t => t.assigned_to === parseInt(assigned_to));
  }

  res.json({ count: result.length, tasks: result });
});

// POST /api/tasks — Create and assign a task
app.post('/api/tasks', (req, res) => {
  const { title, description, project_id, assigned_to, due_date } = req.body;

  if (!title || !project_id || !assigned_to) {
    return res.status(400).json({ error: 'title, project_id, and assigned_to are required' });
  }

  const newTask = {
    id: nextId.tasks++,
    title,
    description: description || '',
    project_id,
    assigned_to,
    status: 'pending',
    due_date: due_date || null,
  };
  tasks.push(newTask);

  res.status(201).json({ message: 'Task created', task: newTask });
});

// ============================================================
// SUBMISSION ROUTES (Intern)
// ============================================================

// GET /api/submissions — View all submissions (Trainer)
app.get('/api/submissions', (req, res) => {
  const { task_id, intern_id } = req.query;

  let result = submissions;
  if (task_id) result = result.filter(s => s.task_id === parseInt(task_id));
  if (intern_id) result = result.filter(s => s.intern_id === parseInt(intern_id));

  res.json({ count: result.length, submissions: result });
});

// POST /api/submissions — Submit work (Intern)
app.post('/api/submissions', (req, res) => {
  const { task_id, intern_id, link, notes } = req.body;

  if (!task_id || !intern_id || !link) {
    return res.status(400).json({ error: 'task_id, intern_id, and link are required' });
  }

  const newSubmission = {
    id: nextId.submissions++,
    task_id,
    intern_id,
    link,
    notes: notes || '',
    submitted_at: new Date().toISOString().split('T')[0],
  };
  submissions.push(newSubmission);

  // Update task status
  const task = tasks.find(t => t.id === task_id);
  if (task) task.status = 'submitted';

  res.status(201).json({ message: 'Submission recorded', submission: newSubmission });
});

// ============================================================
// EVALUATION ROUTES (Trainer)
// ============================================================

// GET /api/evaluations — View all evaluations
app.get('/api/evaluations', (req, res) => {
  const { submission_id } = req.query;

  let result = evaluations;
  if (submission_id) result = result.filter(e => e.submission_id === parseInt(submission_id));

  res.json({ count: result.length, evaluations: result });
});

// POST /api/evaluations — Score a submission (Trainer)
app.post('/api/evaluations', (req, res) => {
  const { submission_id, trainer_id, score, feedback } = req.body;

  if (!submission_id || !trainer_id || score === undefined) {
    return res.status(400).json({ error: 'submission_id, trainer_id, and score are required' });
  }

  if (score < 0 || score > 10) {
    return res.status(400).json({ error: 'Score must be between 0 and 10' });
  }

  const newEvaluation = {
    id: nextId.evaluations++,
    submission_id,
    trainer_id,
    score,
    feedback: feedback || '',
    evaluated_at: new Date().toISOString().split('T')[0],
  };
  evaluations.push(newEvaluation);

  res.status(201).json({ message: 'Evaluation recorded', evaluation: newEvaluation });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`\n  InternHub API Server`);
  console.log(`  ====================`);
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`  API base:   http://localhost:${PORT}/api`);
  console.log(`\n  Available endpoints:`);
  console.log(`  POST   /api/auth/login`);
  console.log(`  GET    /api/users`);
  console.log(`  POST   /api/users`);
  console.log(`  GET    /api/cohorts`);
  console.log(`  POST   /api/cohorts`);
  console.log(`  GET    /api/projects`);
  console.log(`  POST   /api/projects`);
  console.log(`  GET    /api/tasks`);
  console.log(`  POST   /api/tasks`);
  console.log(`  GET    /api/submissions`);
  console.log(`  POST   /api/submissions`);
  console.log(`  GET    /api/evaluations`);
  console.log(`  POST   /api/evaluations`);
  console.log(`\n  Demo credentials:`);
  console.log(`  Admin:   admin@internhub.com / admin123`);
  console.log(`  Trainer: trainer@internhub.com / trainer123`);
  console.log(`  Intern:  intern@internhub.com / intern123\n`);
});
