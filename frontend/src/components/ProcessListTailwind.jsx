import React, { useState } from 'react';

const ProcessListTailwind = ({ processes = [] }) => {
  const [sortBy, setSortBy] = useState('cpu');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filter, setFilter] = useState('');

  // Sort and filter processes
  const sortedProcesses = [...processes]
    .filter(process => 
      process.name.toLowerCase().includes(filter.toLowerCase()) ||
      process.user.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getProcessIcon = (name) => {
    const processName = name.toLowerCase();
    if (processName.includes('node') || processName.includes('npm')) return '⚡';
    if (processName.includes('python') || processName.includes('py')) return '🐍';
    if (processName.includes('java')) return '☕';
    if (processName.includes('docker')) return '🐳';
    if (processName.includes('mysql') || processName.includes('postgres')) return '🗄️';
    if (processName.includes('nginx') || processName.includes('apache')) return '🌐';
    if (processName.includes('ssh') || processName.includes('sshd')) return '🔐';
    if (processName.includes('systemd')) return '⚙️';
    if (processName.includes('chrome') || processName.includes('firefox')) return '🌍';
    if (processName.includes('bash') || processName.includes('zsh')) return '💻';
    return '📋';
  };

  const getMemoryColor = (memory) => {
    if (memory > 500) return 'text-danger-600 bg-danger-50';
    if (memory > 200) return 'text-warning-600 bg-warning-50';
    return 'text-success-600 bg-success-50';
  };

  const getCpuColor = (cpu) => {
    if (cpu > 80) return 'text-danger-600 bg-danger-50';
    if (cpu > 50) return 'text-warning-600 bg-warning-50';
    return 'text-success-600 bg-success-50';
  };

  const formatMemory = (mb) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) {
      return <span className="text-gray-400">↕️</span>;
    }
    return (
      <span className="text-primary-600">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          📋 Top Processes
          <span className="text-sm font-normal text-gray-500">
            ({processes.length} total)
          </span>
        </h3>
        
        {/* Search Filter */}
        <div className="relative">
          <input
            type="text"
            placeholder="Filter processes..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
      </div>

      {processes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚙️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Process Data</h3>
          <p className="text-gray-500">Process information is not available</p>
        </div>
      ) : sortedProcesses.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Matches Found</h3>
          <p className="text-gray-500">Try adjusting your search filter</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="w-full">
              <thead className="sticky top-0 bg-white border-b-2 border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 uppercase text-xs tracking-wide">
                    Process
                  </th>
                  <th 
                    className="text-right py-3 px-4 font-medium text-gray-700 uppercase text-xs tracking-wide cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => handleSort('cpu')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      CPU %
                      <SortIcon column="cpu" />
                    </div>
                  </th>
                  <th 
                    className="text-right py-3 px-4 font-medium text-gray-700 uppercase text-xs tracking-wide cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => handleSort('memory')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Memory
                      <SortIcon column="memory" />
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-gray-700 uppercase text-xs tracking-wide cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => handleSort('user')}
                  >
                    <div className="flex items-center gap-1">
                      User
                      <SortIcon column="user" />
                    </div>
                  </th>
                  <th 
                    className="text-right py-3 px-4 font-medium text-gray-700 uppercase text-xs tracking-wide cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => handleSort('pid')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      PID
                      <SortIcon column="pid" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedProcesses.slice(0, 50).map((process, index) => (
                  <tr 
                    key={process.pid || index} 
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getProcessIcon(process.name)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">
                            {process.name}
                          </p>
                          {process.cmd && process.cmd !== process.name && (
                            <p className="text-xs text-gray-500 truncate font-mono">
                              {process.cmd}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCpuColor(process.cpu)}`}>
                        {process.cpu.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMemoryColor(process.memory)}`}>
                        {formatMemory(process.memory)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-700 bg-gray-100">
                        {process.user}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <code className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {process.pid}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {sortedProcesses.length > 50 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing top 50 of {sortedProcesses.length} processes
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {processes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Processes</p>
              <p className="text-lg font-bold text-gray-900">{processes.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Avg CPU</p>
              <p className="text-lg font-bold text-primary-600">
                {(processes.reduce((sum, p) => sum + p.cpu, 0) / processes.length).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Memory</p>
              <p className="text-lg font-bold text-secondary-600">
                {formatMemory(processes.reduce((sum, p) => sum + p.memory, 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">High CPU</p>
              <p className="text-lg font-bold text-danger-600">
                {processes.filter(p => p.cpu > 50).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessListTailwind;
