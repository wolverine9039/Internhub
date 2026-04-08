import React, { useState, useEffect, useCallback } from 'react';
import Pagination from '@/components/Shared/Pagination';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import ProjectFormModal from './ProjectFormModal';
import { projectService } from '@/services/projectService';
import type { Project, PaginatedResponse, ProjectFormData } from '@/types';
import { getErrorMessage } from '@/utils/errorUtils';

interface AdminProjectsProps {
    onNavigate: (screen: string) => void;
}

const AdminProjects: React.FC<AdminProjectsProps> = () => {
    const [data, setData] = useState<PaginatedResponse<Project> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [formOpen, setFormOpen] = useState(false);
    const [editProject, setEditProject] = useState<Project | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

    const fetchProjects = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const result = await projectService.getProjects({ page, page_size: 10, sort: '-created_at' });
            setData(result);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load projects'));
        } finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const handleCreate = async (formData: ProjectFormData) => {
        try { await projectService.createProject(formData); setFormOpen(false); fetchProjects(); }
        catch (err: unknown) { alert(getErrorMessage(err, 'Failed to create project')); }
    };

    const handleEdit = async (formData: ProjectFormData) => {
        if (!editProject) return;
        try { await projectService.updateProject(editProject.id, formData); setEditProject(null); setFormOpen(false); fetchProjects(); }
        catch (err: unknown) { alert(getErrorMessage(err, 'Failed to update project')); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { await projectService.deleteProject(deleteTarget.id); setDeleteTarget(null); fetchProjects(); }
        catch (err: unknown) { alert(getErrorMessage(err, 'Failed to delete project')); }
    };

    return (
        <div className="screen-admin-projects fade-in">
            <div className="page-header">
                <div>
                    <div className="page-title">Project Management <span className="wf-note">Admin View</span></div>
                    <div className="page-subtitle">All active and past projects</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditProject(null); setFormOpen(true); }}>+ New Project</button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {loading ? (
                      <div className="loader-wrapper">
        <div className="loading-wave">
          <div className="loading-bar"></div>
          <div className="loading-bar"></div>
          <div className="loading-bar"></div>
          <div className="loading-bar"></div>
        </div>
      </div>
            ) : (
                <div className="admin-card">
                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Description</th>
                                    <th>Cohort ID</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.items.map(project => (
                                    <tr key={project.id}>
                                        <td><strong>{project.title}</strong></td>
                                        <td className="time-muted">{project.description || '—'}</td>
                                        <td className="time-muted">{project.cohort_id}</td>
                                        <td className="time-muted">{new Date(project.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-secondary btn-sm" onClick={() => { setEditProject(project); setFormOpen(true); }}>Edit</button>
                                                <button className="btn btn-secondary btn-sm" style={{ color: 'var(--accent2)' }} onClick={() => setDeleteTarget(project)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {data?.items.length === 0 && (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No projects found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {data && <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />}
                </div>
            )}

            <ProjectFormModal isOpen={formOpen} editProject={editProject} onSubmit={editProject ? handleEdit : handleCreate} onClose={() => { setFormOpen(false); setEditProject(null); }} />
            <ConfirmDialog isOpen={!!deleteTarget} title="Delete Project" message={`Delete "${deleteTarget?.title}"? This cannot be undone.`} confirmLabel="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
        </div>
    );
};

export default AdminProjects;
