import React, { useState, useEffect, useRef } from 'react';

const Terminal = () => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [currentPath, setCurrentPath] = useState('/home');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-scroll ke bottom saat ada output baru
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    // Focus input saat component mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const executeCommand = async (cmd) => {
    if (!cmd.trim()) return;

    // Tambah ke history
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    // Tambah command ke output
    setOutput(prev => [...prev, {
      type: 'command',
      content: `${currentPath}$ ${cmd}`,
      timestamp: new Date().toLocaleTimeString('id-ID')
    }]);

    try {
      const response = await fetch('http://localhost:3001/api/terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: cmd, path: currentPath })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update current path jika command cd berhasil
        if (cmd.startsWith('cd ') && result.path) {
          setCurrentPath(result.path);
        }

        // Tambah output ke terminal
        setOutput(prev => [...prev, {
          type: 'output',
          content: result.output || '(no output)',
          timestamp: new Date().toLocaleTimeString('id-ID')
        }]);
      } else {
        setOutput(prev => [...prev, {
          type: 'error',
          content: result.error || 'Command failed',
          timestamp: new Date().toLocaleTimeString('id-ID')
        }]);
      }
    } catch (error) {
      setOutput(prev => [...prev, {
        type: 'error',
        content: `Connection error: ${error.message}`,
        timestamp: new Date().toLocaleTimeString('id-ID')
      }]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeCommand(command);
    setCommand('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  const clearTerminal = () => {
    setOutput([]);
  };

  const quickCommands = [
    { label: 'List Files', cmd: 'ls -la' },
    { label: 'Disk Usage', cmd: 'df -h' },
    { label: 'Memory Info', cmd: 'free -h' },
    { label: 'CPU Info', cmd: 'htop' },
    { label: 'Processes', cmd: 'ps aux' },
    { label: 'Network', cmd: 'netstat -tuln' }
  ];

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
        marginBottom: '20px',
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
          💻 <span>Terminal</span>
        </h1>
        <p style={{
          margin: '5px 0 0 34px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Execute commands on your server
        </p>
      </div>

      {/* Quick Commands */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{
          margin: '0 0 15px 0',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#1f2937'
        }}>
          Quick Commands
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px'
        }}>
          {quickCommands.map((item, index) => (
            <button
              key={index}
              onClick={() => executeCommand(item.cmd)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                color: '#374151',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e5e7eb';
                e.target.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Window */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        border: '1px solid #333'
      }}>
        {/* Terminal Header */}
        <div style={{
          background: '#2d2d2d',
          padding: '12px 20px',
          borderBottom: '1px solid #444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f57' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28ca42' }}></div>
            </div>
            <span style={{ color: '#888', fontSize: '14px', marginLeft: '10px' }}>
              Terminal - {currentPath}
            </span>
          </div>
          <button
            onClick={clearTerminal}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '4px 8px'
            }}
          >
            Clear
          </button>
        </div>

        {/* Terminal Content */}
        <div
          ref={terminalRef}
          style={{
            height: '400px',
            overflowY: 'auto',
            padding: '20px',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '14px',
            lineHeight: '1.4'
          }}
        >
          {output.length === 0 && (
            <div style={{ color: '#888', fontStyle: 'italic' }}>
              Welcome to ServerDash Terminal. Type a command or use quick commands above.
            </div>
          )}
          
          {output.map((entry, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              {entry.type === 'command' && (
                <div style={{ color: '#4ade80', fontWeight: 'bold' }}>
                  {entry.content}
                </div>
              )}
              {entry.type === 'output' && (
                <div style={{ color: '#e5e5e5', whiteSpace: 'pre-wrap' }}>
                  {entry.content}
                </div>
              )}
              {entry.type === 'error' && (
                <div style={{ color: '#ef4444' }}>
                  {entry.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Command Input */}
        <div style={{
          borderTop: '1px solid #444',
          padding: '15px 20px',
          background: '#1a1a1a'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#4ade80', fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}>
              {currentPath}$
            </span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#e5e5e5',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '14px',
                padding: '5px 0'
              }}
            />
            <button
              type="submit"
              style={{
                background: '#3b82f6',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              Execute
            </button>
          </form>
          <div style={{
            fontSize: '11px',
            color: '#666',
            marginTop: '8px'
          }}>
            Use ↑/↓ arrow keys for command history
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
