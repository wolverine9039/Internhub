// AdminTasks.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { taskService, TaskQueryParams } from '@/services/taskService';
import type { Task, TaskFormData } from '@/types';
import { getErrorMessage } from '@/utils/errorUtils';
import Pagination from '@/components/Shared/Pagination';
import TaskFormModal from './TaskFormModal';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import Badge from '@/components/Shared/Badge';
import { useAuth } from '@/context/AuthContext';
import './AdminDashboard.css'; // Reuse dashboard table styles

interface AdminTasksProps {
  onNavigate?: (screen: string) => void;
}

const AdminTasks: React.FC<AdminTasksProps> = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchTasks = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params: TaskQueryParams = { page, page_size: 15 };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (search) params.search = search;
      
      const res = await taskService.getTasks(params);
      setTasks(res.items);
      setPagination({ page: res.page, pages: res.pages, total: res.total });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load tasks'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => {
    const delay = setTimeout(() => fetchTasks(1), 300);
    return () => clearTimeout(delay);
  }, [fetchTasks]);

  const handleCreate = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await taskService.deleteTask(deleteConfirmId);
      setDeleteConfirmId(null);
      fetchTasks(pagination.page);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete task'));
      setDeleteConfirmId(null);
    }
  };

  const onFormSubmit = async (data: TaskFormData) => {
    if (editingTask) {
      await taskService.updateTask(editingTask.id, data);
    } else {
      await taskService.createTask({ ...data, created_by: user?.id });
    }
    setIsFormOpen(false);
    fetchTasks(pagination.page);
  };

  const getPriorityColor = (p: string) => {
    if (p === 'low') return 'green';
    if (p === 'medium') return 'blue';
    if (p === 'high') return 'yellow';
    return 'red'; // critical
  };

  const getStatusColor = (s: string) => {
    if (s === 'pending') return 'gray';
    if (s === 'in_progress') return 'blue';
    if (s === 'completed') return 'green';
    return 'red';
  };

  return (
    <div className="view-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Assignment</h1>
          <p className="page-subtitle">Manage and assign tasks to interns</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>+ New Task</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="search-row">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search tasks..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-chips">
          <button className={`filter-chip ${statusFilter === '' ? 'active' : ''}`} onClick={() => setStatusFilter('')}>All Status</button>
          <button className={`filter-chip ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>Pending</button>
          <button className={`filter-chip ${statusFilter === 'in_progress' ? 'active' : ''}`} onClick={() => setStatusFilter('in_progress')}>In Progress</button>
          <button className={`filter-chip ${statusFilter === 'completed' ? 'active' : ''}`} onClick={() => setStatusFilter('completed')}>Completed</button>
        </div>
        <div className="filter-chips">
          <button className={`filter-chip ${priorityFilter === '' ? 'active' : ''}`} onClick={() => setPriorityFilter('')}>All Priorities</button>
          <button className={`filter-chip ${priorityFilter === 'high' ? 'active' : ''}`} onClick={() => setPriorityFilter('high')}>High</button>
          <button className={`filter-chip ${priorityFilter === 'critical' ? 'active' : ''}`} onClick={() => setPriorityFilter('critical')}>Critical</button>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="loader-wrapper">
            <div className="loading-wave">
              <div className="loading-bar"></div>
              <div className="loading-bar"></div>
              <div className="loading-bar"></div>
              <div className="loading-bar"></div>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">No tasks found</div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Assigned To</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td><strong>{task.title}</strong><div className="deadline-project">{task.project_title}</div></td>
                    <td>
                      <div className="user-cell">
                        <div className="avatar micro">{task.assigned_to_name?.substring(0,2).toUpperCase() || 'U'}</div>
                        {task.assigned_to_name || `User #${task.assigned_to}`}
                      </div>
                    </td>
                    <td><Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge></td>
                    <td><Badge variant={getStatusColor(task.status)}>{task.status.replace('_', ' ')}</Badge></td>
                    <td className="time-muted">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(task)} style={{ marginRight: '8px' }}>Edit</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirmId(task.id)} style={{ color: 'var(--accent2)', borderColor: 'rgba(255,107,107,0.3)' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <Pagination 
          page={pagination.page} 
          pages={pagination.pages} 
          total={pagination.total}
          onPageChange={fetchTasks} 
        />
      )}

      <TaskFormModal 
        isOpen={isFormOpen} 
        editTask={editingTask} 
        onSubmit={onFormSubmit} 
        onClose={() => setIsFormOpen(false)} 
      />

      <ConfirmDialog 
        isOpen={!!deleteConfirmId}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export default AdminTasks;
