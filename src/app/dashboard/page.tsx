'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ServerInfoComponent from '@/components/ServerInfo';
import { 
  Server, 
  User, 
  Shield, 
  Terminal, 
  HardDrive, 
  Activity,
  LogOut,
  Settings,
  Monitor,
  Database,
  Info
} from 'lucide-react';

interface UserInfo {
  username: string;
  authType: string;
  loginTime: string;
  userInfo?: {
    uid: number;
    gid: number;
    home: string;
    shell: string;
    fullName: string;
  };
  groups?: string[];
  hasSudo?: boolean;
  isAdmin?: boolean;
}

export default function Dashboard() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/auth/verify', { headers });
      const data = await response.json();

      if (data.authenticated) {
        setUserInfo(data.user);
      } else {
        router.push('/login');
      }
    } catch (err) {
      setError('Failed to verify authentication');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch('/api/auth/logout', { 
        method: 'POST',
        headers 
      });
      
      // Clear localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear localStorage and redirect on error
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Alert className="max-w-md border-red-500 bg-red-500/10">
          <AlertDescription className="text-white">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Server className="h-8 w-8 text-blue-500 mr-3" />
              <h1 className="text-xl font-semibold text-white">System Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {userInfo.userInfo?.fullName || userInfo.username}
                </div>
                <div className="text-xs text-slate-400">
                  {userInfo.isAdmin ? 'Administrator' : 'User'}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-400 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome back, {userInfo.userInfo?.fullName || userInfo.username}!
          </h2>
          <p className="text-slate-400">
            You are authenticated via system credentials
          </p>
        </div>

        {/* User Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* User Info Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5 text-blue-500" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-400">Username</p>
                <p className="text-white font-medium">{userInfo.username}</p>
              </div>
              {userInfo.userInfo?.fullName && (
                <div>
                  <p className="text-sm text-slate-400">Full Name</p>
                  <p className="text-white font-medium">{userInfo.userInfo.fullName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-400">User ID</p>
                <p className="text-white font-medium">{userInfo.userInfo?.uid}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Home Directory</p>
                <p className="text-white font-mono text-sm">{userInfo.userInfo?.home}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Shell</p>
                <p className="text-white font-mono text-sm">{userInfo.userInfo?.shell}</p>
              </div>
            </CardContent>
          </Card>

          {/* Authentication Info Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-green-500" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-400">Auth Type</p>
                <p className="text-white font-medium">{userInfo.authType}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Login Time</p>
                <p className="text-white font-medium">
                  {new Date(userInfo.loginTime).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Admin Access</p>
                <Badge variant={userInfo.isAdmin ? "default" : "secondary"}>
                  {userInfo.isAdmin ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-400">Sudo Access</p>
                <Badge variant={userInfo.hasSudo ? "default" : "secondary"}>
                  {userInfo.hasSudo ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Groups Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Terminal className="h-5 w-5 text-purple-500" />
                Group Memberships
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {userInfo.groups?.map((group) => (
                  <Badge 
                    key={group} 
                    variant={['sudo', 'admin', 'wheel', 'root'].includes(group) ? "default" : "secondary"}
                  >
                    {group}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Server Information Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Info className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-white">Server Information</h2>
          </div>
          <ServerInfoComponent />
        </div>

        {/* Dashboard Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-800 border-slate-700 hover:border-blue-500 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Monitor className="h-5 w-5 text-blue-500" />
                System Monitor
              </CardTitle>
              <CardDescription className="text-slate-400">
                Real-time system metrics and performance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-green-500 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Terminal className="h-5 w-5 text-green-500" />
                Terminal Access
              </CardTitle>
              <CardDescription className="text-slate-400">
                Web-based terminal with system access
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-purple-500 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <HardDrive className="h-5 w-5 text-purple-500" />
                File Manager
              </CardTitle>
              <CardDescription className="text-slate-400">
                Browse and manage system files
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-orange-500 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="h-5 w-5 text-orange-500" />
                Database Manager
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage databases and execute queries
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Security Notice */}
        {userInfo.isAdmin && (
          <Alert className="mt-8 border-blue-500 bg-blue-500/10">
            <AlertDescription className="text-blue-200">
              <strong>Administrator Access:</strong> You have elevated privileges. 
              Please use system commands responsibly and ensure you understand the 
              implications of administrative actions.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}