// AdminSubmissions.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { submissionService, SubmissionQueryParams } from '@/services/submissionService';
import type { Submission } from '@/types';
import { getErrorMessage } from '@/utils/errorUtils';
import Pagination from '@/components/Shared/Pagination';
import Badge from '@/components/Shared/Badge';
import './AdminDashboard.css';

interface AdminSubmissionsProps {
  onNavigate?: (screen: string) => void;
}

const AdminSubmissions: React.FC<AdminSubmissionsProps> = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  // Updates
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchSubmissions = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params: SubmissionQueryParams = { page, page_size: 15 };
      if (statusFilter) params.status = statusFilter;
      
      const res = await submissionService.getSubmissions(params);
      setSubmissions(res.items);
      setPagination({ page: res.page, pages: res.pages, total: res.total });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load submissions'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const delay = setTimeout(() => fetchSubmissions(1), 300);
    return () => clearTimeout(delay);
  }, [fetchSubmissions]);

  const handleStatusUpdate = async (id: number, status: 'reviewed' | 'revision_requested') => {
    try {
      setUpdatingId(id);
      await submissionService.updateSubmissionStatus(id, status);
      fetchSubmissions(pagination.page);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update status'));
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'submitted': return 'gray';
      case 'reviewed': return 'green';
      case 'revision_requested': return 'yellow'; // orange/yellow
      default: return 'gray';
    }
  };

  return (
    <div className="view-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Submissions Review</h1>
          <p className="page-subtitle">Track and review intern project submissions</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="search-row">
        {/* Submissions don't have titles, they tie to tasks, so searching by title requires joining or distinct UI. Assuming we don't have text search for now. */}
        <div style={{ flex: 1 }}></div>
        <div className="filter-chips">
          <button className={`filter-chip ${statusFilter === '' ? 'active' : ''}`} onClick={() => setStatusFilter('')}>All</button>
          <button className={`filter-chip ${statusFilter === 'submitted' ? 'active' : ''}`} onClick={() => setStatusFilter('submitted')}>Submitted</button>
          <button className={`filter-chip ${statusFilter === 'reviewed' ? 'active' : ''}`} onClick={() => setStatusFilter('reviewed')}>Reviewed</button>
          <button className={`filter-chip ${statusFilter === 'revision_requested' ? 'active' : ''}`} onClick={() => setStatusFilter('revision_requested')}>Needs Revision</button>
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
        ) : submissions.length === 0 ? (
          <div className="empty-state">No submissions found</div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Intern</th>
                  <th>Submission Info</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub.id}>
                    <td><strong>{sub.task_title || `Task #${sub.task_id}`}</strong></td>
                    <td>
                      <div className="user-cell">
                        <div className="avatar micro">{sub.intern_name?.substring(0,2).toUpperCase() || 'I'}</div>
                        {sub.intern_name || `Intern #${sub.intern_id}`}
                      </div>
                    </td>
                    <td>
                      {sub.github_url && <a href={sub.github_url} target="_blank" rel="noreferrer" className="stat-value" style={{ fontSize: '0.85rem' }}>GitHub Link</a>}<br/>
                      {sub.demo_url && <a href={sub.demo_url} target="_blank" rel="noreferrer" className="stat-value" style={{ fontSize: '0.85rem' }}>Live Demo</a>}
                    </td>
                    <td><Badge variant={getStatusColor(sub.status)}>{sub.status.replace('_', ' ')}</Badge></td>
                    <td className="time-muted">{new Date(sub.submitted_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      {sub.status === 'submitted' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(sub.id, 'reviewed')} disabled={updatingId === sub.id} style={{ marginRight: '8px' }}>
                            Mark Reviewed
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate(sub.id, 'revision_requested')} disabled={updatingId === sub.id}>
                            Request Revision
                          </button>
                        </>
                      )}
                      {sub.status !== 'submitted' && (
                        <span className="time-muted" style={{ fontSize: '0.85rem' }}>No pending actions</span>
                      )}
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
          onPageChange={fetchSubmissions} 
        />
      )}
    </div>
  );
};

export default AdminSubmissions;
