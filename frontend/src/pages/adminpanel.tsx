import React from 'react';

const AdminPanel: React.FC = () => {
    return (
        <div style={{ padding: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #333', marginBottom: '20px' }}>
                <h1>Admin Dashboard</h1>
                <nav>
                    <button style={{ margin: '0 5px' }}>Users</button>
                    <button style={{ margin: '0 5px' }}>Cohorts</button>
                    <button style={{ margin: '0 5px' }}>Projects</button>
                    <button style={{ margin: '0 5px', color: 'red' }}>Logout</button>
                </nav>
            </header>
            <main>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                        <h3>Total Users</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>4</p>
                    </div>
                    <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                        <h3>Active Cohorts</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>2</p>
                    </div>
                    <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                        <h3>Open Projects</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>2</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminPanel;
