import React from 'react';

const MetricCardTailwind = ({ title, value, unit, percentage, status = 'normal' }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-warning-50 to-warning-100',
          border: 'border-warning-200',
          accent: 'text-warning-600',
          progress: 'bg-warning-500',
          icon: '⚠️'
        };
      case 'danger':
        return {
          bg: 'bg-gradient-to-br from-danger-50 to-danger-100',
          border: 'border-danger-200',
          accent: 'text-danger-600',
          progress: 'bg-danger-500',
          icon: '🚨'
        };
      case 'good':
        return {
          bg: 'bg-gradient-to-br from-success-50 to-success-100',
          border: 'border-success-200',
          accent: 'text-success-600',
          progress: 'bg-success-500',
          icon: '✅'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-primary-50 to-primary-100',
          border: 'border-primary-200',
          accent: 'text-primary-600',
          progress: 'bg-primary-500',
          icon: '📊'
        };
    }
  };

  const statusClasses = getStatusClasses();

  return (
    <div className={`${statusClasses.bg} ${statusClasses.border} border rounded-xl p-5 text-center min-h-[140px] flex flex-col justify-between transition-all duration-300 hover:shadow-card-hover hover:scale-105`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-600 text-sm font-medium uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-lg">{statusClasses.icon}</span>
      </div>

      {/* Value */}
      <div className="flex-1 flex items-center justify-center">
        <div className={`text-3xl font-bold ${statusClasses.accent} font-mono`}>
          {typeof value === 'number' ? value.toFixed(1) : value}
          <span className="text-lg font-normal ml-1">{unit}</span>
        </div>
      </div>

      {/* Progress Bar (if percentage provided) */}
      {percentage !== undefined && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full ${statusClasses.progress} transition-all duration-500 ease-out`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {percentage?.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="absolute top-2 right-2 opacity-30">
        <div className={`w-2 h-2 rounded-full ${statusClasses.progress}`}></div>
      </div>
    </div>
  );
};

export default MetricCardTailwind;
