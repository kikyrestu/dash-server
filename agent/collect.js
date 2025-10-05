const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');

const BACKEND_URL = 'http://127.0.0.1:3001'; // Use IPv4 localhost instead of localhost
const COLLECTION_INTERVAL = 2000; // 2 seconds

class SystemMonitor {
  constructor() {
    this.previousNetworkStats = null;
    console.log('🔍 System Monitor Agent started');
  }

  // Get CPU usage
  async getCPUUsage() {
    return new Promise((resolve) => {
      exec("top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'", (error, stdout) => {
        if (error) {
          resolve(0);
        } else {
          resolve(parseFloat(stdout.trim()) || 0);
        }
      });
    });
  }

  // Get Memory usage
  async getMemoryUsage() {
    return new Promise((resolve) => {
      exec('free -m', (error, stdout) => {
        if (error) {
          resolve({ used: 0, total: 0, percentage: 0 });
        } else {
          const lines = stdout.split('\n');
          const memLine = lines[1].split(/\s+/);
          const total = parseInt(memLine[1]);
          const used = parseInt(memLine[2]);
          const percentage = ((used / total) * 100).toFixed(1);
          
          resolve({
            used,
            total,
            percentage: parseFloat(percentage)
          });
        }
      });
    });
  }

  // Get Disk usage
  async getDiskUsage() {
    return new Promise((resolve) => {
      exec("df -h / | awk 'NR==2 {print $2,$3,$5}'", (error, stdout) => {
        if (error) {
          resolve({ used: 0, total: 0, percentage: 0 });
        } else {
          const parts = stdout.trim().split(' ');
          const total = parts[0];
          const used = parts[1];
          const percentage = parseFloat(parts[2].replace('%', ''));
          
          resolve({
            used,
            total,
            percentage
          });
        }
      });
    });
  }

  // Get Network stats
  async getNetworkStats() {
    return new Promise((resolve) => {
      exec("cat /proc/net/dev | grep -E 'eth0|wlan0|enp|wlp' | head -1", (error, stdout) => {
        if (error) {
          resolve({ upload: 0, download: 0 });
        } else {
          const parts = stdout.trim().split(/\s+/);
          if (parts.length >= 10) {
            const rxBytes = parseInt(parts[1]);
            const txBytes = parseInt(parts[9]);
            
            if (this.previousNetworkStats) {
              const timeDiff = 2; // seconds
              const rxDiff = rxBytes - this.previousNetworkStats.rxBytes;
              const txDiff = txBytes - this.previousNetworkStats.txBytes;
              
              const download = Math.max(0, (rxDiff / timeDiff / 1024 / 1024)); // MB/s
              const upload = Math.max(0, (txDiff / timeDiff / 1024 / 1024)); // MB/s
              
              this.previousNetworkStats = { rxBytes, txBytes };
              resolve({
                download: parseFloat(download.toFixed(2)),
                upload: parseFloat(upload.toFixed(2))
              });
            } else {
              this.previousNetworkStats = { rxBytes, txBytes };
              resolve({ upload: 0, download: 0 });
            }
          } else {
            resolve({ upload: 0, download: 0 });
          }
        }
      });
    });
  }

  // Get CPU temperature
  async getTemperature() {
    return new Promise((resolve) => {
      exec("sensors | grep 'Core 0' | awk '{print $3}' | sed 's/+//g' | sed 's/°C//g'", (error, stdout) => {
        if (error) {
          // Fallback to thermal zone if sensors not available
          exec("cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null", (error2, stdout2) => {
            if (error2) {
              resolve(0);
            } else {
              const temp = parseInt(stdout2.trim()) / 1000;
              resolve(temp || 0);
            }
          });
        } else {
          resolve(parseFloat(stdout.trim()) || 0);
        }
      });
    });
  }

  // Get system uptime
  async getUptime() {
    return new Promise((resolve) => {
      exec("cat /proc/uptime", (error, stdout) => {
        if (error) {
          resolve(0);
        } else {
          const uptimeSeconds = parseFloat(stdout.split(' ')[0]);
          resolve(uptimeSeconds);
        }
      });
    });
  }

  // Get top processes
  async getTopProcesses() {
    return new Promise((resolve) => {
      exec("ps aux --sort=-%cpu | head -6 | tail -5", (error, stdout) => {
        if (error) {
          resolve([]);
        } else {
          const processes = stdout.trim().split('\n').map(line => {
            const parts = line.split(/\s+/);
            return {
              name: parts[10],
              cpu: parseFloat(parts[2]),
              memory: parseFloat(parts[3]),
              pid: parts[1]
            };
          });
          resolve(processes);
        }
      });
    });
  }

  // Collect all metrics
  async collectMetrics() {
    try {
      const [cpu, memory, disk, network, temperature, uptime, processes] = await Promise.all([
        this.getCPUUsage(),
        this.getMemoryUsage(),
        this.getDiskUsage(),
        this.getNetworkStats(),
        this.getTemperature(),
        this.getUptime(),
        this.getTopProcesses()
      ]);

      return {
        cpu: parseFloat(cpu.toFixed(1)),
        memory,
        disk,
        network,
        temperature: parseFloat(temperature.toFixed(1)),
        uptime,
        processes
      };
    } catch (error) {
      console.error('Error collecting metrics:', error);
      return null;
    }
  }

  // Send metrics to backend
  async sendMetrics(metrics) {
    try {
      await axios.post(`${BACKEND_URL}/api/metrics`, metrics);
      console.log(`📊 Metrics sent - CPU: ${metrics.cpu}%, RAM: ${metrics.memory.percentage}%, Temp: ${metrics.temperature}°C`);
    } catch (error) {
      console.error('❌ Error sending metrics:', error.message);
    }
  }

  // Start monitoring
  start() {
    console.log(`🚀 Starting monitoring loop every ${COLLECTION_INTERVAL}ms`);
    
    setInterval(async () => {
      const metrics = await this.collectMetrics();
      if (metrics) {
        await this.sendMetrics(metrics);
      }
    }, COLLECTION_INTERVAL);
  }
}

// Start the monitor
const monitor = new SystemMonitor();
monitor.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Monitor agent shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Monitor agent shutting down...');
  process.exit(0);
});
