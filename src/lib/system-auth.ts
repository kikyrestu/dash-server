import jwt from 'jsonwebtoken';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Secret key untuk JWT (simpan di environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: {
    username: string;
    authType: string;
    loginTime?: string;
    userInfo?: UserInfo;
    groups?: string[];
    hasSudo?: boolean;
    isAdmin?: boolean;
  };
  error?: string;
  message?: string;
}

export interface UserInfo {
  username: string;
  uid: number;
  gid: number;
  home: string;
  shell: string;
  fullName: string;
}

export interface TokenVerification {
  valid: boolean;
  user?: any;
  error?: string;
}

export class SystemAuth {
  private sudoPath: string = '/usr/bin/sudo';
  private suPath: string = '/bin/su';

  // Authenticate user dengan system commands
  async authenticate(username: string, password: string): Promise<AuthResult> {
    return new Promise((resolve) => {
      // Development mode fallback for container environments
      if (process.env.NODE_ENV === 'development' || process.env.DEV_MODE === 'true') {
        // Development credentials - only for development!
        const devUsers = {
          'root': 'devroot123',
          'admin': 'devadmin123',
          'demo': 'demopassword'
        };
        
        if (devUsers[username] && password === devUsers[username]) {
          const token = this.generateJWT(username);
          resolve({
            success: true,
            token: token,
            user: {
              username: username,
              authType: 'development',
              loginTime: new Date().toISOString(),
              isAdmin: username === 'root' || username === 'admin'
            }
          });
          return;
        }
      }
      
      // Special handling for root user
      if (username === 'root') {
        // Method 1: Direct root authentication with su
        const command = `echo '${password.replace(/'/g, "'\\''")}' | ${this.suPath} - root -c 'echo "AUTH_SUCCESS"' 2>/dev/null`;
        
        exec(command, (error, stdout, stderr) => {
          if (!error && stdout.trim() === 'AUTH_SUCCESS') {
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
            return;
          }
          
          // Method 2: Try with sudo -i for root
          const sudoCommand = `echo '${password.replace(/'/g, "'\\''")}' | ${this.sudoPath} -S -i root echo "AUTH_SUCCESS" 2>/dev/null`;
          
          exec(sudoCommand, (sudoError, sudoStdout, sudoStderr) => {
            if (!sudoError && sudoStdout.trim() === 'AUTH_SUCCESS') {
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
                error: 'Root authentication failed',
                message: 'Invalid root password or sudo not configured properly'
              });
            }
          });
        });
      } else {
        // Regular user authentication
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
      }
    });
  }

  // Generate JWT token
  generateJWT(username: string): string {
    const payload = {
      username: username,
      authType: 'system',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
  }

  // Verify JWT token
  verifyToken(token: string): TokenVerification {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return {
        valid: true,
        user: decoded
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Get user info dari sistem
  async getUserInfo(username: string): Promise<UserInfo> {
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
  async getUserGroups(username: string): Promise<string[]> {
    return new Promise((resolve) => {
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
  async hasSudoPrivileges(username: string): Promise<boolean> {
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
  async userExists(username: string): Promise<boolean> {
    return new Promise((resolve) => {
      exec(`id -u ${username}`, (error, stdout, stderr) => {
        resolve(!error);
      });
    });
  }

  // Get system users (for admin interface)
  async getSystemUsers(): Promise<string[]> {
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

  // Execute system command as user (with security checks)
  async executeAsUser(username: string, command: string): Promise<{ output: string }> {
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