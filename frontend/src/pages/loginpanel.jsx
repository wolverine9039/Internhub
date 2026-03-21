import React from 'react';

const LoginPanel = () => {
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>InternHub Login</h1>
            <form style={{ display: 'inline-block', textAlign: 'left', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Email:</label><br />
                    <input type="email" placeholder="admin@internhub.com" style={{ width: '200px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Password:</label><br />
                    <input type="password" placeholder="admin123" style={{ width: '200px' }} />
                </div>
                <button type="button" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Login
                </button>
            </form>
            <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
                Try login with: admin@internhub.com / admin123
            </p>
        </div>
    );
};

export default LoginPanel;
