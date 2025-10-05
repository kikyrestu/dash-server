const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Add database management dependencies
const mysql = require('mysql2/promise');
const { Client: PgClient } = require('pg');
const { MongoClient } = require('mongodb');
const sqlite3 = require('sqlite3');
const redis = require('redis');
const multer = require('multer');

// Add Docker management dependency
const Docker = require('dockerode');

// Import SystemAuth class
const SystemAuth = require('./system-auth');
const systemAuth = new SystemAuth();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory user storage (in production, use a proper database)
const ADMIN_USERS = [
  {
    id: 1,
    username: 'admin',
    password: '$2b$10$rXK8QpZ1hJ9Gh4K4kJ8VeeJqhZ5xJ0U8Y4K5J6Y8Xk0Jk1J8Y6Xk8', // admin123
    role: 'admin'
  }
];

// JWT secret (use the same as system-auth.js)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// System Authentication Endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    const result = await systemAuth.authenticate(username, password);
    
    if (result.success) {
      // Get additional user info
      try {
        const userInfo = await systemAuth.getUserInfo(username);
        const groups = await systemAuth.getUserGroups(username);
        const hasSudo = await systemAuth.hasSudoPrivileges(username);
        
        res.json({
          success: true,
          token: result.token,
          user: {
            ...result.user,
            ...userInfo,
            groups,
            hasSudo,
            isAdmin: groups.includes('sudo') || groups.includes('admin') || groups.includes('wheel') || hasSudo
          }
        });
      } catch (error) {
        // If getting user info fails, still return basic auth success
        res.json({
          success: true,
          token: result.token,
          user: result.user
        });
      }
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/auth/verify', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const verification = systemAuth.verifyToken(token);
    
    if (verification.valid) {
      res.json({
        success: true,
        user: verification.user
      });
    } else {
      res.status(401).json({
        success: false,
        error: verification.error
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  // For JWT, logout is handled client-side by removing the token
  // Server-side, we could implement token blacklisting if needed
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

app.get('/api/auth/user/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check if requested user matches authenticated user or is admin
    if (req.user.username !== username && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const userInfo = await systemAuth.getUserInfo(username);
    const groups = await systemAuth.getUserGroups(username);
    const hasSudo = await systemAuth.hasSudoPrivileges(username);
    
    res.json({
      success: true,
      user: {
        ...userInfo,
        groups,
        hasSudo,
        isAdmin: groups.includes('sudo') || groups.includes('admin') || groups.includes('wheel') || hasSudo
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    });
  }
});

app.get('/api/auth/users', authenticateToken, async (req, res) => {
  try {
    // Only admins can list users
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const users = await systemAuth.getSystemUsers();
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user list'
    });
  }
});

// WebSocket Server
const wss = new WebSocket.Server({ server });

// In-memory storage for metrics
let currentMetrics = {
  cpu: 0,
  memory: { used: 0, total: 0, percentage: 0 },
  disk: { used: 0, total: 0, percentage: 0 },
  network: { upload: 0, download: 0 },
  temperature: 0,
  uptime: 0,
  processes: [],
  timestamp: Date.now()
};

let metricsHistory = [];
const MAX_HISTORY = 100; // Keep last 100 data points

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  try {
    // Send current metrics immediately
    ws.send(JSON.stringify({
      type: 'metrics',
      data: currentMetrics
    }));
    console.log('📊 Sent current metrics to new client');
    
    // Send historical data
    ws.send(JSON.stringify({
      type: 'history',
      data: metricsHistory
    }));
    console.log('📈 Sent history data to new client');
  } catch (error) {
    console.error('❌ Error sending initial data to client:', error);
  }

  ws.on('close', (code, reason) => {
    console.log('Client disconnected from WebSocket. Code:', code, 'Reason:', reason || 'No reason provided');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast metrics to all connected clients
function broadcastMetrics() {
  const message = JSON.stringify({
    type: 'metrics',
    data: currentMetrics
  });
  
  console.log('📡 Broadcasting metrics to', wss.clients.size, 'clients - CPU:', currentMetrics.cpu + '%');
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// API Routes
app.get('/api/metrics', (req, res) => {
  res.json(currentMetrics);
});

app.get('/api/history', (req, res) => {
  res.json(metricsHistory);
});

// Endpoint for agent to send metrics
app.post('/api/metrics', (req, res) => {
  const newMetrics = {
    ...req.body,
    timestamp: Date.now()
  };
  
  console.log('📊 Received metrics from agent - CPU:', newMetrics.cpu + '%', 'clients:', wss.clients.size);
  
  currentMetrics = newMetrics;
  
  // Add to history
  metricsHistory.push(newMetrics);
  if (metricsHistory.length > MAX_HISTORY) {
    metricsHistory.shift();
  }
  
  // Broadcast to all WebSocket clients
  broadcastMetrics();
  
  res.json({ success: true });
});

// File Manager Endpoints
app.get('/api/files', async (req, res) => {
  try {
    const dirPath = req.query.path || '/home';
    const safePath = path.resolve(dirPath);
    
    // Security check - prevent access outside allowed paths
    const allowedPaths = ['/home', '/var/log', '/etc', '/tmp'];
    const isAllowed = allowedPaths.some(allowed => safePath.startsWith(allowed));
    
    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied to this path' });
    }

    const stats = await fs.stat(safePath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    const files = await fs.readdir(safePath);
    const fileList = [];

    // Add parent directory link if not at root
    if (safePath !== '/') {
      fileList.push({
        name: '..',
        type: 'directory',
        size: 0,
        modified: new Date().toISOString().split('T')[0],
        permissions: 'drwxr-xr-x'
      });
    }

    for (const file of files) {
      try {
        const filePath = path.join(safePath, file);
        const fileStats = await fs.stat(filePath);
        
        fileList.push({
          name: file,
          type: fileStats.isDirectory() ? 'directory' : 'file',
          size: fileStats.size,
          modified: fileStats.mtime.toISOString().split('T')[0],
          permissions: fileStats.mode.toString(8).slice(-3)
        });
      } catch (err) {
        // Skip files that can't be accessed
        console.warn(`Cannot access ${file}:`, err.message);
      }
    }

    res.json({
      path: safePath,
      files: fileList
    });
  } catch (error) {
    console.error('File listing error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

app.get('/api/file/content', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }

    const safePath = path.resolve(filePath);
    const stats = await fs.stat(safePath);
    
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Cannot read directory as file' });
    }

    // Limit file size to prevent memory issues
    if (stats.size > 1024 * 1024) { // 1MB limit
      return res.status(400).json({ error: 'File too large to display' });
    }

    const content = await fs.readFile(safePath, 'utf8');
    res.json({
      path: safePath,
      content: content,
      size: stats.size,
      modified: stats.mtime.toISOString()
    });
  } catch (error) {
    console.error('File read error:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// File upload and folder creation endpoints
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Use a temporary directory first, we'll move the file later
      cb(null, '/tmp');
    },
    filename: (req, file, cb) => {
      // Generate unique filename to avoid conflicts
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// File upload endpoint
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { path: targetPath } = req.body;
    if (!targetPath) {
      return res.status(400).json({ error: 'Target path is required' });
    }

    const safeTargetPath = path.resolve(targetPath);
    
    // Security check - only allow certain paths
    const allowedPaths = ['/home', '/var/log', '/tmp'];
    const isAllowed = allowedPaths.some(allowed => safeTargetPath.startsWith(allowed));
    
    if (!isAllowed) {
      // Clean up temporary file
      fsSync.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Access denied to this path' });
    }

    // Ensure target directory exists
    if (!fsSync.existsSync(safeTargetPath)) {
      fsSync.mkdirSync(safeTargetPath, { recursive: true });
    }

    // Move file from temp location to target location
    const finalPath = path.join(safeTargetPath, req.file.originalname);
    
    // Copy the file (handles cross-filesystem moves)
    fsSync.copyFileSync(req.file.path, finalPath);
    // Delete the temporary file
    fsSync.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        name: req.file.originalname,
        size: req.file.size,
        path: finalPath
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    // Clean up temporary file if it exists
    if (req.file && fsSync.existsSync(req.file.path)) {
      fsSync.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'File upload failed: ' + error.message });
  }
});

// Create new folder endpoint
app.post('/api/files/mkdir', async (req, res) => {
  try {
    const { folderName, path: parentPath } = req.body;
    
    if (!folderName || !parentPath) {
      return res.status(400).json({ error: 'Folder name and path are required' });
    }

    const safeParentPath = path.resolve(parentPath);
    const newFolderPath = path.join(safeParentPath, folderName);
    
    // Security check
    const allowedPaths = ['/home', '/var/log', '/etc', '/tmp'];
    const isAllowed = allowedPaths.some(allowed => safeParentPath.startsWith(allowed));
    
    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied to this path' });
    }

    // Check if folder already exists
    if (await fs.stat(newFolderPath).catch(() => false)) {
      return res.status(400).json({ error: 'Folder already exists' });
    }

    // Create the folder
    await fs.mkdir(newFolderPath);
    
    res.json({
      success: true,
      message: 'Folder created successfully',
      folder: {
        name: folderName,
        path: newFolderPath
      }
    });
  } catch (error) {
    console.error('Folder creation error:', error);
    res.status(500).json({ error: 'Failed to create folder: ' + error.message });
  }
});

// Terminal endpoint - execute shell commands
app.post('/api/terminal', (req, res) => {
  const { command, path: currentPath } = req.body;
  
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command is required' });
  }

  // Security restrictions - block dangerous commands
  const blockedCommands = [
    'rm -rf', 'mkfs', 'fdisk', 'dd', 'shutdown', 'reboot', 
    'halt', 'init', 'kill -9', 'killall', 'pkill',
    'chmod 777', 'chown root', 'sudo su', 'su root',
    'passwd', 'useradd', 'userdel', 'usermod'
  ];
  
  const isBlocked = blockedCommands.some(blocked => 
    command.toLowerCase().includes(blocked.toLowerCase())
  );
  
  if (isBlocked) {
    return res.status(403).json({ 
      error: 'Command blocked for security reasons',
      success: false 
    });
  }

  // Set working directory with security check
  const workingDir = currentPath || '/home';
  const allowedPaths = ['/home', '/var/log', '/etc', '/tmp', '/usr', '/opt'];
  const isAllowedPath = allowedPaths.some(allowed => workingDir.startsWith(allowed));
  
  if (!isAllowedPath) {
    return res.status(403).json({ 
      error: 'Access denied to this directory',
      success: false 
    });
  }

  // Execute command with timeout
  const execOptions = {
    cwd: workingDir,
    timeout: 10000, // 10 second timeout
    maxBuffer: 1024 * 1024, // 1MB buffer
    encoding: 'utf8'
  };

  exec(command, execOptions, (error, stdout, stderr) => {
    if (error) {
      // Handle different types of errors
      if (error.code === 'ENOENT') {
        return res.json({
          success: false,
          error: 'Command not found',
          output: stderr || error.message
        });
      } else if (error.signal === 'SIGTERM') {
        return res.json({
          success: false,
          error: 'Command timed out',
          output: 'Command execution exceeded 10 second timeout'
        });
      } else {
        return res.json({
          success: false,
          error: error.message,
          output: stderr || ''
        });
      }
    }

    // Handle cd command specially
    let newPath = workingDir;
    if (command.trim().startsWith('cd ')) {
      const targetPath = command.trim().substring(3).trim();
      if (targetPath === '..') {
        newPath = path.dirname(workingDir);
      } else if (targetPath.startsWith('/')) {
        newPath = targetPath;
      } else {
        newPath = path.join(workingDir, targetPath);
      }
      
      // Verify the new path exists and is allowed
      try {
        const fs = require('fs');
        if (fs.existsSync(newPath) && fs.statSync(newPath).isDirectory()) {
          const isNewPathAllowed = allowedPaths.some(allowed => newPath.startsWith(allowed));
          if (!isNewPathAllowed) {
            return res.json({
              success: false,
              error: 'Access denied to target directory',
              output: ''
            });
          }
        } else {
          return res.json({
            success: false,
            error: 'Directory does not exist',
            output: ''
          });
        }
      } catch (err) {
        return res.json({
          success: false,
          error: 'Cannot access directory',
          output: ''
        });
      }
    }

    res.json({
      success: true,
      output: stdout || '(command executed successfully)',
      path: newPath,
      timestamp: new Date().toISOString()
    });
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    clients: wss.clients.size
  });
});

// Database detection and connection functions
const detectDatabases = async () => {
  const databases = [];
  const status = {};

  // Check MySQL/MariaDB
  try {
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec('systemctl is-active mysql || systemctl is-active mariadb', (error, stdout) => {
        if (stdout.trim() === 'active') {
          databases.push({
            name: 'MySQL/MariaDB',
            type: 'mysql',
            port: 3306,
            host: 'localhost'
          });
          status['MySQL/MariaDB'] = { detected: true, running: true };
        }
        resolve();
      });
    });
  } catch (error) {
    console.log('MySQL/MariaDB not detected');
  }

  // Check PostgreSQL
  try {
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec('systemctl is-active postgresql', (error, stdout) => {
        if (stdout.trim() === 'active') {
          databases.push({
            name: 'PostgreSQL',
            type: 'postgresql',
            port: 5432,
            host: 'localhost'
          });
          status['PostgreSQL'] = { detected: true, running: true };
        }
        resolve();
      });
    });
  } catch (error) {
    console.log('PostgreSQL not detected');
  }

  // Check MongoDB
  try {
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec('systemctl is-active mongod', (error, stdout) => {
        if (stdout.trim() === 'active') {
          databases.push({
            name: 'MongoDB',
            type: 'mongodb',
            port: 27017,
            host: 'localhost'
          });
          status['MongoDB'] = { detected: true, running: true };
        }
        resolve();
      });
    });
  } catch (error) {
    console.log('MongoDB not detected');
  }

  // Check Redis
  try {
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec('systemctl is-active redis', (error, stdout) => {
        if (stdout.trim() === 'active') {
          databases.push({
            name: 'Redis',
            type: 'redis',
            port: 6379,
            host: 'localhost'
          });
          status['Redis'] = { detected: true, running: true };
        }
        resolve();
      });
    });
  } catch (error) {
    console.log('Redis not detected');
  }

  // Check for SQLite databases
  try {
    const fs = require('fs');
    const path = require('path');
    const commonPaths = ['/var/lib', '/home', '/opt', '/usr/local'];
    
    for (const basePath of commonPaths) {
      if (fs.existsSync(basePath)) {
        const files = fs.readdirSync(basePath, { withFileTypes: true });
        for (const file of files) {
          if (file.isFile() && file.name.endsWith('.db')) {
            databases.push({
              name: `SQLite - ${file.name}`,
              type: 'sqlite',
              path: path.join(basePath, file.name),
              host: 'localhost'
            });
            status[`SQLite - ${file.name}`] = { detected: true, running: true };
          }
        }
      }
    }
  } catch (error) {
    console.log('SQLite scan error:', error.message);
  }

  return { databases, status };
};

const connectToDatabase = async (dbInfo) => {
  try {
    switch (dbInfo.type.toLowerCase()) {
      case 'mysql':
      case 'mariadb':
        const mysqlConnection = await mysql.createConnection({
          host: '127.0.0.1', // Force IPv4
          port: dbInfo.port || 3306,
          user: 'root',
          password: dbInfo.password || process.env.MYSQL_ROOT_PASSWORD || '',
          connectTimeout: 5000
        });
        await mysqlConnection.ping();
        const [mysqlResult] = await mysqlConnection.execute('SELECT VERSION() as version');
        await mysqlConnection.end();
        return {
          success: true,
          info: {
            version: mysqlResult[0].version,
            connected: true
          }
        };

      case 'postgresql':
        const pgClient = new PgClient({
          host: dbInfo.host || 'localhost',
          port: dbInfo.port || 5432,
          user: 'postgres',
          password: dbInfo.password || process.env.POSTGRES_PASSWORD || '',
          database: 'postgres',
          connectionTimeoutMillis: 5000
        });
        await pgClient.connect();
        const pgResult = await pgClient.query('SELECT version()');
        await pgClient.end();
        return {
          success: true,
          info: {
            version: pgResult.rows[0].version,
            connected: true
          }
        };

      case 'mongodb':
        const mongoClient = new MongoClient(`mongodb://${dbInfo.host || 'localhost'}:${dbInfo.port || 27017}`, {
          serverSelectionTimeoutMS: 5000
        });
        await mongoClient.connect();
        const mongoAdmin = mongoClient.db('admin');
        const mongoResult = await mongoAdmin.command({ buildInfo: 1 });
        await mongoClient.close();
        return {
          success: true,
          info: {
            version: mongoResult.version,
            connected: true
          }
        };

      case 'redis':
        const redisClient = redis.createClient({
          host: dbInfo.host || 'localhost',
          port: dbInfo.port || 6379,
          connectTimeout: 5000
        });
        await redisClient.connect();
        const redisInfo = await redisClient.info('server');
        await redisClient.quit();
        return {
          success: true,
          info: {
            version: redisInfo.split('\n').find(line => line.startsWith('redis_version:')),
            connected: true
          }
        };

      case 'sqlite':
        return new Promise((resolve, reject) => {
          const db = new sqlite3.Database(dbInfo.path, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
              reject({ success: false, error: err.message });
            } else {
              db.get('SELECT sqlite_version() as version', (err, row) => {
                db.close();
                if (err) {
                  reject({ success: false, error: err.message });
                } else {
                  resolve({
                    success: true,
                    info: {
                      version: row.version,
                      connected: true
                    }
                  });
                }
              });
            }
          });
        });

      default:
        return { success: false, error: 'Unsupported database type' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const executeQuery = async (dbName, query, dbType) => {
  try {
    switch (dbType.toLowerCase()) {
      case 'mysql':
      case 'mariadb':
        const mysqlConnection = await mysql.createConnection({
          host: '127.0.0.1', // Force IPv4
          port: 3306,
          user: 'root',
          password: process.env.MYSQL_ROOT_PASSWORD || 'Kikyrestu089!!!',
          multipleStatements: true
        });
        const [rows] = await mysqlConnection.execute(query);
        await mysqlConnection.end();
        return { success: true, data: rows };

      case 'postgresql':
        const pgClient = new PgClient({
          host: 'localhost',
          port: 5432,
          user: 'postgres',
          password: process.env.POSTGRES_PASSWORD || '',
          database: 'postgres'
        });
        await pgClient.connect();
        const pgQueryResult = await pgClient.query(query);
        await pgClient.end();
        return { success: true, data: pgQueryResult.rows };

      case 'mongodb':
        // For MongoDB, we'll execute as eval commands
        const mongoClient = new MongoClient('mongodb://localhost:27017');
        await mongoClient.connect();
        const db = mongoClient.db('admin');
        const mongoQueryResult = await db.eval(query);
        await mongoClient.close();
        return { success: true, data: mongoQueryResult };

      case 'sqlite':
        return new Promise((resolve, reject) => {
          const db = new sqlite3.Database(dbName.split(' - ')[1], (err) => {
            if (err) {
              reject({ success: false, error: err.message });
              return;
            }
            
            db.all(query, (err, rows) => {
              db.close();
              if (err) {
                reject({ success: false, error: err.message });
              } else {
                resolve({ success: true, data: rows });
              }
            });
          });
        });

      default:
        return { success: false, error: 'Unsupported database type' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Database API endpoints
app.get('/api/databases', async (req, res) => {
  try {
    const result = await detectDatabases();
    res.json(result);
  } catch (error) {
    console.error('Database detection error:', error);
    res.status(500).json({ error: 'Failed to detect databases' });
  }
});

app.post('/api/database/connect', async (req, res) => {
  try {
    const dbInfo = req.body;
    const result = await connectToDatabase(dbInfo);
    res.json(result);
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, error: 'Connection failed' });
  }
});

app.post('/api/database/query', async (req, res) => {
  try {
    const { database, query } = req.body;
    
    if (!database || !query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Database and query are required' 
      });
    }

    // Security check - block dangerous queries
    const dangerousQueries = [
      'drop database', 'drop table', 'delete from', 'truncate',
      'alter table', 'create user', 'grant all', 'revoke'
    ];
    
    const isBlocked = dangerousQueries.some(blocked => 
      query.toLowerCase().includes(blocked.toLowerCase())
    );
    
    if (isBlocked) {
      return res.json({ 
        success: false, 
        error: 'Query blocked for security reasons' 
      });
    }

    // Extract database type from database name
    let dbType = 'mysql';
    if (database.toLowerCase().includes('postgresql')) dbType = 'postgresql';
    else if (database.toLowerCase().includes('mongodb')) dbType = 'mongodb';
    else if (database.toLowerCase().includes('sqlite')) dbType = 'sqlite';
    else if (database.toLowerCase().includes('redis')) dbType = 'redis';

    const result = await executeQuery(database, query, dbType);
    res.json(result);
  } catch (error) {
    console.error('Query execution error:', error);
    res.status(500).json({ success: false, error: 'Query execution failed' });
  }
});

// Network information functions
const getNetworkInfo = async () => {
  try {
    const networkInfo = {
      localIP: null,
      publicIP: null,
      wireguard: {
        status: 'disconnected',
        interface: null,
        ip: null,
        endpoint: null,
        lastHandshake: null
      },
      interfaces: []
    };

    // Get local IP addresses
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    try {
      // Get all network interfaces
      const { stdout: ifconfigOutput } = await execPromise('ip addr show');
      const interfaces = parseNetworkInterfaces(ifconfigOutput);
      networkInfo.interfaces = interfaces;
      
      // Find primary local IP (usually from eth0, wlan0, wlp*, or enp* interfaces)
      const primaryInterface = interfaces.find(iface => 
        iface.name.match(/^(eth0|wlan0|wlp\d+s\d+|enp\d+s\d+|ens\d+)$/) && 
        iface.ipv4 && 
        !iface.ipv4.startsWith('127.') &&
        iface.status === 'up'
      );
      
      if (primaryInterface) {
        networkInfo.localIP = primaryInterface.ipv4;
      }
    } catch (error) {
      console.error('Error getting network interfaces:', error);
    }

    // Check WireGuard status
    try {
      const { stdout: wgOutput } = await execPromise('which wg');
      if (wgOutput.trim()) {
        // WireGuard is installed, check status
        try {
          const { stdout: wgShowOutput } = await execPromise('sudo wg show');
          if (wgShowOutput.trim()) {
            const wgInfo = parseWireGuardStatus(wgShowOutput);
            networkInfo.wireguard = wgInfo;
          }
        } catch (wgError) {
          // WireGuard not running or no sudo access
          networkInfo.wireguard.status = 'not_running';
        }
      } else {
        networkInfo.wireguard.status = 'not_installed';
      }
    } catch (error) {
      networkInfo.wireguard.status = 'not_installed';
    }

    // Get public IP
    try {
      const { stdout: publicIPOutput } = await execPromise('curl -s --max-time 5 ifconfig.me || curl -s --max-time 5 ipinfo.io/ip || echo "unavailable"');
      const publicIP = publicIPOutput.trim();
      if (publicIP && publicIP !== 'unavailable' && publicIP.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        networkInfo.publicIP = publicIP;
      }
    } catch (error) {
      console.error('Error getting public IP:', error);
    }

    return networkInfo;
  } catch (error) {
    console.error('Error getting network info:', error);
    return {
      localIP: null,
      publicIP: null,
      wireguard: { status: 'error', interface: null, ip: null },
      interfaces: []
    };
  }
};

const parseNetworkInterfaces = (ifconfigOutput) => {
  const interfaces = [];
  const lines = ifconfigOutput.split('\n');
  
  let currentInterface = null;
  
  for (const line of lines) {
    // New interface
    const interfaceMatch = line.match(/^(\d+):\s+([^:]+):/);
    if (interfaceMatch) {
      if (currentInterface) {
        interfaces.push(currentInterface);
      }
      currentInterface = {
        name: interfaceMatch[2].trim(),
        status: line.includes('state UP') ? 'up' : 'down',
        ipv4: null,
        ipv6: null,
        mac: null
      };
    }
    
    // IPv4 address
    const ipv4Match = line.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
    if (ipv4Match && currentInterface) {
      currentInterface.ipv4 = ipv4Match[1];
    }
    
    // IPv6 address
    const ipv6Match = line.match(/inet6\s+([a-f0-9:]+)/);
    if (ipv6Match && currentInterface && !ipv6Match[1].startsWith('fe80')) {
      currentInterface.ipv6 = ipv6Match[1];
    }
    
    // MAC address
    const macMatch = line.match(/link\/ether\s+([a-f0-9:]+)/);
    if (macMatch && currentInterface) {
      currentInterface.mac = macMatch[1];
    }
  }
  
  if (currentInterface) {
    interfaces.push(currentInterface);
  }
  
  return interfaces.filter(iface => iface.name !== 'lo'); // Filter out loopback
};

const parseWireGuardStatus = (wgOutput) => {
  const lines = wgOutput.split('\n');
  const wgInfo = {
    status: 'connected',
    interface: null,
    ip: null,
    endpoint: null,
    lastHandshake: null,
    peers: []
  };
  
  let currentPeer = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Interface name
    const interfaceMatch = trimmedLine.match(/^interface:\s+(.+)$/);
    if (interfaceMatch) {
      wgInfo.interface = interfaceMatch[1];
      continue;
    }
    
    // Peer
    const peerMatch = trimmedLine.match(/^peer:\s+(.+)$/);
    if (peerMatch) {
      if (currentPeer) {
        wgInfo.peers.push(currentPeer);
      }
      currentPeer = {
        publicKey: peerMatch[1],
        endpoint: null,
        allowedIPs: null,
        latestHandshake: null
      };
      continue;
    }
    
    // Endpoint
    const endpointMatch = trimmedLine.match(/^endpoint:\s+(.+)$/);
    if (endpointMatch && currentPeer) {
      currentPeer.endpoint = endpointMatch[1];
      if (!wgInfo.endpoint) {
        wgInfo.endpoint = endpointMatch[1];
      }
      continue;
    }
    
    // Allowed IPs
    const allowedIPsMatch = trimmedLine.match(/^allowed ips:\s+(.+)$/);
    if (allowedIPsMatch && currentPeer) {
      currentPeer.allowedIPs = allowedIPsMatch[1];
      // Extract WireGuard IP if it looks like a single IP
      const ipMatch = allowedIPsMatch[1].match(/(\d+\.\d+\.\d+\.\d+)\/\d+/);
      if (ipMatch && !wgInfo.ip) {
        wgInfo.ip = ipMatch[1];
      }
      continue;
    }
    
    // Latest handshake
    const handshakeMatch = trimmedLine.match(/^latest handshake:\s+(.+)$/);
    if (handshakeMatch && currentPeer) {
      currentPeer.latestHandshake = handshakeMatch[1];
      if (!wgInfo.lastHandshake) {
        wgInfo.lastHandshake = handshakeMatch[1];
      }
      continue;
    }
  }
  
  if (currentPeer) {
    wgInfo.peers.push(currentPeer);
  }
  
  return wgInfo;
};

// Network API endpoints
app.get('/api/network', async (req, res) => {
  try {
    const networkInfo = await getNetworkInfo();
    res.json(networkInfo);
  } catch (error) {
    console.error('Network info error:', error);
    res.status(500).json({ error: 'Failed to get network information' });
  }
});

// Storage management functions
const getStorageInfo = async () => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    const storageInfo = {
      disks: [],
      partitions: [],
      totalSpace: 0,
      usedSpace: 0,
      freeSpace: 0,
      usage: 0
    };

    // Get disk information (SSD vs HDD detection)
    try {
      const { stdout: lsblkOutput } = await execPromise('lsblk -J -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE,ROTA,MODEL');
      const lsblkData = JSON.parse(lsblkOutput);
      
      for (const device of lsblkData.blockdevices) {
        if (device.type === 'disk') {
          const diskInfo = {
            name: device.name,
            model: device.model || 'Unknown',
            size: device.size,
            type: device.rota === '1' ? 'HDD' : 'SSD',
            partitions: []
          };

          // Get disk temperature and health info
          try {
            let smartOutput;
            
            if (sudoPassword) {
              // Use stored sudo password
              const command = `echo "${sudoPassword}" | sudo -S smartctl -A /dev/${device.name} 2>/dev/null`;
              const { stdout } = await execPromise(command);
              smartOutput = stdout;
            } else {
              // Try without sudo first
              try {
                const { stdout } = await execPromise(`smartctl -A /dev/${device.name} 2>/dev/null || echo "Permission denied"`);
                smartOutput = stdout;
              } catch (err) {
                smartOutput = 'SMART access requires sudo password';
              }
            }
            
            if (smartOutput && !smartOutput.includes('Permission denied') && !smartOutput.includes('requires sudo')) {
              diskInfo.smart = smartOutput.trim();
              
              // Parse temperature
              const tempMatch = smartOutput.match(/Temperature:\s+(\d+)\s+Celsius/);
              if (tempMatch) {
                diskInfo.temperature = parseInt(tempMatch[1]);
              }
              
              // Parse health percentage
              const usedMatch = smartOutput.match(/Percentage Used:\s+(\d+)%/);
              if (usedMatch) {
                diskInfo.healthPercentage = 100 - parseInt(usedMatch[1]);
              }
            } else {
              diskInfo.smart = sudoPassword ? 'SMART not available' : 'SMART access requires sudo password';
            }
          } catch (err) {
            diskInfo.smart = 'SMART access denied';
          }

          // Process partitions
          if (device.children) {
            for (const partition of device.children) {
              if (partition.mountpoint) {
                const partInfo = {
                  name: partition.name,
                  size: partition.size,
                  mountpoint: partition.mountpoint,
                  fstype: partition.fstype || 'Unknown'
                };

                // Get partition usage
                try {
                  const { stdout: dfOutput } = await execPromise(`df -h ${partition.mountpoint} | tail -n 1`);
                  const dfParts = dfOutput.trim().split(/\s+/);
                  if (dfParts.length >= 6) {
                    partInfo.used = dfParts[2];
                    partInfo.available = dfParts[3];
                    partInfo.usage = parseInt(dfParts[4].replace('%', ''));
                  }
                } catch (err) {
                  partInfo.usage = 0;
                }

                diskInfo.partitions.push(partInfo);
                storageInfo.partitions.push(partInfo);
              }
            }
          }

          storageInfo.disks.push(diskInfo);
        }
      }
    } catch (error) {
      console.error('Error getting disk info:', error);
    }

    // Get overall storage statistics
    try {
      const { stdout: dfOutput } = await execPromise('df -h --total | tail -n 1');
      const dfParts = dfOutput.trim().split(/\s+/);
      if (dfParts.length >= 6) {
        storageInfo.totalSpace = dfParts[1];
        storageInfo.usedSpace = dfParts[2];
        storageInfo.freeSpace = dfParts[3];
        storageInfo.usage = parseInt(dfParts[4].replace('%', ''));
      }
    } catch (error) {
      console.error('Error getting storage stats:', error);
    }

    // Get I/O statistics
    try {
      const { stdout: iostatOutput } = await execPromise('iostat -x 1 1 | tail -n +4');
      const ioLines = iostatOutput.trim().split('\n').filter(line => line.trim());
      storageInfo.ioStats = [];
      
      for (const line of ioLines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 10 && !parts[0].includes('avg-cpu')) {
          storageInfo.ioStats.push({
            device: parts[0],
            readKBps: parseFloat(parts[2]) || 0,
            writeKBps: parseFloat(parts[3]) || 0,
            utilization: parseFloat(parts[9]) || 0
          });
        }
      }
    } catch (error) {
      storageInfo.ioStats = [];
    }

    // Get mounted filesystems
    try {
      const { stdout: mountOutput } = await execPromise('mount | grep "^/dev"');
      const mountLines = mountOutput.trim().split('\n');
      storageInfo.mounts = [];
      
      for (const line of mountLines) {
        const parts = line.split(' ');
        if (parts.length >= 6) {
          storageInfo.mounts.push({
            device: parts[0],
            mountpoint: parts[2],
            filesystem: parts[4],
            options: parts[5].replace(/[()]/g, '')
          });
        }
      }
    } catch (error) {
      storageInfo.mounts = [];
    }

    return storageInfo;
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      disks: [],
      partitions: [],
      totalSpace: '0B',
      usedSpace: '0B', 
      freeSpace: '0B',
      usage: 0,
      ioStats: [],
      mounts: []
    };
  }
};

// Storage API endpoint
app.get('/api/storage', async (req, res) => {
  try {
    const storageInfo = await getStorageInfo();
    res.json(storageInfo);
  } catch (error) {
    console.error('Storage info error:', error);
    res.status(500).json({ error: 'Failed to get storage information' });
  }
});

// Storage sudo password handling
let sudoPassword = null;

// Add sudo password endpoint
app.post('/api/storage/sudo', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  // Test sudo password with a simple command
  const testCommand = `echo "${password}" | sudo -S whoami`;
  
  exec(testCommand, { timeout: 5000 }, (error, stdout, stderr) => {
    if (error || stderr.includes('Sorry, try again')) {
      return res.json({ 
        success: false, 
        error: 'Invalid sudo password' 
      });
    }
    
    if (stdout.trim() === 'root') {
      sudoPassword = password;
      res.json({ 
        success: true, 
        message: 'Sudo password stored successfully' 
      });
    } else {
      res.json({ 
        success: false, 
        error: 'Failed to verify sudo access' 
      });
    }
  });
});

// Clear stored sudo password
app.post('/api/storage/sudo/clear', (req, res) => {
  sudoPassword = null;
  res.json({ success: true, message: 'Sudo password cleared' });
});

// Enhanced SMART data collection with sudo password
const getSmartDataWithSudo = async (deviceName) => {
  if (!sudoPassword) {
    return 'SMART access requires sudo password';
  }
  
  try {
    const command = `echo "${sudoPassword}" | sudo -S smartctl -A /dev/${deviceName} 2>/dev/null`;
    const { stdout } = await execPromise(command);
    
    if (stdout.trim()) {
      return stdout.trim();
    } else {
      return 'SMART data not available';
    }
  } catch (error) {
    return 'SMART access failed';
  }
};

// Port management functions
const getPortsInfo = async () => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    const ports = [];
    
    // Get listening ports using netstat
    try {
      const { stdout: netstatOutput } = await execPromise('netstat -tulnp 2>/dev/null');
      const lines = netstatOutput.trim().split('\n').slice(2); // Skip headers
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 6) {
          const protocol = parts[0];
          const localAddress = parts[3];
          const state = parts[5] || 'LISTEN';
          const processInfo = parts[6] || '-';
          
          // Extract port from local address
          const portMatch = localAddress.match(/:(\d+)$/);
          if (portMatch) {
            const port = parseInt(portMatch[1]);
            const address = localAddress.replace(`:${port}`, '');
            
            // Extract PID and process name
            let pid = null;
            let process = null;
            if (processInfo !== '-') {
              const pidMatch = processInfo.match(/^(\d+)\/(.*)/);
              if (pidMatch) {
                pid = pidMatch[1];
                process = pidMatch[2];
              }
            }
            
            // Determine service type
            let service = 'unknown';
            if (port === 80) service = 'http';
            else if (port === 443) service = 'https';
            else if (port === 22) service = 'ssh';
            else if (port === 21) service = 'ftp';
            else if (port === 3306) service = 'mysql';
            else if (port === 5432) service = 'postgresql';
            else if (port === 27017) service = 'mongodb';
            else if (port === 6379) service = 'redis';
            else if (port === 3000) service = 'node-app';
            else if (port === 8080) service = 'tomcat/jenkins'; if (port === 25) service = 'smtp';
            else if (port === 53) service = 'dns';
            else if (port === 3306) service = 'mysql';
            else if (port === 5432) service = 'postgresql';
            else if (port === 6379) service = 'redis';
            else if (port === 27017) service = 'mongodb';
            else if (port === 3000) service = 'react-dev';
            else if (port === 3001) service = 'node-api';
            else if (port === 8080) service = 'http-alt';
            else if (port === 9000) service = 'web-service';
            
            ports.push({
              port: port,
              protocol: protocol,
              status: state,
              localAddress: address,
              service: service,
              process: process,
              pid: pid
            });
          }
        }
      }
    } catch (error) {
      console.error('Error getting netstat output:', error);
    }
    
    // Get additional port info using ss command
    try {
      const { stdout: ssOutput } = await execPromise('ss -tulnp 2>/dev/null');
      const lines = ssOutput.trim().split('\n').slice(1); // Skip header
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const state = parts[0];
          const localAddress = parts[4];
          const processInfo = parts[6] || '';
          
          // Extract port from local address
          const portMatch = localAddress.match(/:(\d+)$/);
          if (portMatch) {
            const port = parseInt(portMatch[1]);
            
            // Check if port already exists in our list
            const existingPort = ports.find(p => p.port === port);
            if (!existingPort && state === 'LISTEN') {
              // Extract process info
              let pid = null;
              let process = null;
              const pidMatch = processInfo.match(/pid=(\d+),.*,cmd="([^"]+)"/);
              if (pidMatch) {
                pid = pidMatch[1];
                process = pidMatch[2];
              }
              
              ports.push({
                port: port,
                protocol: 'tcp', // ss default
                status: 'LISTEN',
                localAddress: localAddress.replace(`:${port}`, ''),
                service: 'unknown',
                process: process,
                pid: pid
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting ss output:', error);
    }
    
    // Remove duplicates and sort by port number
    const uniquePorts = ports.filter((port, index, self) => 
      index === self.findIndex(p => p.port === port.port && p.protocol === port.protocol)
    ).sort((a, b) => a.port - b.port);
    
    return {
      ports: uniquePorts,
      timestamp: new Date().toISOString(),
      total: uniquePorts.length
    };
    
  } catch (error) {
    console.error('Error getting ports info:', error);
    return {
      ports: [],
      timestamp: new Date().toISOString(),
      total: 0,
      error: error.message
    };
  }
};

const scanPorts = async (startPort = 1, endPort = 1000) => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    const openPorts = [];
    const batchSize = 50; // Scan in batches to avoid overwhelming the system
    
    for (let i = startPort; i <= endPort; i += batchSize) {
      const endBatch = Math.min(i + batchSize - 1, endPort);
      
      try {
        // Use nc (netcat) for port scanning
        const { stdout } = await execPromise(`timeout 10 nc -z -v 127.0.0.1 ${i}-${endBatch} 2>&1 | grep "succeeded" | grep -o "\\b[0-9]\\+\\b" || true`);
        
        if (stdout.trim()) {
          const ports = stdout.trim().split('\n').map(p => parseInt(p)).filter(p => !isNaN(p));
          openPorts.push(...ports);
        }
      } catch (scanError) {
        // Continue scanning even if some ports fail
        console.log(`Port scan batch ${i}-${endBatch} failed:`, scanError.message);
      }
    }
    
    return {
      openPorts: openPorts.sort((a, b) => a - b),
      scannedRange: `${startPort}-${endPort}`,
      timestamp: new Date().toISOString(),
      total: openPorts.length
    };
    
  } catch (error) {
    console.error('Error scanning ports:', error);
    return {
      openPorts: [],
      scannedRange: `${startPort}-${endPort}`,
      timestamp: new Date().toISOString(),
      total: 0,
      error: error.message
    };
  }
};

const getFirewallRules = async () => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    const rules = [];
    
    // Try to get UFW rules first
    try {
      const { stdout: ufwOutput } = await execPromise('sudo ufw status numbered 2>/dev/null || ufw status numbered 2>/dev/null');
      if (ufwOutput.includes('Status: active')) {
        const lines = ufwOutput.split('\n').slice(3); // Skip headers
        for (const line of lines) {
          if (line.trim() && !line.includes('---')) {
            rules.push(line.trim());
          }
        }
      }
    } catch (ufwError) {
      console.log('UFW not available or accessible');
    }
    
    // Try to get iptables rules as fallback
    if (rules.length === 0) {
      try {
        const { stdout: iptablesOutput } = await execPromise('sudo iptables -L -n --line-numbers 2>/dev/null || iptables -L -n --line-numbers 2>/dev/null');
        const lines = iptablesOutput.split('\n');
        let inInputChain = false;
        
        for (const line of lines) {
          if (line.includes('Chain INPUT')) {
            inInputChain = true;
            continue;
          }
          if (line.includes('Chain ') && !line.includes('Chain INPUT')) {
            inInputChain = false;
            continue;
          }
          
          if (inInputChain && line.trim() && !line.includes('target') && !line.includes('---')) {
            rules.push(line.trim());
          }
        }
      } catch (iptablesError) {
        console.log('iptables not available or accessible');
      }
    }
    
    return {
      rules: rules,
      timestamp: new Date().toISOString(),
      total: rules.length
    };
    
  } catch (error) {
    console.error('Error getting firewall rules:', error);
    return {
      rules: [],
      timestamp: new Date().toISOString(),
      total: 0,
      error: error.message
    };
  }
};

const manageFirewallPort = async (port, action) => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    let command = '';
    
    if (action === 'block') {
      // Try UFW first
      command = `sudo ufw deny ${port} 2>/dev/null || sudo iptables -A INPUT -p tcp --dport ${port} -j DROP 2>/dev/null`;
    } else if (action === 'allow') {
      // Try UFW first
      command = `sudo ufw allow ${port} 2>/dev/null || sudo iptables -A INPUT -p tcp --dport ${port} -j ACCEPT 2>/dev/null`;
    } else if (action === 'remove') {
      // Try UFW first, then iptables
      command = `sudo ufw delete allow ${port} 2>/dev/null || sudo ufw delete deny ${port} 2>/dev/null || sudo iptables -D INPUT -p tcp --dport ${port} -j DROP 2>/dev/null || sudo iptables -D INPUT -p tcp --dport ${port} -j ACCEPT 2>/dev/null`;
    }
    
    if (command) {
      const { stdout, stderr } = await execPromise(command);
      return {
        success: true,
        message: `Port ${port} ${action} rule applied successfully`,
        output: stdout || stderr
      };
    } else {
      throw new Error('Invalid action specified');
    }
    
  } catch (error) {
    console.error('Error managing firewall port:', error);
    return {
      success: false,
      error: error.message,
      message: `Failed to ${action} port ${port}. This might require sudo privileges.`
    };
  }
};

// Security Center functions
const getLoginAttempts = async () => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    const attempts = [];
    
    // Get SSH login attempts from auth.log
    try {
      const { stdout: authLog } = await execPromise('sudo tail -n 100 /var/log/auth.log 2>/dev/null | grep -E "(Failed|Accepted) (password|publickey)" | tail -20');
      const lines = authLog.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const parts = line.split(' ');
        if (parts.length >= 11) {
          const timestamp = new Date(`${parts[0]} ${parts[1]} ${parts[2]}`);
          const success = line.includes('Accepted');
          const user = success ? parts[8] : parts[10];
          const ip = success ? parts[10] : parts[12];
          
          attempts.push({
            timestamp: timestamp.toISOString(),
            success: success,
            user: user || 'unknown',
            ip: ip || 'unknown',
            method: line.includes('password') ? 'password' : 'publickey',
            service: 'ssh'
          });
        }
      }
    } catch (error) {
      console.error('Error reading auth.log:', error);
    }
    
    // Get web server login attempts (if available)
    try {
      const { stdout: accessLog } = await execPromise('sudo tail -n 50 /var/log/apache2/access.log 2>/dev/null | grep -E "(POST|PUT)" | grep -E "(login|admin|wp-admin)" | tail -10');
      const lines = accessLog.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const match = line.match(/^(\S+) \S+ \S+ \[([^\]]+)\] "(\w+) ([^"]+)" (\d+)/);
        if (match) {
          const [, ip, timestamp, method, path, status] = match;
          const success = status.startsWith('2');
          
          attempts.push({
            timestamp: new Date(timestamp).toISOString(),
            success: success,
            user: 'web-user',
            ip: ip,
            method: method.toLowerCase(),
            service: 'web',
            path: path
          });
        }
      }
    } catch (error) {
      console.error('Error reading web logs:', error);
    }
    
    return {
      attempts: attempts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      timestamp: new Date().toISOString(),
      total: attempts.length
    };
    
  } catch (error) {
    console.error('Error getting login attempts:', error);
    return {
      attempts: [],
      timestamp: new Date().toISOString(),
      total: 0,
      error: error.message
    };
  }
};

const scanVulnerabilities = async () => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    const vulnerabilities = [];
    
    // Check for outdated packages
    try {
      const { stdout: aptOutput } = await execPromise('apt list --upgradable 2>/dev/null | head -20');
      const lines = aptOutput.trim().split('\n').slice(1); // Skip header
      
      for (const line of lines) {
        const parts = line.split(' ');
        if (parts.length >= 2) {
          const packageName = parts[0].split('/')[0];
          const version = parts[1];
          
          vulnerabilities.push({
            package: packageName,
            version: version,
            severity: 'MEDIUM',
            type: 'Outdated Package',
            description: `Package ${packageName} has updates available`,
            solution: `Run: sudo apt update && sudo apt upgrade ${packageName}`
          });
        }
      }
    } catch (error) {
      console.error('Error checking packages:', error);
    }
    
    // Check for security-specific vulnerabilities
    try {
      // Check for weak SSH configuration
      const { stdout: sshConfig } = await execPromise('sudo grep -E "^(PermitRootLogin|PasswordAuthentication|PermitEmptyPasswords)" /etc/ssh/sshd_config 2>/dev/null || echo ""');
      
      if (sshConfig.includes('PermitRootLogin yes')) {
        vulnerabilities.push({
          package: 'openssh-server',
          version: 'config',
          severity: 'HIGH',
          type: 'SSH Security',
          description: 'Root login via SSH is enabled',
          solution: 'Set PermitRootLogin to no in /etc/ssh/sshd_config'
        });
      }
      
      if (sshConfig.includes('PasswordAuthentication yes')) {
        vulnerabilities.push({
          package: 'openssh-server',
          version: 'config',
          severity: 'MEDIUM',
          type: 'SSH Security',
          description: 'Password authentication is enabled',
          solution: 'Consider disabling password auth and using SSH keys only'
        });
      }
    } catch (error) {
      console.error('Error checking SSH config:', error);
    }
    
    // Check for firewall status
    try {
      const { stdout: ufwStatus } = await execPromise('sudo ufw status 2>/dev/null || echo "inactive"');
      
      if (ufwStatus.includes('inactive')) {
        vulnerabilities.push({
          package: 'ufw',
          version: 'system',
          severity: 'HIGH',
          type: 'Firewall',
          description: 'Firewall is not active',
          solution: 'Enable firewall: sudo ufw enable'
        });
      }
    } catch (error) {
      console.error('Error checking firewall:', error);
    }
    
    return {
      vulnerabilities: vulnerabilities,
      timestamp: new Date().toISOString(),
      total: vulnerabilities.length
    };
    
  } catch (error) {
    console.error('Error scanning vulnerabilities:', error);
    return {
      vulnerabilities: [],
      timestamp: new Date().toISOString(),
      total: 0,
      error: error.message
    };
  }
};

const getAuditLogs = async () => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    const logs = [];
    
    // Get system audit logs
    try {
      const { stdout: syslog } = await execPromise('sudo tail -n 50 /var/log/syslog 2>/dev/null | grep -E "(sudo|su |login|logout|session)" | tail -20');
      const lines = syslog.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const parts = line.split(' ');
        if (parts.length >= 5) {
          const timestamp = new Date(`${parts[0]} ${parts[1]} ${parts[2]}`);
          const hostname = parts[3];
          const process = parts[4];
          const message = parts.slice(5).join(' ');
          
          logs.push({
            timestamp: timestamp.toISOString(),
            hostname: hostname,
            process: process,
            message: message,
            type: 'system'
          });
        }
      }
    } catch (error) {
      console.error('Error reading syslog:', error);
    }
    
    return {
      logs: logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      timestamp: new Date().toISOString(),
      total: logs.length
    };
    
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return {
      logs: [],
      timestamp: new Date().toISOString(),
      total: 0,
      error: error.message
    };
  }
};

const getActiveSessions = async () => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    const sessions = [];
    
    // Get logged in users
    try {
      const { stdout: whoOutput } = await execPromise('who -u');
      const lines = whoOutput.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 6) {
          const user = parts[0];
          const terminal = parts[1];
          const loginTime = `${parts[2]} ${parts[3]}`;
          const idleTime = parts[4];
          const pid = parts[5];
          const from = parts[6] || 'local';
          
          sessions.push({
            user: user,
            terminal: terminal,
            loginTime: loginTime,
            idleTime: idleTime,
            pid: pid,
            from: from,
            type: 'console'
          });
        }
      }
    } catch (error) {
      console.error('Error getting user sessions:', error);
    }
    
    // Get SSH sessions
    try {
      const { stdout: sshSessions } = await execPromise('ps aux | grep "sshd:" | grep -v grep');
      const lines = sshSessions.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 11) {
          const user = parts[0];
          const pid = parts[1];
          const command = parts.slice(10).join(' ');
          
          if (command.includes('@pts')) {
            sessions.push({
              user: user,
              terminal: 'ssh',
              pid: pid,
              type: 'ssh',
              command: command
            });
          }
        }
      }
    } catch (error) {
      console.error('Error getting SSH sessions:', error);
    }
    
    return {
      sessions: sessions,
      timestamp: new Date().toISOString(),
      total: sessions.length
    };
    
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return {
      sessions: [],
      timestamp: new Date().toISOString(),
      total: 0,
      error: error.message
    };
  }
};

const getSSLCertificates = async () => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    const certificates = [];
    
    // Check common SSL certificate locations
    const certPaths = [
      '/etc/ssl/certs',
      '/etc/letsencrypt/live',
      '/etc/apache2/ssl',
      '/etc/nginx/ssl'
    ];
    
    for (const certPath of certPaths) {
      try {
        const { stdout: lsOutput } = await execPromise(`find ${certPath} -name "*.pem" -o -name "*.crt" -o -name "*.cert" 2>/dev/null | head -10`);
        const files = lsOutput.trim().split('\n').filter(f => f.trim());
        
        for (const file of files) {
          try {
            const { stdout: certInfo } = await execPromise(`openssl x509 -in "${file}" -text -noout 2>/dev/null | grep -E "(Subject:|Not After|Issuer)" | head -3`);
            
            if (certInfo.trim()) {
              const lines = certInfo.trim().split('\n');
              let subject = '', notAfter = '', issuer = '';
              
              for (const line of lines) {
                if (line.includes('Subject:')) subject = line.split('Subject:')[1]?.trim() || '';
                if (line.includes('Not After')) notAfter = line.split('Not After :')[1]?.trim() || '';
                if (line.includes('Issuer:')) issuer = line.split('Issuer:')[1]?.trim() || '';
              }
              
              certificates.push({
                path: file,
                subject: subject,
                issuer: issuer,
                expiryDate: notAfter,
                isExpired: notAfter ? new Date(notAfter) < new Date() : false
              });
            }
          } catch (certError) {
            // Skip invalid certificates
          }
        }
      } catch (error) {
        // Skip inaccessible paths
      }
    }
    
    return {
      certificates: certificates,
      timestamp: new Date().toISOString(),
      total: certificates.length
    };
    
  } catch (error) {
    console.error('Error getting SSL certificates:', error);
    return {
      certificates: [],
      timestamp: new Date().toISOString(),
      total: 0,
      error: error.message
    };
  }
};

const getFirewallStatus = async () => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    const status = {
      active: false,
      rules: [],
      defaultPolicy: 'unknown'
    };
    
    // Check UFW status
    try {
      const { stdout: ufwStatus } = await execPromise('sudo ufw status verbose 2>/dev/null');
      
      if (ufwStatus.includes('Status: active')) {
        status.active = true;
        
        // Parse default policies
        const lines = ufwStatus.split('\n');
        for (const line of lines) {
          if (line.includes('Default:')) {
            status.defaultPolicy = line.split('Default:')[1]?.trim() || 'unknown';
            break;
          }
        }
        
        // Count rules
        const ruleLines = lines.filter(line => 
          line.includes('ALLOW') || line.includes('DENY') || line.includes('REJECT')
        );
        status.rules = ruleLines.map(rule => rule.trim());
      }
    } catch (error) {
      console.error('Error checking UFW:', error);
    }
    
    return {
      ...status,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error getting firewall status:', error);
    return {
      active: false,
      rules: [],
      defaultPolicy: 'unknown',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

const getSecurityAlerts = async () => {
  try {
    const alerts = [];
    
    // Generate alerts based on security findings
    const loginAttempts = await getLoginAttempts();
    const vulnerabilities = await scanVulnerabilities();
    const firewallStatus = await getFirewallStatus();
    
    // Check for failed login attempts
    const failedLogins = loginAttempts.attempts.filter(a => !a.success);
    if (failedLogins.length > 5) {
      alerts.push({
        title: 'Multiple Failed Login Attempts',
        description: `${failedLogins.length} failed login attempts detected in recent logs`,
        severity: failedLogins.length > 10 ? 'CRITICAL' : 'HIGH',
        timestamp: new Date().toISOString(),
        type: 'authentication'
      });
    }
    
    // Check for critical vulnerabilities
    const criticalVulns = vulnerabilities.vulnerabilities.filter(v => v.severity === 'CRITICAL');
    if (criticalVulns.length > 0) {
      alerts.push({
        title: 'Critical Vulnerabilities Detected',
        description: `${criticalVulns.length} critical security vulnerabilities found`,
        severity: 'CRITICAL',
        timestamp: new Date().toISOString(),
        type: 'vulnerability'
      });
    }
    
    // Check firewall status
    if (!firewallStatus.active) {
      alerts.push({
        title: 'Firewall Not Active',
        description: 'System firewall is not currently active, leaving server exposed',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        type: 'firewall'
      });
    }
    
    return {
      alerts: alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      timestamp: new Date().toISOString(),
      total: alerts.length
    };
    
  } catch (error) {
    console.error('Error generating security alerts:', error);
    return {
      alerts: [],
      timestamp: new Date().toISOString(),
      total: 0,
      error: error.message
    };
  }
};

// Security Center API endpoints
app.get('/api/security/login-attempts', async (req, res) => {
  try {
    const data = await getLoginAttempts();
    res.json(data);
  } catch (error) {
    console.error('Login attempts error:', error);
    res.status(500).json({ error: 'Failed to get login attempts' });
  }
});

app.get('/api/security/vulnerabilities', async (req, res) => {
  try {
    const data = await scanVulnerabilities();
    res.json(data);
  } catch (error) {
    console.error('Vulnerabilities error:', error);
    res.status(500).json({ error: 'Failed to scan vulnerabilities' });
  }
});

app.post('/api/security/scan-vulnerabilities', async (req, res) => {
  try {
    const data = await scanVulnerabilities();
    res.json(data);
  } catch (error) {
    console.error('Vulnerability scan error:', error);
    res.status(500).json({ error: 'Failed to scan vulnerabilities' });
  }
});

app.get('/api/security/audit-logs', async (req, res) => {
  try {
    const data = await getAuditLogs();
    res.json(data);
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

app.get('/api/security/active-sessions', async (req, res) => {
  try {
    const data = await getActiveSessions();
    res.json(data);
  } catch (error) {
    console.error('Active sessions error:', error);
    res.status(500).json({ error: 'Failed to get active sessions' });
  }
});

app.get('/api/security/ssl-certificates', async (req, res) => {
  try {
    const data = await getSSLCertificates();
    res.json(data);
  } catch (error) {
    console.error('SSL certificates error:', error);
    res.status(500).json({ error: 'Failed to get SSL certificates' });
  }
});

app.get('/api/security/firewall-status', async (req, res) => {
  try {
    const data = await getFirewallStatus();
    res.json(data);
  } catch (error) {
    console.error('Firewall status error:', error);
    res.status(500).json({ error: 'Failed to get firewall status' });
  }
});

app.get('/api/security/alerts', async (req, res) => {
  try {
    const data = await getSecurityAlerts();
    res.json(data);
  } catch (error) {
    console.error('Security alerts error:', error);
    res.status(500).json({ error: 'Failed to get security alerts' });
  }
});

// Port management API endpoints
app.get('/api/ports', async (req, res) => {
  try {
    const portsInfo = await getPortsInfo();
    res.json(portsInfo);
  } catch (error) {
    console.error('Ports info error:', error);
    res.status(500).json({ error: 'Failed to get ports information' });
  }
});

app.post('/api/ports/scan', async (req, res) => {
  try {
    const { startPort = 1, endPort = 1000 } = req.body;
    const scanResults = await scanPorts(startPort, endPort);
    res.json(scanResults);
  } catch (error) {
    console.error('Port scan error:', error);
    res.status(500).json({ error: 'Failed to scan ports' });
  }
});

app.get('/api/firewall', async (req, res) => {
  try {
    const firewallInfo = await getFirewallRules();
    res.json(firewallInfo);
  } catch (error) {
    console.error('Firewall info error:', error);
    res.status(500).json({ error: 'Failed to get firewall information' });
  }
});

app.post('/api/firewall/manage', async (req, res) => {
  try {
    const { port, action } = req.body;
    
    if (!port || !action) {
      return res.status(400).json({ 
        success: false, 
        error: 'Port and action are required' 
      });
    }
    
    const result = await manageFirewallPort(port, action);
    res.json(result);
  } catch (error) {
    console.error('Firewall management error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to manage firewall rule' 
    });
  }
});

// =============================================
// LOG MANAGEMENT APIS
// =============================================

// Get available log sources
const getLogSources = async () => {
  try {
    const sources = [];
    
    // System logs
    const systemLogs = [
      { id: 'syslog', name: 'System Log', path: '/var/log/syslog', type: 'system' },
      { id: 'auth', name: 'Authentication Log', path: '/var/log/auth.log', type: 'security' },
      { id: 'kern', name: 'Kernel Log', path: '/var/log/kern.log', type: 'system' },
      { id: 'daemon', name: 'Daemon Log', path: '/var/log/daemon.log', type: 'system' },
      { id: 'boot', name: 'Boot Log', path: '/var/log/boot.log', type: 'system' },
    ];

    // Web server logs
    const webLogs = [
      { id: 'nginx-access', name: 'Nginx Access Log', path: '/var/log/nginx/access.log', type: 'web' },
      { id: 'nginx-error', name: 'Nginx Error Log', path: '/var/log/nginx/error.log', type: 'web' },
      { id: 'apache-access', name: 'Apache Access Log', path: '/var/log/apache2/access.log', type: 'web' },
      { id: 'apache-error', name: 'Apache Error Log', path: '/var/log/apache2/error.log', type: 'web' },
    ];

    // Application logs
    const appLogs = [
      { id: 'mysql-error', name: 'MySQL Error Log', path: '/var/log/mysql/error.log', type: 'database' },
      { id: 'postgresql', name: 'PostgreSQL Log', path: '/var/log/postgresql/postgresql-*.log', type: 'database' },
      { id: 'redis', name: 'Redis Log', path: '/var/log/redis/redis-server.log', type: 'database' },
    ];

    // Check which log files exist
    for (const logGroup of [systemLogs, webLogs, appLogs]) {
      for (const log of logGroup) {
        try {
          if (log.path.includes('*')) {
            // Handle wildcard paths
            const dirPath = path.dirname(log.path);
            const pattern = path.basename(log.path);
            try {
              const files = await fs.readdir(dirPath);
              const matchingFiles = files.filter(f => f.match(pattern.replace('*', '.*')));
              if (matchingFiles.length > 0) {
                log.path = path.join(dirPath, matchingFiles[0]);
                sources.push(log);
              }
            } catch (err) {
              // Directory doesn't exist, skip
            }
          } else {
            await fs.access(log.path);
            const stats = await fs.stat(log.path);
            log.size = stats.size;
            log.modified = stats.mtime;
            sources.push(log);
          }
        } catch (err) {
          // File doesn't exist or no permission, skip
        }
      }
    }

    return sources;
  } catch (error) {
    console.error('Error getting log sources:', error);
    return [];
  }
};

// Read log file with pagination
const readLogFile = async (filePath, lines = 100, offset = 0) => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    // Try to get file stats with sudo if needed
    let stats;
    try {
      stats = await fs.stat(filePath);
    } catch (error) {
      // Try with sudo to get stats
      try {
        const { stdout: lsOutput } = await execPromise(`sudo ls -la "${filePath}"`);
        const parts = lsOutput.trim().split(/\s+/);
        stats = {
          size: parseInt(parts[4]) || 0,
          mtime: new Date()
        };
      } catch (sudoError) {
        throw new Error(`Cannot access file: ${error.message}`);
      }
    }
    
    let command;
    if (offset > 0) {
      // Read from specific offset with sudo
      command = `sudo tail -n +${offset + 1} "${filePath}" | head -n ${lines}`;
    } else {
      // Read last N lines with sudo
      command = `sudo tail -n ${lines} "${filePath}"`;
    }
    
    try {
      const { stdout } = await execPromise(command);
      const logLines = stdout.trim().split('\n').filter(line => line.trim());
      
      return {
        lines: logLines,
        totalSize: stats.size,
        totalLines: await countLinesWithSudo(filePath),
        timestamp: new Date().toISOString()
      };
    } catch (tailError) {
      // If sudo tail fails, try without sudo as fallback
      try {
        let fallbackCommand;
        if (offset > 0) {
          fallbackCommand = `tail -n +${offset + 1} "${filePath}" | head -n ${lines}`;
        } else {
          fallbackCommand = `tail -n ${lines} "${filePath}"`;
        }
        
        const { stdout } = await execPromise(fallbackCommand);
        const logLines = stdout.trim().split('\n').filter(line => line.trim());
        
        return {
          lines: logLines,
          totalSize: stats.size,
          totalLines: await countLines(filePath),
          timestamp: new Date().toISOString()
        };
      } catch (fallbackError) {
        throw new Error(`Permission denied: ${tailError.message}`);
      }
    }
  } catch (error) {
    throw new Error(`Error reading log file: ${error.message}`);
  }
};

// Count total lines in file
const countLines = async (filePath) => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    const { stdout } = await execPromise(`wc -l < "${filePath}"`);
    return parseInt(stdout.trim()) || 0;
  } catch (error) {
    return 0;
  }
};

// Count total lines in file with sudo access
const countLinesWithSudo = async (filePath) => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    // Try without sudo first
    try {
      const { stdout } = await execPromise(`wc -l < "${filePath}"`);
      return parseInt(stdout.trim()) || 0;
    } catch (error) {
      // Try with sudo
      const { stdout } = await execPromise(`sudo wc -l < "${filePath}"`);
      return parseInt(stdout.trim()) || 0;
    }
  } catch (error) {
    return 0;
  }
};

// Search logs with filters
const searchLogs = async (filePath, query, options = {}) => {
  try {
    const { 
      lines = 100, 
      level = null, 
      startDate = null, 
      endDate = null,
      caseSensitive = false 
    } = options;
    
    let grepCommand = `sudo grep`;
    if (!caseSensitive) grepCommand += ` -i`;
    
    let command = `${grepCommand} "${query}" "${filePath}"`;
    
    // Add date filtering if specified
    if (startDate || endDate) {
      if (startDate) command += ` | grep -E "${startDate}"`;
      if (endDate) command += ` | grep -E "${endDate}"`;
    }
    
    // Add log level filtering
    if (level) {
      command += ` | grep -i "${level}"`;
    }
    
    command += ` | tail -n ${lines}`;
    
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    try {
      const { stdout } = await execPromise(command);
      const results = stdout.trim().split('\n').filter(line => line.trim());
      
      return {
        results,
        query,
        totalMatches: results.length,
        timestamp: new Date().toISOString()
      };
    } catch (sudoError) {
      // Try without sudo as fallback
      const fallbackCommand = command.replace('sudo grep', 'grep');
      try {
        const { stdout } = await execPromise(fallbackCommand);
        const results = stdout.trim().split('\n').filter(line => line.trim());
        
        return {
          results,
          query,
          totalMatches: results.length,
          timestamp: new Date().toISOString()
        };
      } catch (fallbackError) {
        return {
          results: [],
          query,
          totalMatches: 0,
          error: `Permission denied: ${sudoError.message}`,
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (error) {
    return {
      results: [],
      query,
      totalMatches: 0,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// API Endpoints for Log Management
app.get('/api/logs/sources', authenticateToken, async (req, res) => {
  try {
    const sources = await getLogSources();
    res.json({
      success: true,
      sources,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting log sources:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/logs/:sourceId', authenticateToken, async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { lines = 100, offset = 0 } = req.query;
    
    // Get log sources to find the file path
    const sources = await getLogSources();
    const source = sources.find(s => s.id === sourceId);
    
    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Log source not found'
      });
    }
    
    const logData = await readLogFile(source.path, parseInt(lines), parseInt(offset));
    
    res.json({
      success: true,
      source: source,
      data: logData
    });
  } catch (error) {
    console.error('Error reading log:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/logs/search', authenticateToken, async (req, res) => {
  try {
    const { sourceId, query, options = {} } = req.body;
    
    if (!sourceId || !query) {
      return res.status(400).json({
        success: false,
        error: 'Source ID and query are required'
      });
    }
    
    // Get log sources to find the file path
    const sources = await getLogSources();
    const source = sources.find(s => s.id === sourceId);
    
    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Log source not found'
      });
    }
    
    const searchResults = await searchLogs(source.path, query, options);
    
    res.json({
      success: true,
      source: source,
      search: searchResults
    });
  } catch (error) {
    console.error('Error searching logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// WebSocket endpoint for real-time log streaming
app.get('/api/logs/:sourceId/stream', (req, res) => {
  try {
    // Check authentication via token query parameter (since EventSource can't send headers)
    const token = req.query.token;
    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Verify the token manually
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
      }

      const { sourceId } = req.params;
      
      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });
      
      // Get log sources to find the file path
      getLogSources().then(sources => {
        const source = sources.find(s => s.id === sourceId);
        
        if (!source) {
          res.write(`data: ${JSON.stringify({ error: 'Log source not found' })}\n\n`);
          res.end();
          return;
        }
         // Send initial connection success message
        res.write(`data: ${JSON.stringify({ 
          status: 'connected',
          message: `Starting to stream logs from ${source.name}`,
          timestamp: new Date().toISOString()
        })}\n\n`);
        
        // Use tail -f to follow the log file with sudo if needed
        const tailProcess = spawn('sudo', ['tail', '-f', source.path]);
      
        tailProcess.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            res.write(`data: ${JSON.stringify({ 
              line: line,
              timestamp: new Date().toISOString(),
              source: sourceId
            })}\n\n`);
          }
        }
      });        tailProcess.stderr.on('data', (data) => {
          console.error('Tail process error:', data.toString());
          res.write(`data: ${JSON.stringify({ 
            error: `Stream error: ${data.toString()}`,
            timestamp: new Date().toISOString()
          })}\n\n`);
        });
        
        tailProcess.on('error', (error) => {
          console.error('Failed to start tail process:', error);
          res.write(`data: ${JSON.stringify({ 
            error: `Failed to start log streaming: ${error.message}`,
            timestamp: new Date().toISOString()
          })}\n\n`);
          res.end();
        });
      
      // Clean up on client disconnect
      req.on('close', () => {
        tailProcess.kill();
      });
      
      req.on('end', () => {
        tailProcess.kill();
      });
      
    }).catch(error => {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    });
    
    }); // Close jwt.verify callback
    
  } catch (error) {
    console.error('Error setting up log stream:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('🚀 Log Management APIs loaded:');
console.log('   📋 GET /api/logs/sources - Get available log sources');
console.log('   📄 GET /api/logs/:sourceId - Read log file with pagination'); 
console.log('   🔍 POST /api/logs/search - Search logs with filters');
console.log('   📡 GET /api/logs/:sourceId/stream - Real-time log streaming');

// ============================
// SYSTEM PERFORMANCE MONITOR
// ============================

// Enhanced performance monitoring functions
const getEnhancedPerformanceData = async () => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    // Get system load average
    const { stdout: loadAvgOutput } = await execPromise('cat /proc/loadavg');
    const loadParts = loadAvgOutput.trim().split(' ');
    const [load1, load5, load15, runningTotal] = loadParts;
    const [running, total] = runningTotal.split('/');
    
    // Get CPU cores count
    const { stdout: cpuInfoOutput } = await execPromise('nproc');
    const cpuCores = parseInt(cpuInfoOutput.trim());
    
    // Get memory information
    const { stdout: memInfoOutput } = await execPromise('cat /proc/meminfo');
    const memInfo = {};
    memInfoOutput.split('\n').forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        memInfo[key.trim()] = parseInt(value.trim().split(' ')[0]) * 1024; // Convert kB to bytes
      }
    });
    
    // Get disk I/O stats
    const { stdout: diskStatsOutput } = await execPromise('cat /proc/diskstats | grep -E "(nvme|sda|hda|vda)" | head -1');
    let diskReadRate = 0, diskWriteRate = 0;
    if (diskStatsOutput.trim()) {
      const diskParts = diskStatsOutput.trim().split(/\s+/);
      if (diskParts.length >= 14) {
        diskReadRate = parseInt(diskParts[5]) * 512; // sectors to bytes
        diskWriteRate = parseInt(diskParts[9]) * 512; // sectors to bytes
      }
    }
    
    // Get network stats
    const { stdout: netStatsOutput } = await execPromise('cat /proc/net/dev | grep -E "(eth0|wlan0|enp|wlp)" | head -1');
    let networkDownload = 0, networkUpload = 0, totalBandwidth = 0, connections = 0;
    if (netStatsOutput.trim()) {
      const netParts = netStatsOutput.trim().split(/\s+/);
      if (netParts.length >= 10) {
        networkDownload = parseInt(netParts[1]);
        networkUpload = parseInt(netParts[9]);
        totalBandwidth = networkDownload + networkUpload;
      }
    }
    
    // Get active connections count
    try {
      const { stdout: connectionsOutput } = await execPromise('netstat -an | grep ESTABLISHED | wc -l');
      connections = parseInt(connectionsOutput.trim()) || 0;
    } catch (err) {
      connections = 0;
    }
    
    // Get CPU temperature
    let temperature = 0, maxTemp = 100;
    try {
      const { stdout: tempOutput } = await execPromise("sensors | grep 'Core 0' | awk '{print $3}' | sed 's/+//g' | sed 's/°C//g'");
      if (tempOutput.trim()) {
        temperature = parseFloat(tempOutput.trim()) || 0;
      } else {
        // Fallback to thermal zone
        const { stdout: thermalOutput } = await execPromise('cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo "0"');
        temperature = parseInt(thermalOutput.trim()) / 1000;
      }
    } catch (err) {
      temperature = 0;
    }
    
    // Get uptime
    const { stdout: uptimeOutput } = await execPromise('cat /proc/uptime');
    const uptime = parseFloat(uptimeOutput.split(' ')[0]);
    
    // Use current metrics from existing system
    const cpuUsage = currentMetrics.cpu || 0;
    const memoryUsed = memInfo.MemTotal - memInfo.MemAvailable;
    const memoryPercentUsed = (memoryUsed / memInfo.MemTotal) * 100;
    
    return {
      cpu: {
        usage: cpuUsage,
        cores: cpuCores,
        trend: 0 // Could be calculated from historical data
      },
      memory: {
        total: memInfo.MemTotal,
        used: memoryUsed,
        available: memInfo.MemAvailable,
        percentUsed: memoryPercentUsed,
        cached: memInfo.Cached || 0,
        buffers: memInfo.Buffers || 0
      },
      disk: {
        usage: currentMetrics.disk?.percentage || 0,
        readRate: diskReadRate,
        writeRate: diskWriteRate
      },
      network: {
        download: networkDownload,
        upload: networkUpload,
        totalBandwidth: totalBandwidth,
        connections: connections
      },
      temperature: {
        current: temperature,
        max: maxTemp
      },
      loadAverage: {
        load1: parseFloat(load1),
        load5: parseFloat(load5),
        load15: parseFloat(load15),
        current: parseFloat(load1),
        runningProcesses: parseInt(running),
        totalProcesses: parseInt(total)
      },
      uptime: uptime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error getting enhanced performance data:', error);
    return {
      cpu: { usage: 0, cores: 1, trend: 0 },
      memory: { total: 0, used: 0, available: 0, percentUsed: 0, cached: 0, buffers: 0 },
      disk: { usage: 0, readRate: 0, writeRate: 0 },
      network: { download: 0, upload: 0, totalBandwidth: 0, connections: 0 },
      temperature: { current: 0, max: 100 },
      loadAverage: { load1: 0, load5: 0, load15: 0, current: 0, runningProcesses: 0, totalProcesses: 0 },
      uptime: 0,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

// Get detailed process information
const getDetailedProcessInfo = async () => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    // Get detailed process information
    const { stdout: psOutput } = await execPromise('ps aux --sort=-%cpu | head -51'); // Get top 50 processes
    const lines = psOutput.trim().split('\n').slice(1); // Skip header
    
    const processes = lines.map(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 11) {
        return {
          user: parts[0],
          pid: parseInt(parts[1]),
          cpu: parseFloat(parts[2]),
          memory: parseFloat(parts[3]),
          vsz: parseInt(parts[4]), // Virtual memory size
          rss: parseInt(parts[5]), // Resident set size
          tty: parts[6],
          status: parts[7],
          start: parts[8],
          time: parts[9],
          name: parts.slice(10).join(' ').substring(0, 50) // Limit name length
        };
      }
      return null;
    }).filter(proc => proc !== null);
    
    return {
      processes: processes,
      total: processes.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error getting detailed process info:', error);
    return {
      processes: [],
      total: 0,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

// Kill process function
const killProcessById = async (pid, signal = 'TERM') => {
  try {
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    // Validate PID
    if (!pid || isNaN(pid) || pid <= 0) {
      throw new Error('Invalid process ID');
    }
    
    // Check if process exists
    try {
      await execPromise(`kill -0 ${pid}`);
    } catch (err) {
      throw new Error('Process not found or no permission');
    }
    
    // Kill the process
    await execPromise(`kill -${signal} ${pid}`);
    
    // Verify process was terminated (wait a bit then check)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      await execPromise(`kill -0 ${pid}`);
      // Process still exists, might need SIGKILL
      if (signal === 'TERM') {
        await execPromise(`kill -KILL ${pid}`);
      }
    } catch (err) {
      // Process doesn't exist anymore, good
    }
    
    return {
      success: true,
      message: `Process ${pid} terminated successfully`,
      pid: pid,
      signal: signal
    };
    
  } catch (error) {
    console.error('Error killing process:', error);
    return {
      success: false,
      error: error.message,
      pid: pid,
      signal: signal
    };
  }
};

// System Performance Monitor API endpoints
app.get('/api/performance/overview', authenticateToken, async (req, res) => {
  try {
    const performanceData = await getEnhancedPerformanceData();
    res.json(performanceData);
  } catch (error) {
    console.error('Performance overview error:', error);
    res.status(500).json({ error: 'Failed to get performance data' });
  }
});

app.get('/api/performance/processes', authenticateToken, async (req, res) => {
  try {
    const processData = await getDetailedProcessInfo();
    res.json(processData);
  } catch (error) {
    console.error('Performance processes error:', error);
    res.status(500).json({ error: 'Failed to get process data' });
  }
});

app.post('/api/performance/processes/kill', authenticateToken, async (req, res) => {
  try {
    const { pid, signal = 'TERM' } = req.body;
    
    if (!pid) {
      return res.status(400).json({ error: 'Process ID is required' });
    }
    
    const result = await killProcessById(pid, signal);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Kill process error:', error);
    res.status(500).json({ error: 'Failed to kill process' });
  }
});

console.log('⚡ System Performance Monitor APIs loaded:');
console.log('   📊 GET /api/performance/overview - Enhanced performance metrics');
console.log('   🔧 GET /api/performance/processes - Detailed process information');
console.log('   ⚠️  POST /api/performance/processes/kill - Terminate processes');

// ============================
// DOCKER CONTAINER MANAGER
// ============================

// Initialize Docker client
const docker = new Docker();

// Docker Container Management Functions
const getDockerContainers = async () => {
  try {
    const containers = await docker.listContainers({ all: true });
    const containerInfo = [];

    for (const container of containers) {
      const containerDetail = docker.getContainer(container.Id);
      const inspect = await containerDetail.inspect();
      
      // Get container stats if running
      let stats = null;
      if (container.State === 'running') {
        try {
          const statsStream = await containerDetail.stats({ stream: false });
          stats = {
            cpuUsage: calculateCpuPercent(statsStream),
            memoryUsage: formatBytes(statsStream.memory_stats.usage || 0),
            memoryLimit: formatBytes(statsStream.memory_stats.limit || 0),
            memoryPercent: statsStream.memory_stats.usage && statsStream.memory_stats.limit 
              ? ((statsStream.memory_stats.usage / statsStream.memory_stats.limit) * 100).toFixed(2)
              : 0,
            networkRx: formatBytes(statsStream.networks?.eth0?.rx_bytes || 0),
            networkTx: formatBytes(statsStream.networks?.eth0?.tx_bytes || 0)
          };
        } catch (statsError) {
          console.log('Stats error for container', container.Names[0], ':', statsError.message);
        }
      }

      containerInfo.push({
        id: container.Id.substring(0, 12),
        fullId: container.Id,
        name: container.Names[0].replace('/', ''),
        image: container.Image,
        imageId: container.ImageID.substring(7, 19),
        command: container.Command,
        created: new Date(container.Created * 1000).toISOString(),
        status: container.Status,
        state: container.State,
        ports: container.Ports.map(port => ({
          privatePort: port.PrivatePort,
          publicPort: port.PublicPort || null,
          type: port.Type,
          ip: port.IP || '0.0.0.0'
        })),
        mounts: inspect.Mounts.map(mount => ({
          source: mount.Source,
          destination: mount.Destination,
          mode: mount.Mode,
          type: mount.Type
        })),
        networks: Object.keys(inspect.NetworkSettings.Networks),
        env: inspect.Config.Env,
        stats: stats,
        restartCount: inspect.RestartCount,
        platform: inspect.Platform
      });
    }

    return {
      containers: containerInfo,
      total: containerInfo.length,
      running: containerInfo.filter(c => c.state === 'running').length,
      stopped: containerInfo.filter(c => c.state === 'exited').length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting Docker containers:', error);
    return {
      containers: [],
      total: 0,
      running: 0,
      stopped: 0,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

const getDockerImages = async () => {
  try {
    const images = await docker.listImages();
    const imageInfo = images.map(image => ({
      id: image.Id.substring(7, 19),
      fullId: image.Id,
      repoTags: image.RepoTags || ['<none>:<none>'],
      created: new Date(image.Created * 1000).toISOString(),
      size: formatBytes(image.Size),
      virtualSize: formatBytes(image.VirtualSize)
    }));

    return {
      images: imageInfo,
      total: imageInfo.length,
      totalSize: formatBytes(images.reduce((sum, img) => sum + img.Size, 0)),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting Docker images:', error);
    return {
      images: [],
      total: 0,
      totalSize: '0B',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

const getDockerSystemInfo = async () => {
  try {
    const systemInfo = await docker.info();
    const version = await docker.version();
    
    return {
      info: {
        containers: systemInfo.Containers,
        containersRunning: systemInfo.ContainersRunning,
        containersPaused: systemInfo.ContainersPaused,
        containersStopped: systemInfo.ContainersStopped,
        images: systemInfo.Images,
        driver: systemInfo.Driver,
        storageDriver: systemInfo.StorageDriver,
        loggingDriver: systemInfo.LoggingDriver,
        cpus: systemInfo.NCPU,
        memTotal: formatBytes(systemInfo.MemTotal),
        serverVersion: systemInfo.ServerVersion,
        kernelVersion: systemInfo.KernelVersion,
        operatingSystem: systemInfo.OperatingSystem,
        architecture: systemInfo.Architecture
      },
      version: {
        version: version.Version,
        apiVersion: version.ApiVersion,
        minApiVersion: version.MinAPIVersion,
        gitCommit: version.GitCommit,
        goVersion: version.GoVersion,
        os: version.Os,
        arch: version.Arch,
        buildTime: version.BuildTime
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting Docker system info:', error);
    return {
      info: null,
      version: null,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

const manageContainer = async (containerId, action) => {
  try {
    const container = docker.getContainer(containerId);
    let result = {};

    switch (action) {
      case 'start':
        await container.start();
        result = { success: true, message: `Container ${containerId} started successfully` };
        break;
      case 'stop':
        await container.stop();
        result = { success: true, message: `Container ${containerId} stopped successfully` };
        break;
      case 'restart':
        await container.restart();
        result = { success: true, message: `Container ${containerId} restarted successfully` };
        break;
      case 'pause':
        await container.pause();
        result = { success: true, message: `Container ${containerId} paused successfully` };
        break;
      case 'unpause':
        await container.unpause();
        result = { success: true, message: `Container ${containerId} unpaused successfully` };
        break;
      case 'remove':
        await container.remove({ force: true });
        result = { success: true, message: `Container ${containerId} removed successfully` };
        break;
      default:
        result = { success: false, error: 'Invalid action specified' };
    }

    return result;
  } catch (error) {
    console.error(`Error ${action} container ${containerId}:`, error);
    return {
      success: false,
      error: `Failed to ${action} container: ${error.message}`
    };
  }
};

const getContainerLogs = async (containerId, tail = 100) => {
  try {
    const container = docker.getContainer(containerId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: tail,
      timestamps: true
    });

    // Convert buffer to string and clean it up
    const logString = logs.toString('utf8');
    const cleanLogs = logString
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Remove Docker log prefixes (first 8 bytes)
        return line.length > 8 ? line.substring(8) : line;
      })
      .join('\n');

    return {
      success: true,
      logs: cleanLogs,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error getting logs for container ${containerId}:`, error);
    return {
      success: false,
      error: error.message,
      logs: '',
      timestamp: new Date().toISOString()
    };
  }
};

const pullDockerImage = async (imageName) => {
  try {
    return new Promise((resolve, reject) => {
      docker.pull(imageName, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        let output = '';
        stream.on('data', (chunk) => {
          const data = chunk.toString();
          output += data;
        });

        stream.on('end', () => {
          resolve({
            success: true,
            message: `Successfully pulled image ${imageName}`,
            output: output
          });
        });

        stream.on('error', (error) => {
          reject(error);
        });
      });
    });
  } catch (error) {
    console.error(`Error pulling image ${imageName}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

const removeDockerImage = async (imageId) => {
  try {
    const image = docker.getImage(imageId);
    await image.remove({ force: true });
    
    return {
      success: true,
      message: `Image ${imageId} removed successfully`
    };
  } catch (error) {
    console.error(`Error removing image ${imageId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

const createAndRunContainer = async (options) => {
  try {
    const {
      image,
      name,
      ports = {},
      environment = [],
      volumes = [],
      command = null,
      workingDir = null,
      restartPolicy = 'unless-stopped'
    } = options;

    const createOptions = {
      Image: image,
      name: name,
      Env: environment,
      WorkingDir: workingDir,
      HostConfig: {
        PortBindings: {},
        Binds: volumes,
        RestartPolicy: { Name: restartPolicy }
      }
    };

    // Add command if specified
    if (command) {
      createOptions.Cmd = command.split(' ');
    }

    // Configure port bindings
    Object.keys(ports).forEach(containerPort => {
      const hostPort = ports[containerPort];
      createOptions.HostConfig.PortBindings[`${containerPort}/tcp`] = [{ HostPort: hostPort.toString() }];
    });

    const container = await docker.createContainer(createOptions);
    await container.start();

    return {
      success: true,
      containerId: container.id,
      message: `Container ${name} created and started successfully`
    };
  } catch (error) {
    console.error('Error creating container:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper functions
const calculateCpuPercent = (stats) => {
  if (!stats.cpu_stats || !stats.precpu_stats) return 0;
  
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemCpuDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const numberCpus = stats.cpu_stats.online_cpus || 1;
  
  if (systemCpuDelta > 0 && cpuDelta > 0) {
    return ((cpuDelta / systemCpuDelta) * numberCpus * 100).toFixed(2);
  }
  return 0;
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i];
};

// Docker API Endpoints
app.get('/api/docker/containers', async (req, res) => {
  try {
    const containerData = await getDockerContainers();
    res.json(containerData);
  } catch (error) {
    console.error('Docker containers API error:', error);
    res.status(500).json({ error: 'Failed to get Docker containers' });
  }
});

app.get('/api/docker/images', async (req, res) => {
  try {
    const imageData = await getDockerImages();
    res.json(imageData);
  } catch (error) {
    console.error('Docker images API error:', error);
    res.status(500).json({ error: 'Failed to get Docker images' });
  }
});

app.get('/api/docker/system/info', async (req, res) => {
  try {
    const systemData = await getDockerSystemInfo();
    res.json(systemData);
  } catch (error) {
    console.error('Docker system info API error:', error);
    res.status(500).json({ error: 'Failed to get Docker system info' });
  }
});

app.post('/api/docker/containers/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    const result = await manageContainer(id, action);
    res.json(result);
  } catch (error) {
    console.error('Docker container management API error:', error);
    res.status(500).json({ error: 'Failed to manage container' });
  }
});

app.get('/api/docker/containers/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const tail = req.query.tail || 100;
    const result = await getContainerLogs(id, parseInt(tail));
    res.json(result);
  } catch (error) {
    console.error('Docker container logs API error:', error);
    res.status(500).json({ error: 'Failed to get container logs' });
  }
});

app.post('/api/docker/images/pull', async (req, res) => {
  try {
    const { imageName } = req.body;
    if (!imageName) {
      return res.status(400).json({ error: 'Image name is required' });
    }
    const result = await pullDockerImage(imageName);
    res.json(result);
  } catch (error) {
    console.error('Docker image pull API error:', error);
    res.status(500).json({ error: 'Failed to pull Docker image' });
  }
});

app.delete('/api/docker/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await removeDockerImage(id);
    res.json(result);
  } catch (error) {
    console.error('Docker image removal API error:', error);
    res.status(500).json({ error: 'Failed to remove Docker image' });
  }
});

app.post('/api/docker/containers/run', async (req, res) => {
  try {
    const options = req.body;
    const result = await createAndRunContainer(options);
    res.json(result);
  } catch (error) {
    console.error('Docker container creation API error:', error);
    res.status(500).json({ error: 'Failed to create and run container' });
  }
});

// ============================
// AUTHENTICATION ROUTES
// ============================

// Function to validate system user credentials using PAM-like approach
const validateSystemUser = async (username, password) => {
  return new Promise((resolve) => {
    try {
      // Check if user exists in system
      exec(`id -u ${username}`, (error, stdout, stderr) => {
        if (error) {
          console.log(`❌ User ${username} does not exist in system`);
          resolve({ success: false, error: 'User not found in system' });
          return;
        }

        // Use su command to validate password
        const childProcess = spawn('su', ['-c', 'whoami', username], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        childProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        childProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        childProcess.on('close', (code) => {
          if (code === 0 && output.trim() === username) {
            console.log(`✅ System authentication successful for user: ${username}`);
            resolve({ 
              success: true, 
              user: {
                username: username,
                role: username === 'root' ? 'superadmin' : 'admin',
                source: 'system'
              }
            });
          } else {
            console.log(`❌ System authentication failed for user: ${username}`);
            resolve({ success: false, error: 'Invalid system credentials' });
          }
        });

        childProcess.on('error', (err) => {
          console.error('❌ System auth process error:', err);
          resolve({ success: false, error: 'System authentication error' });
        });

        // Send password to stdin
        childProcess.stdin.write(password + '\n');
        childProcess.stdin.end();

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!childProcess.killed) {
            childProcess.kill();
            resolve({ success: false, error: 'Authentication timeout' });
          }
        }, 5000);
      });
    } catch (error) {
      console.error('❌ System validation error:', error);
      resolve({ success: false, error: 'System validation failed' });
    }
  });
};

// Alternative system authentication using expect-like approach
const validateSystemUserAlternative = async (username, password) => {
  return new Promise((resolve) => {
    try {
      // First check if user exists
      exec(`getent passwd ${username}`, (error, stdout, stderr) => {
        if (error) {
          console.log(`❌ User ${username} not found in system`);
          resolve({ success: false, error: 'User not found in system' });
          return;
        }

        // Create a temporary script for authentication
        const tempScript = `/tmp/auth_${Date.now()}.sh`;
        const scriptContent = `#!/bin/bash
echo "${password}" | su ${username} -c "whoami" 2>/dev/null
echo "EXIT_CODE:$?"
`;

        require('fs').writeFileSync(tempScript, scriptContent, { mode: 0o700 });

        exec(`bash ${tempScript}`, (execError, execStdout, execStderr) => {
          // Clean up temp script
          try {
            require('fs').unlinkSync(tempScript);
          } catch (cleanupError) {
            console.warn('Warning: Could not clean up temp script');
          }

          if (execStdout.includes(`${username}`) && execStdout.includes('EXIT_CODE:0')) {
            console.log(`✅ System authentication successful for: ${username}`);
            resolve({ 
              success: true, 
              user: {
                username: username,
                role: username === 'root' ? 'superadmin' : 'admin',
                source: 'system',
                fullName: execStdout.split(':')[4] || username
              }
            });
          } else {
            console.log(`❌ System authentication failed for: ${username}`);
            resolve({ success: false, error: 'Invalid system credentials' });
          }
        });
      });
    } catch (error) {
      console.error('❌ Alternative system validation error:', error);
      resolve({ success: false, error: 'System validation failed' });
    }
  });
};

// Login endpoint with both system and fallback authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, authType = 'auto' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    console.log(`🔐 Login attempt for user: ${username} (authType: ${authType})`);

    let authResult = { success: false };

    // Try system authentication first (if not explicitly disabled)
    if (authType === 'auto' || authType === 'system') {
      console.log(`🔍 Attempting system authentication for: ${username}`);
      authResult = await validateSystemUserAlternative(username, password);
      
      if (authResult.success) {
        console.log(`✅ System authentication successful for: ${username}`);
        
        // Generate JWT token for system user
        const token = jwt.sign(
          { 
            id: `system_${username}`,
            username: authResult.user.username,
            role: authResult.user.role,
            source: 'system'
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          token,
          user: authResult.user,
          message: `Welcome ${username}! Authenticated via system account.`
        });
      } else {
        console.log(`❌ System authentication failed: ${authResult.error}`);
      }
    }

    // Fallback to traditional authentication if system auth fails or is disabled
    if ((authType === 'auto' && !authResult.success) || authType === 'traditional') {
      console.log(`🔍 Attempting traditional authentication for: ${username}`);
      
      const user = ADMIN_USERS.find(u => u.username === username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password (for demo, we'll also allow plain 'admin123')
      const validPassword = password === 'admin123' || await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log(`✅ Traditional authentication successful for: ${username}`);

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          source: 'traditional'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          source: 'traditional'
        },
        message: `Welcome ${username}! Authenticated via dashboard account.`
      });
    }

    // If all authentication methods fail
    console.log(`❌ All authentication methods failed for: ${username}`);
    return res.status(401).json({ 
      message: 'Authentication failed. Please check your credentials.' 
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify token endpoint
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Logout endpoint (client-side handles token removal)
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// =============================================
// WEB SERVICES MONITORING APIs
// =============================================

// Get system services information
const getSystemServices = async () => {
  try {
    const services = [];
    
    // Check common system services
    const commonServices = [
      { name: 'nginx', type: 'web', port: 80, description: 'Nginx Web Server' },
      { name: 'apache2', type: 'web', port: 80, description: 'Apache Web Server' },
      { name: 'mysql', type: 'database', port: 3306, description: 'MySQL Database' },
      { name: 'postgresql', type: 'database', port: 5432, description: 'PostgreSQL Database' },
      { name: 'redis', type: 'cache', port: 6379, description: 'Redis Cache' },
      { name: 'mongodb', type: 'database', port: 27017, description: 'MongoDB Database' },
      { name: 'docker', type: 'container', port: null, description: 'Docker Service' },
      { name: 'ssh', type: 'network', port: 22, description: 'SSH Service' },
      { name: 'fail2ban', type: 'security', port: null, description: 'Fail2Ban Security' },
      { name: 'ufw', type: 'security', port: null, description: 'UFW Firewall' }
    ];

    for (const service of commonServices) {
      try {
        // Check if service is running using systemctl
        const { stdout: statusOutput } = await execPromise(`systemctl is-active ${service.name} 2>/dev/null || echo "inactive"`);
        const isActive = statusOutput.trim() === 'active';
        
        let status = 'stopped';
        let pid = null;
        let memory = 0;
        let cpu = 0;
        
        if (isActive) {
          status = 'running';
          
          // Get service details
          try {
            const { stdout: statusDetail } = await execPromise(`systemctl status ${service.name} --no-pager -l`);
            const pidMatch = statusDetail.match(/Main PID: (\d+)/);
            if (pidMatch) {
              pid = parseInt(pidMatch[1]);
              
              // Get process stats if PID exists
              try {
                const { stdout: processStats } = await execPromise(`ps -p ${pid} -o pid,pcpu,pmem --no-headers 2>/dev/null`);
                if (processStats.trim()) {
                  const [, cpuUsage, memUsage] = processStats.trim().split(/\s+/);
                  cpu = parseFloat(cpuUsage) || 0;
                  memory = parseFloat(memUsage) || 0;
                }
              } catch (e) {
                // Process might have ended
              }
            }
          } catch (e) {
            // Service might not have detailed status
          }
        }

        // Check if port is listening (for services with ports)
        let portStatus = 'closed';
        if (service.port) {
          try {
            const { stdout: portCheck } = await execPromise(`netstat -tlnp 2>/dev/null | grep :${service.port} || echo "not_found"`);
            portStatus = portCheck.includes(':' + service.port) ? 'listening' : 'closed';
          } catch (e) {
            portStatus = 'unknown';
          }
        }

        services.push({
          name: service.name,
          type: service.type,
          description: service.description,
          status: status,
          port: service.port,
          portStatus: portStatus,
          pid: pid,
          cpu: cpu,
          memory: memory,
          uptime: isActive ? await getServiceUptime(service.name) : 0
        });
        
      } catch (error) {
        // Service doesn't exist or error checking
        services.push({
          name: service.name,
          type: service.type,
          description: service.description,
          status: 'not_installed',
          port: service.port,
          portStatus: service.port ? 'closed' : null,
          pid: null,
          cpu: 0,
          memory: 0,
          uptime: 0
        });
      }
    }

    return services;
  } catch (error) {
    console.error('Error getting system services:', error);
    throw error;
  }
};

// Get service uptime
const getServiceUptime = async (serviceName) => {
  try {
    const { stdout } = await execPromise(`systemctl show ${serviceName} --property=ActiveEnterTimestamp --no-pager`);
    const timestampMatch = stdout.match(/ActiveEnterTimestamp=(.+)/);
    if (timestampMatch && timestampMatch[1] !== 'n/a') {
      const startTime = new Date(timestampMatch[1]);
      return Math.floor((Date.now() - startTime.getTime()) / 1000);
    }
    return 0;
  } catch (error) {
    return 0;
  }
};

// Services API endpoint
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const services = await getSystemServices();
    res.json({
      success: true,
      services: services,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Services API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get services information'
    });
  }
});

// Protect existing routes with authentication middleware
app.use('/api/metrics', authenticateToken);
app.use('/api/history', authenticateToken);
// /api/services already has authenticateToken in its route definition
app.use('/api/ports', authenticateToken);
app.use('/api/firewall', authenticateToken);
app.use('/api/storage', authenticateToken);
app.use('/api/databases', authenticateToken);
app.use('/api/security', authenticateToken);
app.use('/api/docker', authenticateToken);

// WebSocket connection handler (simplified without authentication for now)
wss.on('connection', (ws, req) => {
  console.log('Client connected to WebSocket');
  
  // Send current metrics immediately
  ws.send(JSON.stringify({
    type: 'metrics',
    data: currentMetrics
  }));
  
  // Send historical data
  ws.send(JSON.stringify({
    type: 'history',
    data: metricsHistory
  }));

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 WebSocket server ready for connections`);
  console.log(`🔗 API endpoints:`);
  console.log(`   POST /api/auth/login - System login`);
  console.log(`   POST /api/auth/verify - Token verification`);
  console.log(`   POST /api/auth/logout - User logout`);
  console.log(`   GET /api/auth/user/:username - Get user info`);
  console.log(`   GET /api/auth/users - List system users (admin only)`);
  console.log(`   GET /api/metrics - Current metrics`);
  console.log(`   GET /api/history - Historical data`);
  console.log(`   GET /api/services - Web services monitoring`);
  console.log(`   GET /api/ports - Port information`);
  console.log(`   POST /api/ports/scan - Port scanning`);
  console.log(`   GET /api/firewall - Firewall rules`);
  console.log(`   POST /api/firewall/manage - Manage firewall`);
  console.log(`   GET /api/docker/containers - Docker containers`);
  console.log(`   GET /api/docker/images - Docker images`);
  console.log(`   POST /api/docker/containers/run - Create container`);
  console.log(`   POST /api/metrics - Upload metrics (for agent)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
  });
});
