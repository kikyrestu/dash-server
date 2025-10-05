import React, { useState, useEffect } from 'react';
import LineChart from './LineChart';
import {
  MdFolder,
  MdKeyboardArrowUp,
  MdDescription,
  MdCode,
  MdSettingsApplications,
  MdFlash,
  MdArchive,
  MdImage,
  MdMovie,
  MdMusicNote,
  MdCreateNewFolder,
  MdUpload,
  MdRefresh,
  MdError,
  MdDelete,
  MdContentCut,
  MdContentPaste,
  MdDownload,
  MdClose,
  MdHome,
  MdPieChart,
  MdBarChart,
  MdTrendingUp
} from 'react-icons/md';
import { API_BASE_URL } from '../config/api';

const FileManager = () => {
  const [currentPath, setCurrentPath] = useState('/home');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [storageHistory, setStorageHistory] = useState([]);

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/files?path=${encodeURIComponent(currentPath)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setFiles(result.files || []);
    } catch (err) {
      console.error('Failed to load files:', err);
      setError('Failed to load files: ' + err.message);
      // Fallback to mock data on error
      setFiles([
        { name: '..', type: 'directory', size: 0, modified: '2024-06-28', permissions: 'drwxr-xr-x' },
        { name: 'Documents', type: 'directory', size: 0, modified: '2024-06-28', permissions: 'drwxr-xr-x' },
        { name: 'Downloads', type: 'directory', size: 0, modified: '2024-06-27', permissions: 'drwxr-xr-x' },
        { name: 'Pictures', type: 'directory', size: 0, modified: '2024-06-26', permissions: 'drwxr-xr-x' },
        { name: 'server-config.json', type: 'file', size: 2048, modified: '2024-06-28', permissions: '-rw-r--r--' },
        { name: 'backup.tar.gz', type: 'file', size: 104857600, modified: '2024-06-27', permissions: '-rw-r--r--' },
        { name: 'logs', type: 'directory', size: 0, modified: '2024-06-28', permissions: 'drwxr-xr-x' },
        { name: 'script.sh', type: 'file', size: 1024, modified: '2024-06-28', permissions: '-rwxr-xr-x' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    const iconProps = { size: 20, style: { marginRight: '8px' } };
    
    if (file.type === 'directory') {
      if (file.name === '..') return <MdKeyboardArrowUp {...iconProps} />;
      return <MdFolder {...iconProps} />;
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'txt': case 'md': return <MdDescription {...iconProps} />;
      case 'js': case 'jsx': case 'ts': case 'tsx': return <MdCode {...iconProps} />;
      case 'json': return <MdSettingsApplications {...iconProps} />;
      case 'sh': return <MdFlash {...iconProps} />;
      case 'tar': case 'gz': case 'zip': return <MdArchive {...iconProps} />;
      case 'jpg': case 'png': case 'gif': return <MdImage {...iconProps} />;
      case 'mp4': case 'avi': return <MdMovie {...iconProps} />;
      case 'mp3': case 'wav': return <MdMusicNote {...iconProps} />;
      default: return <MdDescription {...iconProps} />;
    }
  };

  const handleFileClick = (file) => {
    if (file.type === 'directory') {
      if (file.name === '..') {
        // Go up one directory
        const pathParts = currentPath.split('/').filter(p => p);
        pathParts.pop();
        const newPath = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';
        setCurrentPath(newPath);
      } else {
        // Go into subdirectory
        const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
        setCurrentPath(newPath);
      }
      setSelectedFiles([]); // Clear selection when navigating
    }
  };

  const handleFileSelect = (fileName) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileName)) {
        return prev.filter(f => f !== fileName);
      } else {
        return [...prev, fileName];
      }
    });
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', currentPath);

      const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setShowUploadModal(false);
        loadFiles(); // Refresh file list
        setError(null);
      } else {
        setError('Upload failed: ' + result.error);
      }
    } catch (error) {
      setError('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/files/mkdir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderName: newFolderName.trim(),
          path: currentPath
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowFolderModal(false);
        setNewFolderName('');
        loadFiles(); // Refresh file list
        setError(null);
      } else {
        setError('Failed to create folder: ' + result.error);
      }
    } catch (error) {
      setError('Failed to create folder: ' + error.message);
    }
  };

  // Analytics functions
  const getFileTypeDistribution = () => {
    const distribution = {};
    files.forEach(file => {
      if (file.type === 'directory') {
        distribution['Folders'] = (distribution['Folders'] || 0) + 1;
      } else {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const category = getFileCategory(ext);
        distribution[category] = (distribution[category] || 0) + 1;
      }
    });
    return distribution;
  };

  const getFileCategory = (ext) => {
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c'].includes(ext)) return 'Code';
    if (['jpg', 'png', 'gif', 'bmp', 'svg', 'ico'].includes(ext)) return 'Images';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(ext)) return 'Videos';
    if (['mp3', 'wav', 'flac', 'aac'].includes(ext)) return 'Audio';
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return 'Documents';
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return 'Archives';
    return 'Other';
  };

  const getSizeDistribution = () => {
    const total = files.reduce((sum, file) => sum + (file.size || 0), 0);
    return files.filter(f => f.type !== 'directory').map(file => ({
      name: file.name,
      size: file.size || 0,
      percentage: total > 0 ? ((file.size || 0) / total * 100).toFixed(1) : 0
    })).sort((a, b) => b.size - a.size).slice(0, 10);
  };

  const generateStorageData = () => {
    // Simulate storage usage over time
    const data = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date();
      hour.setHours(hour.getHours() - i);
      const usage = 60 + Math.random() * 30 + Math.sin(i * 0.1) * 10;
      data.push({
        time: hour.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        usage: Math.round(usage)
      });
    }
    return data;
  };

  useEffect(() => {
    setStorageHistory(generateStorageData());
  }, [currentPath]);

  const breadcrumbParts = currentPath.split('/').filter(p => p);

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Enhanced Header with Analytics Toggle */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px 30px',
        marginBottom: '20px',
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
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <MdFolder size={32} /> <span>File Manager</span>
          </h1>
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <button 
              onClick={() => setShowAnalytics(!showAnalytics)}
              style={{
                padding: '8px 16px',
                backgroundColor: showAnalytics ? '#8b5cf6' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <MdBarChart size={16} />
              {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </button>
            <button 
              onClick={() => setShowUploadModal(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <MdUpload size={16} style={{ marginRight: '6px' }} />Upload
            </button>
            <button 
              onClick={() => setShowFolderModal(true)}
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
              <MdCreateNewFolder size={16} style={{ marginRight: '6px' }} />New Folder
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          <button
            onClick={() => setCurrentPath('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <MdHome size={14} style={{ marginRight: '4px' }} />Home
          </button>
          {breadcrumbParts.map((part, index) => (
            <React.Fragment key={index}>
              <span>/</span>
              <button
                onClick={() => {
                  const newPath = '/' + breadcrumbParts.slice(0, index + 1).join('/');
                  setCurrentPath(newPath);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: index === breadcrumbParts.length - 1 ? '#374151' : '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: index === breadcrumbParts.length - 1 ? '600' : 'normal'
                }}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Analytics Toggle */}
        <div style={{
          marginTop: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          color: '#374151'
        }}>
          <input
            type="checkbox"
            checked={showAnalytics}
            onChange={(e) => setShowAnalytics(e.target.checked)}
            style={{
              cursor: 'pointer',
              width: '20px',
              height: '20px',
              accentColor: '#3b82f6'
            }}
          />
          <span>Show Analytics</span>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div style={{
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {/* Storage Usage Trend */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <MdTrendingUp size={20} style={{ color: '#3b82f6' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Storage Usage (24h)
              </h3>
            </div>
            <LineChart 
              data={storageHistory.map(d => d.usage)}
              title=""
              color="#3b82f6"
              height={120}
            />
          </div>

          {/* File Type Distribution */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <MdPieChart size={20} style={{ color: '#8b5cf6' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                File Type Distribution
              </h3>
            </div>
            <div style={{ height: '120px', overflow: 'auto' }}>
              {Object.entries(getFileTypeDistribution()).map(([type, count], index) => (
                <div key={type} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < Object.keys(getFileTypeDistribution()).length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '2px',
                      backgroundColor: `hsl(${index * 40}, 70%, 50%)`
                    }}></div>
                    <span style={{ fontSize: '14px', color: '#374151' }}>{type}</span>
                  </div>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#6b7280',
                    minWidth: '30px',
                    textAlign: 'right'
                  }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Largest Files */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <MdBarChart size={20} style={{ color: '#10b981' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Largest Files
              </h3>
            </div>
            <div style={{ height: '120px', overflow: 'auto' }}>
              {getSizeDistribution().slice(0, 5).map((file, index) => (
                <div key={file.name} style={{
                  padding: '8px 0',
                  borderBottom: index < 4 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ 
                      fontSize: '13px', 
                      color: '#374151',
                      fontWeight: '500',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '150px'
                    }}>
                      {file.name}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(file.percentage, 100)}%`,
                      height: '100%',
                      backgroundColor: '#10b981',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Directory Statistics */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <MdFolder size={20} style={{ color: '#f59e0b' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Directory Stats
              </h3>
            </div>
            <div style={{ height: '120px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
                height: '100%'
              }}>
                <div style={{
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  borderRadius: '8px',
                  padding: '10px'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af' }}>
                    {files.filter(f => f.type === 'directory' && f.name !== '..').length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Folders</div>
                </div>
                <div style={{
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                  borderRadius: '8px',
                  padding: '10px'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }}>
                    {files.filter(f => f.type !== 'directory').length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Files</div>
                </div>
                <div style={{
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
                  borderRadius: '8px',
                  padding: '10px'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#92400e' }}>
                    {formatFileSize(files.reduce((sum, f) => sum + (f.size || 0), 0))}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Size</div>
                </div>
                <div style={{
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
                  borderRadius: '8px',
                  padding: '10px'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#be185d' }}>
                    {currentPath.split('/').filter(p => p).length + 1}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Depth</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 1fr 120px 120px 100px',
          gap: '15px',
          padding: '15px 20px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e5e7eb',
          fontSize: '12px',
          fontWeight: '600',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          <div></div>
          <div>Name</div>
          <div>Size</div>
          <div>Modified</div>
          <div>Permissions</div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '15px'
            }}></div>
            <div>Loading files...</div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#ef4444'
          }}>
            <MdError size={48} style={{ marginBottom: '10px' }} />
            {error}
          </div>
        )}

        {/* File List */}
        {!loading && !error && files.map((file, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 120px 120px 100px',
              gap: '15px',
              padding: '12px 20px',
              borderBottom: index < files.length - 1 ? '1px solid #f3f4f6' : 'none',
              backgroundColor: selectedFiles.includes(file.name) ? '#eff6ff' : 'transparent',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!selectedFiles.includes(file.name)) {
                e.target.style.backgroundColor = '#f8fafc';
              }
            }}
            onMouseLeave={(e) => {
              if (!selectedFiles.includes(file.name)) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
            onClick={() => handleFileClick(file)}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <input
                type="checkbox"
                checked={selectedFiles.includes(file.name)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleFileSelect(file.name);
                }}
                style={{
                  margin: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              <span style={{ fontSize: '16px' }}>
                {getFileIcon(file)}
              </span>
              {file.name}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#6b7280'
            }}>
              {file.type === 'directory' && file.name !== '..' ? '-' : formatFileSize(file.size)}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#6b7280'
            }}>
              {file.modified}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              fontFamily: 'monospace'
            }}>
              {file.permissions}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {!loading && !error && files.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <MdFolder size={96} style={{ marginBottom: '15px', color: '#d1d5db' }} />
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '5px' }}>
              Folder is empty
            </div>
            <div style={{ fontSize: '14px' }}>
              No files or folders found in this directory
            </div>
          </div>
        )}
      </div>

      {/* Selection Actions */}
      {selectedFiles.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'white',
          borderRadius: '12px',
          padding: '15px 20px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <span style={{
            fontSize: '14px',
            color: '#374151',
            fontWeight: '500'
          }}>
            {selectedFiles.length} item{selectedFiles.length > 1 ? 's' : ''} selected
          </span>
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button style={{
              padding: '6px 12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              <MdDelete size={14} style={{ marginRight: '4px' }} />Delete
            </button>
            <button style={{
              padding: '6px 12px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              <MdContentPaste size={14} style={{ marginRight: '4px' }} />Copy
            </button>
            <button style={{
              padding: '6px 12px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              <MdContentCut size={14} style={{ marginRight: '4px' }} />Cut
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            minWidth: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <MdUpload size={20} style={{ marginRight: '8px' }} />Upload File
            </h3>
            
            <p style={{
              margin: '0 0 20px 0',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Upload to: <strong>{currentPath}</strong>
            </p>

            {error && (
              <div style={{
                background: '#fee2e2',
                color: '#dc2626',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <input
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '20px',
                boxSizing: 'border-box'
              }}
            />

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              {uploading && (
                <button
                  disabled
                  style={{
                    padding: '10px 20px',
                    background: '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'not-allowed'
                  }}
                >
                  Uploading...
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showFolderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            minWidth: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <MdCreateNewFolder size={20} style={{ marginRight: '8px' }} />Create New Folder
            </h3>

            <p style={{
              margin: '0 0 20px 0',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Create in: <strong>{currentPath}</strong>
            </p>

            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newFolderName.trim()) {
                  handleCreateFolder();
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '20px',
                boxSizing: 'border-box'
              }}
              autoFocus
            />

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowFolderModal(false);
                  setNewFolderName('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                style={{
                  padding: '10px 20px',
                  background: newFolderName.trim() ? '#10b981' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: newFolderName.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
