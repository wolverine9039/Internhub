import React, { useState, useEffect } from 'react';
import '@/components/Shared/ConfirmDialog.css';

interface CohortFormModalProps {
  isOpen: boolean;
  editCohort?: { id: number; name: string; description?: string | null; start_date?: string | null; end_date?: string | null } | null;
  onSubmit: (data: { name: string; description?: string; start_date?: string; end_date?: string }) => void;
  onClose: () => void;
}

const CohortFormModal: React.FC<CohortFormModalProps> = ({ isOpen, editCohort, onSubmit, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editCohort) {
      setName(editCohort.name);
      setDescription(editCohort.description || '');
      setStartDate(editCohort.start_date?.split('T')[0] || '');
      setEndDate(editCohort.end_date?.split('T')[0] || '');
    } else {
      setName(''); setDescription(''); setStartDate(''); setEndDate('');
    }
    setErrors({});
  }, [editCohort, isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (evt: React.SyntheticEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (!validate()) return;
    onSubmit({ name, description: description || undefined, start_date: startDate || undefined, end_date: endDate || undefined });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{editCohort ? 'Edit Cohort' : 'New Cohort'}</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Cohort Name</label>
              <input className={`form-input ${errors.name ? 'error' : ''}`} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cohort D" />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Track / focus area" />
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">{editCohort ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CohortFormModal;
