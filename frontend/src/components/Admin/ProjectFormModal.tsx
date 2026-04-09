import React, { useState, useEffect } from 'react';
import '@/components/Shared/ConfirmDialog.css';

interface ProjectFormModalProps {
  isOpen: boolean;
  editProject?: { id: number; title: string; description?: string | null; cohort_id: number; trainer_id?: number | null } | null;
  onSubmit: (data: { title: string; description?: string; cohort_id: number; trainer_id?: number }) => void;
  onClose: () => void;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ isOpen, editProject, onSubmit, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editProject) {
      setTitle(editProject.title);
      setDescription(editProject.description || '');
      setCohortId(String(editProject.cohort_id));
    } else {
      setTitle(''); setDescription(''); setCohortId('');
    }
    setErrors({});
  }, [editProject, isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!cohortId.trim()) e.cohort_id = 'Cohort ID is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (evt: React.SyntheticEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (!validate()) return;
    onSubmit({ title, description: description || undefined, cohort_id: Number(cohortId) });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} aria-hidden="true">
      <dialog open className="modal-card" style={{ border: 'none', padding: 0, margin: 0 }} aria-modal="true" aria-label={editProject ? 'Edit Project' : 'New Project'}>
        <div className="modal-header">
          <h3 className="modal-title">{editProject ? 'Edit Project' : 'New Project'}</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="project-title">Project Title</label>
              <input id="project-title" className={`form-input ${errors.title ? 'error' : ''}`} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. InternHub Platform" />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="project-desc">Description</label>
              <input id="project-desc" className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief project description" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="project-cohort">Cohort ID</label>
              <input id="project-cohort" className={`form-input ${errors.cohort_id ? 'error' : ''}`} type="number" value={cohortId} onChange={e => setCohortId(e.target.value)} placeholder="1" />
              {errors.cohort_id && <div className="form-error">{errors.cohort_id}</div>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">{editProject ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </dialog>
    </div>
  );
};

export default ProjectFormModal;
