import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: "'DM Sans', sans-serif",
      color: '#6b748a',
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0, color: '#e8ecf4' }}>404</h1>
      <p style={{ fontSize: '1.1rem', marginTop: '8px' }}>Page Not Found</p>
      <a href="/" style={{ marginTop: '16px', color: '#5b8cff', textDecoration: 'none' }}>
        ← Back to Login
      </a>
    </div>
  );
};

export default NotFound;
