import React from 'react';

const TrainerPanel = () => {
    return (
        <div style={{ padding: '20px' }}>
            <h1>Trainer Panel</h1>
            <p>Manage submissions and evaluate interns.</p>
            <div style={{ border: '1px solid #ddd', padding: '10px', marginTop: '20px' }}>
                <h3>Recent Submissions</h3>
                <ul>
                    <li>Intern One - Setup Repository (Submitted)</li>
                </ul>
            </div>
        </div>
    );
};

export default TrainerPanel;
