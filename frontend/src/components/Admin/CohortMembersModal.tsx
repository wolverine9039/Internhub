import React, { useState, useEffect, useCallback } from 'react';
import '@/components/Shared/ConfirmDialog.css';
import LoadingWave from '@/components/Shared/LoadingWave';
import UserRow from '@/components/Shared/UserRow';

interface Intern {
  id: number;
  name: string;
  email: string;
  is_active?: boolean;
}

interface CohortMembersModalProps {
  isOpen: boolean;
  cohort: { id: number; name: string } | null;
  onClose: () => void;
}

const CohortMembersModal: React.FC<CohortMembersModalProps> = ({ isOpen, cohort, onClose }) => {
  const [members, setMembers] = useState<Intern[]>([]);
  const [unassigned, setUnassigned] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = useCallback(async () => {
    if (!cohort) return;
    setLoading(true);
    setError('');
    const authToken = localStorage.getItem('token');
    const authHeaders = { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' };
    try {
      const [membersRes, unassignedRes] = await Promise.all([
        fetch(`/api/cohorts/${cohort.id}/members`, { headers: authHeaders }).then(r => r.json()),
        fetch('/api/cohorts/meta/unassigned-interns', { headers: authHeaders }).then(r => r.json()),
      ]);
      setMembers(membersRes);
      setUnassigned(unassignedRes);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [cohort]);

  useEffect(() => {
    if (isOpen && cohort) fetchData();
  }, [isOpen, cohort, fetchData]);

  const handleAdd = async (internId: number) => {
    if (!cohort) return;
    setActing(internId);
    setError('');
    try {
      const resp = await fetch(`/api/cohorts/${cohort.id}/members`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ intern_id: internId }),
      });
      if (!resp.ok) throw new Error('Failed to add intern');
      const intern = unassigned.find(u => u.id === internId);
      if (intern) {
        setMembers(prev => [...prev, intern].sort((a, b) => a.name.localeCompare(b.name)));
        setUnassigned(prev => prev.filter(u => u.id !== internId));
      }
    } catch {
      setError('Failed to add intern');
    } finally {
      setActing(null);
    }
  };

  const handleRemove = async (internId: number) => {
    if (!cohort) return;
    setActing(internId);
    setError('');
    try {
      const resp = await fetch(`/api/cohorts/${cohort.id}/members/${internId}`, {
        method: 'DELETE',
        headers,
      });
      if (!resp.ok) throw new Error('Failed to remove intern');
      const intern = members.find(m => m.id === internId);
      if (intern) {
        setUnassigned(prev => [...prev, { id: intern.id, name: intern.name, email: intern.email }].sort((a, b) => a.name.localeCompare(b.name)));
        setMembers(prev => prev.filter(m => m.id !== internId));
      }
    } catch {
      setError('Failed to remove intern');
    } finally {
      setActing(null);
    }
  };

  if (!isOpen || !cohort) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} aria-hidden="true">
      <dialog open className="modal-card" style={{ maxWidth: '580px', padding: 0, margin: 0 }} aria-modal="true" aria-label="Manage Interns">
        <div className="modal-header">
          <h3 className="modal-title">Manage Interns — {cohort.name}</h3>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {error && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(255, 99, 99, 0.12)',
              borderRadius: '4px',
              color: 'var(--accent2)',
              fontSize: '12px',
              marginBottom: '12px',
            }}>{error}</div>
          )}

          {loading ? (
            <LoadingWave />
          ) : (
            <>
              {/* Current Members */}
              <div style={{ marginBottom: '20px' }}>
                <div className="form-label" style={{ marginBottom: '8px', fontSize: '12px' }}>
                  Current Interns ({members.length})
                </div>
                {members.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--muted)', padding: '12px 0' }}>
                    No interns in this cohort yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {members.map(m => (
                      <UserRow
                        key={m.id}
                        name={m.name}
                        email={m.email}
                        actionLabel="Remove"
                        isActing={acting === m.id}
                        onAction={() => handleRemove(m.id)}
                        variant="assigned"
                        avatarGradient="linear-gradient(135deg, #f5c542, #e67e22)"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Unassigned Interns */}
              {unassigned.length > 0 && (
                <div>
                  <div className="form-label" style={{ marginBottom: '8px', fontSize: '12px' }}>
                    Unassigned Interns ({unassigned.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {unassigned.map(u => (
                      <UserRow
                        key={u.id}
                        name={u.name}
                        email={u.email}
                        actionLabel="+ Add"
                        isActing={acting === u.id}
                        onAction={() => handleAdd(u.id)}
                        variant="available"
                      />
                    ))}
                  </div>
                </div>
              )}

              {unassigned.length === 0 && members.length > 0 && (
                <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '8px 0' }}>
                  All interns have been assigned to a cohort.
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </dialog>
    </div>
  );
};

export default CohortMembersModal;
