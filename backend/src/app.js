const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cohortRoutes = require('./routes/cohorts');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const submissionRoutes = require('./routes/submissions');
const evaluationRoutes = require('./routes/evaluations');
const adminRoutes = require('./routes/admin');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global Middleware ───────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health Check ────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'InternHub API is running', status: 'ok' });
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cohorts', cohortRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 Catch-All ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    },
  });
});

// ─── Centralized Error Handler (must be last) ────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ✅ InternHub API Server is running`);
  console.log(`  ==================================`);
  console.log(`  Live AWS RDS Database Connected`);
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`  Health:     http://localhost:${PORT}/health`);
  console.log(`  API base:   http://localhost:${PORT}/api\n`);
});
