import React from 'react';
import { 
  MdBarChart, 
  MdMemory, 
  MdNetworkWifi, 
  MdThermostat,
  MdComputer,
  MdTrendingUp,
  MdTrendingDown,
  MdTrendingFlat
} from 'react-icons/md';

const LineChartTailwind = ({ data, title, color = '#3b82f6', height = 200, icon = 'default' }) => {
  const getIcon = () => {
    const iconStyle = { fontSize: '18px', color };
    switch (icon) {
      case 'cpu': return <MdComputer style={iconStyle} />;
      case 'memory': return <MdMemory style={iconStyle} />;
      case 'network': return <MdNetworkWifi style={iconStyle} />;
      case 'temperature': return <MdThermostat style={iconStyle} />;
      default: return <MdBarChart style={iconStyle} />;
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6" style={{ height: height + 80 }}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          {getIcon()}
          {title}
        </h3>
        <div className="flex items-center justify-center text-gray-400" style={{ height: height }}>
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <p>Waiting for data...</p>
          </div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.filter(v => typeof v === 'number' && !isNaN(v)));
  const minValue = Math.min(...data.filter(v => typeof v === 'number' && !isNaN(v)));
  const range = maxValue - minValue || 1;
  const avgValue = data.reduce((a, b) => a + (typeof b === 'number' && !isNaN(b) ? b : 0), 0) / data.length;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const safeValue = typeof value === 'number' && !isNaN(value) && isFinite(value) ? value : 0;
    const normalizedValue = Math.max(minValue, Math.min(maxValue, safeValue));
    const y = 100 - ((normalizedValue - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const fillPoints = `0,100 ${points} 100,100`;

  // Generate grid lines
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = (i / 4) * 100;
    gridLines.push(y);
  }

  const formatValue = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(1);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {getIcon()}
          {title}
        </h3>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Current: </span>
          <span className="font-mono font-bold" style={{ color }}>
            {formatValue(data[data.length - 1])}
          </span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative bg-gray-50 rounded-lg p-3">
        <svg 
          className="w-full"
          style={{ height: height }}
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.05 }} />
            </linearGradient>
          </defs>
          
          {/* Grid Lines */}
          {gridLines.map((y, index) => (
            <line
              key={index}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          ))}

          {/* Area Fill */}
          <polygon
            points={fillPoints}
            fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
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

          {/* Data Points */}
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
              />
            );
          })}
        </svg>
      </div>

      {/* Simple Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase">Min</p>
          <p className="text-sm font-mono font-bold text-gray-700">
            {formatValue(minValue)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase">Avg</p>
          <p className="text-sm font-mono font-bold" style={{ color }}>
            {formatValue(avgValue)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase">Max</p>
          <p className="text-sm font-mono font-bold text-gray-700">
            {formatValue(maxValue)}
          </p>
        </div>
      </div>

      {/* Simple Trend */}
      <div className="mt-3 flex items-center justify-center">
        {data.length >= 2 && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            data[data.length - 1] > data[data.length - 2]
              ? 'text-green-700 bg-green-100'
              : data[data.length - 1] < data[data.length - 2]
              ? 'text-red-700 bg-red-100'
              : 'text-gray-700 bg-gray-100'
          }`}>
            {data[data.length - 1] > data[data.length - 2] ? (
              <MdTrendingUp className="text-sm" />
            ) : data[data.length - 1] < data[data.length - 2] ? (
              <MdTrendingDown className="text-sm" />
            ) : (
              <MdTrendingFlat className="text-sm" />
            )}
            <span>
              {data[data.length - 1] > data[data.length - 2] ? 'Rising' : 
               data[data.length - 1] < data[data.length - 2] ? 'Falling' : 'Stable'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LineChartTailwind;
