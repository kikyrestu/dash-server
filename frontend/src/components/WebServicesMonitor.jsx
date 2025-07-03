import React, { useState, useEffect } from 'react';
import {
  MdPublic,
  MdStorage,
  MdFlash,
  MdSettings,
  MdArchive,
  MdLink,
  MdSecurity,
  MdBarChart,
  MdBuild,
  MdError,
  MdRefresh,
  MdSearch,
  MdCheckCircle,
  MdLabel
} from 'react-icons/md';

const WebServicesMonitor = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchServicesInfo();
    // Refresh every 30 seconds
    const interval = setInterval(fetchServicesInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchServicesInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/services');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setServices(data.services || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch services info:', err);
      setError('Failed to load services information');
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (type) => {
    const iconProps = { size: 20 };
    const iconMap = {
      'web': <MdPublic {...iconProps} />,
      'database': <MdStorage {...iconProps} />,
      'cache': <MdFlash {...iconProps} />,
      'application': <MdSettings {...iconProps} />,
      'container': <MdArchive {...iconProps} />,
      'network': <MdLink {...iconProps} />,
      'security': <MdSecurity {...iconProps} />,
      'monitoring': <MdBarChart {...iconProps} />,
      'other': <MdBuild {...iconProps} />
    };
    return iconMap[type] || iconMap['other'];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981'; // green
      case 'inactive': return '#ef4444'; // red
      case 'failed': return '#dc2626'; // dark red
      case 'unknown': return '#6b7280'; // gray
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Running';
      case 'inactive': return 'Stopped';
      case 'failed': return 'Failed';
      case 'unknown': return 'Unknown';
      default: return 'Unknown';
    }
  };

  const getServiceTypeColor = (type) => {
    const colors = {
      'web': '#3b82f6',
      'database': '#8b5cf6', 
      'cache': '#f59e0b',
      'application': '#10b981',
      'container': '#06b6d4',
      'network': '#6366f1',
      'security': '#ef4444',
      'monitoring': '#84cc16',
      'other': '#6b7280'
    };
    return colors[type] || colors['other'];
  };

  const filteredServices = services.filter(service => {
    if (filter === 'all') return true;
    if (filter === 'running') return service.status === 'active';
    if (filter === 'stopped') return service.status !== 'active';
    return service.type === filter;
  });

  const serviceStats = {
    total: services.length,
    running: services.filter(s => s.status === 'active').length,
    stopped: services.filter(s => s.status !== 'active').length,
    types: [...new Set(services.map(s => s.type))].length
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
          <MdPublic size={64} style={{ marginBottom: '15px', color: '#6b7280' }} />
          <div style={{ color: '#6b7280' }}>Loading web services...</div>
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
            onClick={fetchServicesInfo}
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
            <MdPublic size={32} /> <span>Web Services Monitor</span>
          </h1>
          <button
            onClick={fetchServicesInfo}
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
        </div>

        <div style={{
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Monitor all running web services, databases, and applications on your server
        </div>
      </div>

      {/* Service Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            <MdBarChart size={24} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Total Services
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {serviceStats.total}
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
            <MdCheckCircle size={24} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Running
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {serviceStats.running}
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
            <MdError size={24} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Stopped
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            {serviceStats.stopped}
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
            <MdLabel size={24} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Service Types
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
            {serviceStats.types}
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
          {['all', 'running', 'stopped', 'web', 'database', 'cache', 'application', 'container', 'network'].map(filterType => (
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
              {filterType === 'all' ? 'All Services' : filterType}
            </button>
          ))}
        </div>
      </div>

      {/* Services List */}
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
            color: '#1f2937'
          }}>
            Services ({filteredServices.length})
          </h2>
        </div>

        <div style={{ padding: '0' }}>
          {filteredServices.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 120px 120px 100px 120px',
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
              <div>Service Name</div>
              <div>Status</div>
              <div>Port</div>
              <div>PID</div>
              <div>Memory</div>
            </div>
          ) : null}

          {filteredServices.length > 0 ? (
            filteredServices.map((service, index) => (
              <div key={index} style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 120px 120px 100px 120px',
                gap: '15px',
                padding: '15px 20px',
                borderBottom: index < filteredServices.length - 1 ? '1px solid #f3f4f6' : 'none',
                alignItems: 'center',
                transition: 'background-color 0.2s ease',
                cursor: 'default'
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
                  justifyContent: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: getServiceTypeColor(service.type) + '20',
                    border: `1px solid ${getServiceTypeColor(service.type)}40`
                  }}>
                    {getServiceIcon(service.type)}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '2px'
                  }}>
                    {service.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {service.description || 'No description'}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(service.status)
                  }} />
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: getStatusColor(service.status)
                  }}>
                    {getStatusText(service.status)}
                  </span>
                </div>

                <div style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  fontFamily: 'monospace'
                }}>
                  {service.port || '-'}
                </div>

                <div style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  fontFamily: 'monospace'
                }}>
                  {service.pid || '-'}
                </div>

                <div style={{
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  {service.memory || '-'}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <MdSearch size={96} style={{ marginBottom: '15px', color: '#6b7280' }} />
              <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '5px' }}>
                No services found
              </div>
              <div style={{ fontSize: '14px' }}>
                {filter === 'all' 
                  ? 'No services detected on this server'
                  : `No ${filter} services found`
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebServicesMonitor;
