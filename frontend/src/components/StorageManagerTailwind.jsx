import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const StorageManagerTailwind = () => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSudoModal, setShowSudoModal] = useState(false);
  const [sudoPassword, setSudoPassword] = useState('');
  const [sudoVerifying, setSudoVerifying] = useState(false);
  const [hasSudoAccess, setHasSudoAccess] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const loadData = async () => {
      await fetchStorageInfo();
    };
    
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStorageInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStorageInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/storage`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStorageInfo(data);
      setError(null);
      
      // Check if SMART data requires sudo
      const needsSudo = data.disks?.some(disk => 
        disk.smart && disk.smart.includes('requires sudo password')
      );
      
      if (needsSudo && !hasSudoAccess) {
        setShowSudoModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch storage info:', err);
      setError('Failed to load storage information');
    } finally {
      setLoading(false);
    }
  };

  const handleSudoSubmit = async () => {
    if (!sudoPassword.trim()) return;

    setSudoVerifying(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/storage/sudo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: sudoPassword })
      });

      const result = await response.json();
      
      if (result.success) {
        setHasSudoAccess(true);
        setShowSudoModal(false);
        setSudoPassword('');
        fetchStorageInfo();
      } else {
        setError('Invalid sudo password: ' + result.error);
      }
    } catch (err) {
      setError('Failed to verify sudo password: ' + err.message);
    } finally {
      setSudoVerifying(false);
    }
  };

  const handleClearSudo = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/storage/sudo/clear`, {
        method: 'POST'
      });
      setHasSudoAccess(false);
      setShowSudoModal(false);
      fetchStorageInfo();
    } catch (err) {
      console.error('Failed to clear sudo access:', err);
    }
  };

  const getStorageStatusColor = (usage) => {
    if (usage >= 90) return 'text-red-500';
    if (usage >= 80) return 'text-yellow-500';
    if (usage >= 60) return 'text-blue-500';
    return 'text-green-500';
  };

  const getStorageStatusBgColor = (usage) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 80) return 'bg-yellow-500';
    if (usage >= 60) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStorageTypeIcon = (type) => {
    return type === 'SSD' ? '⚡' : '💿';
  };

  if (loading) {
    return (
      <div className="p-5 bg-gray-50 min-h-screen flex items-center justify-center font-inter">
        <div className="bg-white rounded-xl p-10 text-center shadow-lg">
          <div className="text-4xl mb-4 animate-pulse">💾</div>
          <div className="text-gray-500">Loading storage information...</div>
        </div>
      </div>
    );
  }

  if (error && !storageInfo) {
    return (
      <div className="p-5 bg-gray-50 min-h-screen flex items-center justify-center font-inter">
        <div className="bg-white rounded-xl p-10 text-center shadow-lg">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-red-500 mb-3">{error}</div>
          <button
            onClick={fetchStorageInfo}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-gray-50 min-h-screen font-inter">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            💾 Storage Manager
          </h1>
          <div className="flex gap-3 items-center">
            <button
              onClick={fetchStorageInfo}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 hover:scale-105 transition-all duration-200 font-medium"
            >
              🔄 Refresh
            </button>
            
            {/* Sudo Access Indicator */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              hasSudoAccess 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              <span>{hasSudoAccess ? '🔓' : '🔒'}</span>
              <span>{hasSudoAccess ? 'SMART Access' : 'Limited Access'}</span>
            </div>
            
            {/* Sudo Controls */}
            {hasSudoAccess ? (
              <button
                onClick={handleClearSudo}
                className="px-3 py-2 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
              >
                Clear Sudo
              </button>
            ) : (
              <button
                onClick={() => setShowSudoModal(true)}
                className="px-3 py-2 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium"
              >
                Enable SMART
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-500 text-sm">
          Comprehensive storage monitoring including drive types, partitions, and I/O statistics
        </p>
      </div>

      {/* Overall Storage Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">📊</span>
            <span className="text-base font-semibold text-gray-700">Total Storage</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {storageInfo?.totalSpace || '0B'}
          </div>
          <div className="text-sm text-gray-600 mb-3">
            Used: {storageInfo?.usedSpace || '0B'} • Free: {storageInfo?.freeSpace || '0B'}
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getStorageStatusBgColor(storageInfo?.usage || 0)}`}
              style={{ width: `${storageInfo?.usage || 0}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {storageInfo?.usage || 0}% used
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">💿</span>
            <span className="text-base font-semibold text-gray-700">Storage Devices</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {storageInfo?.disks?.length || 0}
          </div>
          <div className="text-sm text-gray-600">
            {storageInfo?.disks?.filter(d => d.type === 'SSD').length || 0} SSD • {storageInfo?.disks?.filter(d => d.type === 'HDD').length || 0} HDD
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">📁</span>
            <span className="text-base font-semibold text-gray-700">Partitions</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {storageInfo?.partitions?.length || 0}
          </div>
          <div className="text-sm text-gray-600">
            Active mounted filesystems
          </div>
        </div>
      </div>

      {/* Storage Devices */}
      <div className="bg-white rounded-2xl mb-8 shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            💿 Storage Devices
          </h2>
        </div>

        <div className="p-6">
          {storageInfo?.disks?.length > 0 ? (
            <div className="space-y-5">
              {storageInfo.disks.map((disk, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">{getStorageTypeIcon(disk.type)}</span>
                        <span className="text-base font-semibold text-gray-900">/dev/{disk.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          disk.type === 'SSD' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {disk.type}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        Model: {disk.model}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-4">
                        <span>Size: {disk.size}</span>
                        {disk.temperature && (
                          <span className="flex items-center gap-1">
                            🌡️ {disk.temperature}°C
                          </span>
                        )}
                        {disk.healthPercentage && (
                          <span className={`flex items-center gap-1 font-semibold ${
                            disk.healthPercentage > 80 ? 'text-green-500' : 
                            disk.healthPercentage > 60 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            ❤️ {disk.healthPercentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Partitions */}
                  {disk.partitions?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Partitions ({disk.partitions.length})
                      </h4>
                      <div className="space-y-2">
                        {disk.partitions.map((partition, partIndex) => (
                          <div key={partIndex} className="grid grid-cols-5 gap-4 items-center p-3 bg-white rounded-lg border border-gray-200">
                            <div>
                              <div className="text-xs font-medium text-gray-900 font-mono">
                                /dev/{partition.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {partition.mountpoint} • {partition.fstype}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 text-center">
                              {partition.size}
                            </div>
                            <div className="text-xs text-gray-600 text-center">
                              {partition.used || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-600 text-center">
                              {partition.available || 'N/A'}
                            </div>
                            <div className={`text-xs font-semibold text-center ${getStorageStatusColor(partition.usage || 0)}`}>
                              {partition.usage || 0}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SMART Info */}
                  {disk.smart && disk.smart !== 'N/A' && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Health Information
                      </h4>
                      
                      {disk.smart.includes('requires sudo password') ? (
                        <div className="p-4 bg-yellow-100 rounded-lg border border-yellow-300">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">🔒</span>
                            <span className="text-sm font-semibold text-yellow-800">
                              SMART Data Requires Permissions
                            </span>
                          </div>
                          <div className="text-xs text-yellow-800 mb-3">
                            Enable SMART access to view detailed disk health information including temperature, wear level, and error statistics.
                          </div>
                          <button
                            onClick={() => setShowSudoModal(true)}
                            className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors duration-200 font-medium"
                          >
                            🔑 Enable SMART Access
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600 font-mono bg-white p-3 rounded border border-gray-200 whitespace-pre-wrap">
                          {disk.smart}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <div className="text-5xl mb-4">💿</div>
              <div className="text-lg font-medium mb-2">No storage devices detected</div>
              <div className="text-sm">Storage information may require elevated permissions</div>
            </div>
          )}
        </div>
      </div>

      {/* I/O Statistics */}
      {storageInfo?.ioStats?.length > 0 && (
        <div className="bg-white rounded-2xl mb-8 shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              📈 I/O Statistics
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <div>Device</div>
              <div>Read KB/s</div>
              <div>Write KB/s</div>
              <div>Utilization</div>
            </div>

            {storageInfo.ioStats.map((stat, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 items-center">
                <div className="text-sm font-medium text-gray-900 font-mono">
                  {stat.device}
                </div>
                <div className="text-xs text-green-600 font-medium">
                  {stat.readKBps.toFixed(2)}
                </div>
                <div className="text-xs text-red-600 font-medium">
                  {stat.writeKBps.toFixed(2)}
                </div>
                <div className={`text-xs font-semibold ${getStorageStatusColor(stat.utilization)}`}>
                  {stat.utilization.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mounted Filesystems */}
      {storageInfo?.mounts?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              🔗 Mounted Filesystems
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <div>Device</div>
              <div>Mount Point</div>
              <div>Filesystem</div>
              <div>Options</div>
            </div>

            {storageInfo.mounts.map((mount, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 items-center">
                <div className="text-xs font-medium text-gray-900 font-mono">
                  {mount.device}
                </div>
                <div className="text-xs text-gray-600 font-mono">
                  {mount.mountpoint}
                </div>
                <div className="text-xs text-green-600 font-medium">
                  {mount.filesystem}
                </div>
                <div className="text-xs text-gray-600">
                  {mount.options}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Sudo Password Modal */}
      {showSudoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 min-w-96 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3 mb-5">
              🔒 Enable SMART Data Access
            </h3>
            
            <p className="text-gray-600 text-sm mb-5 leading-relaxed">
              To access detailed disk health information (SMART data), sudo privileges are required. 
              Your password will be used only for disk monitoring and won't be stored permanently.
            </p>

            {error && error.includes('sudo') && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <input
              type="password"
              value={sudoPassword}
              onChange={(e) => setSudoPassword(e.target.value)}
              placeholder="Enter your sudo password..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && sudoPassword.trim()) {
                  handleSudoSubmit();
                }
              }}
              disabled={sudoVerifying}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              autoFocus
            />

            <div className="flex gap-3 justify-end mb-4">
              <button
                onClick={() => {
                  setShowSudoModal(false);
                  setSudoPassword('');
                  setError(null);
                }}
                disabled={sudoVerifying}
                className="px-5 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
              >
                Skip
              </button>
              
              <button
                onClick={handleSudoSubmit}
                disabled={!sudoPassword.trim() || sudoVerifying}
                className={`px-5 py-2 text-white rounded-lg transition-all duration-200 ${
                  sudoPassword.trim() && !sudoVerifying
                    ? 'bg-blue-500 hover:bg-blue-600 hover:scale-105' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {sudoVerifying ? 'Verifying...' : 'Enable SMART Access'}
              </button>
            </div>
            
            <div className="p-3 bg-gray-50 rounded text-xs text-gray-600">
              <div className="font-semibold mb-2">Security Notice:</div>
              <div>• Password is used only for disk health monitoring</div>
              <div>• No password is stored permanently</div>
              <div>• You can clear sudo access anytime</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageManagerTailwind;
