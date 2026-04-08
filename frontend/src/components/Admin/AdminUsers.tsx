import React, { useState, useEffect, useCallback } from 'react';
import Badge from '@/components/Shared/Badge';
import Pagination from '@/components/Shared/Pagination';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import UserFormModal from './UserFormModal';
import TrainerAssignModal from './TrainerAssignModal';
import { userService } from '@/services/userService';
import type { User, PaginatedResponse, UserFormData } from '@/types';
import { getErrorMessage } from '@/utils/errorUtils';

interface AdminUsersProps {
    onNavigate: (screen: string) => void;
}

const AdminUsers: React.FC<AdminUsersProps> = () => {
    const [data, setData] = useState<PaginatedResponse<User> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);

    // Modal state
    const [formOpen, setFormOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [assignTarget, setAssignTarget] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await userService.getUsers({
                page, page_size: 10, sort: '-created_at',
                ...(roleFilter && { role: roleFilter }),
                ...(search && { search }),
            });
            setData(result);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load users'));
        } finally {
            setLoading(false);
        }
    }, [page, roleFilter, search]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Debounced search
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const handleCreate = async (formData: UserFormData) => {
        try {
            await userService.createUser({
                ...formData,
                password: formData.password || '',
            });
            setFormOpen(false);
            fetchUsers();
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Failed to create user'));
        }
    };

    const handleEdit = async (formData: UserFormData) => {
        if (!editUser) return;
        try {
            await userService.updateUser(editUser.id, formData);
            setEditUser(null);
            fetchUsers();
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Failed to update user'));
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await userService.deleteUser(deleteTarget.id);
            setDeleteTarget(null);
            fetchUsers();
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Failed to delete user'));
        }
    };

    const roleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'red';
            case 'trainer': return 'blue';
            case 'intern': return 'yellow';
            default: return 'gray';
        }
    };

    return (
        <div className="screen-admin-users fade-in">
            <div className="page-header">
                <div>
                    <div className="page-title">User Management <span className="wf-note">Admin View</span></div>
                    <div className="page-subtitle">Manage all system users</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditUser(null); setFormOpen(true); }}>+ Create User</button>
            </div>
            
            <div className="search-row">
                <input className="search-input" placeholder="🔍  Search users…" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
                {['', 'admin', 'trainer', 'intern'].map(r => (
                    <div key={r} className={`filter-chip ${roleFilter === r ? 'active' : ''}`} onClick={() => { setRoleFilter(r); setPage(1); }}>
                        {r || 'All'}
                    </div>
                ))}
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
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.items.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="avatar micro">{user.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}</div>
                                                {user.name}
                                            </div>
                                        </td>
                                        <td className="time-muted">{user.email}</td>
                                        <td><Badge variant={roleBadgeColor(user.role)}>{user.role}</Badge></td>
                                        <td><Badge variant={user.is_active ? 'green' : 'gray'}>{user.is_active ? 'Active' : 'Inactive'}</Badge></td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-secondary btn-sm" onClick={() => { setEditUser(user); setFormOpen(true); }}>Edit</button>
                                                {user.role === 'intern' && (
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ color: 'var(--accent3)' }}
                                                        onClick={() => setAssignTarget(user)}
                                                    >
                                                        Assign Trainer
                                                    </button>
                                                )}
                                                <button className="btn btn-secondary btn-sm" style={{ color: 'var(--accent2)' }} onClick={() => setDeleteTarget(user)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {data?.items.length === 0 && (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No users found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {data && <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />}
                </div>
            )}

            <UserFormModal
                isOpen={formOpen}
                editUser={editUser}
                onSubmit={editUser ? handleEdit : handleCreate}
                onClose={() => { setFormOpen(false); setEditUser(null); }}
            />

            <TrainerAssignModal
                isOpen={!!assignTarget}
                user={assignTarget}
                onClose={() => setAssignTarget(null)}
                onAssigned={fetchUsers}
            />

            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Delete User"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default AdminUsers;
