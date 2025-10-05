import React, { useState, useEffect } from 'react';

const NetworkStatusTailwind = () => {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNetworkInfo();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNetworkInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNetworkInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/network');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNetworkInfo(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch network info:', err);
      setError('Failed to load network information');
    } finally {
      setLoading(false);
    }
  };

  const getWireGuardStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-yellow-500';
      case 'not_running': return 'text-red-500';
      case 'not_installed': return 'text-gray-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getWireGuardStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      case 'not_running': return 'Not Running';
      case 'not_installed': return 'Not Installed';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getWireGuardIcon = (status) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'disconnected': return '🟡';
      case 'not_running': return '🔴';
      case 'not_installed': return '⚫';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const formatHandshakeTime = (handshake) => {
    if (!handshake || handshake === '(none)') return 'Never';
    if (handshake.includes('second')) return 'Just now';
    if (handshake.includes('minute')) return handshake;
    if (handshake.includes('hour')) return handshake;
    if (handshake.includes('day')) return handshake;
    return handshake;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🌐</span>
          <h3 className="text-lg font-bold text-gray-900">
            Network Status
          </h3>
        </div>
        <div className="flex items-center justify-center py-8 text-gray-500">
          <div className="flex items-center gap-2">
            <div className="animate-spin text-xl">⚙️</div>
            <span className="text-sm">Loading network information...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🌐</span>
          <h3 className="text-lg font-bold text-gray-900">
            Network Status
          </h3>
        </div>
        <div className="flex items-center justify-center py-8 text-red-500">
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xl">🌐</span>
        <h3 className="text-lg font-bold text-gray-900">
          Network Status
        </h3>
        <button
          onClick={fetchNetworkInfo}
          className="ml-auto border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors duration-200"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="space-y-4">
        {/* Local IP */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <span className="text-base">🏠</span>
            <span className="text-sm font-medium text-gray-700">
              Local IP
            </span>
          </div>
          <span className={`text-sm font-mono font-semibold ${
            networkInfo?.localIP ? 'text-green-600' : 'text-gray-500'
          }`}>
            {networkInfo?.localIP || 'Not available'}
          </span>
        </div>

        {/* Public IP */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <span className="text-base">🌍</span>
            <span className="text-sm font-medium text-gray-700">
              Public IP
            </span>
          </div>
          <span className={`text-sm font-mono font-semibold ${
            networkInfo?.publicIP ? 'text-green-600' : 'text-gray-500'
          }`}>
            {networkInfo?.publicIP || 'Not available'}
          </span>
        </div>

        {/* WireGuard Status */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🔒</span>
              <span className="text-sm font-medium text-gray-700">
                WireGuard VPN
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">
                {getWireGuardIcon(networkInfo?.wireguard?.status)}
              </span>
              <span className={`text-xs font-semibold ${
                getWireGuardStatusColor(networkInfo?.wireguard?.status)
              }`}>
                {getWireGuardStatusText(networkInfo?.wireguard?.status)}
              </span>
            </div>
          </div>

          {/* WireGuard Details */}
          {networkInfo?.wireguard?.status === 'connected' && (
            <div className="space-y-2 mt-3 pt-3 border-t border-gray-300">
              {networkInfo.wireguard.interface && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Interface:</span>
                  <span className="text-xs font-mono text-gray-800">
                    {networkInfo.wireguard.interface}
                  </span>
                </div>
              )}
              {networkInfo.wireguard.ip && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">VPN IP:</span>
                  <span className="text-xs font-mono text-gray-800">
                    {networkInfo.wireguard.ip}
                  </span>
                </div>
              )}
              {networkInfo.wireguard.endpoint && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Endpoint:</span>
                  <span className="text-xs font-mono text-gray-800">
                    {networkInfo.wireguard.endpoint}
                  </span>
                </div>
              )}
              {networkInfo.wireguard.lastHandshake && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Last Handshake:</span>
                  <span className="text-xs text-gray-800">
                    {formatHandshakeTime(networkInfo.wireguard.lastHandshake)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Network Interfaces Summary */}
        {networkInfo?.interfaces?.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🔗</span>
              <span className="text-sm font-medium text-gray-700">
                Network Interfaces ({networkInfo.interfaces.length})
              </span>
            </div>
            <div className="space-y-2">
              {networkInfo.interfaces.slice(0, 3).map((iface, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${
                      iface.status === 'up' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {iface.status === 'up' ? '🟢' : '🔴'}
                    </span>
                    <span className="text-xs font-mono text-gray-800">
                      {iface.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-gray-600">
                    {iface.ipv4 || 'No IP'}
                  </span>
                </div>
              ))}
              {networkInfo.interfaces.length > 3 && (
                <div className="text-xs text-gray-600 text-center mt-2">
                  ... and {networkInfo.interfaces.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkStatusTailwind;
