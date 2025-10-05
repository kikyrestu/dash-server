import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from './LoginPage';
import { MdComputer } from 'react-icons/md';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Check if we're in debug mode
  const isDebugMode = window.location.search.includes('debug=true');

  // Bypass authentication for debug mode
  if (isDebugMode) {
    return children;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MdComputer className="text-2xl text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Dashboard...</h2>
          <p className="text-gray-500 mt-2">Please wait while we prepare your session</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return children;
};

export default ProtectedRoute;
