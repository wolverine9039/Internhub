import React, { useState, useEffect } from 'react';
import '@/components/Shared/ConfirmDialog.css';

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

  const fetchData = async () => {
    if (!cohort) return;
    setLoading(true);
    setError('');
    try {
      const [membersRes, unassignedRes] = await Promise.all([
        fetch(`/api/cohorts/${cohort.id}/members`, { headers }).then(r => r.json()),
        fetch('/api/cohorts/meta/unassigned-interns', { headers }).then(r => r.json()),
      ]);
      setMembers(membersRes);
      setUnassigned(unassignedRes);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && cohort) fetchData();
  }, [isOpen, cohort]);

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
      if (!resp.ok) throw new Error();
      // Move from unassigned to members
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
      if (!resp.ok) throw new Error();
      // Move from members to unassigned
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
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
            <div className="loader-wrapper" style={{ padding: '24px 0' }}>
              <div className="loading-wave">
                <div className="loading-bar"></div>
                <div className="loading-bar"></div>
                <div className="loading-bar"></div>
                <div className="loading-bar"></div>
              </div>
            </div>
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
                      <div key={m.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'var(--surface2)',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f5c542, #e67e22)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#fff',
                          }}>
                            {m.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{m.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{m.email}</div>
                          </div>
                        </div>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--accent2)', fontSize: '11px' }}
                          onClick={() => handleRemove(m.id)}
                          disabled={acting === m.id}
                          type="button"
                        >
                          {acting === m.id ? '...' : 'Remove'}
                        </button>
                      </div>
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
                      <div key={u.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'var(--surface)',
                        borderRadius: '6px',
                        border: '1px dashed var(--border)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: 'var(--surface2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--muted)',
                          }}>
                            {u.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', color: 'var(--text)' }}>{u.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{u.email}</div>
                          </div>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '11px' }}
                          onClick={() => handleAdd(u.id)}
                          disabled={acting === u.id}
                          type="button"
                        >
                          {acting === u.id ? '...' : '+ Add'}
                        </button>
                      </div>
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
      </div>
    </div>
  );
};

export default CohortMembersModal;
