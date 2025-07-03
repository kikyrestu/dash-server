import React from 'react';

const MetricCard = ({ title, value, unit, percentage, status = 'normal' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'warning':
        return '#f59e0b';
      case 'danger':
        return '#ef4444';
      case 'good':
        return '#10b981';
      default:
        return '#3b82f6';
    }
  };

  const getGradient = () => {
    const color = getStatusColor();
    return `linear-gradient(135deg, ${color}20, ${color}05)`;
  };

  return (
    <div style={{
      background: getGradient(),
      border: `1px solid ${getStatusColor()}30`,
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      minHeight: '140px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    }}>
      <h3 style={{
        margin: '0 0 10px 0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {title}
      </h3>
      
      <div style={{
        fontSize: '36px',
        fontWeight: 'bold',
        color: getStatusColor(),
        margin: '10px 0',
        fontFamily: 'monospace'
      }}>
        {value}
        {unit && <span style={{ fontSize: '18px', marginLeft: '4px' }}>{unit}</span>}
      </div>

      {percentage !== undefined && (
        <div style={{
          marginTop: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '100px',
            height: '6px',
            backgroundColor: '#e5e7eb',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(percentage, 100)}%`,
              height: '100%',
              backgroundColor: getStatusColor(),
              borderRadius: '3px',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <span style={{
            fontSize: '12px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
