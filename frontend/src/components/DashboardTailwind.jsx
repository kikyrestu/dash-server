import React, { useState, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import MetricCardTailwind from './MetricCardTailwind';
import LineChart from './LineChart';
import ProcessList from './ProcessList';
import ConnectionStatus from './ConnectionStatus';
import SidebarTailwind from './SidebarTailwind';
import FileManager from './FileManager';
import Terminal from './Terminal';
import DatabaseManager from './DatabaseManager';
import StorageManager from './StorageManager';
import NetworkStatus from './NetworkStatus';
import WebServicesMonitor from './WebServicesMonitor';
import PortManager from './PortManager';
import SecurityCenter from './SecurityCenter';
import Settings from './Settings';
import { WS_BASE_URL } from '../config/api';

const DashboardTailwind = () => {
  const { data, connectionStatus } = useWebSocket(WS_BASE_URL);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [history, setHistory] = useState({
    cpu: [],
    memory: [],
    network: [],
    temperature: []
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update history when new data arrives
  useEffect(() => {
    if (data) {
      setHistory(prev => ({
        cpu: [...prev.cpu.slice(-49), data.cpu],
        memory: [...prev.memory.slice(-49), data.memory.percentage],
        network: [...prev.network.slice(-49), data.network.download + data.network.upload],
        temperature: [...prev.temperature.slice(-49), data.temperature]
      }));
    }
  }, [data]);

  const getStatus = (value, warningThreshold, dangerThreshold) => {
    if (value >= dangerThreshold) return 'danger';
    if (value >= warningThreshold) return 'warning';
    if (value > 0) return 'good';
    return 'normal';
  };

  const formatDateTime = (date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('id-ID');
    
    return {
      date: `${dayName}, ${day} ${month} ${year}`,
      time: time
    };
  };

  const { date, time } = formatDateTime(currentTime);

  // Render content based on active tab
  const renderContent = () => {
    if (activeTab === 'files') return <FileManager />;
    if (activeTab === 'terminal') return <Terminal />;
    if (activeTab === 'database') return <DatabaseManager />;
    if (activeTab === 'storage') return <StorageManager />;
    if (activeTab === 'network') return <NetworkStatus />;
    if (activeTab === 'services') return <WebServicesMonitor />;
    if (activeTab === 'ports') return <PortManager />;
    if (activeTab === 'security') return <SecurityCenter />;
    if (activeTab === 'settings') return <Settings />;

    // Dashboard content
    if (!data) {
      return (
        <div className="min-h-screen flex items-center justify-center p-5">
          <div className="bg-white p-10 rounded-2xl shadow-2xl border border-gray-200 text-center max-w-md">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Server Dashboard
            </div>
            <div className="text-gray-700 mb-4 font-semibold">
              📅 {date}
            </div>
            <div className="text-2xl font-bold text-gray-600 font-mono mb-6">
              🕐 {time}
            </div>
            <ConnectionStatus status={connectionStatus} />
            <div className="text-gray-500 text-center mt-4 space-y-1">
              <p>Menunggu koneksi server...</p>
              <small className="text-gray-400">Pastikan backend server berjalan di port 3001</small>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-5 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Dashboard Server
              </h1>
              <div className="flex items-center gap-5 flex-wrap">
                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                  <span>📅</span>
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 font-mono font-semibold">
                  <span>🕐</span>
                  <span>{time}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ConnectionStatus status={connectionStatus} />
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 font-medium flex items-center gap-2">
                <span>⚡</span>
                <span>Real-time</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCardTailwind
            title="CPU Usage"
            value={data.cpu}
            unit="%"
            percentage={data.cpu}
            status={getStatus(data.cpu, 70, 90)}
          />
          <MetricCardTailwind
            title="Memory"
            value={data.memory.percentage}
            unit="%"
            percentage={data.memory.percentage}
            status={getStatus(data.memory.percentage, 80, 95)}
          />
          <MetricCardTailwind
            title="Disk Usage"
            value={data.disk.percentage}
            unit="%"
            percentage={data.disk.percentage}
            status={getStatus(data.disk.percentage, 80, 95)}
          />
          <MetricCardTailwind
            title="Temperature"
            value={data.temperature}
            unit="°C"
            status={getStatus(data.temperature, 70, 85)}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-5">
            <LineChart
              data={history.cpu}
              title="CPU Usage History"
              color="#ef4444"
            />
          </div>
          <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-5">
            <LineChart
              data={history.memory}
              title="Memory Usage History"
              color="#8b5cf6"
            />
          </div>
          <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-5">
            <LineChart
              data={history.network}
              title="Network Activity History"
              color="#10b981"
            />
          </div>
          <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-5">
            <LineChart
              data={history.temperature}
              title="Temperature History"
              color="#f59e0b"
            />
          </div>
        </div>

        {/* Process List */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-200">
          <ProcessList processes={data.processes} />
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarTailwind activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="ml-20 flex-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default DashboardTailwind;
