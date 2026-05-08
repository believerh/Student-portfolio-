import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText, Video, Image, Music, Loader2 } from 'lucide-react';

const VALID_EXTENSIONS = {
  video: ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'],
  audio: ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma'],
  text: ['.pdf', '.doc', '.docx', '.txt', '.md', '.json'],
};

const fileIcon = (type) => {
  if (type.startsWith('video/')) return Video;
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('audio/')) return Music;
  return FileText;
};

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const DropZone = ({
  onUpload,
  fileType,
  darkMode = true,
  maxSizeMB = 100,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const inputRef = useRef(null);

  const validateFile = useCallback((file) => {
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) return { valid: false, error: `File too large (max ${maxSizeMB}MB)` };

    const exts = VALID_EXTENSIONS[fileType] || [];
    const fileName = file.name.toLowerCase();
    const hasValidExt = exts.some(ext => fileName.endsWith(ext));
    const hasValidType = file.type.startsWith(fileType === 'text' ? 'application/' : fileType + '/');

    if (!hasValidExt && !hasValidType) {
      return { valid: false, error: `Invalid file type for ${fileType}` };
    }
    return { valid: true };
  }, [fileType, maxSizeMB]);

  const processFiles = useCallback((files) => {
    const newItems = Array.from(files).map((file) => {
      const validation = validateFile(file);
      return {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: validation.valid ? 'queued' : 'error',
        error: validation.error || null,
        progress: 0,
      };
    });

    setUploadQueue(prev => [...prev, ...newItems]);

    // Upload valid files
    newItems.forEach((item) => {
      if (item.status === 'queued') {
        onUpload(item.file, fileType, item.id, (progress) => {
          setUploadQueue(prev =>
            prev.map(q => q.id === item.id ? { ...q, progress } : q)
          );
        }).then(() => {
          setUploadQueue(prev =>
            prev.map(q => q.id === item.id ? { ...q, status: 'done', progress: 100 } : q)
          );
        }).catch((err) => {
          setUploadQueue(prev =>
            prev.map(q => q.id === item.id ? { ...q, status: 'error', error: err.message } : q)
          );
        });
      }
    });
  }, [onUpload, fileType, validateFile]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files.length) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeItem = (id) => {
    setUploadQueue(prev => prev.filter(q => q.id !== id));
  };

  const clearDone = () => {
    setUploadQueue(prev => prev.filter(q => q.status !== 'done'));
  };

  const Icon = fileIcon(fileType);
  const doneCount = uploadQueue.filter(q => q.status === 'done').length;

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02]'
            : darkMode
            ? 'border-gray-600 hover:border-indigo-500 hover:bg-gray-800/50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
        }`}
        role="button"
        aria-label="Drop files here or click to upload"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={fileType === 'video' ? 'video/*' : fileType === 'image' ? 'image/*' : fileType === 'audio' ? 'audio/*' : '.pdf,.doc,.docx,.txt,.md'}
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />
        <Icon className={`w-12 h-12 mx-auto mb-3 transition-colors ${isDragging ? 'text-cyan-400' : darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        <p className={`font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          or click to browse • Max {maxSizeMB}MB per file
        </p>
        <p className={`text-xs mt-2 capitalize ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          Accepted: {VALID_EXTENSIONS[fileType]?.join(', ')}
        </p>
      </div>

      {/* Upload queue */}
      {uploadQueue.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Upload Queue ({doneCount}/{uploadQueue.length} complete)
            </p>
            {doneCount > 0 && (
              <button onClick={clearDone} className="text-xs text-cyan-500 hover:text-cyan-400">
                Clear completed
              </button>
            )}
          </div>
          {uploadQueue.map((item) => {
            const ItemIcon = fileIcon(item.type);
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  item.status === 'error'
                    ? 'border-red-500/50 bg-red-500/10'
                    : item.status === 'done'
                    ? 'border-green-500/50 bg-green-500/10'
                    : darkMode
                    ? 'border-gray-700 bg-gray-900/50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <ItemIcon className={`w-5 h-5 flex-shrink-0 ${
                  item.status === 'error' ? 'text-red-400' :
                  item.status === 'done' ? 'text-green-400' :
                  'text-cyan-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.name}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatSize(item.size)}</p>
                  {item.status === 'uploading' && (
                    <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 transition-all duration-300 rounded-full"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  {item.error && (
                    <p className="text-xs text-red-400 mt-1">{item.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  )}
                  {item.status === 'done' && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                    aria-label="Remove from queue"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropZone;
