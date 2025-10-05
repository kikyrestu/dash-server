import React from 'react';

const LineChart = ({ data, title, color = '#3b82f6', height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        height: height + 80
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#374151' }}>{title}</h3>
        <div style={{
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af'
        }}>
          Waiting for data...
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.filter(v => typeof v === 'number' && !isNaN(v)));
  const minValue = Math.min(...data.filter(v => typeof v === 'number' && !isNaN(v)));
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const safeValue = typeof value === 'number' && !isNaN(value) && isFinite(value) ? value : 0;
    const normalizedValue = Math.max(minValue, Math.min(maxValue, safeValue));
    const y = 100 - ((normalizedValue - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const fillPoints = `0,100 ${points} 100,100`;

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, color: '#374151' }}>{title}</h3>
        <div style={{
          display: 'flex',
          gap: '15px',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <span>Max: {maxValue.toFixed(1)}</span>
          <span>Current: {data[data.length - 1]?.toFixed(1)}</span>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <svg
          width="100%"
          height={height}
          style={{ display: 'block' }}
          viewBox={`0 0 100 100`}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Area fill */}
          <polygon
            points={fillPoints}
            fill={`${color}20`}
            stroke="none"
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const safeValue = typeof value === 'number' && !isNaN(value) && isFinite(value) ? value : 0;
            const normalizedValue = Math.max(minValue, Math.min(maxValue, safeValue));
            const y = 100 - ((normalizedValue - minValue) / range) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                fill={color}
                opacity={index === data.length - 1 ? 1 : 0.6}
              />
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div style={{
          position: 'absolute',
          left: '-50px',
          top: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: '#6b7280'
        }}>
          <span>{maxValue.toFixed(0)}</span>
          <span>{((maxValue + minValue) / 2).toFixed(0)}</span>
          <span>{minValue.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
};

export default LineChart;
