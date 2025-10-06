const jwt = require('jsonwebtoken');
const { exec } = require('child_process');
const crypto = require('crypto');

// Secret key untuk JWT (simpan di environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

class SystemAuth {
  constructor() {
    this.sudoPath = '/usr/bin/sudo';
    this.suPath = '/bin/su';
  }

  // Authenticate user dengan system commands
  async authenticate(username, password) {
    return new Promise((resolve, reject) => {
      // Method 1: Use su command (most reliable)
      const command = `echo '${password.replace(/'/g, "'\\''")}' | ${this.suPath} - ${username} -c 'echo "AUTH_SUCCESS"' 2>/dev/null`;
      
      exec(command, (error, stdout, stderr) => {
        if (error || stderr) {
          // Method 2: Try with sudo if available
          const sudoCommand = `echo '${password.replace(/'/g, "'\\''")}' | ${this.sudoPath} -S -u ${username} echo "AUTH_SUCCESS" 2>/dev/null`;
          
          exec(sudoCommand, (sudoError, sudoStdout, sudoStderr) => {
            if (sudoError || sudoStderr) {
              resolve({
                success: false,
                error: 'Authentication failed',
                message: 'Invalid username or password'
              });
              return;
            }

            if (sudoStdout.trim() === 'AUTH_SUCCESS') {
              const token = this.generateJWT(username);
              resolve({
                success: true,
                token: token,
                user: {
                  username: username,
                  authType: 'system',
                  loginTime: new Date().toISOString()
                }
              });
            } else {
              resolve({
                success: false,
                error: 'Authentication failed',
                message: 'Invalid username or password'
              });
            }
          });
          return;
        }

        if (stdout.trim() === 'AUTH_SUCCESS') {
          const token = this.generateJWT(username);
          resolve({
            success: true,
            token: token,
            user: {
              username: username,
              authType: 'system',
              loginTime: new Date().toISOString()
            }
          });
        } else {
          resolve({
            success: false,
            error: 'Authentication failed',
            message: 'Invalid username or password'
          });
        }
      });
    });
  }

  // Generate JWT token
  generateJWT(username) {
    const payload = {
      username: username,
      authType: 'system',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return {
        valid: true,
        user: decoded
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Get user info dari sistem
  async getUserInfo(username) {
    return new Promise((resolve, reject) => {
      exec(`getent passwd ${username}`, (error, stdout, stderr) => {
        if (error) {
          reject({ error: 'User not found' });
          return;
        }

        const userInfo = stdout.trim().split(':');
        if (userInfo.length >= 7) {
          resolve({
            username: userInfo[0],
            uid: parseInt(userInfo[2]),
            gid: parseInt(userInfo[3]),
            home: userInfo[5],
            shell: userInfo[6],
            fullName: userInfo[4].split(',')[0]
          });
        } else {
          reject({ error: 'Invalid user info' });
        }
      });
    });
  }

  // Check user groups
  async getUserGroups(username) {
    return new Promise((resolve, reject) => {
      exec(`groups ${username}`, (error, stdout, stderr) => {
        if (error) {
          resolve([]);
          return;
        }

        const groupsOutput = stdout.trim();
        const groups = groupsOutput.split(':')[1] ? groupsOutput.split(':')[1].trim().split(' ') : [];
        resolve(groups);
      });
    });
  }

  // Check sudo privileges
  async hasSudoPrivileges(username) {
    return new Promise((resolve) => {
      exec(`sudo -l -U ${username}`, (error, stdout, stderr) => {
        if (error) {
          resolve(false);
          return;
        }
        
        // Check if user has sudo access
        resolve(stdout.includes('(ALL : ALL)') || stdout.includes('(ALL)'));
      });
    });
  }

  // Check if user exists
  async userExists(username) {
    return new Promise((resolve) => {
      exec(`id -u ${username}`, (error, stdout, stderr) => {
        resolve(!error);
      });
    });
  }

  // Get system users (for admin interface)
  async getSystemUsers() {
    return new Promise((resolve, reject) => {
      exec("getent passwd | awk -F: '$3 >= 1000 && $3 < 60000 {print $1}' | head -20", (error, stdout, stderr) => {
        if (error) {
          reject({ error: 'Failed to get users' });
          return;
        }

        const users = stdout.trim().split('\n').filter(user => user.length > 0);
        resolve(users);
      });
    });
  }

  // Middleware untuk Express.js
  authMiddleware() {
    return (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'No token provided'
        });
      }

      const verification = this.verifyToken(token);
      if (!verification.valid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }

      req.user = verification.user;
      next();
    };
  }

  // Middleware untuk admin access
  adminMiddleware() {
    return async (req, res, next) => {
      try {
        const groups = await this.getUserGroups(req.user.username);
        const hasSudo = await this.hasSudoPrivileges(req.user.username);
        
        // Check if user is in admin groups or has sudo
        const adminGroups = ['sudo', 'admin', 'wheel', 'root'];
        const isAdmin = groups.some(group => adminGroups.includes(group)) || hasSudo;

        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            error: 'Admin access required'
          });
        }

        req.user.isAdmin = isAdmin;
        req.user.groups = groups;
        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to verify admin privileges'
        });
      }
    };
  }

  // Execute system command as user (with security checks)
  async executeAsUser(username, command) {
    return new Promise((resolve, reject) => {
      // Security: Validate command to prevent injection
      const allowedCommands = [
        'ls', 'cd', 'pwd', 'whoami', 'id', 'date', 'uname',
        'df', 'du', 'free', 'top', 'ps', 'netstat', 'ss'
      ];
      
      const commandBase = command.split(' ')[0];
      if (!allowedCommands.includes(commandBase)) {
        reject({ error: 'Command not allowed for security reasons' });
        return;
      }

      exec(`sudo -u ${username} ${command}`, (error, stdout, stderr) => {
        if (error) {
          reject({ error: stderr || 'Command execution failed' });
          return;
        }
        resolve({ output: stdout });
      });
    });
  }
}

module.exports = SystemAuth;