import React, { useState, useMemo, memo } from 'react';
import { User, Users, LogOut, Eye, Bell, Moon, Sun, Video, Image, FileText, Music, Send, Link2, MessageCircle } from 'lucide-react';
import FileViewer from './FileViewer';
import SearchBar from './common/SearchBar';
import SearchResult from './common/SearchResult';

const TeacherDashboard = (props) => {
  const {
    currentUser,
    students,
    files,
    shares,
    notifications,
    darkMode,
    toggleDarkMode,
    setShowNotificationPanel,
    setCurrentUser,
    setCurrentView,
    comments,
    likes,
    handleLikeFile,
    handleAddComment,
    setSelectedFileForShare,
    setShowShareModal,
    setShowSendFileModal,
    handleSendFileToStudents,
    showChat,
    setShowChat,
    handleSearch,
    searchResults,
    searchState,
  } = props;

  // eslint-disable-next-line no-unused-vars
  const _shares = shares;
  // eslint-disable-next-line no-unused-vars
  const _handleSendFileToStudents = handleSendFileToStudents;
  // eslint-disable-next-line no-unused-vars
  const _showChat = showChat;

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewTab, setViewTab] = useState('video');

  const unreadNotifications = useMemo(() => 
    notifications.filter(n => n.userId === currentUser?.dbId && !n.read).length,
    [notifications, currentUser?.dbId]
  );
  
  const chatNotifications = useMemo(() => 
    notifications.filter(n => n.userId === currentUser?.dbId && n.type === 'chat' && !n.read).length,
    [notifications, currentUser?.dbId]
  );

  const TeacherFileViewerInner = ({ studentId }) => {
    const studentFiles = useMemo(() => files[studentId] || [], [studentId]); // eslint-disable-line react-hooks/exhaustive-deps
    const videoFiles = useMemo(() => studentFiles.filter(f => f.type === 'video'), [studentFiles]);
    const imageFiles = useMemo(() => studentFiles.filter(f => f.type === 'image'), [studentFiles]);
    const textFiles = useMemo(() => studentFiles.filter(f => f.type === 'text'), [studentFiles]);
    const audioFiles = useMemo(() => studentFiles.filter(f => f.type === 'audio'), [studentFiles]);

    const getFilesByType = () => {
      switch (viewTab) {
        case 'video': return videoFiles;
        case 'image': return imageFiles;
        case 'text': return textFiles;
        case 'audio': return audioFiles;
        default: return [];
      }
    };

    const currentFiles = getFilesByType();

    return (
      <div className="mt-4 sm:mt-6 border-t pt-4 sm:pt-6 animate-slide-down">
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 px-1">
          {[
            { tab: 'video', icon: Video, label: 'Videos', count: videoFiles.length, color: 'indigo' },
            { tab: 'image', icon: Image, label: 'Images', count: imageFiles.length, color: 'green' },
            { tab: 'text', icon: FileText, label: 'Notes', count: textFiles.length, color: 'blue' },
            { tab: 'audio', icon: Music, label: 'Audio', count: audioFiles.length, color: 'purple' }
          ].map(({ tab, icon: Icon, label, count, color }) => (
            <button
              key={tab}
              onClick={() => setViewTab(tab)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg whitespace-nowrap transition-all duration-300 text-xs sm:text-sm ${
                viewTab === tab
                  ? color === 'indigo' ? 'bg-indigo-600 text-white shadow-md' :
                    color === 'green' ? 'bg-green-600 text-white shadow-md' :
                    color === 'blue' ? 'bg-blue-600 text-white shadow-md' :
                    color === 'purple' ? 'bg-purple-600 text-white shadow-md' : ''
                  : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.slice(0, 3)}</span>
              <span className="text-xs opacity-75">({count})</span>
            </button>
          ))}
        </div>

        {currentFiles.length === 0 ? (
          <div className="text-center py-6 sm:py-12 animate-fade-in">
            <div className={`w-12 h-12 sm:w-16 sm:h-16 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center`}>
              {viewTab === 'video' && <Video className={`w-6 h-6 sm:w-8 sm:h-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />}
              {viewTab === 'image' && <Image className={`w-6 h-6 sm:w-8 sm:h-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />}
              {viewTab === 'text' && <FileText className={`w-6 h-6 sm:w-8 sm:h-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />}
              {viewTab === 'audio' && <Music className={`w-6 h-6 sm:w-8 sm:h-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />}
            </div>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm sm:text-base`}>No {viewTab} files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-4">
            {currentFiles.map((file, index) => (
              <div key={file.id} className="animate-slide-down" style={{ animationDelay: `${index * 0.05}s` }}>
                <FileViewer
                  file={file}
                  canDelete={false}
                  onDelete={() => {}}
                  darkMode={darkMode}
                  comments={comments}
                  likes={likes}
                  currentUser={currentUser}
                  handleLikeFile={handleLikeFile}
                  handleAddComment={handleAddComment}
                  setSelectedFileForShare={setSelectedFileForShare}
                  setShowShareModal={setShowShareModal}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      <nav className={`${darkMode ? 'bg-gradient-to-r from-purple-900 to-pink-900' : 'bg-gradient-to-r from-purple-600 to-pink-600'} text-white p-3 sm:p-4 shadow-lg`}>
        <div className="container mx-auto flex justify-between items-center gap-2">
          <h1 className="text-lg sm:text-2xl font-bold truncate">Teacher Dashboard</h1>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 sm:p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button
              onClick={() => setShowNotificationPanel(true)}
              aria-label="Open notifications"
              className="relative p-1.5 sm:p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowChat(true)}
              aria-label="Open chat"
              className="relative p-1.5 sm:p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              {chatNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                  {chatNotifications}
                </span>
              )}
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg backdrop-blur-sm">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline text-sm">{currentUser?.name || 'Teacher'}</span>
              <span className="sm:hidden text-xs">{currentUser?.name?.split(' ')[0] || 'T'}</span>
            </div>
            <button
              onClick={() => { localStorage.removeItem('appSessionUser'); setCurrentUser(null); setCurrentView('login'); }}
              className="flex items-center gap-1 sm:gap-2 bg-white/20 hover:bg-white/30 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm"
            >
              <LogOut className="w-3 h-4 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
        {/* Dashboard Link */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-md p-3 sm:p-4 mb-4 sm:mb-6 border-l-4 border-purple-500 animate-slide-down`}>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <Link2 className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className={`font-semibold ${darkMode ? 'text-gray-300' : ''}`}>Your Dashboard Link:</span>
          </div>
          <code className={`${darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-700'} px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm block mt-1 overflow-x-auto whitespace-nowrap`}>{currentUser?.dashboard_link || currentUser?.dashboardLink || ''}</code>
        </div>

        {/* Full-Text Search */}
        <SearchBar onSearch={handleSearch} className="mb-4 sm:mb-6" />
        <SearchResult
          results={searchResults}
          searchState={searchState}
          onClose={() => handleSearch({ query: '', type: 'all', dateFrom: '', dateTo: '', role: 'all' })}
        />

        {/* Send File Button */}
        <button
          onClick={() => setShowSendFileModal(true)}
          className="mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2 text-sm sm:text-base"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Send File to Students</span>
          <span className="sm:hidden">Send File</span>
        </button>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-3 sm:p-6 animate-fade-in`}>
          <h2 className={`text-lg sm:text-2xl font-bold mb-4 sm:mb-6 ${darkMode ? 'text-white' : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'}`}>
            Student Files
          </h2>

          <div className="grid gap-3 sm:gap-4">
            {students.length === 0 ? (
              <div className="text-center py-8 sm:py-12 animate-fade-in">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center`}>
                  <Users className={`w-7 h-7 sm:w-8 sm:h-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm sm:text-base`}>No students registered yet</p>
              </div>
            ) : (
              students.map((student, index) => (
                <div
                  key={student.id}
                  className={`border-2 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100'} rounded-xl overflow-hidden hover:border-purple-300 hover:shadow-md transition-all duration-300 animate-slide-down`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
                          {(student.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>{student.name}</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>{student.email}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                            Files: {(files[student.id] || []).length}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg w-full sm:w-auto justify-center text-xs sm:text-sm ${darkMode ? 'bg-purple-900 text-purple-300 hover:bg-purple-800' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'} transition-all duration-200`}
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {selectedStudent === student.id ? 'Hide' : 'View'} Files
                        </button>
                      </div>
                    </div>

                    {selectedStudent === student.id && (
                      <TeacherFileViewerInner studentId={student.id} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(TeacherDashboard);