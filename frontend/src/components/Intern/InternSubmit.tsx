import React, { useEffect, useMemo, useState, useCallback } from 'react';
import type { User, Task, Submission } from '@/types';
import { taskService } from '@/services/taskService';
import { submissionService } from '@/services/submissionService';
import Badge from '@/components/Shared/Badge';
import './InternModule.css';
import { getErrorMessage } from '@/utils/errorUtils';
import LoadingWave from '@/components/Shared/LoadingWave';

interface InternSubmitProps {
  user: User | null;
  onNavigate: (screen: string) => void;
}

interface SubmitForm {
  taskId: string;
  githubUrl: string;
  demoUrl: string;
  fileUrl: string;
  notes: string;
}

const initialForm: SubmitForm = {
  taskId: '',
  githubUrl: '',
  demoUrl: '',
  fileUrl: '',
  notes: '',
};

const InternSubmit: React.FC<InternSubmitProps> = ({ user, onNavigate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [form, setForm] = useState<SubmitForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) {
      setTasks([]);
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const [taskRes, subRes] = await Promise.all([
      taskService.getTasks({ assigned_to: user.id, page: 1, page_size: 300, sort: 'due_date' }),
      submissionService.getSubmissions({ intern_id: user.id, page: 1, page_size: 300 }),
    ]);

    setTasks(taskRes.items);
    setSubmissions(subRes.items);
  }, [user?.id]);

  useEffect(() => {
    const run = async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [load]);

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status === 'pending' || task.status === 'in_progress' || task.status === 'overdue'),
    [tasks]
  );

  const selectedTask = useMemo(
    () => pendingTasks.find((task) => String(task.id) === form.taskId) || pendingTasks[0] || null,
    [pendingTasks, form.taskId]
  );

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await submissionService.createSubmission({
        task_id: Number(form.taskId),
        intern_id: user.id,
        github_url: form.githubUrl,
        demo_url: form.demoUrl || undefined,
        file_url: form.fileUrl || undefined,
        notes: form.notes || undefined,
      });

      setSuccess('Work submitted successfully.');
      setForm(initialForm);
      await load();
    } catch (submissionError: unknown) {
      setError(getErrorMessage(submissionError, 'Submission failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LoadingWave />
    );
  }

  return (
    <div className="intern-module fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Submit Work <span className="wf-note">Intern Module</span></div>
          <div className="page-subtitle">Submit assigned task work for trainer review.</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('intern-tasks')}>Back to Tasks</button>
      </div>

      <div className="two-col">
        <div className="admin-card">
          <div className="admin-card-header"><div className="admin-card-title">Task Details</div></div>
          <div className="admin-card-body">
            <div className="intern-field-row"><strong>Task</strong><span>{selectedTask?.title || 'No pending task'}</span></div>
            <div className="intern-field-row"><strong>Project</strong><span>{selectedTask?.project_title || '—'}</span></div>
            <div className="intern-field-row"><strong>Priority</strong><span>{selectedTask?.priority || '—'}</span></div>
            <div className="intern-field-row"><strong>Due Date</strong><span>{selectedTask?.due_date ? new Date(selectedTask.due_date).toLocaleDateString('en-US') : '—'}</span></div>
            <div className="intern-field-row"><strong>Description</strong><span>{selectedTask?.description || 'Select a task from the form to view instructions.'}</span></div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header"><div className="admin-card-title">Submission Form</div></div>
          <div className="admin-card-body">
            <form className="intern-form" onSubmit={onSubmit}>
              <label>Task</label>
              <select name="taskId" value={form.taskId} onChange={onChange} required>
                <option value="">Select a task</option>
                {pendingTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>

              <label>GitHub / Repository URL</label>
              <input type="url" name="githubUrl" value={form.githubUrl} onChange={onChange} placeholder="https://github.com/your-repo" required />

              <label>Live Demo URL (optional)</label>
              <input type="url" name="demoUrl" value={form.demoUrl} onChange={onChange} placeholder="https://your-app.vercel.app" />

              <label>Attachment URL (optional)</label>
              <input type="url" name="fileUrl" value={form.fileUrl} onChange={onChange} placeholder="https://drive.google.com/..." />

              <label>Notes to Trainer</label>
              <textarea name="notes" value={form.notes} onChange={onChange} rows={3} placeholder="Add implementation notes, assumptions, and known limitations..." />

              {error && <div className="error-banner">{error}</div>}
              {success && <div className="intern-success">{success}</div>}

              <button type="submit" className="btn btn-primary" disabled={submitting || !pendingTasks.length}>
                {submitting ? 'Submitting...' : pendingTasks.length ? 'Submit for Review' : 'No Pending Tasks'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header"><div className="admin-card-title">Recent Submissions</div></div>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Attempt</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.slice(0, 6).map((item) => (
                <tr key={item.id}>
                  <td>{item.task_title || `Task #${item.task_id}`}</td>
                  <td>#{item.attempt_no}</td>
                  <td><Badge variant={item.status === 'reviewed' ? 'green' : 'yellow'}>{item.status.replace('_', ' ')}</Badge></td>
                  <td>{new Date(item.submitted_at).toLocaleDateString('en-US')}</td>
                </tr>
              ))}
              {!submissions.length && (
                <tr>
                  <td colSpan={4} className="time-muted">No submissions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InternSubmit;
