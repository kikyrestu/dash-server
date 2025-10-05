import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import {
  MdPublic,
  MdCircle,
  MdError,
  MdHelpOutline,
  MdRefresh,
  MdWifi,
  MdSecurity,
  MdComputer,
  MdHome
} from 'react-icons/md';
import { API_BASE_URL } from '../config/api';

const NetworkStatus = () => {
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
      const response = await fetch(`${API_BASE_URL}/api/network`);
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
      case 'connected': return '#10b981'; // green
      case 'disconnected': return '#f59e0b'; // yellow
      case 'not_running': return '#ef4444'; // red
      case 'not_installed': return '#6b7280'; // gray
      case 'error': return '#ef4444'; // red
      default: return '#6b7280';
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
    const iconProps = { size: 16 };
    switch (status) {
      case 'connected': return <MdCircle {...iconProps} style={{ color: '#10b981' }} />;
      case 'disconnected': return <MdCircle {...iconProps} style={{ color: '#f59e0b' }} />;
      case 'not_running': return <MdCircle {...iconProps} style={{ color: '#ef4444' }} />;
      case 'not_installed': return <MdCircle {...iconProps} style={{ color: '#6b7280' }} />;
      case 'error': return <MdError {...iconProps} style={{ color: '#ef4444' }} />;
      default: return <MdHelpOutline {...iconProps} style={{ color: '#6b7280' }} />;
    }
  };

  const getInterfaceStatusIcon = (status) => {
    const iconProps = { size: 12 };
    return status === 'up' 
      ? <MdCircle {...iconProps} style={{ color: '#10b981' }} />
      : <MdCircle {...iconProps} style={{ color: '#ef4444' }} />;
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
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '15px'
        }}>
          <MdPublic size={24} />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
            Network Status
          </h3>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '14px' }}>Loading network information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '15px'
        }}>
          <MdPublic size={24} />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
            Network Status
          </h3>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          color: '#ef4444'
        }}>
          <div style={{ fontSize: '14px' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <MdPublic size={24} />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
          Network Status
        </h3>
        <button
          onClick={fetchNetworkInfo}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#6b7280'
          }}
        >
          <MdRefresh size={16} style={{ marginRight: '6px' }} />Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        {/* Local IP */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 15px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdHome size={16} />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Local IP
            </span>
          </div>
          <span style={{
            fontSize: '14px',
            fontFamily: 'monospace',
            color: networkInfo?.localIP ? '#059669' : '#6b7280',
            fontWeight: '600'
          }}>
            {networkInfo?.localIP || 'Not available'}
          </span>
        </div>

        {/* Public IP */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 15px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdPublic size={16} />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Public IP
            </span>
          </div>
          <span style={{
            fontSize: '14px',
            fontFamily: 'monospace',
            color: networkInfo?.publicIP ? '#059669' : '#6b7280',
            fontWeight: '600'
          }}>
            {networkInfo?.publicIP || 'Not available'}
          </span>
        </div>

        {/* WireGuard Status */}
        <div style={{
          padding: '15px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdSecurity size={16} />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                WireGuard VPN
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>
                {getWireGuardIcon(networkInfo?.wireguard?.status)}
              </span>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: getWireGuardStatusColor(networkInfo?.wireguard?.status)
              }}>
                {getWireGuardStatusText(networkInfo?.wireguard?.status)}
              </span>
            </div>
          </div>

          {/* WireGuard Details */}
          {networkInfo?.wireguard?.status === 'connected' && (
            <div style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
              {networkInfo.wireguard.interface && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Interface:</span>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#374151' }}>
                    {networkInfo.wireguard.interface}
                  </span>
                </div>
              )}
              {networkInfo.wireguard.ip && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>VPN IP:</span>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#374151' }}>
                    {networkInfo.wireguard.ip}
                  </span>
                </div>
              )}
              {networkInfo.wireguard.endpoint && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Endpoint:</span>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#374151' }}>
                    {networkInfo.wireguard.endpoint}
                  </span>
                </div>
              )}
              {networkInfo.wireguard.lastHandshake && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Last Handshake:</span>
                  <span style={{ fontSize: '12px', color: '#374151' }}>
                    {formatHandshakeTime(networkInfo.wireguard.lastHandshake)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Network Interfaces Summary */}
        {networkInfo?.interfaces?.length > 0 && (
          <div style={{
            padding: '15px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '16px' }}>🔗</span>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Network Interfaces ({networkInfo.interfaces.length})
              </span>
            </div>
            <div style={{ display: 'grid', gap: '6px' }}>
              {networkInfo.interfaces.slice(0, 3).map((iface, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>                    <span style={{
                      fontSize: '10px',
                      color: iface.status === 'up' ? '#10b981' : '#ef4444'
                    }}>
                      {getInterfaceStatusIcon(iface.status)}
                    </span>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#374151' }}>
                      {iface.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#6b7280' }}>
                    {iface.ipv4 || 'No IP'}
                  </span>
                </div>
              ))}
              {networkInfo.interfaces.length > 3 && (
                <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', marginTop: '5px' }}>
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

export default NetworkStatus;
