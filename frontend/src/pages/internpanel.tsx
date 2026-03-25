import React from 'react';

const InternPanel: React.FC = () => {
    return (
        <div style={{ padding: '20px' }}>
            <h1>Intern Panel</h1>
            <p>View your tasks and submit your progress.</p>
            <div style={{ backgroundColor: '#eef', padding: '15px', borderRadius: '8px' }}>
                <h3>Assigned Task: Build Admin Dashboard</h3>
                <p>Status: In Progress</p>
                <button>Submit Task</button>
            </div>
        </div>
    );
};

export default InternPanel;
