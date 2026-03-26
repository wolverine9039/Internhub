const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * GET /tasks — List with pagination, sorting, and filters (assigned_to, project_id, status, priority)
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const page_size = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
    const offset = (page - 1) * page_size;

    const ALLOWED_SORT = ['id', 'title', 'status', 'priority', 'due_date', 'created_at'];
    let sortField = 'created_at';
    let sortOrder = 'DESC';
    if (req.query.sort) {
      const raw = req.query.sort;
      sortField = raw.startsWith('-') ? raw.slice(1) : raw;
      sortOrder = raw.startsWith('-') ? 'DESC' : 'ASC';
      if (!ALLOWED_SORT.includes(sortField)) sortField = 'created_at';
    }

    const conditions = []; const params = [];
    if (req.query.assigned_to) { conditions.push('t.assigned_to = ?'); params.push(req.query.assigned_to); }
    if (req.query.project_id) { conditions.push('t.project_id = ?'); params.push(req.query.project_id); }
    if (req.query.status) { conditions.push('t.status = ?'); params.push(req.query.status); }
    if (req.query.priority) { conditions.push('t.priority = ?'); params.push(req.query.priority); }
    if (req.query.search) { conditions.push('t.title LIKE ?'); params.push(`%${req.query.search}%`); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) AS total FROM tasks t ${where}`;
    const dataQuery = `
      SELECT t.*, u.name as assigned_to_name, p.title as project_title 
      FROM tasks t 
      LEFT JOIN users u ON t.assigned_to = u.id 
      LEFT JOIN projects p ON t.project_id = p.id 
      ${where} 
      ORDER BY t.${sortField} ${sortOrder} 
      LIMIT ? OFFSET ?
    `;

    const [[countResult], [tasks]] = await Promise.all([
      pool.execute(countQuery, params),
      pool.execute(dataQuery, [...params, String(page_size), String(offset)]),
    ]);

    res.status(200).json({ items: tasks, page, page_size, total: countResult[0].total, pages: Math.ceil(countResult[0].total / page_size) });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Task not found');
    res.status(200).json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('admin', 'trainer'), async (req, res, next) => {
  try {
    const { title, description, project_id, assigned_to, created_by, due_date, priority } = req.body;
    if (!title || !project_id || !assigned_to) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', [
        ...(!title ? [{ field: 'title', message: 'Title is required' }] : []),
        ...(!project_id ? [{ field: 'project_id', message: 'Project ID is required' }] : []),
        ...(!assigned_to ? [{ field: 'assigned_to', message: 'Assigned-to user is required' }] : []),
      ]);
    }
    const [result] = await pool.execute(
      'INSERT INTO tasks (title, description, project_id, assigned_to, created_by, due_date, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description || null, project_id, assigned_to, created_by || null, due_date || null, priority || 'medium']
    );
    res.status(201).location(`/api/tasks/${result.insertId}`).json({ message: 'Task created', taskId: result.insertId });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, authorize('admin', 'trainer'), async (req, res, next) => {
  try {
    const ALLOWED = ['title', 'description', 'status', 'priority', 'due_date', 'assigned_to'];
    const updates = []; const params = [];
    for (const f of ALLOWED) { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); } }
    if (updates.length === 0) throw new AppError(422, 'VALIDATION_ERROR', 'No valid fields provided');

    params.push(req.params.id);
    const [result] = await pool.execute(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Task not found');

    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.status(200).json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', 'Task not found');
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
