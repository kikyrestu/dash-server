import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { API_BASE_URL } from '../config/api';

const WebServicesMonitorTailwind = () => {
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
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
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
    const icons = {
      'web': '🌐',
      'database': '💾',
      'cache': '⚡',
      'application': '⚙️',
      'container': '📦',
      'network': '🔗',
      'security': '🔒',
      'monitoring': '📊',
      'other': '🔧'
    };
    return icons[type] || icons['other'];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'inactive': return 'text-red-500';
      case 'failed': return 'text-red-600';
      case 'unknown': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-red-500';
      case 'failed': return 'bg-red-600';
      case 'unknown': return 'bg-gray-500';
      default: return 'bg-gray-500';
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
      'web': 'bg-blue-100 border-blue-300',
      'database': 'bg-purple-100 border-purple-300',
      'cache': 'bg-yellow-100 border-yellow-300',
      'application': 'bg-green-100 border-green-300',
      'container': 'bg-cyan-100 border-cyan-300',
      'network': 'bg-indigo-100 border-indigo-300',
      'security': 'bg-red-100 border-red-300',
      'monitoring': 'bg-lime-100 border-lime-300',
      'other': 'bg-gray-100 border-gray-300'
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
      <div className="p-5 bg-gray-50 min-h-screen flex items-center justify-center font-inter">
        <div className="bg-white rounded-xl p-10 text-center shadow-lg">
          <div className="text-4xl mb-4 animate-pulse">🌐</div>
          <div className="text-gray-500">Loading web services...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 bg-gray-50 min-h-screen flex items-center justify-center font-inter">
        <div className="bg-white rounded-xl p-10 text-center shadow-lg">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-red-500 mb-3">{error}</div>
          <button
            onClick={fetchServicesInfo}
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
            🌐 Web Services Monitor
          </h1>
          <button
            onClick={fetchServicesInfo}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 hover:scale-105 transition-all duration-200 font-medium"
          >
            🔄 Refresh
          </button>
        </div>
        <p className="text-gray-500 text-sm">
          Monitor all running web services, databases, and applications on your server
        </p>
      </div>

      {/* Service Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">📊</span>
            <span className="text-sm font-semibold text-gray-700">Total Services</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{serviceStats.total}</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">✅</span>
            <span className="text-sm font-semibold text-gray-700">Running</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{serviceStats.running}</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">❌</span>
            <span className="text-sm font-semibold text-gray-700">Stopped</span>
          </div>
          <div className="text-2xl font-bold text-red-500">{serviceStats.stopped}</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">🏷️</span>
            <span className="text-sm font-semibold text-gray-700">Service Types</span>
          </div>
          <div className="text-2xl font-bold text-blue-500">{serviceStats.types}</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white rounded-xl p-5 mb-5 shadow-lg border border-gray-200">
        <div className="flex gap-2 flex-wrap">
          {['all', 'running', 'stopped', 'web', 'database', 'cache', 'application', 'container', 'network'].map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                filter === filterType
                  ? 'bg-blue-500 text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              {filterType === 'all' ? 'All Services' : filterType}
            </button>
          ))}
        </div>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">
            Services ({filteredServices.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          {filteredServices.length > 0 ? (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="text-center">Type</div>
                <div>Service Name</div>
                <div>Status</div>
                <div>Port</div>
                <div>PID</div>
                <div>Memory</div>
              </div>

              {/* Table Body */}
              {filteredServices.map((service, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-6 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 items-center"
                >
                  <div className="flex justify-center">
                    <div className={`text-xl p-2 rounded-lg border ${getServiceTypeColor(service.type)}`}>
                      {getServiceIcon(service.type)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      {service.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {service.description || 'No description'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusBgColor(service.status)}`} />
                    <span className={`text-xs font-medium ${getStatusColor(service.status)}`}>
                      {getStatusText(service.status)}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 font-mono">
                    {service.port || '-'}
                  </div>

                  <div className="text-xs text-gray-600 font-mono">
                    {service.pid || '-'}
                  </div>

                  <div className="text-xs text-gray-600">
                    {service.memory || '-'}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="py-16 text-center text-gray-500">
              <div className="text-5xl mb-4">🔍</div>
              <div className="text-lg font-medium mb-2">No services found</div>
              <div className="text-sm">
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

export default WebServicesMonitorTailwind;
