import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  MdAdminPanelSettings,
  MdVisibility,
  MdVisibilityOff,
  MdLogin,
  MdSecurity,
  MdComputer,
  MdLock
} from 'react-icons/md';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white text-center">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <MdComputer className="text-3xl" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1">Server Dashboard</h1>
            <p className="text-blue-100 text-sm">Admin Login Required</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <div className="text-center mb-6">
              <MdAdminPanelSettings className="text-5xl text-gray-400 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-gray-800">Administrator Access</h2>
              <p className="text-gray-500 text-sm mt-1">Please sign in to continue</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <div className="flex items-center gap-2">
                  <MdSecurity className="text-red-500" />
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your username"
                    required
                  />
                  <MdAdminPanelSettings className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                  <MdLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !username || !password}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                  isLoading || !username || !password
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <MdLogin />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Demo Credentials:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Username:</strong> admin</div>
                <div><strong>Password:</strong> admin123</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>🔒 Secure server dashboard access</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
