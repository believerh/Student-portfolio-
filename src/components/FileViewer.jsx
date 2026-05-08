import React, { useState, memo, useEffect, useRef } from 'react';
import { FileText, Image, Video, Music, Eye, Trash2, Share2, MessageSquare, Heart, Send, X, Loader2, CircleHelp, Download, RefreshCw, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useKeyboardClose } from '../hooks/a11y';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const FileViewer = memo(function FileViewer(props) {
  const {
    file,
    canDelete,
    onDelete,
    showActions = true,
    darkMode,
    comments,
    likes,
    currentUser,
    handleLikeFile,
    handleAddComment,
    setSelectedFileForShare,
    setShowShareModal,
    dbConfig,
    showNotification,
    versions = [],
    onCreateVersion,
    onRestoreVersion,
    onGetSimilar,
  } = props;
  const [showPreview, setShowPreview] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [fileTags, setFileTags] = useState([]);
  const [fileSummary, setFileSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const versionFileInputRef = useRef(null);
  // Image zoom/pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panX = pan.x;
  const panY = pan.y;
  // PDF viewer state
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfScale, setPdfScale] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [similarFiles, setSimilarFiles] = useState([]);
  const [showSimilar, setShowSimilar] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  useKeyboardClose(showPreview, () => setShowPreview(false));
  const mediaRef = useRef(null);

  useEffect(() => {
    if (showPreview && !mediaLoaded) {
      setMediaLoading(true);
    }
  }, [showPreview, mediaLoaded]);

  const handleMediaLoad = () => {
    setMediaLoading(false);
    setMediaLoaded(true);
  };

  // Image zoom/pan handlers
  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    if (zoom <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX - panX, y: touch.clientY - panY };
  };

  const handleTouchMove = (e) => {
    if (!isDragging || zoom <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.current.x,
      y: touch.clientY - dragStart.current.y,
    });
  };

  const handleVersionClick = () => {
    versionFileInputRef.current?.click();
  };

  const handleVersionFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file && onCreateVersion) {
      await onCreateVersion(file.id, file);
      if (versionFileInputRef.current) versionFileInputRef.current.value = '';
    }
  };

  const handleRestoreVersionClick = (versionId) => {
    if (onRestoreVersion) {
      onRestoreVersion(file.id, versionId);
    }
  };

  const fileComments = comments?.[file.id] || [];
  const fileLikes = likes?.[file.id] || [];
  const currentUserId = currentUser?.dbId || currentUser?.id;
  const isLiked = currentUserId ? fileLikes.includes(currentUserId) : false;

  // Load AI-generated tags and summary for this file
  useEffect(() => {
    const loadAIData = async () => {
      if (!file?.id) return;
      if (!dbConfig?.url || !dbConfig?.key) return;

      const headers = {
        'apikey': dbConfig.key,
        'Authorization': `Bearer ${dbConfig.key}`,
      };

      const baseUrl = dbConfig.url;
      
      try {
        // Load tags
        const tagsResponse = await fetch(`${baseUrl}/rest/v1/file_tags?file_id=eq.${file.id}&select=tag`, { headers });
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          const tags = tagsData.map(t => t.tag);
          setFileTags(tags);
        }
        
        // Load summary
        const summaryResponse = await fetch(`${baseUrl}/rest/v1/file_summaries?file_id=eq.${file.id}&select=summary`, { headers });
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          const summary = summaryData.length > 0 ? summaryData[0].summary : '';
          setFileSummary(summary);
        }
        
        // Load/update analytics (view count)
        const analyticsResponse = await fetch(`${baseUrl}/rest/v1/file_analytics?file_id=eq.${file.id}&select=*`, { headers });
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          if (analyticsData.length > 0) {
            const analyticsRecord = analyticsData[0];
            await fetch(`${baseUrl}/rest/v1/file_analytics?id=eq.${analyticsRecord.id}`, {
              method: 'PATCH',
              headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
              },
              body: JSON.stringify({
                view_count: analyticsRecord.view_count + 1,
                last_accessed: new Date().toISOString(),
              }),
            });
          } else {
            await fetch(`${baseUrl}/rest/v1/file_analytics`, {
              method: 'POST',
              headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
              },
              body: JSON.stringify({
                file_id: file.id,
                view_count: 1,
                last_accessed: new Date().toISOString(),
              }),
            });
          }
        }
      } catch (error) {
        console.warn('Failed to load AI/analytics data for file:', error);
      }
    };
    
    loadAIData();
  }, [file?.id, dbConfig]);

  return (
    <div className={`border-2 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100'} rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all duration-300`}>
      {/* Header row: file info + actions */}
      <div className="flex items-center justify-between p-2 sm:p-4 gap-2">
        {/* File info */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
            file.type === 'video' ? (darkMode ? 'bg-indigo-900' : 'bg-indigo-100') :
            file.type === 'image' ? (darkMode ? 'bg-green-900' : 'bg-green-100') :
            file.type === 'text' ? (darkMode ? 'bg-blue-900' : 'bg-blue-100') : (darkMode ? 'bg-purple-900' : 'bg-purple-100')
          }`}>
            {file.type === 'video' && <Video className={`w-5 h-5 sm:w-6 sm:h-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />}
            {file.type === 'image' && <Image className={`w-5 h-5 sm:w-6 sm:h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />}
            {file.type === 'text' && <FileText className={`w-5 h-5 sm:w-6 sm:h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
            {file.type === 'audio' && <Music className={`w-5 h-5 sm:w-6 sm:h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>{file.name}</p>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{file.upload_date || file.uploadDate} • {file.size}</p>

            {/* AI Tags */}
            {fileTags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {fileTags.map((tag, index) => (
                  <span key={`${file.id}-tag-${index}`} className={`px-1.5 py-0.5 text-xs ${darkMode ? 'bg-gray-600/50 text-gray-200' : 'bg-gray-100/50 text-gray-700'} rounded-full`}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* AI Summary */}
            {fileSummary && (
              <div className="mt-1">
                <div
                  onMouseEnter={() => setShowSummary(true)}
                  onMouseLeave={() => setShowSummary(false)}
                  className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-600'} cursor-help`}
                >
                  <CircleHelp className="w-3 h-3" />
                  <span>Summary</span>
                </div>
                {showSummary && (
                  <div className={`mt-1 p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} text-xs ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {fileSummary}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {showActions && (
            <>
              <button
                onClick={() => handleLikeFile(file.id)}
                aria-label={isLiked ? 'Unlike file' : 'Like file'}
                aria-pressed={isLiked}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all ${
                  isLiked
                    ? 'bg-red-100 text-red-600'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs sm:text-sm hidden sm:inline">{fileLikes.length}</span>
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                aria-label={`${showComments ? 'Hide' : 'Show'} comments`}
                aria-expanded={showComments}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-all`}
              >
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">{fileComments.length}</span>
              </button>
              {(currentUser?.role === 'student' || currentUser?.role === 'teacher' || currentUser?.role === 'admin') && (
                <button
                  onClick={() => {
                    setSelectedFileForShare(file.id);
                    setShowShareModal(true);
                  }}
                  className={`flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg ${darkMode ? 'bg-purple-900 text-purple-300 hover:bg-purple-800' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'} transition-all`}
                >
                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline text-sm">Share</span>
                </button>
              )}
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = file.data;
                  link.download = file.name;
                  link.click();
                  if (showNotification) showNotification(`Downloading ${file.name}`);
                }}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${darkMode ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} transition-all`}
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline text-sm">Download</span>
              </button>
              {(file.type === 'video' || file.type === 'image' || file.type === 'audio') && (
                <button
                  onClick={() => {
                    setMediaLoaded(false);
                    setMediaLoading(true);
                    if (showNotification) showNotification('Refreshing preview...');
                  }}
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-all`}
                >
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline text-sm">Refresh</span>
                </button>
              )}
              {/* Version History button */}
              {onCreateVersion && (
                <button
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  aria-expanded={showVersionHistory}
                  aria-controls={`version-history-${file.id}`}
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-all`}
                  aria-label="File version history"
                >
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline text-sm">Versions</span>
                </button>
              )}
              {/* Similar Files button */}
              {onGetSimilar && (
                <button
                  onClick={async () => {
                    setShowSimilar(!showSimilar);
                    if (!showSimilar) {
                      setLoadingSimilar(true);
                      const results = await onGetSimilar(file.id, 5);
                      setSimilarFiles(results);
                      setLoadingSimilar(false);
                    }
                  }}
                  aria-expanded={showSimilar}
                  aria-controls={`similar-files-${file.id}`}
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-all`}
                  aria-label="Similar files"
                >
                  <CircleHelp className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline text-sm">Similar</span>
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setShowPreview(!showPreview)}
            aria-expanded={showPreview}
            aria-controls={`file-preview-${file.id}`}
            aria-label={showPreview ? 'Close file preview' : 'View file preview'}
            className={`flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg ${darkMode ? 'bg-indigo-900 text-indigo-300 hover:bg-indigo-800' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'} transition-all duration-200 text-xs sm:text-sm`}
          >
            {showPreview ? <X className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
            <span className="hidden sm:inline">{showPreview ? 'Close' : 'View'}</span>
          </button>
          {canDelete && (
            <button
              onClick={() => onDelete(file.id)}
              aria-label="Delete file"
              className={`${darkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-500 hover:bg-red-50'} p-1.5 sm:p-2 rounded-lg transition-all duration-200`}
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className={`px-2 sm:px-4 pb-2 sm:pb-4 border-t-2 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} animate-slide-down`}>
          <div className="py-3 sm:py-4 space-y-2 sm:space-y-3">
            {fileComments.map(comment => (
              <div key={comment.id} className={`p-2 sm:p-3 rounded-lg ${
                comment.user_role === 'teacher'
                  ? darkMode ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'
                  : darkMode ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                  <span className={`font-semibold text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>{comment.user_name}</span>
                  {comment.user_role === 'teacher' && (
                    <span className="text-[10px] sm:text-xs bg-purple-600 text-white px-1.5 sm:px-2 py-0.5 rounded-full">Teacher</span>
                  )}
                  <span className={`text-[10px] sm:text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{comment.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className={`flex-1 p-2 text-sm border-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'} rounded-lg focus:border-indigo-500 outline-none`}
              aria-label="Add a comment"
            />
            <button
              onClick={() => {
                if (commentText.trim()) {
                  handleAddComment(file.id, commentText);
                  setCommentText('');
                }
              }}
              aria-label="Send comment"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:shadow-lg transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Version History */}
      {showVersionHistory && (
        <div className={`px-2 sm:px-4 pb-3 sm:pb-4 border-t-2 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} animate-slide-down`} id={`version-history-${file.id}`} role="region" aria-label="File version history">
          <div className="py-3 sm:py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-800'}`}>Version History</h3>
              {/* Upload new version button */}
              <input
                type="file"
                ref={versionFileInputRef}
                onChange={handleVersionFileChange}
                className="hidden"
                aria-label="Upload new version"
              />
              {onCreateVersion && (
                <button
                  onClick={handleVersionClick}
                  className={`flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'} transition-all text-xs sm:text-sm`}
                  aria-label="Create new version"
                >
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>New Version</span>
                </button>
              )}
            </div>

            {versions.length === 0 ? (
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No previous versions</p>
            ) : (
              <div className="space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white border'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>
                        Version {v.version_number}
                      </p>
                      <p className={`text-[10px] sm:text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(v.created_at).toLocaleString()} • {v.size} • {v.mime_type}
                      </p>
                      {v.notes && (
                        <p className={`text-[10px] sm:text-xs mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{v.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRestoreVersionClick(v.id)}
                      className={`ml-2 px-2 sm:px-3 py-1 rounded text-xs ${darkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all`}
                      aria-label={`Restore version ${v.version_number}`}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media preview */}

      {/* Similar Files */}
      {showSimilar && (
        <div
          className={`px-2 sm:px-4 pb-3 sm:pb-4 border-t-2 ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          } animate-slide-down`}
          id={`similar-files-${file.id}`}
          role='region'
          aria-label='Similar files'
        >
          <div className='py-3 sm:py-4'>
            <h3 className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>
              Similar Files
            </h3>
            {loadingSimilar ? (
              <div className='flex items-center justify-center p-4'>
                <Loader2 className='w-5 h-5 animate-spin' aria-hidden={true} />
                <span className='ml-2 text-sm'>Finding similar files...</span>
              </div>
            ) : similarFiles.length === 0 ? (
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No similar files found
              </p>
            ) : (
              <div className='space-y-2'>
                {similarFiles.map((similar) => (
                  <div
                    key={similar.file_id}
                    className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-white border'
                    }`}
                  >
                    <div className='flex-1 min-w-0'>
                      <p className={`text-xs sm:text-sm font-medium truncate ${
                        darkMode ? 'text-white' : 'text-gray-800'
                      }`}
                        title={similar.file_name}
                      >
                        {similar.file_name}
                      </p>
                      <p className={`text-[10px] sm:text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {similar.file_type || 'file'} • {similar.similarity ? `${(similar.similarity * 100).toFixed(0)}% match` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        console.log('Open similar file:', similar.file_id);
                      }}
                      className={`ml-2 px-2 sm:px-3 py-1 rounded text-xs ${
                        darkMode
                          ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } transition-all`}
                      aria-label={`Open ${similar.file_name}`}
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media preview */}
      {showPreview && (
        <div
          id={`file-preview-${file.id}`}
          role="region"
          aria-label={`File preview: ${file.name}`}
          className={`p-2 sm:p-4 ${darkMode ? 'bg-gray-900 border-t-2 border-gray-700' : 'bg-gray-50 border-t-2 border-gray-200'} animate-slide-down`}
        >
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>{file.name}</h3>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {file.type.toUpperCase()} • {file.size}
              </span>
            </div>
          </div>

          {file.type === 'video' && (
            <div className="relative" ref={mediaRef}>
              {mediaLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg h-48 sm:h-96 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
              <video
                controls
                className="w-full max-h-48 sm:max-h-96 rounded-lg bg-black"
                preload="metadata"
                onLoadedData={handleMediaLoad}
                onPlay={() => setMediaLoading(false)}
                onPause={() => {}}
                onEnded={() => {}}
              >
                <source src={file.data} type={file.mime_type || file.mimeType} />
                Your browser does not support video playback.
              </video>
              {/* Fullscreen button overlay */}
              <button
                onClick={() => {
                  const vid = mediaRef.current?.querySelector('video');
                  if (vid) {
                    if (vid.requestFullscreen) vid.requestFullscreen();
                    else if (vid.webkitRequestFullscreen) vid.webkitRequestFullscreen();
                    else if (vid.msRequestFullscreen) vid.msRequestFullscreen();
                  }
                }}
                className="absolute bottom-2 right-2 p-2 bg-black/60 hover:bg-black/80 rounded text-white"
                aria-label="Fullscreen"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {file.type === 'image' && (
            <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900 max-w-full" style={{ cursor: zoom > 1 ? 'grab' : 'default' }}>
              {mediaLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg h-48 sm:h-96 z-10">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                </div>
              )}
              <div
                style={{
                  transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
                className="select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                onDoubleClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              >
                <img
                  src={file.data}
                  alt={file.name}
                  className="max-w-none"
                  style={{ maxHeight: 'none', height: 'auto', width: 'auto' }}
                  onLoad={handleMediaLoad}
                  draggable="false"
                />
              </div>
              {/* Zoom controls */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur rounded-lg p-1">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.5))}
                  aria-label="Zoom out"
                  className="text-white p-1 hover:bg-white/20 rounded"
                ><ZoomOut className="w-4 h-4" /></button>
                <span className="text-white text-xs px-2">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.5))}
                  aria-label="Zoom in"
                  className="text-white p-1 hover:bg-white/20 rounded"
                ><ZoomIn className="w-4 h-4" /></button>
                <button
                  onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                  aria-label="Reset zoom"
                  className="text-white p-1 hover:bg-white/20 rounded"
                ><RotateCcw className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {file.type === 'audio' && (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6 rounded-lg`}>
              <audio
                ref={mediaRef}
                controls
                className="w-full"
                preload="metadata"
                onLoadedData={handleMediaLoad}
              >
                <source src={file.data} type={file.mime_type || file.mimeType} />
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {file.type === 'text' && (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-3 sm:p-6 rounded-lg max-h-48 sm:max-h-96 overflow-auto`}>
              {file.mime_type?.includes('pdf') || file.name.toLowerCase().endsWith('.pdf') ? (
                <div className="flex flex-col items-center">
                  {pdfLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                  <Document
                    file={file.data}
                    onLoadSuccess={({ numPages }) => {
                      setNumPages(numPages);
                      setPageNumber(1);
                      setPdfLoading(false);
                    }}
                    onLoadError={(err) => {
                      console.error('PDF load error:', err);
                      setPdfLoading(false);
                    }}
                    className="w-full"
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={pdfScale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="mx-auto border"
                      width={Math.min(800, window.innerWidth - 100)}
                    />
                  </Document>
                  {numPages && numPages > 1 && (
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                        disabled={pageNumber <= 1}
                        className={`px-3 py-1 rounded text-sm ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200'} disabled:opacity-50`}
                        aria-label="Previous page"
                      >Prev</button>
                      <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Page {pageNumber} of {numPages}</span>
                      <button
                        onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                        disabled={pageNumber >= numPages}
                        className={`px-3 py-1 rounded text-sm ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200'} disabled:opacity-50`}
                        aria-label="Next page"
                      >Next</button>
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => setPdfScale(s => Math.max(0.5, s - 0.25))} aria-label="Zoom out" className="p-1 rounded bg-gray-200 dark:bg-gray-700"><ZoomOut className="w-4 h-4" /></button>
                        <span className="text-sm w-12 text-center">{Math.round(pdfScale * 100)}%</span>
                        <button onClick={() => setPdfScale(s => Math.min(3, s + 0.25))} aria-label="Zoom in" className="p-1 rounded bg-gray-200 dark:bg-gray-700"><ZoomIn className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <iframe
                  src={file.data}
                  className="w-full h-48 sm:h-96 border-0 rounded-lg"
                  title={file.name}
                  loading="lazy"
                ></iframe>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default FileViewer;
