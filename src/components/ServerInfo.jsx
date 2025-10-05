import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Wifi, 
  MemoryStick, 
  Thermometer,
  Activity,
  Zap
} from 'lucide-react';

const ServerInfo = () => {
  const [serverInfo, setServerInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServerInfo = async () => {
      try {
        const response = await fetch('/api/server-info');
        if (!response.ok) {
          throw new Error('Failed to fetch server information');
        }
        const data = await response.json();
        setServerInfo(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchServerInfo();
    const interval = setInterval(fetchServerInfo, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Server className="h-5 w-5 text-blue-500" />
            Server Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <Activity className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Server className="h-5 w-5 text-blue-500" />
            Server Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-500/10 p-4 rounded-md border border-red-500">
            <p className="text-red-400">Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Server className="h-5 w-5 text-blue-500" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{serverInfo.hostname || 'N/A'}</div>
              <div className="text-sm text-slate-400">Hostname</div>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{serverInfo.uptime || 'N/A'}</div>
              <div className="text-sm text-slate-400">Uptime</div>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{serverInfo.platform || 'N/A'}</div>
              <div className="text-sm text-slate-400">Platform</div>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">{serverInfo.arch || 'N/A'}</div>
              <div className="text-sm text-slate-400">Architecture</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CPU Information */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Cpu className="h-5 w-5 text-green-500" />
            CPU Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">CPU Model</label>
                <div className="text-white font-medium">{serverInfo.cpuModel || 'N/A'}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Cores</label>
                  <div className="text-white font-medium">{serverInfo.cpuCores || serverInfo.cpuCount || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Speed</label>
                  <div className="text-white font-medium">{serverInfo.cpuSpeed || 'N/A'}</div>
                </div>
              </div>
              {serverInfo.cpuCache && (
                <div>
                  <label className="text-sm text-slate-400">Cache</label>
                  <div className="text-white font-medium">{serverInfo.cpuCache}</div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-slate-400">Usage</span>
                </div>
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  {serverInfo.cpuUsage || 'N/A'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-slate-400">Temperature</span>
                </div>
                <Badge variant="outline" className="text-red-400 border-red-400">
                  {serverInfo.cpuTemp || 'N/A'}
                </Badge>
              </div>
              {serverInfo.loadAverage && (
                <div>
                  <label className="text-sm text-slate-400">Load Average</label>
                  <div className="text-white font-medium">
                    {serverInfo.loadAverage.map((load, index) => (
                      <Badge key={index} variant="secondary" className="mr-2">
                        {load.toFixed(2)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory Information */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <MemoryStick className="h-5 w-5 text-purple-500" />
            Memory Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-400">Total Memory</label>
                <div className="text-white font-medium">{serverInfo.totalMemory || serverInfo.memoryTotal || 'N/A'}</div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Used Memory</label>
                <div className="text-white font-medium">{serverInfo.usedMemory || serverInfo.memoryUsed || 'N/A'}</div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Free Memory</label>
                <div className="text-white font-medium">{serverInfo.freeMemory || serverInfo.memoryFree || 'N/A'}</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Memory Usage</span>
                <span className="text-sm text-white font-medium">{serverInfo.memoryUsagePercent || 0}%</span>
              </div>
              <Progress value={serverInfo.memoryUsagePercent || 0} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disk Information */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <HardDrive className="h-5 w-5 text-orange-500" />
            Disk Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-400">Total Disk</label>
                <div className="text-white font-medium">{serverInfo.diskTotal || 'N/A'}</div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Used Disk</label>
                <div className="text-white font-medium">{serverInfo.diskUsed || 'N/A'}</div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Free Disk</label>
                <div className="text-white font-medium">{serverInfo.diskFree || 'N/A'}</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Disk Usage</span>
                <span className="text-sm text-white font-medium">{serverInfo.diskUsagePercent || 0}%</span>
              </div>
              <Progress value={serverInfo.diskUsagePercent || 0} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Information */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wifi className="h-5 w-5 text-cyan-500" />
            Network Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">IP Address</label>
              <div className="text-white font-medium font-mono">{serverInfo.ipAddress || 'N/A'}</div>
            </div>
            <div>
              <label className="text-sm text-slate-400">MAC Address</label>
              <div className="text-white font-medium font-mono">{serverInfo.macAddress || 'N/A'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerInfo;