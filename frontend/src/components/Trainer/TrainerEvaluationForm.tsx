import React, { useState } from 'react';
import type { Submission } from '@/types';

interface TrainerEvaluationFormProps {
  selectedSubmission?: Submission;
  onBack: () => void;
}

const scoreButtons = Array.from({ length: 10 }, (_, index) => index + 1);

const TrainerEvaluationForm: React.FC<TrainerEvaluationFormProps> = ({ selectedSubmission, onBack }) => {
  const [codeQuality, setCodeQuality] = useState<number>(8);
  const [functionality, setFunctionality] = useState<number>(9);
  const [documentation, setDocumentation] = useState<number>(6);
  const [timeliness, setTimeliness] = useState<number>(10);
  const [strengths, setStrengths] = useState('Clean code structure, good use of middleware pattern. JWT implementation is solid.');
  const [improvements, setImprovements] = useState('Error handling could be more comprehensive. Consider adding input validation with a library like Joi.');
  const [submitted, setSubmitted] = useState(false);

  const totalScore = codeQuality + functionality + documentation + timeliness;

  if (!selectedSubmission) {
    return (
      <div className="view-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Evaluation Form</h1>
            <p className="page-subtitle">Select a submission before evaluating.</p>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card-body">
            <p className="empty-state">No submission selected. Go back to submissions and choose a task to evaluate.</p>
            <button className="btn btn-primary btn-sm" onClick={onBack} type="button">
              Back to Submissions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
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
            <div className="detail-row detail-notes">
              <strong>Notes</strong>
              <span>{selectedSubmission.notes}</span>
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

      <div className="admin-card">
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
            />
          </div>
          <div className="feedback-field">
            <label htmlFor="improvements">Areas for Improvement</label>
            <textarea
              id="improvements"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              rows={4}
            />
          </div>
          <div className="evaluation-footer">
            <div className="total-score">Total: {totalScore}/40</div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setSubmitted(true)}
              type="button"
            >
              Submit Evaluation
            </button>
          </div>
          {submitted && <div className="success-banner">Evaluation saved successfully.</div>}
        </div>
      </div>
    </div>
  );
};

export default TrainerEvaluationForm;
