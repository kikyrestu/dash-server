import React, { useState, useEffect } from 'react';
import {
  MdStorage,
  MdCircle,
  MdRefresh,
  MdSearch,
  MdCheckCircle,
  MdError,
  MdSecurity,
  MdClose
} from 'react-icons/md';
import { API_BASE_URL } from '../config/api';

const DatabaseManager = () => {
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDb, setSelectedDb] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [queryResult, setQueryResult] = useState(null);
  const [query, setQuery] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [dbPassword, setDbPassword] = useState('');

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/databases`);
      const result = await response.json();
      setDatabases(result.databases || []);
      setConnectionStatus(result.status || {});
    } catch (error) {
      console.error('Failed to load databases:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectToDatabase = async (dbInfo, password = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/database/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dbInfo,
          password: password
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setSelectedDb(dbInfo);
        setConnectionStatus(prev => ({
          ...prev,
          [dbInfo.name]: { connected: true, info: result.info }
        }));
        setShowPasswordModal(false);
        setPendingConnection(null);
        setDbPassword('');
      } else if (result.error && result.error.includes('Access denied')) {
        // If access denied, show password modal
        setPendingConnection(dbInfo);
        setShowPasswordModal(true);
      }
      return result;
    } catch (error) {
      console.error('Connection failed:', error);
      return { success: false, error: error.message };
    }
  };

  const handlePasswordSubmit = () => {
    if (pendingConnection && dbPassword) {
      connectToDatabase(pendingConnection, dbPassword);
    }
  };

  const executeQuery = async () => {
    if (!selectedDb || !query.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/database/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: selectedDb.name,
          query: query
        })
      });

      const result = await response.json();
      setQueryResult(result);
    } catch (error) {
      setQueryResult({ success: false, error: error.message });
    }
  };

  const getDbIcon = (type) => {
    const iconProps = { size: 20 };
    const iconMap = {
      'mysql': <MdCircle {...iconProps} style={{ color: '#4285f4' }} />,
      'postgresql': <MdCircle {...iconProps} style={{ color: '#336791' }} />, 
      'mongodb': <MdCircle {...iconProps} style={{ color: '#4db33d' }} />,
      'sqlite': <MdCircle {...iconProps} style={{ color: '#003b57' }} />,
      'redis': <MdCircle {...iconProps} style={{ color: '#dc382d' }} />,
      'mariadb': <MdCircle {...iconProps} style={{ color: '#1f5582' }} />
    };
    return iconMap[type.toLowerCase()] || <MdStorage {...iconProps} />;
  };

  const getStatusColor = (status) => {
    if (status?.connected) return '#10b981';
    return '#ef4444';
  };

  const quickQueries = {
    mysql: [
      { label: 'Show Databases', query: 'SHOW DATABASES;' },
      { label: 'Show Tables', query: 'SHOW TABLES;' },
      { label: 'Show Processes', query: 'SHOW PROCESSLIST;' },
      { label: 'Show Status', query: 'SHOW STATUS;' }
    ],
    postgresql: [
      { label: 'List Databases', query: 'SELECT datname FROM pg_database;' },
      { label: 'List Tables', query: 'SELECT tablename FROM pg_tables WHERE schemaname = \'public\';' },
      { label: 'Show Connections', query: 'SELECT * FROM pg_stat_activity;' },
      { label: 'Database Size', query: 'SELECT pg_size_pretty(pg_database_size(current_database()));' }
    ],
    mongodb: [
      { label: 'Show Collections', query: 'show collections' },
      { label: 'Database Stats', query: 'db.stats()' },
      { label: 'Server Status', query: 'db.serverStatus()' },
      { label: 'List Users', query: 'db.getUsers()' }
    ]
  };

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
        marginBottom: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb'
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
          <MdStorage size={32} /> <span>Database Manager</span>
        </h1>
        <p style={{
          margin: '5px 0 0 34px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Manage and query databases on your server
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Database List */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              Detected Databases
            </h2>
            <button
              onClick={loadDatabases}
              disabled={loading}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? (
                <>
                  <MdRefresh size={16} style={{ marginRight: '6px' }} />
                  Scanning...
                </>
              ) : (
                <>
                  <MdSearch size={16} style={{ marginRight: '6px' }} />
                  Refresh
                </>
              )}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Scanning for databases...
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {databases.map((db, index) => (
                <div
                  key={index}
                  onClick={() => connectToDatabase(db)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '15px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: selectedDb?.name === db.name ? '#eff6ff' : 'white'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDb?.name !== db.name) {
                      e.target.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDb?.name !== db.name) {
                      e.target.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{getDbIcon(db.type)}</span>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        {db.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {db.type} • Port {db.port}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(connectionStatus[db.name])
                  }}></div>
                </div>
              ))}
              
              {databases.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#6b7280',
                  fontStyle: 'italic'
                }}>
                  No databases detected. Make sure database services are running.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Query Interface */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1f2937'
          }}>
            Query Interface
          </h2>

          {selectedDb ? (
            <>
              <div style={{
                background: '#f3f4f6',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                <strong>Connected to:</strong> {selectedDb.name} ({selectedDb.type})
              </div>

              {/* Quick Queries */}
              {quickQueries[selectedDb.type.toLowerCase()] && (
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    Quick Queries:
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '6px'
                  }}>
                    {quickQueries[selectedDb.type.toLowerCase()].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(item.query)}
                        style={{
                          padding: '6px 10px',
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          textAlign: 'left'
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Query Input */}
              <div style={{ marginBottom: '15px' }}>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your query here..."
                  style={{
                    width: '100%',
                    height: '100px',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '13px',
                    resize: 'vertical'
                  }}
                />
                <button
                  onClick={executeQuery}
                  disabled={!query.trim()}
                  style={{
                    marginTop: '8px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: query.trim() ? 'pointer' : 'not-allowed',
                    opacity: query.trim() ? 1 : 0.5
                  }}
                >
                  Execute Query
                </button>
              </div>

              {/* Query Result */}
              {queryResult && (
                <div style={{
                  background: queryResult.success ? '#f0f9ff' : '#fef2f2',
                  border: `1px solid ${queryResult.success ? '#bfdbfe' : '#fecaca'}`,
                  borderRadius: '6px',
                  padding: '12px',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: queryResult.success ? '#1d4ed8' : '#dc2626',
                    marginBottom: '8px'
                  }}>
                    {queryResult.success ? (
                      <>
                        <MdCheckCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        Query Result:
                      </>
                    ) : (
                      <>
                        <MdError size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        Error:
                      </>
                    )}
                  </div>
                  <pre style={{
                    margin: 0,
                    fontSize: '11px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    whiteSpace: 'pre-wrap',
                    color: queryResult.success ? '#374151' : '#dc2626'
                  }}>
                    {queryResult.success ? 
                      JSON.stringify(queryResult.data, null, 2) : 
                      queryResult.error
                    }
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              Select a database from the list to start querying
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
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
              <MdSecurity size={20} style={{ marginRight: '8px' }} />Database Authentication
            </h3>
            
            <p style={{
              margin: '0 0 20px 0',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Please enter the password for <strong>{pendingConnection?.name}</strong>:
            </p>

            <input
              type="password"
              value={dbPassword}
              onChange={(e) => setDbPassword(e.target.value)}
              placeholder="Enter database password..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePasswordSubmit();
                }
              }}
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
                  setShowPasswordModal(false);
                  setPendingConnection(null);
                  setDbPassword('');
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
                onClick={handlePasswordSubmit}
                disabled={!dbPassword.trim()}
                style={{
                  padding: '10px 20px',
                  background: dbPassword.trim() ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: dbPassword.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManager;
