import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { 
  MdMemory, 
  MdSpeed, 
  MdComputer, 
  MdRefresh, 
  MdWarning, 
  MdError,
  MdCheckCircle,
  MdTrendingUp,
  MdTrendingDown,
  MdSettings,
  MdDelete,
  MdStop,
  MdInfo,
  MdTimeline,
  MdStorage,
  MdNetworkWifi,
  MdBatteryAlert,
  MdDeviceThermostat
} from 'react-icons/md';
import { API_BASE_URL } from '../config/api';

const SystemPerformanceMonitorTailwind = () => {
  const [performanceData, setPerformanceData] = useState(null);
  // const [historicalData, setHistoricalData] = useState([]); // For future chart implementation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [alerts, setAlerts] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [showKillConfirm, setShowKillConfirm] = useState(false);

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/performance/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      const data = await response.json();
      setPerformanceData(data);
      
      // Add to historical data (for future chart implementation)
      // setHistoricalData(prev => {
      //   const newData = [...prev, {
      //     timestamp: Date.now(),
      //     cpu: data.cpu.usage,
      //     memory: data.memory.percentUsed,
      //     disk: data.disk.usage,
      //     network: data.network.totalBandwidth,
      //     temperature: data.temperature.current,
      //     loadAverage: data.loadAverage.current
      //   }];
      //   return newData.slice(-50); // Keep last 50 data points
      // });

      // Check for alerts
      checkPerformanceAlerts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed process information
  const fetchProcesses = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/performance/processes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch process data');
      }
      const data = await response.json();
      setProcesses(data.processes || []);
    } catch (err) {
      console.error('Error fetching processes:', err);
    }
  };

  // Kill process
  const killProcess = async (pid, signal = 'TERM') => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/performance/processes/kill`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pid, signal })
      });
      
      if (!response.ok) {
        throw new Error('Failed to kill process');
      }
      
      const result = await response.json();
      if (result.success) {
        setAlerts(prev => [...prev, {
          id: Date.now(),
          type: 'info',
          message: `Process ${pid} terminated successfully`,
          timestamp: new Date()
        }]);
        fetchProcesses(); // Refresh process list
      }
    } catch (err) {
      setAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: `Failed to kill process: ${err.message}`,
        timestamp: new Date()
      }]);
    }
    setShowKillConfirm(false);
    setSelectedProcess(null);
  };

  // Check for performance alerts
  const checkPerformanceAlerts = (data) => {
    const newAlerts = [];
    const timestamp = new Date();

    if (data.cpu.usage > 90) {
      newAlerts.push({
        id: `cpu-${Date.now()}`,
        type: 'error',
        message: `Critical CPU Usage: ${data.cpu.usage.toFixed(1)}%`,
        timestamp
      });
    } else if (data.cpu.usage > 75) {
      newAlerts.push({
        id: `cpu-${Date.now()}`,
        type: 'warning',
        message: `High CPU Usage: ${data.cpu.usage.toFixed(1)}%`,
        timestamp
      });
    }

    if (data.memory.percentUsed > 95) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'error',
        message: `Critical Memory Usage: ${data.memory.percentUsed.toFixed(1)}%`,
        timestamp
      });
    } else if (data.memory.percentUsed > 85) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'warning',
        message: `High Memory Usage: ${data.memory.percentUsed.toFixed(1)}%`,
        timestamp
      });
    }

    if (data.temperature.current > 85) {
      newAlerts.push({
        id: `temp-${Date.now()}`,
        type: 'error',
        message: `Critical Temperature: ${data.temperature.current}°C`,
        timestamp
      });
    } else if (data.temperature.current > 75) {
      newAlerts.push({
        id: `temp-${Date.now()}`,
        type: 'warning',
        message: `High Temperature: ${data.temperature.current}°C`,
        timestamp
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 20)); // Keep last 20 alerts
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchPerformanceData();
    fetchProcesses();
    
    const interval = setInterval(() => {
      fetchPerformanceData();
      if (activeTab === 'processes') {
        fetchProcesses();
      }
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get status color based on value and thresholds
  const getStatusColor = (value, warningThreshold, criticalThreshold) => {
    if (value >= criticalThreshold) return 'text-red-600 bg-red-50 border-red-200';
    if (value >= warningThreshold) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  // Format bytes to human readable
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format uptime
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Render performance overview
  const renderOverview = () => {
    if (!performanceData) return null;

    return (
      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CPU Usage */}
          <div className={`p-6 rounded-2xl border-2 ${getStatusColor(performanceData.cpu.usage, 75, 90)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MdComputer className="text-2xl" />
                <div>
                  <h3 className="font-semibold">CPU Usage</h3>
                  <p className="text-sm opacity-75">{performanceData.cpu.cores} cores</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{performanceData.cpu.usage.toFixed(1)}%</p>
                {performanceData.cpu.trend > 0 ? (
                  <MdTrendingUp className="text-red-500 inline" />
                ) : (
                  <MdTrendingDown className="text-green-500 inline" />
                )}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-current rounded-full h-2 transition-all duration-300" 
                style={{ width: `${Math.min(performanceData.cpu.usage, 100)}%` }}
              />
            </div>
          </div>

          {/* Memory Usage */}
          <div className={`p-6 rounded-2xl border-2 ${getStatusColor(performanceData.memory.percentUsed, 85, 95)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MdMemory className="text-2xl" />
                <div>
                  <h3 className="font-semibold">Memory</h3>
                  <p className="text-sm opacity-75">{formatBytes(performanceData.memory.total)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{performanceData.memory.percentUsed.toFixed(1)}%</p>
                <p className="text-sm opacity-75">{formatBytes(performanceData.memory.used)} used</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-current rounded-full h-2 transition-all duration-300" 
                style={{ width: `${Math.min(performanceData.memory.percentUsed, 100)}%` }}
              />
            </div>
          </div>

          {/* Disk I/O */}
          <div className="p-6 rounded-2xl border-2 border-blue-200 bg-blue-50 text-blue-600">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MdStorage className="text-2xl" />
                <div>
                  <h3 className="font-semibold">Disk I/O</h3>
                  <p className="text-sm opacity-75">Read/Write</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatBytes(performanceData.disk.readRate)}/s</p>
                <p className="text-sm opacity-75">{formatBytes(performanceData.disk.writeRate)}/s</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-xs opacity-75 mb-1">Read</p>
                <div className="w-full bg-blue-200 rounded-full h-1">
                  <div 
                    className="bg-blue-400 rounded-full h-1 transition-all duration-300" 
                    style={{ width: `${Math.min((performanceData.disk.readRate / 10485760) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs opacity-75 mb-1">Write</p>
                <div className="w-full bg-blue-200 rounded-full h-1">
                  <div 
                    className="bg-blue-600 rounded-full h-1 transition-all duration-300" 
                    style={{ width: `${Math.min((performanceData.disk.writeRate / 10485760) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Temperature */}
          <div className={`p-6 rounded-2xl border-2 ${getStatusColor(performanceData.temperature.current, 75, 85)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MdDeviceThermostat className="text-2xl" />
                <div>
                  <h3 className="font-semibold">Temperature</h3>
                  <p className="text-sm opacity-75">CPU Temp</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{performanceData.temperature.current}°C</p>
                <p className="text-sm opacity-75">Max: {performanceData.temperature.max}°C</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-current rounded-full h-2 transition-all duration-300" 
                style={{ width: `${Math.min((performanceData.temperature.current / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* System Load and Network */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Load */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <MdSpeed className="text-blue-500" />
                System Load Average
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">1 minute:</span>
                <span className={`font-bold ${performanceData.loadAverage.load1 > performanceData.cpu.cores ? 'text-red-500' : 'text-green-500'}`}>
                  {performanceData.loadAverage.load1.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">5 minutes:</span>
                <span className={`font-bold ${performanceData.loadAverage.load5 > performanceData.cpu.cores ? 'text-red-500' : 'text-green-500'}`}>
                  {performanceData.loadAverage.load5.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">15 minutes:</span>
                <span className={`font-bold ${performanceData.loadAverage.load15 > performanceData.cpu.cores ? 'text-red-500' : 'text-green-500'}`}>
                  {performanceData.loadAverage.load15.toFixed(2)}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Running Processes:</span>
                  <span className="font-medium">{performanceData.loadAverage.runningProcesses}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Total Processes:</span>
                  <span className="font-medium">{performanceData.loadAverage.totalProcesses}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Network Activity */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <MdNetworkWifi className="text-green-500" />
                Network Activity
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Download:</span>
                <span className="font-bold text-green-500">
                  {formatBytes(performanceData.network.download)}/s
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Upload:</span>
                <span className="font-bold text-blue-500">
                  {formatBytes(performanceData.network.upload)}/s
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Bandwidth:</span>
                <span className="font-bold text-purple-500">
                  {formatBytes(performanceData.network.totalBandwidth)}/s
                </span>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Active Connections:</span>
                  <span className="font-medium">{performanceData.network.connections}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Uptime:</span>
                  <span className="font-medium">{formatUptime(performanceData.uptime)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render process management
  const renderProcesses = () => {
    return (
      <div className="space-y-6">
        {/* Process Management Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <MdSettings className="text-blue-500" />
              Process Management
            </h3>
            <button
              onClick={fetchProcesses}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
            >
              <MdRefresh />
              Refresh
            </button>
          </div>
          <p className="text-gray-600">
            Monitor and manage system processes. Use caution when terminating processes.
          </p>
        </div>

        {/* Process List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Active Processes</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Process Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPU %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Memory %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processes.slice(0, 20).map((process, index) => (
                  <tr key={process.pid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {process.pid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <MdInfo className="text-blue-500" />
                        {process.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        process.cpu > 50 ? 'bg-red-100 text-red-800' : 
                        process.cpu > 20 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {process.cpu.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        process.memory > 10 ? 'bg-red-100 text-red-800' : 
                        process.memory > 5 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {process.memory.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {process.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        process.status === 'Running' ? 'bg-green-100 text-green-800' : 
                        process.status === 'Sleeping' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {process.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedProcess(process);
                            setShowKillConfirm(true);
                          }}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          title="Terminate Process"
                        >
                          <MdStop />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render alerts
  const renderAlerts = () => {
    return (
      <div className="space-y-6">
        {/* Alerts Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <MdBatteryAlert className="text-yellow-500" />
              Performance Alerts
            </h3>
            <button
              onClick={() => setAlerts([])}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Clear All
            </button>
          </div>
          <p className="text-gray-600">
            System performance alerts and warnings. Critical issues require immediate attention.
          </p>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <MdCheckCircle className="mx-auto text-6xl text-green-500 mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">No Active Alerts</h4>
              <p className="text-gray-600">System performance is within normal parameters.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl shadow-lg border-2 p-6 ${
                  alert.type === 'error' ? 'border-red-200 bg-red-50' :
                  alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {alert.type === 'error' && <MdError className="text-2xl text-red-500 mt-1" />}
                    {alert.type === 'warning' && <MdWarning className="text-2xl text-yellow-500 mt-1" />}
                    {alert.type === 'info' && <MdInfo className="text-2xl text-blue-500 mt-1" />}
                    <div>
                      <h4 className={`font-semibold ${
                        alert.type === 'error' ? 'text-red-800' :
                        alert.type === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {alert.type === 'error' ? 'Critical Alert' :
                         alert.type === 'warning' ? 'Warning' : 'Information'}
                      </h4>
                      <p className={`${
                        alert.type === 'error' ? 'text-red-700' :
                        alert.type === 'warning' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {alert.message}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {alert.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                    className={`p-2 rounded-lg ${
                      alert.type === 'error' ? 'text-red-500 hover:bg-red-100' :
                      alert.type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100' :
                      'text-blue-500 hover:bg-blue-100'
                    }`}
                  >
                    <MdDelete />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading && !performanceData) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Performance Data...</h2>
          <p className="text-gray-500 mt-2">Collecting system metrics and process information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
          <MdError className="mx-auto text-6xl text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Performance Data</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchPerformanceData}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <MdTimeline className="text-blue-500" />
            System Performance Monitor
          </h1>
          <div className="flex items-center gap-4">
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={2000}>2 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
            </select>
            <button
              onClick={fetchPerformanceData}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:scale-105 transition-all duration-200 font-medium flex items-center gap-2"
            >
              <MdRefresh />
              Refresh
            </button>
          </div>
        </div>
        <p className="text-gray-500 text-sm">
          Real-time system performance monitoring with process management and alerting
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
        <div className="flex">
          {[
            { id: 'overview', label: 'Performance Overview', icon: MdSpeed },
            { id: 'processes', label: 'Process Management', icon: MdSettings },
            { id: 'alerts', label: 'Alerts & Monitoring', icon: MdBatteryAlert }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="text-lg" />
              {tab.label}
              {tab.id === 'alerts' && alerts.length > 0 && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white text-blue-500' : 'bg-red-500 text-white'
                }`}>
                  {alerts.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'processes' && renderProcesses()}
      {activeTab === 'alerts' && renderAlerts()}

      {/* Kill Process Confirmation Modal */}
      {showKillConfirm && selectedProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <MdWarning className="mx-auto text-6xl text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Terminate Process?</h3>
              <p className="text-gray-600">
                Are you sure you want to terminate process <strong>{selectedProcess.name}</strong> (PID: {selectedProcess.pid})?
              </p>
              <p className="text-sm text-red-600 mt-2">
                This action cannot be undone and may cause system instability.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowKillConfirm(false);
                  setSelectedProcess(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => killProcess(selectedProcess.pid, 'TERM')}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Terminate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemPerformanceMonitorTailwind;
