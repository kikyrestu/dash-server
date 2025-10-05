import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { 
  MdOutlet,
  MdRefresh,
  MdSearch,
  MdShield,
  MdNetworkCheck,
  MdBarChart,
  MdWifi,
  MdSignalWifiStatusbar4Bar,
  MdPublic,
  MdError,
  MdCheckCircle,
  MdAdd
} from 'react-icons/md';
import { API_BASE_URL } from '../config/api';

const PortManagerTailwind = () => {
  const [ports, setPorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [scanResults, setScanResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [showPortBlockModal, setShowPortBlockModal] = useState(false);
  const [portToBlock, setPortToBlock] = useState('');
  const [blockAction, setBlockAction] = useState('block');
  const [showOpenPortModal, setShowOpenPortModal] = useState(false);
  const [newPortNumber, setNewPortNumber] = useState('');
  const [newPortProtocol, setNewPortProtocol] = useState('tcp');
  const [openingPort, setOpeningPort] = useState(false);

  useEffect(() => {
    fetchPortsInfo();
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
      
      // Validate and sanitize port data
      const validPorts = (data.ports || []).map(port => ({
        port: port.port || 0,
        protocol: port.protocol || 'unknown',
        state: port.state || 'unknown',
        status: port.status || port.state || 'unknown',
        localAddress: port.localAddress || '0.0.0.0',
        service: port.service || 'unknown',
        process: port.process || null,
        pid: port.pid || null
      }));
      
      setPorts(validPorts);
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
        // eslint-disable-next-line no-unused-vars
        const data = await response.json();
        // Handle firewall rules if needed
      }
    } catch (err) {
      console.error('Failed to fetch firewall rules:', err);
    }
  };

  const performPortScan = async () => {
    setScanning(true);
    setScanResults([]);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ports/scan`, {
        method: 'POST'
      });
      const data = await response.json();
      setScanResults(data.results || []);
    } catch (err) {
      console.error('Port scan failed:', err);
      setError('Port scan failed: ' + err.message);
    } finally {
      setScanning(false);
    }
  };

  const handlePortAction = async () => {
    if (!portToBlock.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/firewall/rule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          port: portToBlock,
          action: blockAction
        })
      });

      if (response.ok) {
        setShowPortBlockModal(false);
        setPortToBlock('');
        fetchFirewallRules();
        fetchPortsInfo();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to apply firewall rule');
      }
    } catch (err) {
      setError('Failed to apply firewall rule: ' + err.message);
    }
  };

  const handleOpenPort = async () => {
    if (!newPortNumber.trim()) return;

    setOpeningPort(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ports/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          port: newPortNumber,
          protocol: newPortProtocol
        })
      });

      if (response.ok) {
        setShowOpenPortModal(false);
        setNewPortNumber('');
        setNewPortProtocol('tcp');
        fetchFirewallRules();
        fetchPortsInfo();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to open port');
      }
    } catch (err) {
      setError('Failed to open port: ' + err.message);
    } finally {
      setOpeningPort(false);
    }
  };

  const getPortStatusColor = (state) => {
    if (!state) return 'text-gray-500';
    switch (state.toLowerCase()) {
      case 'listen': return 'text-green-500';
      case 'established': return 'text-blue-500';
      case 'time_wait': return 'text-yellow-500';
      case 'close_wait': return 'text-orange-500';
      case 'closed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getPortStatusBg = (state) => {
    if (!state) return 'bg-gray-500';
    switch (state.toLowerCase()) {
      case 'listen': return 'bg-green-500';
      case 'established': return 'bg-blue-500';
      case 'time_wait': return 'bg-yellow-500';
      case 'close_wait': return 'bg-orange-500';
      case 'closed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getProtocolIcon = (protocol) => {
    const iconProps = { size: 16, className: "text-gray-600" };
    switch (protocol?.toLowerCase()) {
      case 'tcp': return <MdWifi {...iconProps} />;
      case 'udp': return <MdSignalWifiStatusbar4Bar {...iconProps} />;
      case 'tcp6': return <MdPublic {...iconProps} />;
      case 'udp6': return <MdPublic {...iconProps} />;
      default: return <MdNetworkCheck {...iconProps} />;
    }
  };

  const filteredPorts = ports.filter(port => {
    if (filter === 'all') return true;
    if (filter === 'listening') return port.state?.toLowerCase() === 'listen';
    if (filter === 'established') return port.state?.toLowerCase() === 'established';
    if (filter === 'tcp') return port.protocol?.toLowerCase() === 'tcp';
    if (filter === 'udp') return port.protocol?.toLowerCase() === 'udp';
    return true;
  });

  const portStats = {
    total: ports.length,
    listening: ports.filter(p => p.state?.toLowerCase() === 'listen').length,
    established: ports.filter(p => p.state?.toLowerCase() === 'established').length,
    tcp: ports.filter(p => p.protocol?.toLowerCase() === 'tcp').length,
    udp: ports.filter(p => p.protocol?.toLowerCase() === 'udp').length
  };

  if (loading) {
    return (
      <div className="p-5 bg-gray-50 min-h-screen flex items-center justify-center font-inter">
        <div className="bg-white rounded-xl p-10 text-center shadow-lg">
          <div className="text-4xl mb-4 animate-pulse flex justify-center">
            <MdOutlet size={48} className="text-blue-500" />
          </div>
          <div className="text-gray-500">Loading port information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 bg-gray-50 min-h-screen flex items-center justify-center font-inter">
        <div className="bg-white rounded-xl p-10 text-center shadow-lg">
          <div className="text-4xl mb-4 flex justify-center">
            <MdError size={48} className="text-red-500" />
          </div>
          <div className="text-red-500 mb-3">{error}</div>
          <button
            onClick={fetchPortsInfo}
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
            <MdOutlet size={24} className="text-blue-500" />
            Port Manager
          </h1>
          <div className="flex gap-3">
            <button
              onClick={fetchPortsInfo}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 hover:scale-105 transition-all duration-200 font-medium"
            >
              <MdRefresh size={16} className="mr-2" />
              Refresh
            </button>
            <button
              onClick={performPortScan}
              disabled={scanning}
              className={`px-4 py-2 bg-blue-500 text-white rounded-lg font-medium transition-all duration-200 ${
                scanning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 hover:scale-105'
              }`}
            >
              <MdSearch size={16} className="mr-2" />
              {scanning ? 'Scanning...' : 'Port Scan'}
            </button>
            <button
              onClick={() => setShowOpenPortModal(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 hover:scale-105 transition-all duration-200 font-medium"
            >
              <MdAdd size={16} className="mr-2 inline" />
              Open Port
            </button>
          </div>
        </div>
        <p className="text-gray-500 text-sm">
          Monitor network ports, manage firewall rules, and perform security scans
        </p>
      </div>

      {/* Port Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <MdBarChart size={20} className="text-blue-500" />
            <span className="text-sm font-semibold text-gray-700">Total Ports</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{portStats.total}</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <MdCheckCircle size={20} className="text-green-500" />
            <span className="text-sm font-semibold text-gray-700">Listening</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{portStats.listening}</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <MdNetworkCheck size={20} className="text-blue-500" />
            <span className="text-sm font-semibold text-gray-700">Established</span>
          </div>
          <div className="text-2xl font-bold text-blue-500">{portStats.established}</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <MdWifi size={20} className="text-indigo-500" />
            <span className="text-sm font-semibold text-gray-700">TCP</span>
          </div>
          <div className="text-2xl font-bold text-indigo-500">{portStats.tcp}</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <MdSignalWifiStatusbar4Bar size={20} className="text-cyan-500" />
            <span className="text-sm font-semibold text-gray-700">UDP</span>
          </div>
          <div className="text-2xl font-bold text-cyan-500">{portStats.udp}</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white rounded-xl p-5 mb-5 shadow-lg border border-gray-200">
        <div className="flex gap-2 flex-wrap">
          {['all', 'listening', 'established', 'tcp', 'udp'].map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                filter === filterType
                  ? 'bg-blue-500 text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              {filterType}
            </button>
          ))}
        </div>
      </div>

      {/* Ports List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">
            Active Ports ({filteredPorts.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          {filteredPorts.length > 0 ? (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div>Protocol</div>
                <div>Local Address</div>
                <div>Remote Address</div>
                <div>State</div>
                <div>Process</div>
                <div>Actions</div>
              </div>

              {/* Table Body */}
              {filteredPorts.map((port, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-6 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 items-center"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getProtocolIcon(port.protocol)}</span>
                    <span className="text-xs font-medium text-gray-900">
                      {port.protocol?.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-gray-900">
                    {port.localAddress}:{port.localPort}
                  </div>

                  <div className="text-xs font-mono text-gray-600">
                    {port.remoteAddress ? `${port.remoteAddress}:${port.remotePort}` : '-'}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getPortStatusBg(port.state)}`} />
                    <span className={`text-xs font-medium ${getPortStatusColor(port.state)}`}>
                      {port.state}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600">
                    {port.process || '-'}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setPortToBlock(port.localPort);
                        setBlockAction('block');
                        setShowPortBlockModal(true);
                      }}
                      className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors duration-200"
                    >
                      Block
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="py-16 text-center text-gray-500">
              <div className="text-5xl mb-4 flex justify-center">
                <MdOutlet size={48} className="text-gray-400" />
              </div>
              <div className="text-lg font-medium mb-2">No ports found</div>
              <div className="text-sm">
                {filter === 'all' 
                  ? 'No active ports detected'
                  : `No ${filter} ports found`
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MdSearch size={20} className="text-blue-500" />
              Scan Results ({scanResults.length})
            </h2>
          </div>

          <div className="p-6 space-y-2">
            {scanResults.map((result, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-mono text-gray-900">
                  Port {result.port} ({result.protocol})
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded ${
                  result.open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.open ? 'Open' : 'Closed'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Port Block Modal */}
      {showPortBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 min-w-96 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <MdShield size={20} className="text-blue-500" />
              Firewall Rule
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port Number
              </label>
              <input
                type="text"
                value={portToBlock}
                onChange={(e) => setPortToBlock(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Port number"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={blockAction}
                onChange={(e) => setBlockAction(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="block">Block</option>
                <option value="allow">Allow</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPortBlockModal(false);
                  setPortToBlock('');
                }}
                className="px-5 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePortAction}
                disabled={!portToBlock.trim()}
                className={`px-5 py-2 text-white rounded-lg transition-all duration-200 ${
                  portToBlock.trim() 
                    ? 'bg-blue-500 hover:bg-blue-600 hover:scale-105' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Apply Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Port Modal */}
      {showOpenPortModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 min-w-96 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <MdAdd size={20} className="text-green-500" />
              Open Port
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port Number
              </label>
              <input
                type="text"
                value={newPortNumber}
                onChange={(e) => setNewPortNumber(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Port number"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Protocol
              </label>
              <select
                value={newPortProtocol}
                onChange={(e) => setNewPortProtocol(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowOpenPortModal(false);
                  setNewPortNumber('');
                  setNewPortProtocol('tcp');
                }}
                disabled={openingPort}
                className="px-5 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleOpenPort}
                disabled={!newPortNumber.trim() || openingPort}
                className={`px-5 py-2 text-white rounded-lg transition-all duration-200 ${
                  newPortNumber.trim() && !openingPort
                    ? 'bg-green-500 hover:bg-green-600 hover:scale-105' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
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

export default PortManagerTailwind;
