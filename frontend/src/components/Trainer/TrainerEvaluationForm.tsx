import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { trainerService } from '@/services/trainerService';
import type { Submission } from '@/types';

interface TrainerEvaluationFormProps {
  selectedSubmission?: Submission;
  onBack: () => void;
  onSubmitted?: () => void;
}

const scoreButtons = Array.from({ length: 10 }, (_, index) => index + 1);

const TrainerEvaluationForm: React.FC<TrainerEvaluationFormProps> = ({ selectedSubmission, onBack, onSubmitted }) => {
  const { user } = useAuth();
  const [codeQuality, setCodeQuality] = useState<number>(7);
  const [functionality, setFunctionality] = useState<number>(7);
  const [documentation, setDocumentation] = useState<number>(5);
  const [timeliness, setTimeliness] = useState<number>(8);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const totalScore = codeQuality + functionality + documentation + timeliness;

  if (!selectedSubmission) {
    return (
      <div className="view-container fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Evaluation Form</h1>
            <p className="page-subtitle">Select a submission before evaluating.</p>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card-body">
            <p className="empty-state">No submission selected. Go back to submissions and choose a task to evaluate.</p>
            <button className="btn btn-primary btn-sm" onClick={onBack} type="button" style={{ marginTop: '12px' }}>
              Back to Submissions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    setError('');

    try {
      await trainerService.submitEvaluation({
        submission_id: selectedSubmission.id,
        trainer_id: user.id,
        code_quality: codeQuality,
        functionality,
        documentation,
        timeliness,
        score: totalScore,
        strengths,
        improvements,
        feedback: `Strengths: ${strengths}\nImprovements: ${improvements}`,
      });
      setSubmitted(true);
      // Navigate back after brief delay
      setTimeout(() => {
        onSubmitted?.();
        onBack();
      }, 1500);
    } catch (err: any) {
      console.error('Evaluation submission failed', err);
      setError(err.response?.data?.message || 'Failed to submit evaluation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="view-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Evaluation Form</h1>
          <p className="page-subtitle">{selectedSubmission.task_title} — {selectedSubmission.intern_name}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onBack} type="button">
          ← Back
        </button>
      </div>

      <div className="two-col">
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Submission Details</div>
          </div>
          <div className="admin-card-body">
            <div className="detail-row">
              <strong>Intern</strong>
              <span>{selectedSubmission.intern_name}</span>
            </div>
            <div className="detail-row">
              <strong>Task</strong>
              <span>{selectedSubmission.task_title}</span>
            </div>
            <div className="detail-row">
              <strong>Submitted</strong>
              <span>{new Date(selectedSubmission.submitted_at).toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <strong>Repository</strong>
              <a href={selectedSubmission.github_url} target="_blank" rel="noreferrer" className="link-button">
                View GitHub
              </a>
            </div>
            {selectedSubmission.demo_url && (
              <div className="detail-row">
                <strong>Demo</strong>
                <a href={selectedSubmission.demo_url} target="_blank" rel="noreferrer" className="link-button">
                  View Demo
                </a>
              </div>
            )}
            <div className="detail-row detail-notes">
              <strong>Notes</strong>
              <span>{selectedSubmission.notes || 'No notes provided'}</span>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Scoring Criteria</div>
          </div>
          <div className="admin-card-body">
            {[
              { label: 'Code Quality', value: codeQuality, setter: setCodeQuality },
              { label: 'Functionality', value: functionality, setter: setFunctionality },
              { label: 'Documentation', value: documentation, setter: setDocumentation },
              { label: 'Timeliness', value: timeliness, setter: setTimeliness },
            ].map((item) => (
              <div key={item.label} className="score-group">
                <div className="score-label">{item.label} (1–10)</div>
                <div className="score-buttons">
                  {scoreButtons.map((score) => (
                    <button
                      key={score}
                      type="button"
                      className={`score-button ${item.value === score ? 'active' : ''}`}
                      onClick={() => item.setter(score)}
                      disabled={submitted}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: '16px' }}>
        <div className="admin-card-header">
          <div className="admin-card-title">Written Feedback</div>
        </div>
        <div className="admin-card-body">
          <div className="feedback-field">
            <label htmlFor="strengths">Strengths</label>
            <textarea
              id="strengths"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={4}
              placeholder="What did the intern do well?"
              disabled={submitted}
            />
          </div>
          <div className="feedback-field">
            <label htmlFor="improvements">Areas for Improvement</label>
            <textarea
              id="improvements"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              rows={4}
              placeholder="What could be improved?"
              disabled={submitted}
            />
          </div>
          <div className="evaluation-footer">
            <div className="total-score">Total: {totalScore}/40</div>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              type="button"
              disabled={submitting || submitted}
            >
              {submitting ? 'Submitting...' : submitted ? 'Submitted ✓' : 'Submit Evaluation'}
            </button>
          </div>
          {error && <div className="error-banner" style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(255, 99, 99, 0.15)', color: 'var(--accent2)' }}>{error}</div>}
          {submitted && <div className="success-banner">Evaluation saved successfully. Redirecting...</div>}
        </div>
      </div>
    </div>
  );
};

export default TrainerEvaluationForm;
