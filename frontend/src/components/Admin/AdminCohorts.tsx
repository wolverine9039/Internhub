import React, { useState, useEffect, useCallback } from 'react';
import Badge from '@/components/Shared/Badge';
import Pagination from '@/components/Shared/Pagination';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import CohortFormModal from './CohortFormModal';
import { cohortService } from '@/services/cohortService';
import type { Cohort, PaginatedResponse } from '@/types';

interface AdminCohortsProps {
    onNavigate: (screen: string) => void;
}

const AdminCohorts: React.FC<AdminCohortsProps> = () => {
    const [data, setData] = useState<PaginatedResponse<Cohort> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [formOpen, setFormOpen] = useState(false);
    const [editCohort, setEditCohort] = useState<Cohort | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Cohort | null>(null);

    const fetchCohorts = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const result = await cohortService.getCohorts({ page, page_size: 10, sort: '-created_at' });
            setData(result);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load cohorts');
        } finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchCohorts(); }, [fetchCohorts]);

    const handleCreate = async (formData: any) => {
        try { await cohortService.createCohort(formData); setFormOpen(false); fetchCohorts(); }
        catch (err: any) { alert(err.response?.data?.error?.message || 'Failed to create cohort'); }
    };

    const handleEdit = async (formData: any) => {
        if (!editCohort) return;
        try { await cohortService.updateCohort(editCohort.id, formData); setEditCohort(null); setFormOpen(false); fetchCohorts(); }
        catch (err: any) { alert(err.response?.data?.error?.message || 'Failed to update cohort'); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { await cohortService.deleteCohort(deleteTarget.id); setDeleteTarget(null); fetchCohorts(); }
        catch (err: any) { alert(err.response?.data?.error?.message || 'Failed to delete cohort'); }
    };

    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="screen-admin-cohorts fade-in">
            <div className="page-header">
                <div>
                    <div className="page-title">Cohort Management <span className="wf-note">Admin View</span></div>
                    <div className="page-subtitle">Training batches and enrollment</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditCohort(null); setFormOpen(true); }}>+ New Cohort</button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {loading ? (
                <div className="loading-container"><div className="loading-spinner" /> Loading cohorts…</div>
            ) : (
                <div className="admin-card">
                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.items.map(cohort => (
                                    <tr key={cohort.id}>
                                        <td><strong>{cohort.name}</strong></td>
                                        <td className="time-muted">{cohort.description || '—'}</td>
                                        <td className="time-muted">{formatDate(cohort.start_date)}</td>
                                        <td className="time-muted">{formatDate(cohort.end_date)}</td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-secondary btn-sm" onClick={() => { setEditCohort(cohort); setFormOpen(true); }}>Edit</button>
                                                <button className="btn btn-secondary btn-sm" style={{ color: 'var(--accent2)' }} onClick={() => setDeleteTarget(cohort)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {data?.items.length === 0 && (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No cohorts found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {data && <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />}
                </div>
            )}

            <CohortFormModal isOpen={formOpen} editCohort={editCohort} onSubmit={editCohort ? handleEdit : handleCreate} onClose={() => { setFormOpen(false); setEditCohort(null); }} />
            <ConfirmDialog isOpen={!!deleteTarget} title="Delete Cohort" message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
        </div>
    );
};

export default AdminCohorts;
