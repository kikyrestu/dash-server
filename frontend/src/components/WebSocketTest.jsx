import React, { useState, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocketDebug';
import { WS_BASE_URL } from '../config/api';

const WebSocketTest = () => {
  const { data, connectionStatus } = useWebSocket(WS_BASE_URL);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    if (data) {
      setMessageCount(prev => prev + 1);
    }
  }, [data]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'Connected': return 'green';
      case 'Connecting': return 'orange';
      case 'Disconnected': return 'red';
      case 'Error': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1>WebSocket Connection Test</h1>
      
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Connection Status</h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: getStatusColor()
          }}></div>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: getStatusColor()
          }}>
            {connectionStatus}
          </span>
        </div>
        <p>Messages received: {messageCount}</p>
        <p>Last update: {data ? new Date(data.timestamp).toLocaleTimeString() : 'Never'}</p>
      </div>

      {data && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>Latest Data</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <strong>CPU Usage:</strong> {data.cpu}%
            </div>
            <div>
              <strong>Memory Usage:</strong> {data.memory.percentage}%
            </div>
            <div>
              <strong>Disk Usage:</strong> {data.disk.percentage}%
            </div>
            <div>
              <strong>Temperature:</strong> {data.temperature}°C
            </div>
          </div>
          
          <h3>Processes</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {data.processes && data.processes.slice(0, 5).map((proc, index) => (
              <div key={index} style={{ 
                padding: '5px 0', 
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{proc.name}</span>
                <span>CPU: {proc.cpu}% | Memory: {proc.memory}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Debug Info</h2>
        <p>WebSocket URL: {WS_BASE_URL}</p>
        <p>Page loaded at: {new Date().toLocaleString()}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};

export default WebSocketTest;
