import React, { useState, useEffect } from 'react';
import '@/components/Shared/ConfirmDialog.css';

interface UserFormModalProps {
  isOpen: boolean;
  editUser?: { id: number; name: string; email: string; role: string; cohort_id?: number | null; is_active?: boolean } | null;
  onSubmit: (data: { name: string; email: string; password?: string; role: string; cohort_id?: number | null }) => void;
  onClose: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, editUser, onSubmit, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('intern');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editUser) {
      setName(editUser.name);
      setEmail(editUser.email);
      setRole(editUser.role);
      setPassword('');
    } else {
      setName(''); setEmail(''); setPassword(''); setRole('intern');
    }
    setErrors({});
  }, [editUser, isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    if (!editUser && !password.trim()) e.password = 'Password is required';
    if (!role) e.role = 'Role is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (!validate()) return;
    const data: { name: string; email: string; password?: string; role: string } = { name, email, role };
    if (!editUser) data.password = password;
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{editUser ? 'Edit User' : 'Create User'}</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className={`form-input ${errors.name ? 'error' : ''}`} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className={`form-input ${errors.email ? 'error' : ''}`} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@company.com" />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            {!editUser && (
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className={`form-input ${errors.password ? 'error' : ''}`} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="intern">Intern</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">{editUser ? 'Save Changes' : 'Create User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
