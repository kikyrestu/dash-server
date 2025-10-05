import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

const TerminalTailwind = () => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [currentPath, setCurrentPath] = useState('/home');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isConnected, setIsConnected] = useState(true);
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

    // Add welcome message
    setOutput([
      {
        type: 'system',
        content: 'Welcome to Server Dashboard Terminal',
        timestamp: new Date().toLocaleTimeString('id-ID')
      },
      {
        type: 'info',
        content: 'Type "help" for available commands',
        timestamp: new Date().toLocaleTimeString('id-ID')
      }
    ]);
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

    // Handle built-in commands
    if (cmd.trim() === 'clear') {
      setOutput([]);
      setCommand('');
      return;
    }

    if (cmd.trim() === 'help') {
      setOutput(prev => [...prev, {
        type: 'output',
        content: `Available commands:
  ls          - List directory contents
  pwd         - Show current directory
  cd <dir>    - Change directory
  cat <file>  - Display file contents
  clear       - Clear terminal
  help        - Show this help message
  top         - Show running processes
  df          - Show disk usage
  ps          - Show processes
  whoami      - Show current user`,
        timestamp: new Date().toLocaleTimeString('id-ID')
      }]);
      setCommand('');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/terminal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: cmd, path: currentPath })
      });

      const result = await response.json();
      
      if (result.success) {
        setOutput(prev => [...prev, {
          type: 'output',
          content: result.output,
          timestamp: new Date().toLocaleTimeString('id-ID')
        }]);

        // Update path if cd command
        if (cmd.startsWith('cd ') && result.newPath) {
          setCurrentPath(result.newPath);
        }
      } else {
        setOutput(prev => [...prev, {
          type: 'error',
          content: result.error || 'Command failed',
          timestamp: new Date().toLocaleTimeString('id-ID')
        }]);
      }
    } catch (error) {
      console.error('Terminal error:', error);
      setIsConnected(false);
      
      // Mock response for demo
      const mockResponses = {
        'ls': 'Documents/  Downloads/  Pictures/  server-config.json  backup.tar.gz  logs/  script.sh',
        'pwd': currentPath,
        'whoami': 'serveradmin',
        'ps': `  PID TTY          TIME CMD
 1234 pts/0    00:00:01 bash
 1235 pts/0    00:00:00 node
 1236 pts/0    00:00:00 ps`,
        'df': `Filesystem     1K-blocks    Used Available Use% Mounted on
/dev/sda1       20971520 8388608  12582912  40% /
tmpfs            1048576       0   1048576   0% /dev/shm`,
        'top': `PID  USER     PR  NI  VIRT  RES  SHR S %CPU %MEM     TIME+ COMMAND
1234 root     20   0 567432 45678 12345 S  1.3  4.5   0:01.23 node
1235 user     20   0 123456  7890  2345 S  0.7  0.8   0:00.45 bash`
      };

      const cmdName = cmd.split(' ')[0];
      const mockOutput = mockResponses[cmdName] || `Mock output for: ${cmd}`;
      
      setOutput(prev => [...prev, {
        type: 'output',
        content: mockOutput,
        timestamp: new Date().toLocaleTimeString('id-ID')
      }]);
    }

    setCommand('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeCommand(command);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
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

  const getOutputStyle = (type) => {
    switch (type) {
      case 'command':
        return 'text-green-400 font-semibold';
      case 'output':
        return 'text-gray-200';
      case 'error':
        return 'text-red-400';
      case 'system':
        return 'text-blue-400 font-semibold';
      case 'info':
        return 'text-yellow-400';
      default:
        return 'text-gray-200';
    }
  };

  const clearTerminal = () => {
    setOutput([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
                💻 Terminal
              </h1>
              <p className="text-gray-600 mt-2">Interactive server terminal</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isConnected 
                  ? 'bg-success-50 text-success-700 border border-success-200' 
                  : 'bg-danger-50 text-danger-700 border border-danger-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-success-500 animate-pulse' : 'bg-danger-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <button
                onClick={clearTerminal}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2 font-medium"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>

        {/* Terminal Window */}
        <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Terminal Header */}
          <div className="bg-gray-800 p-4 flex items-center gap-3 border-b border-gray-700">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex-1 text-center">
              <span className="text-gray-300 text-sm font-mono">
                Terminal - {currentPath}
              </span>
            </div>
            <div className="text-gray-400 text-sm">
              {new Date().toLocaleTimeString('id-ID')}
            </div>
          </div>

          {/* Terminal Content */}
          <div 
            ref={terminalRef}
            className="p-4 h-96 overflow-y-auto font-mono text-sm bg-gray-900 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
            onClick={() => inputRef.current?.focus()}
          >
            {/* Output History */}
            <div className="space-y-1">
              {output.map((line, index) => (
                <div 
                  key={index} 
                  className={`${getOutputStyle(line.type)} leading-relaxed`}
                >
                  {line.type === 'command' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">➜</span>
                      <span>{line.content}</span>
                    </div>
                  ) : (
                    <div className="pl-4">
                      <pre className="whitespace-pre-wrap font-mono text-sm">
                        {line.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Current Input Line */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-green-400 font-semibold">➜</span>
              <span className="text-blue-400 font-semibold">{currentPath}</span>
              <span className="text-gray-300">$</span>
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-gray-200 outline-none font-mono caret-green-400"
                placeholder="Type a command..."
                autoComplete="off"
                spellCheck="false"
              />
              <div className="w-2 h-5 bg-green-400 animate-pulse"></div>
            </div>
          </div>

          {/* Terminal Footer */}
          <div className="bg-gray-800 p-3 border-t border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-4">
                <span>Commands: {commandHistory.length}</span>
                <span>History: ↑↓</span>
                <span>Clear: Ctrl+L or type 'clear'</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Press</span>
                <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">Enter</kbd>
                <span>to execute</span>
              </div>
            </div>
          </div>
        </div>

        {/* Command Help */}
        <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            💡 Quick Commands
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { cmd: 'ls', desc: 'List files and directories' },
              { cmd: 'pwd', desc: 'Show current directory' },
              { cmd: 'cd <directory>', desc: 'Change directory' },
              { cmd: 'cat <file>', desc: 'Display file contents' },
              { cmd: 'ps', desc: 'Show running processes' },
              { cmd: 'top', desc: 'Show system processes' },
              { cmd: 'df', desc: 'Show disk usage' },
              { cmd: 'whoami', desc: 'Show current user' },
              { cmd: 'clear', desc: 'Clear terminal screen' },
            ].map((item, index) => (
              <div 
                key={index}
                onClick={() => setCommand(item.cmd.split(' ')[0])}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200 border border-gray-200 hover:border-primary-300"
              >
                <code className="text-primary-600 font-semibold font-mono">
                  {item.cmd}
                </code>
                <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalTailwind;
