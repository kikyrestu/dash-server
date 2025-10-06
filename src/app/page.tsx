'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        const data = await response.json();

        if (data.authenticated) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4 bg-slate-900">
      <div className="text-center">
        <Activity className="h-16 w-16 animate-spin text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">System Dashboard</h1>
        <p className="text-slate-400">Checking authentication...</p>
      </div>
    </div>
  );
}