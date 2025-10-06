import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    // Get system information
    const systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      type: os.type(),
      arch: os.arch(),
      uptime: formatUptime(os.uptime()),
      release: os.release(),
      totalMemory: formatBytes(os.totalmem()),
      freeMemory: formatBytes(os.freemem()),
      usedMemory: formatBytes(os.totalmem() - os.freemem()),
      memoryUsagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      loadAverage: os.loadavg(),
    };

    // Get CPU information
    let cpuInfo = {};
    try {
      const cpuOutput = await execAsync('lscpu');
      cpuInfo = parseLscpuOutput(cpuOutput.stdout);
    } catch (error) {
      console.log('lscpu not available, using basic CPU info');
    }

    // Get disk information
    let diskInfo = {};
    try {
      const diskOutput = await execAsync('df -h /');
      diskInfo = parseDfOutput(diskOutput.stdout);
    } catch (error) {
      console.log('df command not available');
    }

    // Get network information
    let networkInfo = {};
    try {
      const networkOutput = await execAsync('ip addr show | grep -E "inet |ether" | head -2');
      networkInfo = parseNetworkOutput(networkOutput.stdout);
    } catch (error) {
      try {
        // Fallback to ifconfig
        const ifconfigOutput = await execAsync('ifconfig | grep -E "inet |ether" | head -2');
        networkInfo = parseIfconfigOutput(ifconfigOutput.stdout);
      } catch (error2) {
        console.log('Network commands not available');
      }
    }

    // Get CPU temperature (Linux specific)
    let cpuTemp = 'N/A';
    try {
      const tempOutput = await execAsync('cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null | head -1');
      const tempValue = parseInt(tempOutput.stdout.trim());
      if (!isNaN(tempValue)) {
        cpuTemp = `${(tempValue / 1000).toFixed(1)}°C`;
      }
    } catch (error) {
      console.log('CPU temperature not available');
    }

    // Get CPU usage
    let cpuUsage = 'N/A';
    try {
      const statOutput = await execAsync('cat /proc/stat | grep "^cpu "');
      cpuUsage = await calculateCPUUsage(statOutput.stdout);
    } catch (error) {
      console.log('CPU usage calculation not available');
    }

    const serverInfo = {
      ...systemInfo,
      ...cpuInfo,
      ...diskInfo,
      ...networkInfo,
      cpuTemp,
      cpuUsage,
    };

    return NextResponse.json(serverInfo);
  } catch (error) {
    console.error('Error fetching server info:', error);
    return NextResponse.json({ error: 'Failed to fetch server information' }, { status: 500 });
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function parseLscpuOutput(output: string): any {
  const info: any = {};
  const lines = output.split('\n');
  
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      const cleanKey = key.trim().replace(/\s+/g, '_');
      
      switch (cleanKey) {
        case 'Model_name':
          info.cpuModel = value;
          break;
        case 'CPU(s)':
          info.cpuCores = value;
          break;
        case 'CPU_MHz':
          info.cpuSpeed = `${value} MHz`;
          break;
        case 'CPU_min_MHz':
          info.cpuMinSpeed = `${value} MHz`;
          break;
        case 'CPU_max_MHz':
          info.cpuMaxSpeed = `${value} MHz`;
          break;
        case 'Cache_size':
          info.cpuCache = value;
          break;
      }
    }
  }
  
  return info;
}

function parseDfOutput(output: string): any {
  const lines = output.trim().split('\n');
  if (lines.length < 2) return {};
  
  const headers = lines[0].split(/\s+/);
  const values = lines[1].split(/\s+/);
  
  const info: any = {};
  const sizeIndex = headers.indexOf('Size');
  const usedIndex = headers.indexOf('Used');
  const availIndex = headers.indexOf('Avail');
  const useIndex = headers.indexOf('Use%');
  
  if (sizeIndex !== -1) info.diskTotal = values[sizeIndex];
  if (usedIndex !== -1) info.diskUsed = values[usedIndex];
  if (availIndex !== -1) info.diskFree = values[availIndex];
  if (useIndex !== -1) {
    const usagePercent = parseInt(values[useIndex]);
    info.diskUsagePercent = isNaN(usagePercent) ? 0 : usagePercent;
  }
  
  return info;
}

function parseNetworkOutput(output: string): any {
  const lines = output.trim().split('\n');
  const info: any = {};
  
  for (const line of lines) {
    if (line.includes('ether')) {
      const macMatch = line.match(/ether\s+([0-9a-fA-F:]+)/);
      if (macMatch) {
        info.macAddress = macMatch[1];
      }
    }
    if (line.includes('inet')) {
      const ipMatch = line.match(/inet\s+([0-9.]+)/);
      if (ipMatch) {
        info.ipAddress = ipMatch[1];
      }
    }
  }
  
  return info;
}

function parseIfconfigOutput(output: string): any {
  const lines = output.trim().split('\n');
  const info: any = {};
  
  for (const line of lines) {
    if (line.includes('ether')) {
      const macMatch = line.match(/ether\s+([0-9a-fA-F:]+)/);
      if (macMatch) {
        info.macAddress = macMatch[1];
      }
    }
    if (line.includes('inet ')) {
      const ipMatch = line.match(/inet\s+([0-9.]+)/);
      if (ipMatch) {
        info.ipAddress = ipMatch[1];
      }
    }
  }
  
  return info;
}

async function calculateCPUUsage(statOutput: string): Promise<string> {
  const lines = statOutput.trim().split('\n');
  if (lines.length === 0) return 'N/A';
  
  const parts = lines[0].split(/\s+/);
  const user = parseInt(parts[1]);
  const nice = parseInt(parts[2]);
  const system = parseInt(parts[3]);
  const idle = parseInt(parts[4]);
  
  const total = user + nice + system + idle;
  const usage = ((total - idle) / total) * 100;
  
  return `${usage.toFixed(1)}%`;
}