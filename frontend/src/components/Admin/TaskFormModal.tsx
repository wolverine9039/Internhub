import React, { useState, useEffect } from 'react';
import { projectService } from '@/services/projectService';
import { userService } from '@/services/userService';
import type { Project, User, Task, TaskFormData } from '@/types';
import { getErrorMessage } from '@/utils/errorUtils';
import '@/components/Shared/ConfirmDialog.css';

interface TaskFormModalProps {
  isOpen: boolean;
  editTask?: Task | null;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onClose: () => void;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, editTask, onSubmit, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('pending');
  const [dueDate, setDueDate] = useState('');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [interns, setInterns] = useState<User[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      projectService.getProjects({ page_size: 100 }).then(res => setProjects(res.items)).catch(console.error);
      userService.getUsers({ role: 'intern', page_size: 100 }).then(res => setInterns(res.items)).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setProjectId(String(editTask.project_id));
      setAssignedTo(String(editTask.assigned_to));
      setPriority(editTask.priority);
      setStatus(editTask.status);
      setDueDate(editTask.due_date ? new Date(editTask.due_date).toISOString().split('T')[0] : '');
    } else {
      setTitle(''); setDescription(''); setProjectId(''); setAssignedTo(''); setPriority('medium'); setStatus('pending'); setDueDate('');
    }
    setErrors({});
  }, [editTask, isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!projectId) e.project_id = 'Project is required';
    if (!assignedTo) e.assigned_to = 'Assignee is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      await onSubmit({
        title,
        description: description || undefined,
        project_id: Number(projectId),
        assigned_to: Number(assignedTo),
        priority,
        status,
        due_date: dueDate || undefined
      });
    } catch (err: unknown) {
      setErrors({ submit: getErrorMessage(err, 'Failed to save task') });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{editTask ? 'Edit Task' : 'New Task'}</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.submit && <div className="error-banner">{errors.submit}</div>}
            
            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input className={`form-input ${errors.title ? 'error' : ''}`} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Implement Login API" />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed requirements..." />
            </div>

            <div className="two-col">
              <div className="form-group">
                <label className="form-label">Project</label>
                <select className={`form-input ${errors.project_id ? 'error' : ''}`} value={projectId} onChange={e => setProjectId(e.target.value)}>
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                {errors.project_id && <div className="form-error">{errors.project_id}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className={`form-input ${errors.assigned_to ? 'error' : ''}`} value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                  <option value="">Select Intern</option>
                  {interns.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                {errors.assigned_to && <div className="form-error">{errors.assigned_to}</div>}
              </div>
            </div>

            <div className="three-col">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>{submitting ? 'Saving...' : (editTask ? 'Save Changes' : 'Create Task')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
