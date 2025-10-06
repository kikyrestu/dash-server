const pam = require('pam-auth');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Secret key untuk JWT (simpan di environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

class PAMAuth {
  constructor() {
    this.serviceName = 'login'; // PAM service name
  }

  // Authenticate user dengan PAM
  async authenticate(username, password) {
    return new Promise((resolve, reject) => {
      // Create PAM authentication instance
      const auth = pam.authenticate({
        username: username,
        password: password,
        serviceName: this.serviceName,
        remoteHost: 'localhost'
      });

      auth.on('success', () => {
        // Generate JWT token setelah auth success
        const token = this.generateJWT(username);
        resolve({
          success: true,
          token: token,
          user: {
            username: username,
            authType: 'pam',
            loginTime: new Date().toISOString()
          }
        });
      });

      auth.on('error', (error) => {
        resolve({
          success: false,
          error: 'Authentication failed',
          message: error.message || 'Invalid username or password'
        });
      });

      auth.start();
    });
  }

  // Generate JWT token
  generateJWT(username) {
    const payload = {
      username: username,
      authType: 'pam',
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
      const { exec } = require('child_process');
      
      // Get user info dari /etc/passwd
      exec(`getent passwd ${username}`, (error, stdout, stderr) => {
        if (error) {
          reject({ error: 'User not found' });
          return;
        }

        const userInfo = stdout.trim().split(':');
        if (userInfo.length >= 7) {
          resolve({
            username: userInfo[0],
            uid: userInfo[2],
            gid: userInfo[3],
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
      const { exec } = require('child_process');
      
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
      const { exec } = require('child_process');
      
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
}

module.exports = PAMAuth;