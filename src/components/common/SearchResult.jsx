import React from 'react';
import { FileText, Video, Image, Music, User, MessageSquare, X } from 'lucide-react';

const fileIcon = (type) => {
  switch (type) {
    case 'video': return Video;
    case 'image': return Image;
    case 'audio': return Music;
    default: return FileText;
  }
};

const highlightMatch = (text, query) => {
  if (!query || !text) return text;
  const words = query.split(/\s+/).filter(Boolean);
  let result = String(text);
  words.forEach((word) => {
    const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    result = result.replace(regex, '<mark class="bg-cyan-500/30 text-cyan-300 rounded px-0.5">$1</mark>');
  });
  return <span dangerouslySetInnerHTML={{ __html: result }} />;
};

const SearchResult = ({ results, searchState, onClose }) => {
  const { files, users, comments } = results;
  const { query } = searchState;

  if (!results.active && files.length === 0 && users.length === 0 && comments.length === 0) return null;

  const totalResults = files.length + users.length + comments.length;

  return (
    <div className="mb-6 animate-fade-in" role="region" aria-label="Search results">
      {/* Search results header */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-900/50 border border-cyan-500/30 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-bold">{'//'} SEARCH_RESULTS_</span>
          <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
            {totalResults} result{totalResults !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* File results */}
        <div className="lg:col-span-2">
          <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <FileText className="w-3 h-3" /> Files ({files.length})
          </h3>
          {files.length === 0 ? (
            <p className="text-gray-600 text-sm py-2">No files found</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {files.map((file) => {
                const Icon = fileIcon(file.type);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-gray-950/50 border border-gray-800 hover:border-cyan-500/50 rounded-lg transition-all group"
                  >
                    <Icon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-200 text-sm truncate font-medium">
                        {highlightMatch(file.name, query)}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {file.type} • {file.size} • {file.upload_date}
                      </p>
                    </div>
                    <span className="text-xs text-gray-600 flex-shrink-0">
                      {file.description ? highlightMatch(file.description, query) : null}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User & Comment results */}
        <div className="space-y-4">
          {/* Users */}
          <div>
            <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <User className="w-3 h-3" /> Users ({users.length})
            </h3>
            {users.length === 0 ? (
              <p className="text-gray-600 text-sm py-2">No users found</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 p-2 bg-gray-950/50 border border-gray-800 rounded-lg"
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                      user.role === 'student'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {(user.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-200 text-xs truncate">
                        {highlightMatch(user.name, query)}
                      </p>
                      <p className="text-gray-500 text-xs truncate">
                        {highlightMatch(user.email, query)}
                      </p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      user.role === 'student'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-purple-500/10 text-purple-500'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> Comments ({comments.length})
            </h3>
            {comments.length === 0 ? (
              <p className="text-gray-600 text-sm py-2">No comments found</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {comments.slice(0, 10).map((comment, i) => (
                  <div
                    key={`${comment.fileId}-${i}`}
                    className="p-2 bg-gray-950/50 border border-gray-800 rounded-lg"
                  >
                    <p className="text-gray-300 text-xs">
                      <span className="text-cyan-400">{comment.author}:</span>{' '}
                      {highlightMatch(comment.text, query)}
                    </p>
                    {comment.file && (
                      <p className="text-gray-600 text-[10px] mt-1 truncate">
                        on {comment.file.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResult;
