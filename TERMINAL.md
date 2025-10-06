# Terminal Feature Documentation

## 🚀 Fitur Terminal Terintegrasi

Dashboard home server sekarang dilengkapi dengan **Terminal Terintegrasi** yang memungkinkan eksekusi command shell langsung dari web interface.

## ✨ Features

### 💻 Terminal Interface
- **Real-time Command Execution** - Jalankan command shell langsung dari browser
- **Command History** - Navigasi history dengan arrow keys (↑/↓)
- **Current Directory Tracking** - Path awareness dengan cd command support
- **Auto-scroll Output** - Terminal output otomatis scroll ke bawah
- **Quick Commands** - Tombol shortcut untuk command umum

### 🔒 Security Features
- **Command Blacklist** - Blokir command berbahaya (rm -rf, shutdown, dll)
- **Path Restrictions** - Akses terbatas pada direktori tertentu saja
- **Timeout Protection** - Command dibatasi maksimal 10 detik
- **Buffer Limit** - Output dibatasi maksimal 1MB

### 🎨 UI Components
- **Terminal-style Interface** - Tampilan mirip terminal asli dengan syntax coloring
- **macOS-style Header** - Traffic lights (red, yellow, green) 
- **Monospace Font** - Menggunakan Consolas/Monaco untuk konsistensi
- **Dark Theme** - Background hitam dengan syntax highlighting

## 🛡️ Security Restrictions

### Blocked Commands
```bash
# Dangerous file operations
rm -rf, mkfs, fdisk, dd

# System control
shutdown, reboot, halt, init

# Process control  
kill -9, killall, pkill

# Permission changes
chmod 777, chown root
sudo su, su root

# User management
passwd, useradd, userdel, usermod
```

### Allowed Directories
- `/home` - User home directories
- `/var/log` - Log files (read-only)
- `/etc` - System configuration (read-only)
- `/tmp` - Temporary files
- `/usr` - System binaries (read-only)
- `/opt` - Optional software (read-only)

## 🔧 Technical Implementation

### Backend Endpoint
```javascript
POST /api/terminal
Content-Type: application/json

{
  "command": "ls -la",
  "path": "/home"
}
```

### Response Format
```javascript
// Success
{
  "success": true,
  "output": "file listing...",
  "path": "/home",
  "timestamp": "2025-06-28T02:35:32.096Z"
}

// Error
{
  "success": false,
  "error": "Command blocked for security reasons",
  "output": ""
}
```

### Command Processing
1. **Security Check** - Validasi command terhadap blacklist
2. **Path Validation** - Cek akses direktori yang diizinkan
3. **Execution** - Jalankan command dengan timeout dan buffer limit
4. **Response** - Return output atau error message

## 📊 Quick Commands Available

| Button | Command | Description |
|--------|---------|-------------|
| List Files | `ls -la` | Show detailed file listing |
| Disk Usage | `df -h` | Show disk space usage |
| Memory Info | `free -h` | Show memory usage |
| CPU Info | `htop` | Show CPU usage (if available) |
| Processes | `ps aux` | Show running processes |
| Network | `netstat -tuln` | Show network connections |

## 🎮 Usage Guide

### Basic Commands
```bash
# File operations
ls -la                 # List files
cd /home              # Change directory  
pwd                   # Show current directory
cat filename.txt      # View file content

# System information
df -h                 # Disk usage
free -h               # Memory usage
ps aux                # Running processes
uptime                # System uptime

# Network
ping google.com       # Test connectivity
netstat -tuln         # Network connections
```

### Keyboard Shortcuts
- **↑ (Up Arrow)** - Previous command in history
- **↓ (Down Arrow)** - Next command in history
- **Enter** - Execute command
- **Clear Button** - Clear terminal output

## 🚨 Error Handling

### Common Errors
- **Command not found** - Binary tidak tersedia di sistem
- **Access denied** - Path tidak diizinkan untuk akses
- **Command blocked** - Command masuk blacklist security
- **Command timed out** - Eksekusi lebih dari 10 detik
- **Directory not found** - Target directory tidak ada

### Error Response Examples
```javascript
// Command not found
{
  "success": false,
  "error": "Command not found",
  "output": "bash: htop: command not found"
}

// Security block
{
  "success": false, 
  "error": "Command blocked for security reasons",
  "output": ""
}

// Timeout
{
  "success": false,
  "error": "Command timed out", 
  "output": "Command execution exceeded 10 second timeout"
}
```

## 🔄 Integration

Terminal terintegrasi penuh dengan dashboard:
- **Sidebar Navigation** - Akses melalui icon 💻 di sidebar
- **Real-time Updates** - Command output ditampilkan langsung
- **Responsive Design** - Bekerja di desktop dan mobile
- **Session Persistent** - Path dan history tersimpan selama session

## 📝 Development Notes

### Adding New Quick Commands
Edit `Terminal.jsx` pada array `quickCommands`:
```javascript
const quickCommands = [
  { label: 'Custom Command', cmd: 'your-command-here' },
  // ... existing commands
];
```

### Modifying Security Rules
Edit `server.js` pada array `blockedCommands` dan `allowedPaths`:
```javascript
const blockedCommands = [
  'dangerous-command',
  // ... existing blocks
];

const allowedPaths = ['/new/allowed/path'];
```

## 🎯 Future Enhancements

Potential improvements:
- **File Upload** - Upload files melalui terminal interface
- **Tab Completion** - Auto-complete untuk command dan path
- **Syntax Highlighting** - Color coding untuk different command types  
- **Session Management** - Multiple terminal sessions
- **Command Favorites** - Bookmark frequently used commands
