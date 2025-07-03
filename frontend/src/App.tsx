import React from 'react';
import Dashboard from './components/Dashboard';
import WebSocketTest from './components/WebSocketTest';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  // Temporary: Use WebSocketTest to debug connection issues
  const isDebugMode = window.location.search.includes('debug=true');

  return (
    <div className="App">
      <AuthProvider>
        <ProtectedRoute>
          {isDebugMode ? <WebSocketTest /> : <Dashboard />}
        </ProtectedRoute>
      </AuthProvider>
    </div>
  );
}

export default App;
