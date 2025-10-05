import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { 
  MdOutlet,
  MdRefresh,
  MdLock,
  MdSearch,
  MdClose,
  MdSecurity,
  MdShield,
  MdNetworkCheck,
  MdComputer,
  MdPerson,
  MdSettings,
  MdBarChart,
  MdHeadset,
  MdWifi,
  MdSignalWifiStatusbar4Bar,
  MdPublic,
  MdBlock,
  MdLockOpen,
  MdError,
  MdCheckCircle,
  MdRadio
} from 'react-icons/md';
import { API_BASE_URL } from '../config/api';

const PortManager = () => {
  const [ports, setPorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [scanResults, setScanResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [firewallRules, setFirewallRules] = useState([]);
  const [showPortBlockModal, setShowPortBlockModal] = useState(false);
  const [portToBlock, setPortToBlock] = useState('');
  const [blockAction, setBlockAction] = useState('block');
  const [showOpenPortModal, setShowOpenPortModal] = useState(false);
  const [newPortNumber, setNewPortNumber] = useState('');
  const [newPortProtocol, setNewPortProtocol] = useState('tcp');
  const [openingPort, setOpeningPort] = useState(false);

  useEffect(() => {
    fetchPortsInfo();
    fetchFirewallRules();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPortsInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPortsInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/ports`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPorts(data.ports || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch ports info:', err);
      setError('Failed to load ports information');
    } finally {
      setLoading(false);
    }
  };

  const fetchFirewallRules = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/firewall`);
      if (response.ok) {
        const data = await response.json();
        setFirewallRules(data.rules || []);
      }
    } catch (err) {
      console.error('Failed to fetch firewall rules:', err);
    }
  };

  const scanPorts = async (startPort = 1, endPort = 1000) => {
    try {
      setScanning(true);
      const response = await fetch(`${API_BASE_URL}/api/ports/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startPort, endPort })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setScanResults(data.openPorts || []);
    } catch (err) {
      console.error('Port scan failed:', err);
      setError('Port scan failed: ' + err.message);
    } finally {
      setScanning(false);
    }
  };

  const managePort = async (port, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/firewall/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port, action })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        fetchFirewallRules();
        setShowPortBlockModal(false);
        setPortToBlock('');
      } else {
        setError(data.error || 'Failed to manage port');
      }
    } catch (err) {
      console.error('Port management failed:', err);
      setError('Port management failed: ' + err.message);
    }
  };

  const handleOpenPort = async () => {
    if (!newPortNumber.trim()) {
      setError('Port number is required');
      return;
    }

    const port = parseInt(newPortNumber.trim());
    if (isNaN(port) || port < 1 || port > 65535) {
      setError('Please enter a valid port number (1-65535)');
      return;
    }

    try {
      setOpeningPort(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/firewall/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          port: port,
          action: 'allow'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setShowOpenPortModal(false);
        setNewPortNumber('');
        setNewPortProtocol('tcp');
        fetchFirewallRules();
        fetchPortsInfo();
        alert(`Port ${port} opened successfully!`);
      } else {
        setError(result.error || 'Failed to open port');
      }
    } catch (err) {
      console.error('Failed to open port:', err);
      setError('Failed to open port: ' + err.message);
    } finally {
      setOpeningPort(false);
    }
  };

  const getPortTypeIcon = (type) => {
    const iconProps = { size: 16, style: { marginRight: '4px' } };
    switch (type?.toLowerCase()) {
      case 'tcp': return <MdWifi {...iconProps} />;
      case 'udp': return <MdSignalWifiStatusbar4Bar {...iconProps} />;
      case 'tcp6': return <MdPublic {...iconProps} />;
      case 'udp6': return <MdPublic {...iconProps} />;
      default: return <MdNetworkCheck {...iconProps} />;
    }
  };

  const getPortStatusColor = (status) => {
    switch (status) {
      case 'LISTEN': return '#10b981';
      case 'ESTABLISHED': return '#3b82f6';
      case 'TIME_WAIT': return '#f59e0b';
      case 'CLOSE_WAIT': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getServiceColor = (service) => {
    const colors = {
      'http': '#3b82f6',
      'https': '#10b981',
      'ssh': '#ef4444',
      'ftp': '#f59e0b',
      'mysql': '#8b5cf6',
      'postgresql': '#06b6d4',
      'redis': '#dc2626',
      'mongodb': '#10b981'
    };
    return colors[service] || '#6b7280';
  };

  const filteredPorts = ports.filter(port => {
    if (filter === 'all') return true;
    if (filter === 'listening') return port.status === 'LISTEN';
    if (filter === 'tcp') return port.protocol.toLowerCase().includes('tcp');
    if (filter === 'udp') return port.protocol.toLowerCase().includes('udp');
    if (filter === 'system') return port.port < 1024;
    if (filter === 'user') return port.port >= 1024;
    return true;
  });

  const portStats = {
    total: ports.length,
    listening: ports.filter(p => p.status === 'LISTEN').length,
    tcp: ports.filter(p => p.protocol.toLowerCase().includes('tcp')).length,
    udp: ports.filter(p => p.protocol.toLowerCase().includes('udp')).length,
    system: ports.filter(p => p.port < 1024).length,
    user: ports.filter(p => p.port >= 1024).length
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '15px', color: '#3b82f6' }}>
            <MdSearch size={48} />
          </div>
          <div style={{ color: '#6b7280' }}>Loading port information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '15px', color: '#ef4444' }}>
            <MdError size={48} />
          </div>
          <div style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</div>
          <button
            onClick={fetchPortsInfo}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px 30px',
        marginBottom: '30px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <MdOutlet size={32} style={{ color: '#3b82f6' }} />
            <span>Port Manager</span>
          </h1>
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <button
              onClick={fetchPortsInfo}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <MdRefresh size={16} style={{ marginRight: '6px' }} />Refresh
            </button>
            <button
              onClick={() => setShowOpenPortModal(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <MdLockOpen size={16} />Open Port
            </button>
            <button
              onClick={() => scanPorts(1, 1000)}
              disabled={scanning}
              style={{
                padding: '8px 16px',
                backgroundColor: scanning ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: scanning ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <MdSearch size={16} style={{ marginRight: '6px' }} />{scanning ? 'Scanning...' : 'Port Scan'}
            </button>
            <button
              onClick={() => setShowPortBlockModal(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <MdShield size={16} style={{ marginRight: '6px' }} />Manage Firewall
            </button>
          </div>
        </div>

        <div style={{
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Monitor and manage network ports, scan for open ports, and configure firewall rules
        </div>
      </div>

      {/* Port Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <MdBarChart size={20} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Total Ports
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {portStats.total}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <MdHeadset size={20} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Listening
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {portStats.listening}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <MdWifi size={20} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              TCP Ports
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
            {portStats.tcp}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <MdSignalWifiStatusbar4Bar size={20} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              UDP Ports
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {portStats.udp}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <MdSecurity size={20} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              System Ports
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            {portStats.system}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <MdPerson size={20} style={{ color: '#8b5cf6' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              User Ports
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {portStats.user}
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          {['all', 'listening', 'tcp', 'udp', 'system', 'user'].map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              style={{
                padding: '8px 16px',
                backgroundColor: filter === filterType ? '#3b82f6' : '#f3f4f6',
                color: filter === filterType ? 'white' : '#374151',
                border: '1px solid',
                borderColor: filter === filterType ? '#3b82f6' : '#d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}
            >
              {filterType === 'all' ? 'All Ports' :
               filterType === 'listening' ? 'Listening Only' :
               filterType === 'system' ? 'System Ports (1-1023)' :
               filterType === 'user' ? 'User Ports (1024+)' :
               filterType.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Port List */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        marginBottom: '30px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 30px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1f2937'
          }}>
            Active Ports ({filteredPorts.length})
          </h2>
        </div>

        <div style={{ padding: '0' }}>
          {filteredPorts.length > 0 ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '60px 100px 120px 120px 150px 1fr 120px',
                gap: '15px',
                padding: '15px 20px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase'
              }}>
                <div>Type</div>
                <div>Port</div>
                <div>Protocol</div>
                <div>Status</div>
                <div>Service</div>
                <div>Process</div>
                <div>Local Address</div>
              </div>

              {filteredPorts.map((port, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 100px 120px 120px 150px 1fr 120px',
                  gap: '15px',
                  padding: '15px 20px',
                  borderBottom: index < filteredPorts.length - 1 ? '1px solid #f3f4f6' : 'none',
                  alignItems: 'center',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    {getPortTypeIcon(port.protocol)}
                  </div>

                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: port.port < 1024 ? '#ef4444' : '#3b82f6',
                    fontFamily: 'monospace'
                  }}>
                    {port.port}
                  </div>

                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
                  }}>
                    {port.protocol}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getPortStatusColor(port.status)
                    }} />
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: getPortStatusColor(port.status)
                    }}>
                      {port.status}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '13px',
                    color: getServiceColor(port.service),
                    fontWeight: '500'
                  }}>
                    {port.service || 'Unknown'}
                  </div>

                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280'
                  }}>
                    {port.process || '-'}
                    {port.pid && (
                      <span style={{ 
                        marginLeft: '8px',
                        fontSize: '12px',
                        color: '#9ca3af',
                        fontFamily: 'monospace'
                      }}>
                        (PID: {port.pid})
                      </span>
                    )}
                  </div>

                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    fontFamily: 'monospace'
                  }}>
                    {port.localAddress || '-'}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px', color: '#6b7280', display: 'flex', justifyContent: 'center' }}>
                <MdSearch size={48} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '5px' }}>
                No ports found
              </div>
              <div style={{ fontSize: '14px' }}>
                {filter === 'all' 
                  ? 'No active ports detected on this server'
                  : `No ${filter} ports found`
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          marginBottom: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 30px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f8fafc'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <MdSearch size={20} style={{ marginRight: '8px', color: '#1f2937' }} />
              <span>Port Scan Results ({scanResults.length})</span>
            </h2>
          </div>

          <div style={{ padding: '20px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '10px'
            }}>
              {scanResults.map((port, index) => (
                <div key={index} style={{
                  padding: '10px',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#0369a1'
                }}>
                  {port}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Firewall Rules */}
      {firewallRules.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 30px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f8fafc'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <MdShield size={20} style={{ marginRight: '8px', color: '#1f2937' }} />
              <span>Firewall Rules ({firewallRules.length})</span>
            </h2>
          </div>

          <div style={{ padding: '20px' }}>
            {firewallRules.map((rule, index) => (
              <div key={index} style={{
                padding: '15px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '10px',
                fontFamily: 'monospace',
                fontSize: '13px',
                color: '#374151'
              }}>
                {rule}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Port Management Modal */}
      {showPortBlockModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            minWidth: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <MdShield size={20} style={{ color: '#3b82f6' }} />Firewall Management
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Port Number
              </label>
              <input
                type="number"
                value={portToBlock}
                onChange={(e) => setPortToBlock(e.target.value)}
                placeholder="e.g., 8080"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Action
              </label>
              <select
                value={blockAction}
                onChange={(e) => setBlockAction(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="block">Block Port</option>
                <option value="allow">Allow Port</option>
                <option value="remove">Remove Rule</option>
              </select>
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowPortBlockModal(false);
                  setPortToBlock('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => managePort(portToBlock, blockAction)}
                disabled={!portToBlock.trim()}
                style={{
                  padding: '10px 20px',
                  background: portToBlock.trim() ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: portToBlock.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Apply Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Port Modal */}
      {showOpenPortModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            minWidth: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <MdLockOpen size={20} style={{ color: '#3b82f6' }} />Open Port
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Port Number
              </label>
              <input
                type="number"
                value={newPortNumber}
                onChange={(e) => setNewPortNumber(e.target.value)}
                placeholder="e.g., 8080"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Protocol
              </label>
              <select
                value={newPortProtocol}
                onChange={(e) => setNewPortProtocol(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
              </select>
            </div>

            {error && (
              <div style={{
                marginBottom: '20px',
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowOpenPortModal(false);
                  setNewPortNumber('');
                  setNewPortProtocol('tcp');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleOpenPort}
                disabled={openingPort}
                style={{
                  padding: '10px 20px',
                  background: openingPort ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: openingPort ? 'not-allowed' : 'pointer'
                }}
              >
                {openingPort ? 'Opening...' : 'Open Port'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortManager;
