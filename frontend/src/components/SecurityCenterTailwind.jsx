import React, { useState, useEffect } from 'react';

const SecurityCenterTailwind = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [securityData, setSecurityData] = useState({
    loginAttempts: [],
    vulnerabilities: [],
    auditLogs: [],
    activeSessions: [],
    sslCertificates: [],
    firewallStatus: {},
    securityAlerts: []
  });
  const [scanningVulns, setScanningVulns] = useState(false);

  useEffect(() => {
    fetchSecurityData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real data from API endpoints
      const [
        loginAttemptsRes,
        vulnerabilitiesRes,
        auditLogsRes,
        activeSessionsRes,
        sslCertificatesRes,
        firewallStatusRes,
        securityAlertsRes
      ] = await Promise.all([
        fetch('/api/security/login-attempts'),
        fetch('/api/security/vulnerabilities'),
        fetch('/api/security/audit-logs'),
        fetch('/api/security/active-sessions'),
        fetch('/api/security/ssl-certificates'),
        fetch('/api/security/firewall-status'),
        fetch('/api/security/alerts')
      ]);

      if (!loginAttemptsRes.ok || !vulnerabilitiesRes.ok || !auditLogsRes.ok || 
          !activeSessionsRes.ok || !sslCertificatesRes.ok || !firewallStatusRes.ok || 
          !securityAlertsRes.ok) {
        throw new Error('Failed to fetch security data from one or more endpoints');
      }

      const [
        loginAttempts,
        vulnerabilities,
        auditLogs,
        activeSessions,
        sslCertificates,
        firewallStatus,
        securityAlerts
      ] = await Promise.all([
        loginAttemptsRes.json(),
        vulnerabilitiesRes.json(),
        auditLogsRes.json(),
        activeSessionsRes.json(),
        sslCertificatesRes.json(),
        firewallStatusRes.json(),
        securityAlertsRes.json()
      ]);

      setSecurityData({
        loginAttempts,
        vulnerabilities,
        auditLogs,
        activeSessions,
        sslCertificates,
        firewallStatus,
        securityAlerts
      });
      setLoading(false);
      
    } catch (err) {
      console.error('Failed to fetch security data:', err);
      setError('Failed to load security data');
      setLoading(false);
    }
  };

  const runVulnerabilityScans = async () => {
    setScanningVulns(true);
    
    try {
      const response = await fetch('/api/security/scan-vulnerabilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to run vulnerability scan');
      }

      const result = await response.json();
      console.log('Vulnerability scan completed:', result);
      
      // Refresh data after scan
      await fetchSecurityData();
    } catch (err) {
      console.error('Vulnerability scan failed:', err);
      setError('Failed to run vulnerability scan');
    } finally {
      setScanningVulns(false);
    }
  };

  const getVulnerabilityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-danger-600 bg-danger-50 border-danger-200';
      case 'medium': return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'low': return 'text-success-600 bg-success-50 border-success-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': case 'critical': return 'text-danger-600 bg-danger-50 border-danger-200';
      case 'investigating': case 'warning': return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'resolved': case 'valid': return 'text-success-600 bg-success-50 border-success-200';
      case 'expiring': return 'text-warning-600 bg-warning-50 border-warning-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🛡️' },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: '🚨' },
    { id: 'login-attempts', label: 'Login Attempts', icon: '🔐' },
    { id: 'audit-logs', label: 'Audit Logs', icon: '📋' },
    { id: 'sessions', label: 'Active Sessions', icon: '👥' },
    { id: 'certificates', label: 'SSL Certificates', icon: '🔒' },
    { id: 'firewall', label: 'Firewall', icon: '🔥' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-card border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            <span className="text-gray-700 font-medium">Loading security data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-3">
                🛡️ Security Center
              </h1>
              <p className="text-gray-600 mt-2">Monitor and manage server security</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={runVulnerabilityScans}
                disabled={scanningVulns}
                className="px-4 py-2 bg-danger-500 text-white rounded-lg hover:bg-danger-600 transition-colors duration-200 flex items-center gap-2 font-medium disabled:opacity-50"
              >
                {scanningVulns ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    🔍 Vulnerability Scan
                  </>
                )}
              </button>
              <button
                onClick={fetchSecurityData}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 flex items-center gap-2 font-medium"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-card border border-gray-200 p-2">
          <div className="flex flex-wrap gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-medium text-danger-800">Error</h3>
                <p className="text-danger-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Security Score */}
              <div className="bg-gradient-to-br from-success-50 to-success-100 border border-success-200 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">🛡️</div>
                  <div>
                    <h3 className="text-lg font-semibold text-success-800">Security Score</h3>
                    <p className="text-3xl font-bold text-success-600">85%</p>
                    <p className="text-sm text-success-600">Good security posture</p>
                  </div>
                </div>
              </div>

              {/* Active Threats */}
              <div className="bg-gradient-to-br from-danger-50 to-danger-100 border border-danger-200 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">🚨</div>
                  <div>
                    <h3 className="text-lg font-semibold text-danger-800">Active Threats</h3>
                    <p className="text-3xl font-bold text-danger-600">{securityData.vulnerabilities.filter(v => v.severity === 'high' && v.status === 'open').length}</p>
                    <p className="text-sm text-danger-600">Critical vulnerabilities</p>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">👥</div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-800">Active Sessions</h3>
                    <p className="text-3xl font-bold text-primary-600">{securityData.activeSessions.length}</p>
                    <p className="text-sm text-primary-600">Current users online</p>
                  </div>
                </div>
              </div>

              {/* Firewall Status */}
              <div className="bg-gradient-to-br from-warning-50 to-warning-100 border border-warning-200 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">🔥</div>
                  <div>
                    <h3 className="text-lg font-semibold text-warning-800">Firewall</h3>
                    <p className="text-xl font-bold text-warning-600">
                      {securityData.firewallStatus.enabled ? 'Active' : 'Inactive'}
                    </p>
                    <p className="text-sm text-warning-600">{securityData.firewallStatus.rules} rules configured</p>
                  </div>
                </div>
              </div>

              {/* Security Alerts */}
              <div className="md:col-span-2 lg:col-span-4">
                <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🚨 Recent Security Alerts
                  </h2>
                  <div className="space-y-3">
                    {securityData.securityAlerts.slice(0, 5).map(alert => (
                      <div key={alert.id} className={`p-4 rounded-lg border ${getStatusColor(alert.type)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{alert.title}</h3>
                            <p className="text-sm opacity-75 mt-1">Source: {alert.source}</p>
                          </div>
                          <span className="text-sm font-mono">{alert.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vulnerabilities' && (
            <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                🚨 Vulnerability Assessment
              </h2>
              <div className="space-y-4">
                {securityData.vulnerabilities.map(vuln => (
                  <div key={vuln.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{vuln.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getVulnerabilityColor(vuln.severity)}`}>
                            {vuln.severity.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(vuln.status)}`}>
                            {vuln.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{vuln.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'login-attempts' && (
            <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                🔐 Recent Login Attempts
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">IP Address</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityData.loginAttempts.map(attempt => (
                      <tr key={attempt.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">{attempt.ip}</td>
                        <td className="py-3 px-4">{attempt.user}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            attempt.success 
                              ? 'text-success-700 bg-success-100' 
                              : 'text-danger-700 bg-danger-100'
                          }`}>
                            {attempt.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{attempt.location}</td>
                        <td className="py-3 px-4 font-mono text-sm">{attempt.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                👥 Active User Sessions
              </h2>
              <div className="space-y-4">
                {securityData.activeSessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">👤</div>
                      <div>
                        <h3 className="font-medium text-gray-900">{session.user}</h3>
                        <p className="text-sm text-gray-600">{session.ip} • Duration: {session.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        session.status === 'active' 
                          ? 'text-success-700 bg-success-100' 
                          : 'text-warning-700 bg-warning-100'
                      }`}>
                        {session.status}
                      </span>
                      <button className="px-3 py-1 text-danger-600 border border-danger-300 rounded-lg hover:bg-danger-50 transition-colors duration-200 text-sm">
                        Terminate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                🔒 SSL Certificates
              </h2>
              <div className="space-y-4">
                {securityData.sslCertificates.map(cert => (
                  <div key={cert.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">🔒</div>
                        <div>
                          <h3 className="font-medium text-gray-900">{cert.domain}</h3>
                          <p className="text-sm text-gray-600">Issued by: {cert.issuer}</p>
                          <p className="text-sm text-gray-600">Expires: {cert.expiry}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(cert.status)}`}>
                          {cert.status}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">{cert.daysLeft} days left</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'firewall' && (
            <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                🔥 Firewall Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Status</h3>
                  <p className={`text-2xl font-bold ${
                    securityData.firewallStatus.enabled ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {securityData.firewallStatus.enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Rules</h3>
                  <p className="text-2xl font-bold text-primary-600">{securityData.firewallStatus.rules}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Blocked</h3>
                  <p className="text-2xl font-bold text-danger-600">{securityData.firewallStatus.blocked}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Allowed</h3>
                  <p className="text-2xl font-bold text-success-600">{securityData.firewallStatus.allowed}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityCenterTailwind;
