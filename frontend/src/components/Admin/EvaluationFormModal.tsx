import React, { useState, useEffect } from 'react';
import { submissionService } from '@/services/submissionService';
import { userService } from '@/services/userService';
import type { Evaluation, Submission, User, EvaluationFormData } from '@/types';
import { getErrorMessage } from '@/utils/errorUtils';
import '@/components/Shared/ConfirmDialog.css';

interface EvaluationFormModalProps {
  isOpen: boolean;
  editEvaluation?: Evaluation | null;
  onSubmit: (data: EvaluationFormData) => Promise<void>;
  onClose: () => void;
}

const EvaluationFormModal: React.FC<EvaluationFormModalProps> = ({ isOpen, editEvaluation, onSubmit, onClose }) => {
  const [submissionId, setSubmissionId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [codeQuality, setCodeQuality] = useState(1);
  const [functionality, setFunctionality] = useState(1);
  const [documentation, setDocumentation] = useState(1);
  const [timeliness, setTimeliness] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [trainers, setTrainers] = useState<User[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      submissionService.getSubmissions({ page_size: 100, status: 'submitted' }).then(res => setSubmissions(res.items)).catch(console.error);
      userService.getUsers({ role: 'trainer', page_size: 100 }).then(res => setTrainers(res.items)).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (editEvaluation) {
      setSubmissionId(String(editEvaluation.submission_id));
      setTrainerId(String(editEvaluation.trainer_id));
      setCodeQuality(editEvaluation.code_quality || 1);
      setFunctionality(editEvaluation.functionality || 1);
      setDocumentation(editEvaluation.documentation || 1);
      setTimeliness(editEvaluation.timeliness || 1);
      setFeedback(editEvaluation.feedback || '');
      setStrengths(editEvaluation.strengths || '');
      setImprovements(editEvaluation.improvements || '');
    } else {
      setSubmissionId(''); setTrainerId(''); setCodeQuality(1); setFunctionality(1); setDocumentation(1); setTimeliness(1);
      setFeedback(''); setStrengths(''); setImprovements('');
    }
    setErrors({});
  }, [editEvaluation, isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!submissionId) e.submission_id = 'Submission is required';
    if (!trainerId) e.trainer_id = 'Evaluator is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const calculateScore = () => {
    return Math.round(((codeQuality + functionality + documentation + timeliness) / 40) * 100);
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      await onSubmit({
        submission_id: Number(submissionId),
        trainer_id: Number(trainerId),
        code_quality: codeQuality,
        functionality,
        documentation,
        timeliness,
        score: calculateScore(),
        feedback,
        strengths,
        improvements
      });
    } catch (err: unknown) {
      setErrors({ submit: getErrorMessage(err, 'Failed to save evaluation') });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ width: '600px', maxWidth: '90vw' }}>
        <div className="modal-header">
          <h3 className="modal-title">{editEvaluation ? 'Edit Evaluation' : 'New Evaluation'}</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {errors.submit && <div className="error-banner">{errors.submit}</div>}
            
            <div className="two-col">
              <div className="form-group">
                <label className="form-label">Submission</label>
                <select className={`form-input ${errors.submission_id ? 'error' : ''}`} value={submissionId} onChange={e => setSubmissionId(e.target.value)} disabled={!!editEvaluation}>
                  <option value="">Select Submission</option>
                  {submissions.map(s => <option key={s.id} value={s.id}>{s.task_title || `Submission #${s.id}`} ({s.intern_name})</option>)}
                </select>
                {errors.submission_id && <div className="form-error">{errors.submission_id}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Evaluator (Trainer)</label>
                <select className={`form-input ${errors.trainer_id ? 'error' : ''}`} value={trainerId} onChange={e => setTrainerId(e.target.value)}>
                  <option value="">Select Trainer</option>
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {errors.trainer_id && <div className="form-error">{errors.trainer_id}</div>}
              </div>
            </div>

            <div className="form-group">
              <h4 style={{ margin: '15px 0 5px 0', fontSize: '14px', color: 'var(--text-main)' }}>Scores (1-10)</h4>
              <div className="two-col" style={{ gap: '10px' }}>
                <div>
                  <label className="form-label">Code Quality ({codeQuality})</label>
                  <input type="range" min="1" max="10" value={codeQuality} onChange={e => setCodeQuality(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label">Functionality ({functionality})</label>
                  <input type="range" min="1" max="10" value={functionality} onChange={e => setFunctionality(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label">Documentation ({documentation})</label>
                  <input type="range" min="1" max="10" value={documentation} onChange={e => setDocumentation(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label">Timeliness ({timeliness})</label>
                  <input type="range" min="1" max="10" value={timeliness} onChange={e => setTimeliness(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '1rem', fontWeight: 600 }}>
                Overall Score: <span style={{ color: 'var(--accent)', marginLeft: '8px', fontSize: '1.2rem' }}>{calculateScore()}%</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Feedback Notes</label>
              <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="General comments..." />
            </div>

            <div className="two-col">
              <div className="form-group">
                <label className="form-label">Key Strengths</label>
                <textarea className="form-input" style={{ minHeight: '60px', resize: 'vertical' }} value={strengths} onChange={e => setStrengths(e.target.value)} placeholder="e.g. Good variable naming" />
              </div>
              <div className="form-group">
                <label className="form-label">Areas for Improvement</label>
                <textarea className="form-input" style={{ minHeight: '60px', resize: 'vertical' }} value={improvements} onChange={e => setImprovements(e.target.value)} placeholder="e.g. Needs more comments" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>{submitting ? 'Saving...' : (editEvaluation ? 'Save Changes' : 'Create Evaluation')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvaluationFormModal;
