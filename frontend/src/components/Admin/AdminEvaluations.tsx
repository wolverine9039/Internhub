import React, { useEffect, useState, useCallback } from 'react';
import { evaluationService, EvaluationQueryParams } from '@/services/evaluationService';
import type { Evaluation, EvaluationFormData } from '@/types';
import { getErrorMessage } from '@/utils/errorUtils';
import Pagination from '@/components/Shared/Pagination';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import EvaluationFormModal from './EvaluationFormModal';
import './AdminDashboard.css';
import LoadingWave from '@/components/Shared/LoadingWave';

interface AdminEvaluationsProps {
  onNavigate?: (screen: string) => void;
}

const AdminEvaluations: React.FC<AdminEvaluationsProps> = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEval, setEditingEval] = useState<Evaluation | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchEvaluations = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params: EvaluationQueryParams = { page, page_size: 15 };
      const res = await evaluationService.getEvaluations(params);
      setEvaluations(res.items);
      setPagination({ page: res.page, pages: res.pages, total: res.total });
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to load evaluations');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => fetchEvaluations(1), 300);
    return () => clearTimeout(delay);
  }, [fetchEvaluations]);

  const handleCreate = () => {
    setEditingEval(null);
    setIsFormOpen(true);
  };

  const handleEdit = (evaluation: Evaluation) => {
    setEditingEval(evaluation);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await evaluationService.deleteEvaluation(deleteConfirmId);
      setDeleteConfirmId(null);
      fetchEvaluations(pagination.page);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to delete evaluation');
      setError(errorMessage);
      setDeleteConfirmId(null);
    }
  };

  const onFormSubmit = async (data: EvaluationFormData) => {
    if (editingEval) {
      await evaluationService.updateEvaluation(editingEval.id, data);
    } else {
      await evaluationService.createEvaluation(data);
    }
    setIsFormOpen(false);
    fetchEvaluations(pagination.page);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 70) return 'var(--accent)';
    if (score >= 50) return 'var(--accent2)';
    return 'var(--danger)';
  };

  return (
    <div className="view-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Evaluations Dashboard</h1>
          <p className="page-subtitle">Track and analyze intern performance scores</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>+ Evaluate Submission</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="admin-card">
        {loading ? (
          <LoadingWave />
        ) : evaluations.length === 0 ? (
          <div className="empty-state">No evaluations found</div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Submission ID</th>
                  <th>Scores</th>
                  <th>Overall</th>
                  <th>Feedback Summary</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map(ev => (
                  <tr key={ev.id}>
                    <td>
                      <strong>Sub #{ev.submission_id}</strong>
                      <div className="time-muted">Eval by Trainer #{ev.trainer_id}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                        <div>Code: {ev.code_quality}%</div>
                        <div>Func: {ev.functionality}%</div>
                        <div>Docs: {ev.documentation}%</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '1.2rem', color: getScoreColor(ev.score || 0) }}>
                        {ev.score || 0}%
                      </div>
                    </td>
                    <td style={{ maxWidth: '250px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem' }}>
                        {ev.feedback || 'No feedback provided'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(ev)} style={{ marginRight: '8px' }}>Edit</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirmId(ev.id)} style={{ color: 'var(--accent2)', borderColor: 'rgba(255,107,107,0.3)' }}>Delete</button>
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
          onPageChange={fetchEvaluations} 
        />
      )}

      <EvaluationFormModal 
        isOpen={isFormOpen} 
        editEvaluation={editingEval} 
        onSubmit={onFormSubmit} 
        onClose={() => setIsFormOpen(false)} 
      />

      <ConfirmDialog 
        isOpen={!!deleteConfirmId}
        title="Delete Evaluation"
        message="Are you sure you want to delete this evaluation? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export default AdminEvaluations;
