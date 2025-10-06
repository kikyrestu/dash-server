import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

const DatabaseManagerTailwind = () => {
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDb, setSelectedDb] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [queryResult, setQueryResult] = useState(null);
  const [query, setQuery] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [dbPassword, setDbPassword] = useState('');
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [executing, setExecuting] = useState(false);

  const loadDatabases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/databases`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setDatabases(result.databases || []);
      setConnectionStatus(result.status || {});
    } catch (error) {
      console.error('Failed to load databases:', error);
      setError('Failed to load databases: ' + error.message);
      setDatabases([]);
      setConnectionStatus({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatabases();
    // Refresh every 30 seconds
    const interval = setInterval(loadDatabases, 30000);
    return () => clearInterval(interval);
  }, [loadDatabases]);

  const connectToDatabase = async (dbInfo, password = '') => {
    if (connecting) return; // Prevent multiple concurrent connections
    
    setConnecting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/database/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dbInfo,
          password: password
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
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
        setError(null);
      } else if (result.error && result.error.includes('Access denied')) {
        setPendingConnection(dbInfo);
        setShowPasswordModal(true);
        setError(null);
      } else {
        setError(result.error || 'Connection failed');
      }
      return result;
    } catch (error) {
      console.error('Connection failed:', error);
      setError('Connection failed: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setConnecting(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (pendingConnection && dbPassword.trim()) {
      await connectToDatabase(pendingConnection, dbPassword);
    }
  };

  const validateQuery = (query) => {
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'INSERT', 'UPDATE'];
    const upperQuery = query.toUpperCase();
    
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        return {
          isValid: false,
          message: `Query contains potentially dangerous keyword: ${keyword}. Only SELECT queries are allowed for safety.`
        };
      }
    }
    
    return { isValid: true };
  };

  const executeQuery = async () => {
    if (!selectedDb || !query.trim()) return;

    // Validate query for safety
    const validation = validateQuery(query);
    if (!validation.isValid) {
      setQueryResult({ success: false, error: validation.message });
      return;
    }

    setExecuting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/database/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: selectedDb.name,
          query: query
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setQueryResult(result);
      
      if (!result.success) {
        setError(result.error);
      }
    } catch (error) {
      const errorMsg = 'Query execution failed: ' + error.message;
      setQueryResult({ success: false, error: errorMsg });
      setError(errorMsg);
    } finally {
      setExecuting(false);
    }
  };

  const getDbIcon = (type) => {
    const icons = {
      'mysql': '🐬',
      'postgresql': '🐘', 
      'mongodb': '🍃',
      'sqlite': '📦',
      'redis': '🔴',
      'mariadb': '🌊'
    };
    return icons[type.toLowerCase()] || '💾';
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
    <div className="p-5 bg-gray-50 min-h-screen font-inter">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 mb-5 shadow-lg border border-gray-200 backdrop-blur-sm">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-3 mb-2">
          💾 Database Manager
        </h1>
        <p className="text-gray-500 text-sm ml-9">
          Manage and query databases on your server
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Database List */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Detected Databases
            </h2>
            <button
              onClick={loadDatabases}
              disabled={loading}
              className={`px-3 py-2 bg-blue-500 text-white text-xs rounded-lg transition-all duration-200 hover:bg-blue-600 hover:scale-105 ${
                loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {loading ? '🔄 Scanning...' : '🔍 Refresh'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
              <div className="text-red-700 text-sm font-medium">❌ Error:</div>
              <div className="text-red-600 text-xs mt-1">{error}</div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-10 text-gray-500">
              <div className="animate-spin text-2xl mb-2">⚙️</div>
              Scanning for databases...
            </div>
          ) : (
            <div className="space-y-3">
              {databases.map((db, index) => (
                <div
                  key={index}
                  onClick={() => !connecting && connectToDatabase(db)}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                    selectedDb?.name === db.name
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  } ${connecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getDbIcon(db.type)}</span>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {db.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {db.type} • Port {db.port}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {connecting && pendingConnection?.name === db.name && (
                      <div className="animate-spin text-blue-500">⚙️</div>
                    )}
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus[db.name]?.connected ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                </div>
              ))}
              
              {databases.length === 0 && (
                <div className="text-center py-10 text-gray-500 italic">
                  No databases detected. Make sure database services are running.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Query Interface */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Query Interface
          </h2>

          {selectedDb ? (
            <>
              <div className="bg-gray-100 p-3 rounded-lg mb-4 text-sm">
                <strong>Connected to:</strong> {selectedDb.name} ({selectedDb.type})
              </div>

              {/* Quick Queries */}
              {quickQueries[selectedDb.type.toLowerCase()] && (
                <div className="mb-4">
                  <div className="text-sm font-semibold mb-2">
                    Quick Queries:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickQueries[selectedDb.type.toLowerCase()].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(item.query)}
                        className="p-2 bg-gray-100 border border-gray-300 rounded text-xs text-left hover:bg-gray-200 transition-colors duration-200"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Query Input */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">SQL Query:</label>
                  <div className="text-xs text-gray-500">
                    Only SELECT queries allowed for safety
                  </div>
                </div>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your SELECT query here..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={executeQuery}
                  disabled={!query.trim() || executing}
                  className={`mt-2 px-4 py-2 bg-green-500 text-white rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    query.trim() && !executing
                      ? 'hover:bg-green-600 hover:scale-105 cursor-pointer' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {executing && <div className="animate-spin">⚙️</div>}
                  {executing ? 'Executing...' : 'Execute Query'}
                </button>
              </div>

              {/* Query Result */}
              {queryResult && (
                <div className={`border rounded-lg p-3 max-h-48 overflow-auto ${
                  queryResult.success 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`text-xs font-semibold mb-2 ${
                    queryResult.success ? 'text-blue-800' : 'text-red-800'
                  }`}>
                    {queryResult.success ? '✅ Query Result:' : '❌ Error:'}
                  </div>
                  <pre className={`text-xs font-mono whitespace-pre-wrap ${
                    queryResult.success ? 'text-gray-700' : 'text-red-700'
                  }`}>
                    {queryResult.success ? 
                      JSON.stringify(queryResult.data, null, 2) : 
                      queryResult.error
                    }
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-gray-500 italic">
              Select a database from the list to start querying
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 min-w-96 max-w-md mx-4 shadow-2xl transform animate-pulse">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3 mb-5">
              🔐 Database Authentication
            </h3>
            
            <p className="text-gray-600 text-sm mb-5">
              Please enter the password for <strong>{pendingConnection?.name}</strong>:
            </p>

            {error && error.includes('password') && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

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
              className="w-full p-3 border border-gray-300 rounded-lg text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPendingConnection(null);
                  setDbPassword('');
                  setError(null);
                }}
                disabled={connecting}
                className="px-5 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                disabled={!dbPassword.trim() || connecting}
                className={`px-5 py-2 text-white rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  dbPassword.trim() && !connecting
                    ? 'bg-blue-500 hover:bg-blue-600 hover:scale-105' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {connecting && <div className="animate-spin">⚙️</div>}
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManagerTailwind;
