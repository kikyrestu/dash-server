'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Lock, Shield, Server } from 'lucide-react';

export default function SystemAuthLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSystemHostname = () => {
    return typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Server className="h-12 w-12 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">System Dashboard</h1>
          <p className="text-slate-300">
            Authenticate with your system credentials
          </p>
        </div>

        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              System Authentication
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your Linux system username and password
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-500 bg-red-500/10">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white pl-10"
                    placeholder="Enter system username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white pl-10"
                    placeholder="Enter system password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Login with System Auth
                  </>
                )}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowSystemInfo(!showSystemInfo)}
              className="text-slate-400 hover:text-white"
            >
              {showSystemInfo ? 'Hide' : 'Show'} System Information
            </Button>
            
            {showSystemInfo && (
              <div className="w-full p-3 bg-slate-700 rounded-lg text-sm text-slate-300">
                <div className="space-y-1">
                  <div><strong>Host:</strong> {getSystemHostname()}</div>
                  <div><strong>Auth Method:</strong> System Authentication</div>
                  <div><strong>Security:</strong> PAM-based authentication</div>
                  <div><strong>Access:</strong> System user credentials required</div>
                </div>
              </div>
            )}
            
            <div className="text-xs text-slate-500 text-center">
              This uses your system's built-in authentication. 
              Only users with valid system accounts can login.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}