import React from 'react';

const ProcessList = ({ processes = [] }) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        color: '#374151',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Top Processes
      </h3>

      {processes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#9ca3af',
          padding: '40px 0'
        }}>
          No process data available
        </div>
      ) : (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{
                borderBottom: '2px solid #e5e7eb',
                position: 'sticky',
                top: 0,
                backgroundColor: 'white'
              }}>
                <th style={{
                  textAlign: 'left',
                  padding: '10px 8px',
                  color: '#6b7280',
                  fontWeight: '600',
                  fontSize: '12px',
                  textTransform: 'uppercase'
                }}>Process</th>
                <th style={{
                  textAlign: 'right',
                  padding: '10px 8px',
                  color: '#6b7280',
                  fontWeight: '600',
                  fontSize: '12px',
                  textTransform: 'uppercase'
                }}>CPU%</th>
                <th style={{
                  textAlign: 'right',
                  padding: '10px 8px',
                  color: '#6b7280',
                  fontWeight: '600',
                  fontSize: '12px',
                  textTransform: 'uppercase'
                }}>Memory%</th>
                <th style={{
                  textAlign: 'right',
                  padding: '10px 8px',
                  color: '#6b7280',
                  fontWeight: '600',
                  fontSize: '12px',
                  textTransform: 'uppercase'
                }}>PID</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((process, index) => (
                <tr
                  key={`${process.pid}-${index}`}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.parentElement.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.parentElement.style.backgroundColor = 'transparent';
                  }}
                >
                  <td style={{
                    padding: '12px 8px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    maxWidth: '150px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {process.name}
                  </td>
                  <td style={{
                    padding: '12px 8px',
                    textAlign: 'right',
                    fontFamily: 'monospace',
                    fontWeight: '600',
                    color: process.cpu > 50 ? '#ef4444' : process.cpu > 20 ? '#f59e0b' : '#374151'
                  }}>
                    {process.cpu.toFixed(1)}%
                  </td>
                  <td style={{
                    padding: '12px 8px',
                    textAlign: 'right',
                    fontFamily: 'monospace',
                    fontWeight: '600',
                    color: process.memory > 10 ? '#ef4444' : process.memory > 5 ? '#f59e0b' : '#374151'
                  }}>
                    {process.memory.toFixed(1)}%
                  </td>
                  <td style={{
                    padding: '12px 8px',
                    textAlign: 'right',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {process.pid}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProcessList;
