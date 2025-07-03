import React from 'react';

const ConnectionStatusTailwind = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Connected':
        return {
          bgClass: 'bg-success-50 border-success-200',
          textClass: 'text-success-700',
          dotClass: 'bg-success-500',
          icon: '🟢',
          text: 'Connected',
          animate: true
        };
      case 'Connecting':
        return {
          bgClass: 'bg-warning-50 border-warning-200',
          textClass: 'text-warning-700',
          dotClass: 'bg-warning-500',
          icon: '🟡',
          text: 'Connecting...',
          animate: false
        };
      case 'Disconnected':
        return {
          bgClass: 'bg-danger-50 border-danger-200',
          textClass: 'text-danger-700',
          dotClass: 'bg-danger-500',
          icon: '🔴',
          text: 'Disconnected',
          animate: false
        };
      case 'Error':
        return {
          bgClass: 'bg-danger-50 border-danger-200',
          textClass: 'text-danger-700',
          dotClass: 'bg-danger-500',
          icon: '❌',
          text: 'Connection Error',
          animate: false
        };
      default:
        return {
          bgClass: 'bg-gray-50 border-gray-200',
          textClass: 'text-gray-700',
          dotClass: 'bg-gray-500',
          icon: '⚪',
          text: 'Unknown',
          animate: false
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`
      inline-flex items-center gap-3 px-4 py-2 rounded-lg border
      ${config.bgClass} transition-all duration-300 hover:shadow-md
    `}>
      {/* Status Icon */}
      <span className="text-sm">{config.icon}</span>
      
      {/* Status Dot */}
      <div className="relative">
        <div className={`
          w-2 h-2 rounded-full ${config.dotClass}
          ${config.animate ? 'animate-pulse' : ''}
        `}></div>
        {config.animate && (
          <div className={`
            absolute inset-0 w-2 h-2 rounded-full ${config.dotClass} 
            animate-ping opacity-75
          `}></div>
        )}
      </div>

      {/* Status Text */}
      <span className={`text-sm font-medium ${config.textClass}`}>
        {config.text}
      </span>

      {/* Connection Quality Indicator */}
      {status === 'Connected' && (
        <div className="flex gap-1 ml-2">
          <div className="w-1 h-3 bg-success-500 rounded-full"></div>
          <div className="w-1 h-4 bg-success-500 rounded-full"></div>
          <div className="w-1 h-2 bg-success-500 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatusTailwind;
