import React from 'react';

const ConnectionStatus = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Connected':
        return {
          color: '#10b981',
          bg: '#10b98120',
          text: 'Connected',
          dot: true
        };
      case 'Connecting':
        return {
          color: '#f59e0b',
          bg: '#f59e0b20',
          text: 'Connecting...',
          dot: false
        };
      case 'Disconnected':
        return {
          color: '#ef4444',
          bg: '#ef444420',
          text: 'Disconnected',
          dot: false
        };
      case 'Error':
        return {
          color: '#ef4444',
          bg: '#ef444420',
          text: 'Connection Error',
          dot: false
        };
      default:
        return {
          color: '#6b7280',
          bg: '#6b728020',
          text: 'Unknown',
          dot: false
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      borderRadius: '20px',
      backgroundColor: config.bg,
      border: `1px solid ${config.color}30`,
      fontSize: '12px',
      fontWeight: '500'
    }}>
      {config.dot && (
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.color,
          animation: status === 'Connected' ? 'pulse 2s infinite' : 'none'
        }} />
      )}
      {status === 'Connecting' && (
        <div style={{
          width: '12px',
          height: '12px',
          border: `2px solid ${config.color}30`,
          borderTop: `2px solid ${config.color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      )}
      <span style={{ color: config.color }}>
        {config.text}
      </span>
      
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ConnectionStatus;
