import React, { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    updateInterval: 2000,
    theme: 'light',
    notifications: true,
    autoRefresh: true,
    maxHistoryPoints: 50
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
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
        marginBottom: '30px',
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
          ⚙️ <span>Settings</span>
        </h1>
        <p style={{
          margin: '5px 0 0 34px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Configure dashboard behavior and preferences
        </p>
      </div>

      {/* Settings Sections */}
      <div style={{
        display: 'grid',
        gap: '20px'
      }}>
        {/* Data Collection Settings */}
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
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📊 <span>Data Collection</span>
          </h2>
          
          <div style={{
            display: 'grid',
            gap: '20px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Update Interval (ms)
              </label>
              <input
                type="number"
                value={settings.updateInterval}
                onChange={(e) => handleSettingChange('updateInterval', parseInt(e.target.value))}
                style={{
                  width: '200px',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                min="1000"
                max="10000"
                step="500"
              />
              <p style={{
                margin: '5px 0 0 0',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                How often to collect system metrics (1000-10000ms)
              </p>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Chart History Points
              </label>
              <input
                type="number"
                value={settings.maxHistoryPoints}
                onChange={(e) => handleSettingChange('maxHistoryPoints', parseInt(e.target.value))}
                style={{
                  width: '200px',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                min="10"
                max="200"
                step="10"
              />
              <p style={{
                margin: '5px 0 0 0',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Maximum data points to show in charts
              </p>
            </div>
          </div>
        </div>

        {/* UI Settings */}
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
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🎨 <span>User Interface</span>
          </h2>

          <div style={{
            display: 'grid',
            gap: '20px'
          }}>
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px'
                  }}
                />
                Auto-refresh Dashboard
              </label>
              <p style={{
                margin: '5px 0 0 26px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Automatically refresh metrics and charts
              </p>
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px'
                  }}
                />
                Enable Notifications
              </label>
              <p style={{
                margin: '5px 0 0 26px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Show alerts for high CPU/memory usage
              </p>
            </div>
          </div>
        </div>

        {/* Server Info */}
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
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔧 <span>Server Information</span>
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div style={{
              padding: '15px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '5px',
                fontWeight: '600'
              }}>
                BACKEND URL
              </div>
              <div style={{
                fontSize: '14px',
                color: '#374151',
                fontFamily: 'monospace'
              }}>
                http://localhost:3001
              </div>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '5px',
                fontWeight: '600'
              }}>
                WEBSOCKET URL
              </div>
              <div style={{
                fontSize: '14px',
                color: '#374151',
                fontFamily: 'monospace'
              }}>
                ws://localhost:3001
              </div>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '5px',
                fontWeight: '600'
              }}>
                VERSION
              </div>
              <div style={{
                fontSize: '14px',
                color: '#374151',
                fontFamily: 'monospace'
              }}>
                v1.0.0
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'flex-end'
        }}>
          <button style={{
            padding: '10px 20px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Reset to Defaults
          </button>
          <button style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
