import React, { useState, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocketClean'; // Use clean simple version
import MetricCardTailwind from './MetricCardTailwind';
import LineChartTailwind from './LineChartTailwind';
import ProcessListTailwind from './ProcessListTailwind';
import ConnectionStatusTailwind from './ConnectionStatusTailwind';
import Sidebar from './Sidebar';
import FileManagerTailwind from './FileManagerTailwind';
import TerminalTailwind from './TerminalTailwind';
import DatabaseManagerTailwind from './DatabaseManagerTailwind';
import StorageManagerTailwind from './StorageManagerTailwind';
import NetworkStatusTailwind from './NetworkStatusTailwind';
import WebServicesMonitorTailwind from './WebServicesMonitorTailwind';
import PortManagerTailwind from './PortManagerTailwind';
import SecurityCenterTailwind from './SecurityCenterTailwind';
import DockerManagerTailwind from './DockerManagerTailwind';
import LogManagerTailwind from './LogManagerTailwind';
import SystemPerformanceMonitorTailwind from './SystemPerformanceMonitorTailwind';
import TailwindDemo from './TailwindDemo';
import Settings from './Settings';
import { useAuth } from '../contexts/AuthContext';
import { 
  MdCalendarToday, 
  MdSchedule, 
  MdFlashOn,
  MdDashboard,
  MdLogout,
  MdAdminPanelSettings
} from 'react-icons/md';

const Dashboard = () => {
  const { data, connectionStatus } = useWebSocket();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [history, setHistory] = useState({
    cpu: [],
    memory: [],
    network: [],
    temperature: []
  });

  // Debug logging for connection status
  useEffect(() => {
    console.log('🔗 Dashboard - Connection Status Changed:', connectionStatus, 'at', new Date().toLocaleTimeString());
  }, [connectionStatus]);

  // Debug logging for data
  useEffect(() => {
    if (data) {
      console.log('📊 Dashboard - Received data:', {
        cpu: data.cpu,
        timestamp: new Date(data.timestamp).toLocaleTimeString(),
        status: connectionStatus
      });
    }
  }, [data, connectionStatus]);

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
    if (activeTab === 'files') {
      return <FileManagerTailwind />;
    }
    
    if (activeTab === 'terminal') {
      return <TerminalTailwind />;
    }
    
    if (activeTab === 'database') {
      return <DatabaseManagerTailwind />;
    }
    
    if (activeTab === 'storage') {
      return <StorageManagerTailwind />;
    }
    
    if (activeTab === 'network') {
      return <NetworkStatusTailwind />;
    }
    
    if (activeTab === 'services') {
      return <WebServicesMonitorTailwind />;
    }
    
    if (activeTab === 'ports') {
      return <PortManagerTailwind />;
    }
    
    if (activeTab === 'security') {
      return <SecurityCenterTailwind />;
    }
    
    if (activeTab === 'docker') {
      return <DockerManagerTailwind />;
    }
    
    if (activeTab === 'logs') {
      return <LogManagerTailwind />;
    }
    
    if (activeTab === 'performance') {
      return <SystemPerformanceMonitorTailwind />;
    }
    
    if (activeTab === 'tailwind-demo') {
      return <TailwindDemo />;
    }
    
    if (activeTab === 'settings') {
      return <Settings />;
    }

    // Dashboard content
    if (!data) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '20px',
          padding: '20px',
          minHeight: '100vh'
        }}>
          <div style={{
            textAlign: 'center',
            background: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '10px'
            }}>
              Server Dashboard
            </div>
            <div style={{
              color: '#374151',
              marginBottom: '15px',
              fontSize: '16px'
            }}>
              {date}
            </div>
            <div style={{
              color: '#6b7280',
              marginBottom: '20px',
              fontSize: '24px',
              fontWeight: '600',
              fontFamily: 'monospace'
            }}>
              {time}
            </div>
            <ConnectionStatusTailwind status={connectionStatus} />
            <div style={{
              color: '#6b7280',
              textAlign: 'center',
              marginTop: '15px'
            }}>
              Menunggu koneksi server...
              <br />
              <small>Pastikan backend server berjalan di port 3001</small>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '25px 35px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
          border: '1px solid rgba(255,255,255,0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background decoration */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
            borderRadius: '50%',
            transform: 'translate(50px, -50px)',
            zIndex: 0
          }} />
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px',
            position: 'relative',
            zIndex: 1
          }}>
            <div>
              <h1 style={{
                margin: '0 0 12px 0',
                fontSize: '36px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <MdDashboard style={{ 
                  fontSize: '40px', 
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }} />
                Dashboard Server
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  color: '#374151',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <MdCalendarToday style={{ fontSize: '18px', color: '#6366f1' }} />
                  {date}
                </div>
                <div style={{
                  color: '#6b7280',
                  fontSize: '16px',
                  fontFamily: 'monospace',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <MdSchedule style={{ fontSize: '18px', color: '#8b5cf6' }} />
                  {time}
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <ConnectionStatusTailwind status={connectionStatus} />
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#374151',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <MdFlashOn style={{ fontSize: '16px', color: '#f59e0b' }} />
                Real-time
              </div>
              
              {/* User Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: '#e0f2fe',
                borderRadius: '8px',
                border: '1px solid #b3e5fc'
              }}>
                <MdAdminPanelSettings style={{ fontSize: '16px', color: '#0277bd' }} />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#01579b' }}>
                  {user?.username || 'Admin'}
                </span>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={logout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#fecaca';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#fee2e2';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <MdLogout style={{ fontSize: '16px' }} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '25px',
          marginBottom: '30px'
        }}>
          <LineChartTailwind
            data={history.cpu}
            title="CPU Usage History"
            color="#ef4444"
            icon="cpu"
          />
          <LineChartTailwind
            data={history.memory}
            title="Memory Usage History"
            color="#8b5cf6"
            icon="memory"
          />
          <LineChartTailwind
            data={history.network}
            title="Network Activity History"
            color="#10b981"
            icon="network"
          />
          <LineChartTailwind
            data={history.temperature}
            title="Temperature History"
            color="#f59e0b"
            icon="temperature"
          />
        </div>

        {/* Process List */}
        <ProcessListTailwind processes={data.processes} />
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div style={{
        marginLeft: '80px',
        flex: 1,
        backgroundColor: '#f8fafc'
      }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
