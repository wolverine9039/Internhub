import React, { useEffect, useMemo, useState } from 'react';
import type { User, Task } from '@/types';
import { taskService } from '@/services/taskService';
import Badge from '@/components/Shared/Badge';
import './InternModule.css';
import LoadingWave from '@/components/Shared/LoadingWave';

interface InternTasksProps {
  user: User | null;
}

function dueLabel(value?: string | null) {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const InternTasks: React.FC<InternTasksProps> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setTasks([]);
        setLoading(false);
        return;
      }

      try {
        const res = await taskService.getTasks({ assigned_to: user.id, page: 1, page_size: 300, sort: 'due_date' });
        setTasks(res.items);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user?.id]);

  const columns = useMemo(() => {
    const todo = tasks.filter((task) => task.status === 'pending' || task.status === 'overdue');
    const inProgress = tasks.filter((task) => task.status === 'in_progress');
    const done = tasks.filter((task) => task.status === 'submitted' || task.status === 'completed');

    return { todo, inProgress, done };
  }, [tasks]);

  if (loading) {
    return (
      <LoadingWave />
    );
  }

  return (
    <div className="intern-module fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">My Tasks <span className="wf-note">Intern Module</span></div>
          <div className="page-subtitle">All tasks assigned to you.</div>
        </div>
      </div>

      <div className="intern-kanban">
        <div className="admin-card">
          <div className="admin-card-header"><div className="admin-card-title">To Do ({columns.todo.length})</div></div>
          <div className="admin-card-body">
            {columns.todo.map((task) => (
              <div key={task.id} className="intern-kanban-card">
                <div className="intern-item-title">{task.title}</div>
                <div className="intern-item-meta">Due {dueLabel(task.due_date)} · {task.project_title || 'Project'}</div>
                <div className="intern-card-foot">
                  <Badge variant={task.status === 'overdue' ? 'red' : 'gray'}>{task.status === 'overdue' ? 'Overdue' : 'Pending'}</Badge>
                  <Badge variant="yellow">{task.priority}</Badge>
                </div>
              </div>
            ))}
            {!columns.todo.length && <div className="page-subtitle">No pending tasks.</div>}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header"><div className="admin-card-title">In Progress ({columns.inProgress.length})</div></div>
          <div className="admin-card-body">
            {columns.inProgress.map((task) => (
              <div key={task.id} className="intern-kanban-card">
                <div className="intern-item-title">{task.title}</div>
                <div className="intern-item-meta">Due {dueLabel(task.due_date)} · {task.project_title || 'Project'}</div>
                <div className="intern-progress-bar"><div className="intern-progress-fill" /></div>
                <div className="intern-card-foot"><Badge variant="yellow">In Progress</Badge></div>
              </div>
            ))}
            {!columns.inProgress.length && <div className="page-subtitle">No in-progress tasks.</div>}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header"><div className="admin-card-title">Submitted / Done ({columns.done.length})</div></div>
          <div className="admin-card-body">
            {columns.done.map((task) => (
              <div key={task.id} className="intern-kanban-card">
                <div className="intern-item-title">{task.title}</div>
                <div className="intern-item-meta">Due {dueLabel(task.due_date)} · {task.project_title || 'Project'}</div>
                <div className="intern-card-foot">
                  <Badge variant={task.status === 'completed' ? 'green' : 'blue'}>{task.status === 'completed' ? 'Completed' : 'Submitted'}</Badge>
                  <Badge variant="gray">{task.priority}</Badge>
                </div>
              </div>
            ))}
            {!columns.done.length && <div className="page-subtitle">No submitted tasks yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternTasks;
