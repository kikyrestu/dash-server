import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { API_BASE_URL } from '../config/api';

const DockerManagerTailwind = () => {
  const [containers, setContainers] = useState([]);
  const [images, setImages] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [selectedTab, setSelectedTab] = useState('containers');
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [logs, setLogs] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPullModal, setShowPullModal] = useState(false);
  const [pullImageName, setPullImageName] = useState('');
  const [createContainerData, setCreateContainerData] = useState({
    image: '',
    name: '',
    ports: '',
    environment: '',
    volumes: '',
    command: '',
    restartPolicy: 'unless-stopped'
  });

  const loadContainers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/docker/containers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setContainers(data.containers || []);
    } catch (err) {
      console.error('Failed to load containers:', err);
      setContainers([]);
    }
  };

  const loadImages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/docker/images`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setImages(data.images || []);
    } catch (err) {
      console.error('Failed to load images:', err);
      setImages([]);
    }
  };

  const loadSystemInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/docker/system/info`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setSystemInfo(data);
    } catch (err) {
      console.error('Failed to load system info:', err);
      setSystemInfo(null);
    }
  };

  const loadDockerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadContainers(),
        loadImages(),
        loadSystemInfo()
      ]);
    } catch (err) {
      setError('Failed to load Docker data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadDockerData();
    const interval = setInterval(loadDockerData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadDockerData]);

  const manageContainer = async (containerId, action) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/docker/containers/${containerId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.success) {
        await loadContainers(); // Refresh container list
        setError(null);
      } else {
        setError(result.error || `Failed to ${action} container`);
      }
    } catch (err) {
      setError(`Failed to ${action} container: ` + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const loadContainerLogs = async (containerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/docker/containers/${containerId}/logs?tail=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.success) {
        setLogs(result.logs);
      } else {
        setLogs('Failed to load logs: ' + result.error);
      }
    } catch (err) {
      setLogs('Failed to load logs: ' + err.message);
    }
  };

  const pullImage = async () => {
    if (!pullImageName.trim()) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/docker/images/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ imageName: pullImageName })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.success) {
        await loadImages();
        setShowPullModal(false);
        setPullImageName('');
        setError(null);
      } else {
        setError(result.error || 'Failed to pull image');
      }
    } catch (err) {
      setError('Failed to pull image: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const removeImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to remove this image?')) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/docker/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.success) {
        await loadImages();
        setError(null);
      } else {
        setError(result.error || 'Failed to remove image');
      }
    } catch (err) {
      setError('Failed to remove image: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const createContainer = async () => {
    if (!createContainerData.image.trim() || !createContainerData.name.trim()) {
      setError('Image and container name are required');
      return;
    }

    setActionLoading(true);
    try {
      // Parse ports (format: host:container,host:container)
      const ports = {};
      if (createContainerData.ports.trim()) {
        createContainerData.ports.split(',').forEach(portMapping => {
          const [hostPort, containerPort] = portMapping.split(':');
          if (hostPort && containerPort) {
            ports[containerPort.trim()] = hostPort.trim();
          }
        });
      }

      // Parse environment variables (format: KEY=value,KEY=value)
      const environment = [];
      if (createContainerData.environment.trim()) {
        createContainerData.environment.split(',').forEach(env => {
          if (env.includes('=')) {
            environment.push(env.trim());
          }
        });
      }

      // Parse volumes (format: host:container,host:container)
      const volumes = [];
      if (createContainerData.volumes.trim()) {
        createContainerData.volumes.split(',').forEach(volume => {
          if (volume.includes(':')) {
            volumes.push(volume.trim());
          }
        });
      }

      const options = {
        image: createContainerData.image,
        name: createContainerData.name,
        ports: ports,
        environment: environment,
        volumes: volumes,
        command: createContainerData.command.trim() || null,
        restartPolicy: createContainerData.restartPolicy
      };

      const response = await fetch(`${API_BASE_URL}/api/docker/containers/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(options)
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.success) {
        await loadContainers();
        setShowCreateModal(false);
        setCreateContainerData({
          image: '',
          name: '',
          ports: '',
          environment: '',
          volumes: '',
          command: '',
          restartPolicy: 'unless-stopped'
        });
        setError(null);
      } else {
        setError(result.error || 'Failed to create container');
      }
    } catch (err) {
      setError('Failed to create container: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getContainerStatusColor = (state) => {
    switch (state) {
      case 'running': return 'bg-green-500';
      case 'exited': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      case 'restarting': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getContainerIcon = (image) => {
    const imageName = image.toLowerCase();
    if (imageName.includes('nginx')) return '🌐';
    if (imageName.includes('mysql') || imageName.includes('mariadb')) return '🐬';
    if (imageName.includes('postgres')) return '🐘';
    if (imageName.includes('redis')) return '🔴';
    if (imageName.includes('mongo')) return '🍃';
    if (imageName.includes('node')) return '💚';
    if (imageName.includes('python')) return '🐍';
    if (imageName.includes('ubuntu') || imageName.includes('debian')) return '🐧';
    return '📦';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  return (
    <div className="p-5 bg-gray-50 min-h-screen font-inter">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 mb-5 shadow-lg border border-gray-200 backdrop-blur-sm">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-3 mb-2">
          🐳 Docker Container Manager
        </h1>
        <p className="text-gray-500 text-sm ml-9">
          Manage Docker containers, images, and system resources
        </p>
      </div>

      {/* System Overview */}
      {systemInfo && systemInfo.info && (
        <div className="bg-white rounded-2xl p-6 mb-5 shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-blue-600 text-2xl font-bold">{systemInfo.info.containersRunning}</div>
              <div className="text-blue-800 text-sm">Running</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600 text-2xl font-bold">{systemInfo.info.containersStopped}</div>
              <div className="text-gray-800 text-sm">Stopped</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-purple-600 text-2xl font-bold">{systemInfo.info.images}</div>
              <div className="text-purple-800 text-sm">Images</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-green-600 text-2xl font-bold">{systemInfo.info.cpus}</div>
              <div className="text-green-800 text-sm">CPUs</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <div>Docker Version: {systemInfo.version?.version}</div>
            <div>Storage Driver: {systemInfo.info.storageDriver}</div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <div className="text-red-700 text-sm font-medium">❌ Error:</div>
          <div className="text-red-600 text-xs mt-1">{error}</div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-5">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('containers')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
              selectedTab === 'containers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📦 Containers ({containers.length})
          </button>
          <button
            onClick={() => setSelectedTab('images')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
              selectedTab === 'images'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            💿 Images ({images.length})
          </button>
        </div>

        <div className="p-6">
          {/* Containers Tab */}
          {selectedTab === 'containers' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Container Management</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                  >
                    ➕ Create Container
                  </button>
                  <button
                    onClick={loadDockerData}
                    disabled={loading}
                    className={`px-4 py-2 bg-gray-500 text-white rounded-lg transition-colors duration-200 text-sm ${
                      loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'
                    }`}
                  >
                    {loading ? '🔄 Loading...' : '🔄 Refresh'}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-10 text-gray-500">
                  <div className="animate-spin text-2xl mb-2">⚙️</div>
                  Loading containers...
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Container List */}
                  <div className="space-y-3">
                    {containers.map((container) => (
                      <div
                        key={container.id}
                        onClick={() => {
                          setSelectedContainer(container);
                          loadContainerLogs(container.id);
                        }}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedContainer?.id === container.id
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{getContainerIcon(container.image)}</span>
                            <div>
                              <div className="font-semibold text-gray-900">{container.name}</div>
                              <div className="text-xs text-gray-500">{container.image}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getContainerStatusColor(container.state)}`}></div>
                            <span className="text-xs text-gray-600 capitalize">{container.state}</span>
                          </div>
                        </div>

                        {container.stats && (
                          <div className="mt-2 text-xs text-gray-600 grid grid-cols-2 gap-2">
                            <div>CPU: {container.stats.cpuUsage}%</div>
                            <div>Memory: {container.stats.memoryPercent}%</div>
                          </div>
                        )}

                        <div className="mt-2 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              manageContainer(container.id, container.state === 'running' ? 'stop' : 'start');
                            }}
                            disabled={actionLoading}
                            className={`px-2 py-1 text-xs rounded transition-colors duration-200 ${
                              container.state === 'running'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {container.state === 'running' ? '⏹️ Stop' : '▶️ Start'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              manageContainer(container.id, 'restart');
                            }}
                            disabled={actionLoading}
                            className={`px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors duration-200 ${
                              actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            🔄 Restart
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to remove this container?')) {
                                manageContainer(container.id, 'remove');
                              }
                            }}
                            disabled={actionLoading}
                            className={`px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200 ${
                              actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    {containers.length === 0 && (
                      <div className="text-center py-10 text-gray-500 italic">
                        No containers found. Create your first container!
                      </div>
                    )}
                  </div>

                  {/* Container Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedContainer ? (
                      <div>
                        <h4 className="font-semibold mb-3">Container Details: {selectedContainer.name}</h4>
                        
                        <div className="space-y-2 text-sm mb-4">
                          <div><strong>ID:</strong> {selectedContainer.id}</div>
                          <div><strong>Image:</strong> {selectedContainer.image}</div>
                          <div><strong>Status:</strong> {selectedContainer.status}</div>
                          <div><strong>Created:</strong> {formatTimeAgo(selectedContainer.created)}</div>
                          
                          {selectedContainer.ports.length > 0 && (
                            <div>
                              <strong>Ports:</strong>
                              <div className="ml-2">
                                {selectedContainer.ports.map((port, idx) => (
                                  <div key={idx} className="text-xs">
                                    {port.publicPort ? `${port.publicPort}:${port.privatePort}` : port.privatePort} ({port.type})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedContainer.stats && (
                            <div>
                              <strong>Resource Usage:</strong>
                              <div className="ml-2 text-xs">
                                <div>CPU: {selectedContainer.stats.cpuUsage}%</div>
                                <div>Memory: {selectedContainer.stats.memoryUsage} / {selectedContainer.stats.memoryLimit} ({selectedContainer.stats.memoryPercent}%)</div>
                                <div>Network: ↓{selectedContainer.stats.networkRx} ↑{selectedContainer.stats.networkTx}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <strong className="text-sm">Recent Logs:</strong>
                          <div className="mt-2 bg-black text-green-400 p-3 rounded font-mono text-xs max-h-40 overflow-y-auto">
                            {logs || 'Loading logs...'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-10">
                        Select a container to view details and logs
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Images Tab */}
          {selectedTab === 'images' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Image Management</h3>
                <button
                  onClick={() => setShowPullModal(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm"
                >
                  ⬇️ Pull Image
                </button>
              </div>

              {loading ? (
                <div className="text-center py-10 text-gray-500">
                  <div className="animate-spin text-2xl mb-2">⚙️</div>
                  Loading images...
                </div>
              ) : (
                <div className="space-y-3">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💿</span>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {image.repoTags[0] !== '<none>:<none>' ? image.repoTags[0] : 'Unnamed Image'}
                            </div>
                            <div className="text-xs text-gray-500">ID: {image.id}</div>
                            <div className="text-xs text-gray-500">Size: {image.size}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-600">
                            {formatTimeAgo(image.created)}
                          </div>
                          <button
                            onClick={() => removeImage(image.id)}
                            disabled={actionLoading}
                            className={`px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200 ${
                              actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {images.length === 0 && (
                    <div className="text-center py-10 text-gray-500 italic">
                      No images found. Pull your first image!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Container Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3 mb-5">
              🐳 Create New Container
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
                  <input
                    type="text"
                    value={createContainerData.image}
                    onChange={(e) => setCreateContainerData({...createContainerData, image: e.target.value})}
                    placeholder="nginx:latest"
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Container Name *</label>
                  <input
                    type="text"
                    value={createContainerData.name}
                    onChange={(e) => setCreateContainerData({...createContainerData, name: e.target.value})}
                    placeholder="my-container"
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Port Mappings</label>
                <input
                  type="text"
                  value={createContainerData.ports}
                  onChange={(e) => setCreateContainerData({...createContainerData, ports: e.target.value})}
                  placeholder="8080:80,8443:443"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">Format: host:container,host:container</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment Variables</label>
                <input
                  type="text"
                  value={createContainerData.environment}
                  onChange={(e) => setCreateContainerData({...createContainerData, environment: e.target.value})}
                  placeholder="NODE_ENV=production,PORT=3000"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">Format: KEY=value,KEY=value</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volume Mounts</label>
                <input
                  type="text"
                  value={createContainerData.volumes}
                  onChange={(e) => setCreateContainerData({...createContainerData, volumes: e.target.value})}
                  placeholder="/host/path:/container/path,/data:/app/data"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">Format: host:container,host:container</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Command</label>
                  <input
                    type="text"
                    value={createContainerData.command}
                    onChange={(e) => setCreateContainerData({...createContainerData, command: e.target.value})}
                    placeholder="/bin/bash"
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restart Policy</label>
                  <select
                    value={createContainerData.restartPolicy}
                    onChange={(e) => setCreateContainerData({...createContainerData, restartPolicy: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="no">No</option>
                    <option value="on-failure">On Failure</option>
                    <option value="always">Always</option>
                    <option value="unless-stopped">Unless Stopped</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateContainerData({
                    image: '',
                    name: '',
                    ports: '',
                    environment: '',
                    volumes: '',
                    command: '',
                    restartPolicy: 'unless-stopped'
                  });
                }}
                disabled={actionLoading}
                className="px-5 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={createContainer}
                disabled={!createContainerData.image.trim() || !createContainerData.name.trim() || actionLoading}
                className={`px-5 py-2 text-white rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  createContainerData.image.trim() && createContainerData.name.trim() && !actionLoading
                    ? 'bg-blue-500 hover:bg-blue-600 hover:scale-105' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {actionLoading && <div className="animate-spin">⚙️</div>}
                {actionLoading ? 'Creating...' : 'Create Container'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pull Image Modal */}
      {showPullModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 min-w-96 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3 mb-5">
              ⬇️ Pull Docker Image
            </h3>
            
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Image Name</label>
              <input
                type="text"
                value={pullImageName}
                onChange={(e) => setPullImageName(e.target.value)}
                placeholder="nginx:latest"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    pullImage();
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <div className="text-xs text-gray-500 mt-1">Examples: nginx:latest, node:16, ubuntu:20.04</div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPullModal(false);
                  setPullImageName('');
                }}
                disabled={actionLoading}
                className="px-5 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={pullImage}
                disabled={!pullImageName.trim() || actionLoading}
                className={`px-5 py-2 text-white rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  pullImageName.trim() && !actionLoading
                    ? 'bg-green-500 hover:bg-green-600 hover:scale-105' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {actionLoading && <div className="animate-spin">⚙️</div>}
                {actionLoading ? 'Pulling...' : 'Pull Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DockerManagerTailwind;
