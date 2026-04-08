import React from 'react';

const LoadingWave: React.FC = () => {
  return (
    <div className="loader-wrapper">
      <div className="loading-wave">
        <div className="loading-bar"></div>
        <div className="loading-bar"></div>
        <div className="loading-bar"></div>
        <div className="loading-bar"></div>
      </div>
    </div>
  );
};

export default LoadingWave;
