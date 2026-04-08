import React, { useState, useEffect } from 'react';
import '@/components/Shared/ConfirmDialog.css';
import LoadingWave from '@/components/Shared/LoadingWave';
import UserRow from '@/components/Shared/UserRow';

interface Trainer {
  id: number;
  name: string;
  email: string;
  assigned_at?: string;
}

interface TrainerAssignModalProps {
  isOpen: boolean;
  user: { id: number; name: string; email: string; role: string; cohort_id?: number | null } | null;
  onClose: () => void;
  onAssigned?: () => void;
}

const TrainerAssignModal: React.FC<TrainerAssignModalProps> = ({ isOpen, user, onClose, onAssigned }) => {
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [assignedTrainers, setAssignedTrainers] = useState<Trainer[]>([]);
  const [cohortId, setCohortId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    Promise.all([
      fetch('/api/admin/trainers', { headers }).then(r => r.json()),
      fetch(`/api/admin/users/${user.id}/trainers`, { headers }).then(r => r.json()),
    ])
      .then(([trainers, assignmentData]) => {
        setAllTrainers(trainers);
        setAssignedTrainers(assignmentData.trainers || []);
        setCohortId(assignmentData.cohort_id);
      })
      .catch(() => setError('Failed to load trainer data'))
      .finally(() => setLoading(false));
  }, [isOpen, user]);

  const handleAssign = async (trainerId: number) => {
    if (!cohortId) return;
    setAssigning(trainerId);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('/api/admin/assign-trainer', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohort_id: cohortId, trainer_id: trainerId, action: 'assign' }),
      });
      if (!resp.ok) throw new Error('Failed to assign');

      const trainer = allTrainers.find(t => t.id === trainerId);
      if (trainer) {
        setAssignedTrainers(prev => [...prev, { ...trainer, assigned_at: new Date().toISOString() }]);
      }
      onAssigned?.();
    } catch {
      setError('Failed to assign trainer');
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassign = async (trainerId: number) => {
    if (!cohortId) return;
    setAssigning(trainerId);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('/api/admin/assign-trainer', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohort_id: cohortId, trainer_id: trainerId, action: 'unassign' }),
      });
      if (!resp.ok) throw new Error('Failed to unassign');

      setAssignedTrainers(prev => prev.filter(t => t.id !== trainerId));
      onAssigned?.();
    } catch {
      setError('Failed to unassign trainer');
    } finally {
      setAssigning(null);
    }
  };

  if (!isOpen || !user) return null;

  const assignedIds = new Set(assignedTrainers.map(t => t.id));
  const availableTrainers = allTrainers.filter(t => !assignedIds.has(t.id));

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={e => { if (e.key === 'Escape') onClose(); }} role="presentation">
      <div className="modal-card" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Assign Trainer">
        <div className="modal-header">
          <h3 className="modal-title">Assign Trainer</h3>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' }}>Intern</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{user.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{user.email}</div>
          </div>

          {(() => {
            if (cohortId) {
              if (loading) {
                return (
                  <LoadingWave />
                );
              }
              return (
            <>
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

              {/* Currently assigned trainers */}
              <div style={{ marginBottom: '16px' }}>
                <div className="form-label" style={{ marginBottom: '8px' }}>
                  Assigned Trainers ({assignedTrainers.length})
                </div>
                {assignedTrainers.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--muted)', padding: '12px 0' }}>
                    No trainers assigned yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {assignedTrainers.map(trainer => (
                      <UserRow
                        key={trainer.id}
                        name={trainer.name}
                        email={trainer.email}
                        actionLabel="Remove"
                        isActing={assigning === trainer.id}
                        onAction={() => handleUnassign(trainer.id)}
                        variant="assigned"
                        avatarGradient="linear-gradient(135deg, var(--accent), #7c3aed)"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Available trainers to assign */}
              {availableTrainers.length > 0 && (
                <div>
                  <div className="form-label" style={{ marginBottom: '8px' }}>
                    Available Trainers
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {availableTrainers.map(trainer => (
                      <UserRow
                        key={trainer.id}
                        name={trainer.name}
                        email={trainer.email}
                        actionLabel="+ Assign"
                        isActing={assigning === trainer.id}
                        onAction={() => handleAssign(trainer.id)}
                        variant="available"
                      />
                    ))}
                  </div>
                </div>
              )}

              {availableTrainers.length === 0 && assignedTrainers.length > 0 && (
                <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '8px 0' }}>
                  All trainers have been assigned.
                </div>
              )}
            </>
              );
            }
            return (
              <div style={{
                padding: '20px',
                background: 'rgba(255, 199, 0, 0.08)',
                border: '1px solid rgba(255, 199, 0, 0.3)',
                borderRadius: '6px',
                color: 'var(--accent4)',
                fontSize: '13px',
                textAlign: 'center',
              }}>
                ⚠ This intern is not assigned to any cohort. Please assign a cohort first before assigning trainers.
              </div>
            );
          })()}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default TrainerAssignModal;
