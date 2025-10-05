import React, { useState, useEffect } from 'react';

const ServerInfo = () => {
  const [serverInfo, setServerInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServerInfo = async () => {
      try {
        const response = await fetch('/api/server-info');
        if (!response.ok) {
          throw new Error('Failed to fetch server information');
        }
        const data = await response.json();
        setServerInfo(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchServerInfo();
    const interval = setInterval(fetchServerInfo, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Server Information</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Server Information</h2>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-red-700 dark:text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Server Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* System Information */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">System Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Hostname:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.hostname || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Platform:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.platform || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">OS Type:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.type || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Architecture:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.arch || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.uptime || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* CPU Information */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">CPU Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Model:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.cpuModel || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cores:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.cpuCores || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Speed:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.cpuSpeed || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Usage:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.cpuUsage || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Temperature:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.cpuTemp || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Memory Information */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Memory Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.memoryTotal || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Used:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.memoryUsed || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Free:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.memoryFree || 'N/A'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${serverInfo.memoryUsagePercent || 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Usage:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.memoryUsagePercent || 0}%</span>
            </div>
          </div>
        </div>

        {/* Disk Information */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Disk Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.diskTotal || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Used:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.diskUsed || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Free:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.diskFree || 'N/A'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${serverInfo.diskUsagePercent || 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Usage:</span>
              <span className="font-medium text-gray-800 dark:text-white">{serverInfo.diskUsagePercent || 0}%</span>
            </div>
          </div>
        </div>

        {/* Network Information */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg md:col-span-2">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Network Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">IP Address:</span>
                <span className="font-medium text-gray-800 dark:text-white">{serverInfo.ipAddress || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">MAC Address:</span>
                <span className="font-medium text-gray-800 dark:text-white">{serverInfo.macAddress || 'N/A'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Network Interface:</span>
                <span className="font-medium text-gray-800 dark:text-white">{serverInfo.networkInterface || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Speed:</span>
                <span className="font-medium text-gray-800 dark:text-white">{serverInfo.networkSpeed || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerInfo;