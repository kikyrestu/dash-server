import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const FileManagerTailwind = () => {
  const [currentPath, setCurrentPath] = useState('/home');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.type === 'directory') {
      return file.name === '..' ? '⬅️' : '📁';
    }
    
    const ext = file.name.split('.').pop().toLowerCase();
    switch (ext) {
      case 'txt': return '📝';
      case 'pdf': return '📕';
      case 'doc': case 'docx': return '📘';
      case 'xls': case 'xlsx': return '📗';
      case 'ppt': case 'pptx': return '📙';
      case 'zip': case 'tar': case 'gz': case 'rar': return '📦';
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': return '🖼️';
      case 'mp3': case 'wav': case 'flac': return '🎵';
      case 'mp4': case 'avi': case 'mkv': case 'mov': return '🎬';
      case 'js': case 'jsx': case 'ts': case 'tsx': return '⚡';
      case 'html': case 'css': return '🌐';
      case 'json': return '⚙️';
      case 'sh': case 'bash': return '🔧';
      case 'py': return '🐍';
      default: return '📄';
    }
  };

  const getFileTypeColor = (file) => {
    if (file.type === 'directory') {
      return 'text-blue-600';
    }
    
    const ext = file.name.split('.').pop().toLowerCase();
    switch (ext) {
      case 'txt': case 'md': return 'text-gray-600';
      case 'pdf': return 'text-red-600';
      case 'doc': case 'docx': return 'text-blue-600';
      case 'xls': case 'xlsx': return 'text-green-600';
      case 'ppt': case 'pptx': return 'text-orange-600';
      case 'zip': case 'tar': case 'gz': case 'rar': return 'text-purple-600';
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': return 'text-pink-600';
      case 'mp3': case 'wav': case 'flac': return 'text-indigo-600';
      case 'mp4': case 'avi': case 'mkv': case 'mov': return 'text-red-600';
      case 'js': case 'jsx': case 'ts': case 'tsx': return 'text-yellow-600';
      case 'html': case 'css': return 'text-blue-600';
      case 'json': return 'text-gray-600';
      case 'sh': case 'bash': return 'text-green-600';
      case 'py': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };

  const handleFileClick = async (file) => {
    if (file.type === 'directory') {
      if (file.name === '..') {
        const pathParts = currentPath.split('/').filter(part => part);
        pathParts.pop();
        setCurrentPath('/' + pathParts.join('/'));
      } else {
        setCurrentPath(currentPath + '/' + file.name);
      }
    } else {
      // Handle file opening/downloading
      try {
        const response = await fetch(`${API_BASE_URL}/api/files/download?path=${encodeURIComponent(currentPath + '/' + file.name)}`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      } catch (err) {
        console.error('Failed to download file:', err);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('path', currentPath);

    try {
      const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        loadFiles();
        setShowUploadModal(false);
      } else {
        setError('Upload failed');
      }
    } catch (err) {
      setError('Upload error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/files/mkdir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          name: newFolderName
        })
      });

      if (response.ok) {
        loadFiles();
        setShowFolderModal(false);
        setNewFolderName('');
      } else {
        setError('Failed to create folder');
      }
    } catch (err) {
      setError('Error creating folder: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-card border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            <span className="text-gray-700 font-medium">Loading files...</span>
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                📁 File Manager
              </h1>
              <p className="text-gray-600 mt-2">Browse and manage your server files</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🔲 Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 List
                </button>
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 flex items-center gap-2 font-medium"
              >
                📤 Upload
              </button>
              <button
                onClick={() => setShowFolderModal(true)}
                className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors duration-200 flex items-center gap-2 font-medium"
              >
                📁 New Folder
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-white rounded-xl shadow-card border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">📍 Path:</span>
            <code className="bg-gray-100 px-3 py-1 rounded-md font-mono text-primary-600 font-medium">
              {currentPath}
            </code>
            <button
              onClick={loadFiles}
              className="ml-auto p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Refresh"
            >
              🔄
            </button>
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

        {/* Files Grid/List */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-6">
          {files.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-500">This directory is empty</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  onClick={() => handleFileClick(file)}
                  className="group cursor-pointer p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 hover:scale-105 bg-gradient-to-br from-gray-50 to-white"
                >
                  <div className="text-center space-y-3">
                    <div className="text-4xl group-hover:scale-110 transition-transform duration-200">
                      {getFileIcon(file)}
                    </div>
                    <div className="space-y-1">
                      <p className={`text-sm font-medium truncate ${getFileTypeColor(file)} group-hover:text-primary-600`}>
                        {file.name}
                      </p>
                      {file.type === 'file' && (
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {files.map((file, index) => (
                <div
                  key={index}
                  onClick={() => handleFileClick(file)}
                  className="group cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-transparent hover:border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
                      {getFileIcon(file)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${getFileTypeColor(file)} group-hover:text-primary-600`}>
                        {file.name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>{file.modified}</span>
                        {file.type === 'file' && <span>{formatFileSize(file.size)}</span>}
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{file.permissions}</code>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📤 Upload Files
            </h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors duration-200">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-gray-600">Click to select files</p>
                  <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                </label>
              </div>
              
              {uploading && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                  <span className="text-primary-700">Uploading...</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📁 Create New Folder
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFolderModal(false);
                    setNewFolderName('');
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createFolder}
                  className="flex-1 py-2 px-4 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors duration-200 font-medium"
                  disabled={!newFolderName.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManagerTailwind;
