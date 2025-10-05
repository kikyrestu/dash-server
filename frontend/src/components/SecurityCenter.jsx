import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import {
  MdSecurity,
  MdError,
  MdRefresh,
  MdSearch,
  MdShield,
  MdWarning,
  MdDangerous,
  MdCheckCircle,
  MdLock,
  MdReportProblem
} from 'react-icons/md';
import { API_BASE_URL } from '../config/api';

const SecurityCenter = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [securityData, setSecurityData] = useState({
    loginAttempts: [],
    vulnerabilities: [],
    auditLogs: [],
    activeSessions: [],
    sslCertificates: [],
    firewallStatus: {},
    securityAlerts: []
  });
  const [filter, setFilter] = useState('all');
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
      
      // Fetch all security data in parallel
      const [
        loginAttemptsRes,
        vulnerabilitiesRes,
        auditLogsRes,
        activeSessionsRes,
        sslCertificatesRes,
        firewallStatusRes,
        securityAlertsRes
      ] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/security/login-attempts`),
        fetch(`${API_BASE_URL}/api/security/vulnerabilities`),
        fetch(`${API_BASE_URL}/api/security/audit-logs`),
        fetch(`${API_BASE_URL}/api/security/active-sessions`),
        fetch(`${API_BASE_URL}/api/security/ssl-certificates`),
        fetch(`${API_BASE_URL}/api/security/firewall-status`),
        fetch(`${API_BASE_URL}/api/security/alerts`)
      ]);

      const data = {
        loginAttempts: loginAttemptsRes.status === 'fulfilled' && loginAttemptsRes.value.ok 
          ? (await loginAttemptsRes.value.json()).attempts || [] : [],
        vulnerabilities: vulnerabilitiesRes.status === 'fulfilled' && vulnerabilitiesRes.value.ok 
          ? (await vulnerabilitiesRes.value.json()).vulnerabilities || [] : [],
        auditLogs: auditLogsRes.status === 'fulfilled' && auditLogsRes.value.ok 
          ? (await auditLogsRes.value.json()).logs || [] : [],
        activeSessions: activeSessionsRes.status === 'fulfilled' && activeSessionsRes.value.ok 
          ? (await activeSessionsRes.value.json()).sessions || [] : [],
        sslCertificates: sslCertificatesRes.status === 'fulfilled' && sslCertificatesRes.value.ok 
          ? (await sslCertificatesRes.value.json()).certificates || [] : [],
        firewallStatus: firewallStatusRes.status === 'fulfilled' && firewallStatusRes.value.ok 
          ? (await firewallStatusRes.value.json()) || {} : {},
        securityAlerts: securityAlertsRes.status === 'fulfilled' && securityAlertsRes.value.ok 
          ? (await securityAlertsRes.value.json()).alerts || [] : []
      };

      setSecurityData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch security data:', err);
      setError('Failed to load security information');
    } finally {
      setLoading(false);
    }
  };

  const scanVulnerabilities = async () => {
    try {
      setScanningVulns(true);
      const response = await fetch(`${API_BASE_URL}/api/security/scan-vulnerabilities`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSecurityData(prev => ({
          ...prev,
          vulnerabilities: data.vulnerabilities || []
        }));
      }
    } catch (err) {
      console.error('Vulnerability scan failed:', err);
      setError('Vulnerability scan failed');
    } finally {
      setScanningVulns(false);
    }
  };

  const getSecurityLevel = () => {
    const criticalVulns = securityData.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const highVulns = securityData.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const failedLogins = securityData.loginAttempts.filter(a => !a.success).length;
    
    if (criticalVulns > 0 || failedLogins > 10) {
      return { level: 'CRITICAL', color: '#dc2626', icon: <MdDangerous size={20} /> };
    } else if (highVulns > 0 || failedLogins > 5) {
      return { level: 'HIGH', color: '#ea580c', icon: <MdWarning size={20} /> };
    } else if (securityData.vulnerabilities.length > 0 || failedLogins > 0) {
      return { level: 'MEDIUM', color: '#ca8a04', icon: <MdReportProblem size={20} /> };
    } else {
      return { level: 'SECURE', color: '#16a34a', icon: <MdShield size={20} /> };
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#ca8a04';
      case 'LOW': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const securityLevel = getSecurityLevel();

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <MdSecurity size={64} style={{ marginBottom: '15px', color: '#6b7280' }} />
          <div style={{ color: '#6b7280' }}>Loading security information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <MdError size={64} style={{ marginBottom: '15px', color: '#ef4444' }} />
          <div style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</div>
          <button
            onClick={fetchSecurityData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px 30px',
        marginBottom: '30px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #dc2626, #ea580c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <MdSecurity size={32} /> <span>Security Center</span>
          </h1>
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <button
              onClick={fetchSecurityData}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <MdRefresh size={16} style={{ marginRight: '6px' }} />Refresh
            </button>
            <button
              onClick={scanVulnerabilities}
              disabled={scanningVulns}
              style={{
                padding: '8px 16px',
                backgroundColor: scanningVulns ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: scanningVulns ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {scanningVulns ? (
                <>
                  <MdSearch size={16} style={{ marginRight: '6px' }} />
                  Scanning...
                </>
              ) : (
                <>
                  <MdSearch size={16} style={{ marginRight: '6px' }} />
                  Vulnerability Scan
                </>
              )}
            </button>
          </div>
        </div>

        <div style={{
          color: '#6b7280',
          fontSize: '14px',
          marginBottom: '15px'
        }}>
          Comprehensive security monitoring and threat detection for your server
        </div>

        {/* Security Level Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: securityLevel.level === 'SECURE' ? '#dcfce7' : '#fee2e2',
          borderRadius: '8px',
          border: `1px solid ${securityLevel.color}20`
        }}>
          <span style={{ fontSize: '24px' }}>{securityLevel.icon}</span>
          <div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: securityLevel.color 
            }}>
              Security Level: {securityLevel.level}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {securityLevel.level === 'SECURE' 
                ? 'No immediate security threats detected'
                : 'Security issues require attention'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Security Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <MdDangerous size={24} style={{ color: '#dc2626' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Failed Logins
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
            {securityData.loginAttempts.filter(a => !a.success).length}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <MdSearch size={24} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Vulnerabilities
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c' }}>
            {securityData.vulnerabilities.length}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>👥</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Active Sessions
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
            {securityData.activeSessions.length}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <MdLock size={24} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              SSL Certificates
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {securityData.sslCertificates.length}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <MdShield size={24} style={{ color: '#16a34a' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Firewall Status
            </span>
          </div>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            color: securityData.firewallStatus.active ? '#10b981' : '#ef4444' 
          }}>
            {securityData.firewallStatus.active ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <MdWarning size={24} style={{ color: '#ea580c' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Security Alerts
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {securityData.securityAlerts.length}
          </div>
        </div>
      </div>

      {/* Recent Security Alerts */}
      {securityData.securityAlerts.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          marginBottom: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 30px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#fee2e2'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <MdWarning size={20} style={{ marginRight: '8px' }} /><span>Security Alerts ({securityData.securityAlerts.length})</span>
            </h2>
          </div>

          <div style={{ padding: '0' }}>
            {securityData.securityAlerts.slice(0, 5).map((alert, index) => (
              <div key={index} style={{
                padding: '15px 20px',
                borderBottom: index < 4 ? '1px solid #f3f4f6' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>
                    {alert.severity === 'CRITICAL' ? <MdDangerous style={{ color: '#dc2626' }} /> : 
                     alert.severity === 'HIGH' ? <MdWarning style={{ color: '#ea580c' }} /> : 
                     alert.severity === 'MEDIUM' ? <MdReportProblem style={{ color: '#ca8a04' }} /> : <MdCheckCircle style={{ color: '#16a34a' }} />}
                  </span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {alert.description}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: getSeverityColor(alert.severity),
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    {alert.severity}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {getTimeAgo(alert.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {/* Tab Navigation */}
        <div style={{
          padding: '20px 30px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {['all', 'login-attempts', 'vulnerabilities', 'audit-logs', 'sessions', 'ssl-certs'].map(tabType => (
              <button
                key={tabType}
                onClick={() => setFilter(tabType)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: filter === tabType ? '#3b82f6' : '#f3f4f6',
                  color: filter === tabType ? 'white' : '#374151',
                  border: '1px solid',
                  borderColor: filter === tabType ? '#3b82f6' : '#d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}
              >
                {tabType === 'all' ? 'Overview' :
                 tabType === 'login-attempts' ? 'Login Attempts' :
                 tabType === 'vulnerabilities' ? 'Vulnerabilities' :
                 tabType === 'audit-logs' ? 'Audit Logs' :
                 tabType === 'sessions' ? 'Active Sessions' :
                 tabType === 'ssl-certs' ? 'SSL Certificates' : tabType}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px 30px' }}>
          {filter === 'all' && (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
              <MdSecurity size={96} style={{ marginBottom: '15px', color: '#6b7280' }} />
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                Security Center Overview
              </div>
              <div style={{ fontSize: '14px' }}>
                Select a tab above to view detailed security information
              </div>
            </div>
          )}

          {filter === 'vulnerabilities' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>
                Detected Vulnerabilities ({securityData.vulnerabilities.length})
              </h3>
              {securityData.vulnerabilities.length > 0 ? (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {securityData.vulnerabilities.map((vuln, index) => (
                    <div key={index} style={{
                      padding: '15px',
                      border: `1px solid ${getSeverityColor(vuln.severity)}40`,
                      borderRadius: '8px',
                      backgroundColor: `${getSeverityColor(vuln.severity)}08`
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '10px'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '5px' }}>
                            {vuln.package} {vuln.version}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {vuln.description}
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          backgroundColor: getSeverityColor(vuln.severity),
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {vuln.severity}
                        </div>
                      </div>
                      {vuln.solution && (
                        <div style={{
                          fontSize: '14px',
                          color: '#059669',
                          backgroundColor: '#ecfdf5',
                          padding: '8px',
                          borderRadius: '4px',
                          marginTop: '10px'
                        }}>
                          <strong>Solution:</strong> {vuln.solution}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                  <MdCheckCircle size={96} style={{ marginBottom: '15px', color: '#10b981' }} />
                  <div>No vulnerabilities detected</div>
                </div>
              )}
            </div>
          )}

          {/* Add more tab content here... */}
        </div>
      </div>
    </div>
  );
};

export default SecurityCenter;
