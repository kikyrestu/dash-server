import React, { useState, useEffect, useRef } from 'react';

const LogManagerTailwind = () => {
  const [logSources, setLogSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('viewer');
  
  // Search options
  const [searchOptions, setSearchOptions] = useState({
    lines: 100,
    level: '',
    caseSensitive: false
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [linesPerPage] = useState(50);
  
  // Refs for streaming and auto-scroll
  const logContainerRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Load log sources on component mount
  useEffect(() => {
    loadLogSources();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom when new logs arrive (only in streaming mode)
  useEffect(() => {
    if (isStreaming && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isStreaming]);

  const loadLogSources = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:3001/api/logs/sources', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (data.success) {
        setLogSources(data.sources);
        if (data.sources.length > 0 && !selectedSource) {
          setSelectedSource(data.sources[0]);
        }
      } else {
        setError(data.error || 'Failed to load log sources');
      }
    } catch (err) {
      setError('Failed to load log sources: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (source, page = 1) => {
    if (!source) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const offset = (page - 1) * linesPerPage;
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `http://localhost:3001/api/logs/${source.id}?lines=${linesPerPage}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data.lines);
        setCurrentPage(page);
      } else {
        setError(data.error || 'Failed to load logs');
      }
    } catch (err) {
      setError('Failed to load logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startStreaming = (source) => {
    if (!source || isStreaming) return;
    
    try {
      setIsStreaming(true);
      setLogs([]); // Clear existing logs
      setError(null);
      
      const token = localStorage.getItem('admin_token');
      const eventSource = new EventSource(
        `http://localhost:3001/api/logs/${source.id}/stream?token=${token}`
      );
      
      eventSourceRef.current = eventSource;
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            setError(data.error);
            return;
          }
          
          if (data.line) {
            setLogs(prevLogs => {
              const newLogs = [...prevLogs, {
                content: data.line,
                timestamp: data.timestamp,
                id: Date.now() + Math.random()
              }];
              // Keep only last 1000 lines for performance
              return newLogs.slice(-1000);
            });
          }
        } catch (err) {
          console.error('Error parsing log stream data:', err);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        setError('Log streaming connection lost');
        stopStreaming();
      };
      
    } catch (err) {
      setError('Failed to start log streaming: ' + err.message);
      setIsStreaming(false);
    }
  };

  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  };

  const searchLogs = async () => {
    if (!selectedSource || !searchQuery.trim()) return;
    
    try {
      setSearchLoading(true);
      setError(null);
      
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:3001/api/logs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceId: selectedSource.id,
          query: searchQuery,
          options: searchOptions
        })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.search.results);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Search failed: ' + err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSourceChange = (source) => {
    stopStreaming(); // Stop any active streaming
    setSelectedSource(source);
    setLogs([]);
    setSearchResults([]);
    setCurrentPage(1);
    if (activeTab === 'viewer') {
      loadLogs(source, 1);
    }
  };

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'system': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'security': return 'bg-red-100 text-red-800 border-red-200';
      case 'web': return 'bg-green-100 text-green-800 border-green-200';
      case 'database': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLogLevelColor = (line) => {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('error') || lowerLine.includes('err')) return 'text-red-600';
    if (lowerLine.includes('warn') || lowerLine.includes('warning')) return 'text-yellow-600';
    if (lowerLine.includes('info')) return 'text-blue-600';
    if (lowerLine.includes('debug')) return 'text-gray-600';
    return 'text-gray-800';
  };

  const formatLogLine = (line, index) => {
    return (
      <div 
        key={index} 
        className={`font-mono text-xs p-2 border-b border-gray-100 hover:bg-gray-50 ${getLogLevelColor(line)}`}
      >
        <span className="text-gray-500 mr-2">{String(index + 1).padStart(4, '0')}:</span>
        {line}
      </div>
    );
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, []);

  return (
    <div className="p-5 bg-gray-50 min-h-screen font-inter">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 mb-5 shadow-lg border border-gray-200">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-3 mb-2">
          📋 Log Management Center
        </h1>
        <p className="text-gray-500 text-sm ml-9">
          Monitor, search, and stream system logs in real-time
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <div className="text-red-700 text-sm font-medium">❌ Error:</div>
          <div className="text-red-600 text-xs mt-1">{error}</div>
        </div>
      )}

      {/* Log Sources */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-5 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Log Sources</h2>
        
        {loading && logSources.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <div className="animate-spin text-2xl mb-2">⚙️</div>
            Loading log sources...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {logSources.map((source) => (
              <div
                key={source.id}
                onClick={() => handleSourceChange(source)}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedSource?.id === source.id
                    ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{source.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLogTypeColor(source.type)}`}>
                    {source.type}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  <div>Path: {source.path}</div>
                  {source.size && <div>Size: {(source.size / 1024).toFixed(1)} KB</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      {selectedSource && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('viewer');
                stopStreaming();
                loadLogs(selectedSource, 1);
              }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'viewer'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📄 Log Viewer
            </button>
            <button
              onClick={() => {
                setActiveTab('stream');
                if (!isStreaming) {
                  startStreaming(selectedSource);
                }
              }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'stream'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📡 Live Stream {isStreaming && <span className="ml-1 text-green-500">●</span>}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🔍 Search
            </button>
          </div>

          <div className="p-6">
            {/* Log Viewer Tab */}
            {activeTab === 'viewer' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Viewing: {selectedSource.name}</h3>
                  <button
                    onClick={() => loadLogs(selectedSource, currentPage)}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm disabled:opacity-50"
                  >
                    🔄 Refresh
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-10 text-gray-500">
                    <div className="animate-spin text-2xl mb-2">⚙️</div>
                    Loading logs...
                  </div>
                ) : (
                  <div>
                    <div 
                      ref={logContainerRef}
                      className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto border"
                    >
                      {logs.length === 0 ? (
                        <div className="text-gray-500 text-center py-4">No logs found</div>
                      ) : (
                        logs.map((line, index) => formatLogLine(line, index))
                      )}
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-center items-center gap-4 mt-4">
                      <button
                        onClick={() => loadLogs(selectedSource, Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        ← Previous
                      </button>
                      <span className="text-sm text-gray-600">Page {currentPage}</span>
                      <button
                        onClick={() => loadLogs(selectedSource, currentPage + 1)}
                        disabled={logs.length < linesPerPage || loading}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Live Stream Tab */}
            {activeTab === 'stream' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Live Stream: {selectedSource.name}
                    {isStreaming && <span className="ml-2 text-green-500 text-sm">● LIVE</span>}
                  </h3>
                  <div className="flex gap-2">
                    {!isStreaming ? (
                      <button
                        onClick={() => startStreaming(selectedSource)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm"
                      >
                        ▶️ Start Stream
                      </button>
                    ) : (
                      <button
                        onClick={stopStreaming}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
                      >
                        ⏹️ Stop Stream
                      </button>
                    )}
                    <button
                      onClick={() => setLogs([])}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 text-sm"
                    >
                      🗑️ Clear
                    </button>
                  </div>
                </div>

                <div 
                  ref={logContainerRef}
                  className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto border"
                >
                  {logs.length === 0 ? (
                    <div className="text-gray-500 text-center py-4">
                      {isStreaming ? 'Waiting for new log entries...' : 'Click "Start Stream" to begin monitoring'}
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={log.id} className={`p-1 ${getLogLevelColor(log.content)}`}>
                        <span className="text-gray-500 mr-2">
                          {new Date(log.timestamp).toLocaleTimeString()}:
                        </span>
                        {log.content}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Search Logs: {selectedSource.name}</h3>
                
                {/* Search Form */}
                <div className="space-y-4 mb-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchLogs()}
                        placeholder="Enter search query..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={searchLogs}
                      disabled={!searchQuery.trim() || searchLoading}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50"
                    >
                      {searchLoading ? '🔄' : '🔍'} Search
                    </button>
                  </div>

                  {/* Search Options */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Results</label>
                      <select
                        value={searchOptions.lines}
                        onChange={(e) => setSearchOptions({...searchOptions, lines: parseInt(e.target.value)})}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={50}>50 lines</option>
                        <option value={100}>100 lines</option>
                        <option value={500}>500 lines</option>
                        <option value={1000}>1000 lines</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Log Level</label>
                      <select
                        value={searchOptions.level}
                        onChange={(e) => setSearchOptions({...searchOptions, level: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All levels</option>
                        <option value="error">Error</option>
                        <option value="warn">Warning</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={searchOptions.caseSensitive}
                          onChange={(e) => setSearchOptions({...searchOptions, caseSensitive: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Case sensitive</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Search Results */}
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto border">
                  {searchLoading ? (
                    <div className="text-center py-4 text-gray-500">
                      <div className="animate-spin text-lg mb-2">🔄</div>
                      Searching logs...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-gray-500 text-center py-4">
                      {searchQuery ? 'No matches found' : 'Enter a search query to begin'}
                    </div>
                  ) : (
                    <div>
                      <div className="text-blue-400 mb-2">
                        Found {searchResults.length} matches for "{searchQuery}"
                      </div>
                      {searchResults.map((line, index) => formatLogLine(line, index))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LogManagerTailwind;
