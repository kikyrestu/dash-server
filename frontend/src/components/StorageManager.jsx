import React, { useState, useEffect } from 'react';
import {
  MdStorage,
  MdError,
  MdRefresh,
  MdLock,
  MdLockOpen,
  MdBarChart,
  MdFolder,
  MdSpeed,
  MdThermostat,
  MdFavorite,
  MdFlash,
  MdDisc,
  MdSecurity,
  MdClose
} from 'react-icons/md';

const StorageManager = () => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSudoModal, setShowSudoModal] = useState(false);
  const [sudoPassword, setSudoPassword] = useState('');
  const [sudoVerifying, setSudoVerifying] = useState(false);
  const [hasSudoAccess, setHasSudoAccess] = useState(false);

  useEffect(() => {
    fetchStorageInfo();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStorageInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStorageInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/storage');
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
      const response = await fetch('http://localhost:3001/api/storage/sudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: sudoPassword })
      });

      const result = await response.json();
      
      if (result.success) {
        setHasSudoAccess(true);
        setShowSudoModal(false);
        setSudoPassword('');
        // Refresh storage info with sudo access
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
      await fetch('http://localhost:3001/api/storage/sudo/clear', {
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
    if (usage >= 90) return '#ef4444'; // red
    if (usage >= 80) return '#f59e0b'; // yellow
    if (usage >= 60) return '#3b82f6'; // blue
    return '#10b981'; // green
  };

  const getStorageTypeIcon = (type) => {
    const iconProps = { size: 16 };
    return type === 'SSD' ? <MdFlash {...iconProps} /> : <MdDisc {...iconProps} />;
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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
          <MdStorage size={64} style={{ marginBottom: '15px', color: '#6b7280' }} />
          <div style={{ color: '#6b7280' }}>Loading storage information...</div>
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
          <MdError size={64} style={{ marginBottom: '15px', color: '#ef4444' }} />
          <div style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</div>
          <button
            onClick={fetchStorageInfo}
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
            <MdStorage size={32} /> <span>Storage Manager</span>
          </h1>
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <button
              onClick={fetchStorageInfo}
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
            
            {/* Sudo Access Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: hasSudoAccess ? '#dcfce7' : '#fef3c7',
              color: hasSudoAccess ? '#166534' : '#92400e',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              <span>{hasSudoAccess ? <MdLockOpen size={16} /> : <MdLock size={16} />}</span>
              <span>{hasSudoAccess ? 'SMART Access' : 'Limited Access'}</span>
            </div>
            
            {/* Sudo Controls */}
            {hasSudoAccess ? (
              <button
                onClick={handleClearSudo}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Clear Sudo
              </button>
            ) : (
              <button
                onClick={() => setShowSudoModal(true)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Enable SMART
              </button>
            )}
          </div>
        </div>

        <div style={{
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Comprehensive storage monitoring including drive types, partitions, and I/O statistics
        </div>
      </div>

      {/* Overall Storage Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
            marginBottom: '15px'
          }}>
            <MdBarChart size={24} />
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              Total Storage
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '5px' }}>
            {storageInfo?.totalSpace || '0B'}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Used: {storageInfo?.usedSpace || '0B'} • Free: {storageInfo?.freeSpace || '0B'}
          </div>
          <div style={{
            marginTop: '10px',
            height: '8px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              backgroundColor: getStorageStatusColor(storageInfo?.usage || 0),
              width: `${storageInfo?.usage || 0}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginTop: '5px'
          }}>
            {storageInfo?.usage || 0}% used
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
            marginBottom: '15px'
          }}>
            <MdDisc size={24} />
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              Storage Devices
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '5px' }}>
            {storageInfo?.disks?.length || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {storageInfo?.disks?.filter(d => d.type === 'SSD').length || 0} SSD • {storageInfo?.disks?.filter(d => d.type === 'HDD').length || 0} HDD
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
            marginBottom: '15px'
          }}>
            <MdFolder size={24} />
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              Partitions
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '5px' }}>
            {storageInfo?.partitions?.length || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Active mounted filesystems
          </div>
        </div>
      </div>

      {/* Storage Devices */}
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
            <MdDisc size={20} style={{ marginRight: '8px' }} /><span>Storage Devices</span>
          </h2>
        </div>

        <div style={{ padding: '20px 30px' }}>
          {storageInfo?.disks?.length > 0 ? (
            <div style={{ display: 'grid', gap: '20px' }}>
              {storageInfo.disks.map((disk, index) => (
                <div key={index} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: '#f8fafc'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '15px'
                  }}>
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '5px'
                      }}>
                        <span style={{ fontSize: '18px' }}>
                          {getStorageTypeIcon(disk.type)}
                        </span>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937'
                        }}>
                          /dev/{disk.name}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          backgroundColor: disk.type === 'SSD' ? '#dbeafe' : '#fef3c7',
                          color: disk.type === 'SSD' ? '#1e40af' : '#92400e',
                          borderRadius: '12px',
                          fontWeight: '500'
                        }}>
                          {disk.type}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        marginBottom: '5px'
                      }}>
                        Model: {disk.model}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        Size: {disk.size}
                        {disk.temperature && (
                          <span style={{ marginLeft: '15px' }}>
                            <MdThermostat size={16} style={{ marginRight: '4px' }} />{disk.temperature}°C
                          </span>
                        )}
                        {disk.healthPercentage && (
                          <span style={{ 
                            marginLeft: '15px',
                            color: disk.healthPercentage > 80 ? '#10b981' : disk.healthPercentage > 60 ? '#f59e0b' : '#ef4444',
                            fontWeight: '600'
                          }}>
                            <MdFavorite size={16} style={{ marginRight: '4px', color: '#ef4444' }} />{disk.healthPercentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Partitions */}
                  {disk.partitions?.length > 0 && (
                    <div>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '10px'
                      }}>
                        Partitions ({disk.partitions.length})
                      </h4>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {disk.partitions.map((partition, partIndex) => (
                          <div key={partIndex} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 100px 100px 80px 60px',
                            gap: '15px',
                            alignItems: 'center',
                            padding: '10px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                          }}>
                            <div>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#374151',
                                fontFamily: 'monospace'
                              }}>
                                /dev/{partition.name}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#6b7280'
                              }}>
                                {partition.mountpoint} • {partition.fstype}
                              </div>
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              textAlign: 'center'
                            }}>
                              {partition.size}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              textAlign: 'center'
                            }}>
                              {partition.used || 'N/A'}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              textAlign: 'center'
                            }}>
                              {partition.available || 'N/A'}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: getStorageStatusColor(partition.usage || 0),
                              textAlign: 'center'
                            }}>
                              {partition.usage || 0}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SMART Info */}
                  {disk.smart && disk.smart !== 'N/A' && (
                    <div style={{ marginTop: '15px' }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Health Information
                      </h4>
                      
                      {disk.smart.includes('requires sudo password') ? (
                        <div style={{
                          padding: '15px',
                          backgroundColor: '#fef3c7',
                          borderRadius: '8px',
                          border: '1px solid #f59e0b',
                          marginBottom: '10px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px'
                          }}>
                            <MdSecurity size={16} />
                            <span style={{ 
                              fontSize: '14px', 
                              fontWeight: '600', 
                              color: '#92400e' 
                            }}>
                              SMART Data Requires Permissions
                            </span>
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#92400e',
                            marginBottom: '10px'
                          }}>
                            Enable SMART access to view detailed disk health information including temperature, wear level, and error statistics.
                          </div>
                          <button
                            onClick={() => setShowSudoModal(true)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            🔑 Enable SMART Access
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          fontFamily: 'monospace',
                          backgroundColor: 'white',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {disk.smart}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6b7280'
            }}>
              <MdDisc size={96} style={{ marginBottom: '15px', color: '#6b7280' }} />
              <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '5px' }}>
                No storage devices detected
              </div>
              <div style={{ fontSize: '14px' }}>
                Storage information may require elevated permissions
              </div>
            </div>
          )}
        </div>
      </div>

      {/* I/O Statistics */}
      {storageInfo?.ioStats?.length > 0 && (
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
              <MdBarChart size={20} style={{ marginRight: '8px' }} /><span>I/O Statistics</span>
            </h2>
          </div>

          <div style={{ padding: '20px 30px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 120px 100px',
              gap: '15px',
              padding: '15px 0',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase'
            }}>
              <div>Device</div>
              <div>Read KB/s</div>
              <div>Write KB/s</div>
              <div>Utilization</div>
            </div>

            {storageInfo.ioStats.map((stat, index) => (
              <div key={index} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 120px 100px',
                gap: '15px',
                padding: '12px 0',
                borderBottom: index < storageInfo.ioStats.length - 1 ? '1px solid #f3f4f6' : 'none',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  fontFamily: 'monospace'
                }}>
                  {stat.device}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#059669',
                  fontWeight: '500'
                }}>
                  {stat.readKBps.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#dc2626',
                  fontWeight: '500'
                }}>
                  {stat.writeKBps.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: getStorageStatusColor(stat.utilization),
                  fontWeight: '600'
                }}>
                  {stat.utilization.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mounted Filesystems */}
      {storageInfo?.mounts?.length > 0 && (
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
              🔗 <span>Mounted Filesystems</span>
            </h2>
          </div>

          <div style={{ padding: '20px 30px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 120px 1fr',
              gap: '15px',
              padding: '15px 0',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase'
            }}>
              <div>Device</div>
              <div>Mount Point</div>
              <div>Filesystem</div>
              <div>Options</div>
            </div>

            {storageInfo.mounts.map((mount, index) => (
              <div key={index} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 120px 1fr',
                gap: '15px',
                padding: '12px 0',
                borderBottom: index < storageInfo.mounts.length - 1 ? '1px solid #f3f4f6' : 'none',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  fontFamily: 'monospace'
                }}>
                  {mount.device}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  fontFamily: 'monospace'
                }}>
                  {mount.mountpoint}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#059669',
                  fontWeight: '500'
                }}>
                  {mount.filesystem}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {mount.options}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Sudo Password Modal */}
      {showSudoModal && (
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
            maxWidth: '500px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <MdLock size={20} style={{ marginRight: '8px' }} />Enable SMART Data Access
            </h3>
            
            <p style={{
              margin: '0 0 20px 0',
              color: '#6b7280',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              To access detailed disk health information (SMART data), sudo privileges are required. 
              Your password will be used only for disk monitoring and won't be stored permanently.
            </p>

            {error && error.includes('sudo') && (
              <div style={{
                background: '#fee2e2',
                color: '#dc2626',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
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
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '20px',
                boxSizing: 'border-box'
              }}
              autoFocus
            />

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowSudoModal(false);
                  setSudoPassword('');
                  setError(null);
                }}
                disabled={sudoVerifying}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: sudoVerifying ? 'not-allowed' : 'pointer',
                  opacity: sudoVerifying ? 0.5 : 1
                }}
              >
                Skip
              </button>
              
              <button
                onClick={handleSudoSubmit}
                disabled={!sudoPassword.trim() || sudoVerifying}
                style={{
                  padding: '10px 20px',
                  background: sudoPassword.trim() && !sudoVerifying ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: sudoPassword.trim() && !sudoVerifying ? 'pointer' : 'not-allowed'
                }}
              >
                {sudoVerifying ? 'Verifying...' : 'Enable SMART Access'}
              </button>
            </div>
            
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>Security Notice:</div>
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

export default StorageManager;
