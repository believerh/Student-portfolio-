import React, { useState } from 'react';
import { User, Users, LogOut, Trash2, UserPlus, Settings, Bell, Moon, Sun, Video, Image, FileText, Music, Mail, Shield, HardDrive, MessageCircle, Link } from 'lucide-react';
import FileViewer from './FileViewer';
import SearchBar from './common/SearchBar';
import SearchResult from './common/SearchResult';
import AnalyticsDashboard from './common/AnalyticsDashboard';
import LMSSettingsModal from './common/LMSSettingsModal';

const AdminDashboard = ({
  currentUser,
  students,
  teachers,
  files,
  shares,
  notifications,
  darkMode,
  toggleDarkMode,
  setShowNotificationPanel,
  setCurrentUser,
  setCurrentView,
  signupEnabled,
  toggleSignup,
  isConnected,
  setShowAddStudentModal,
  setShowAddTeacherModal,
  handleDeleteStudent,
  handleDeleteTeacher,
  comments,
  likes,
  handleLikeFile,
  handleAddComment,
  handleInviteUser,
  setSelectedFileForShare,
  setShowShareModal,
  showChat,
  setShowChat,
  handleSearch,
  searchResults,
  searchState,
  showNotification,
  supabase,
}) => {
  const [viewTab, setViewTab] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'student' });
  const [inviting, setInviting] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [showLMSModal, setShowLMSModal] = useState(false);

  const unreadNotifications = notifications.filter(n => n.userId === currentUser?.id && !n.read).length;
  const chatNotifications = notifications.filter(n => n.userId === currentUser?.id && n.type === 'chat' && !n.read).length;

  // Get all files from all students
  const allFiles = Object.values(files).flat();
  
  // Filter files by type
  const videoFiles = allFiles.filter(f => f.type === 'video' || f.mime_type?.startsWith('video/'));
  const imageFiles = allFiles.filter(f => f.type === 'image' || f.mime_type?.startsWith('image/'));
  const textFiles = allFiles.filter(f => f.type === 'text' || f.mime_type?.startsWith('text/') || f.mime_type?.includes('pdf') || f.mime_type?.includes('document'));
  const audioFiles = allFiles.filter(f => f.type === 'audio' || f.mime_type?.startsWith('audio/'));

  const getFilesByType = () => {
    switch (viewTab) {
      case 'video': return videoFiles;
      case 'image': return imageFiles;
      case 'text': return textFiles;
      case 'audio': return audioFiles;
      default: return allFiles;
    }
  };

  const displayedFiles = getFilesByType();
  const totalFiles = Object.values(files).flat().length;

  const handleInvite = async () => {
    if (!inviteForm.email) return;
    setInviting(true);
    const success = await handleInviteUser(inviteForm.email, inviteForm.role);
    if (success) {
      setInviteForm({ email: '', role: 'student' });
      setShowInviteModal(false);
    }
    setInviting(false);
  };

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono" style={{ backgroundImage: 'linear-gradient(rgba(0,255,153,0.03) 1px, transparent 1px), linear-gradient(90deg,rgba(0,255,153,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
      {/* Scanline effect */}
      <div className="fixed inset-0 pointer-events-none z-50" style={{ background: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.15),rgba(0,0,0,0.15) 1px,transparent 1px,transparent 2px)' }}></div>
      
      {/* Header */}
      <nav className="bg-gray-900/80 border-b border-cyan-500/30 p-3 sm:p-4 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" style={{ filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.8))' }} />
            <h1 className="text-lg sm:text-2xl font-bold">
              <span className="text-cyan-400" style={{ textShadow: '0 0 10px rgba(34,211,238,0.8)' }}>CYBER</span>
              <span className="text-pink-500" style={{ textShadow: '0 0 10px rgba(236,72,153,0.8)' }}>_ADMIN</span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
            <div className="px-2 py-1 bg-gray-900/50 border border-cyan-500/30 text-xs">
              <span className="text-green-400">●</span> ONLINE
            </div>
            <button
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 sm:p-2 rounded-lg bg-gray-900/50 border border-cyan-500/30 hover:border-cyan-400 transition-all"
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button
              onClick={() => setShowNotificationPanel(true)}
              aria-label="Open notifications"
              className="relative p-1.5 sm:p-2 rounded-lg bg-gray-900/50 border border-cyan-500/30 hover:border-cyan-400 transition-all"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowChat(true)}
              aria-label="Open chat"
              className="relative p-1.5 sm:p-2 rounded-lg bg-gray-900/50 border border-cyan-500/30 hover:border-cyan-400 transition-all"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              {chatNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                  {chatNotifications}
                </span>
              )}
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-900/50 border border-cyan-500/30">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">ROOT_ADMIN</span>
            </div>
            <button
              onClick={() => { localStorage.removeItem('appSessionUser'); setCurrentUser(null); setCurrentView('login'); }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-900/50 border border-pink-500/30 text-pink-400 hover:border-pink-400 hover:bg-pink-500/10 transition-all text-xs sm:text-sm"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">LOGOUT</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-6">
        {/* Full-Text Search */}
        <SearchBar onSearch={handleSearch} className="mb-4 sm:mb-6" filters={{ types: true, dateRange: true, role: true }} />
        <SearchResult
          results={searchResults}
          searchState={searchState}
          onClose={() => handleSearch({ query: '', type: 'all', dateFrom: '', dateTo: '', role: 'all' })}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-gray-900/60 border border-cyan-500/30 p-3 sm:p-5 relative overflow-hidden group hover:border-cyan-400 transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            <div className="text-gray-500 text-[10px] sm:text-xs uppercase tracking-wider mb-1 sm:mb-2">Total Users</div>
            <div className="text-2xl sm:text-3xl font-bold text-cyan-400" style={{ textShadow: '0 0 20px rgba(34,211,238,0.5)' }}>{students.length + teachers.length}</div>
          </div>
          <div className="bg-gray-900/60 border border-green-500/30 p-3 sm:p-5 relative overflow-hidden group hover:border-green-400 transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <div className="text-gray-500 text-[10px] sm:text-xs uppercase tracking-wider mb-1 sm:mb-2">Students</div>
            <div className="text-2xl sm:text-3xl font-bold text-green-400" style={{ textShadow: '0 0 20px rgba(74,222,128,0.5)' }}>{students.length}</div>
          </div>
          <div className="bg-gray-900/60 border border-purple-500/30 p-3 sm:p-5 relative overflow-hidden group hover:border-purple-400 transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <div className="text-gray-500 text-[10px] sm:text-xs uppercase tracking-wider mb-1 sm:mb-2">Teachers</div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-400" style={{ textShadow: '0 0 20px rgba(192,132,252,0.5)' }}>{teachers.length}</div>
          </div>
          <div className="bg-gray-900/60 border border-pink-500/30 p-3 sm:p-5 relative overflow-hidden group hover:border-pink-400 transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
            <div className="text-gray-500 text-[10px] sm:text-xs uppercase tracking-wider mb-1 sm:mb-2">Files Stored</div>
            <div className="text-2xl sm:text-3xl font-bold text-pink-400" style={{ textShadow: '0 0 20px rgba(236,72,153,0.5)' }}>{totalFiles}</div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="bg-gray-900/60 border border-cyan-500/30 p-3 sm:p-4 order-2 lg:order-1">
            <h3 className="text-cyan-400 text-[10px] sm:text-sm uppercase tracking-wider mb-3 sm:mb-4 pb-2 border-b border-cyan-500/30">{'//'} NAVIGATION</h3>
            <div className="space-y-1.5 sm:space-y-2">
              {[{ id: 'users', icon: Users, label: 'USERS' }, { id: 'files', icon: HardDrive, label: 'FILES' }, { id: 'settings', icon: Settings, label: 'SETTINGS' }].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all text-xs sm:text-sm ${
                    activeTab === id
                      ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                      : 'border border-transparent text-gray-400 hover:border-cyan-500/30 hover:text-cyan-300'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <h3 className="text-pink-400 text-[10px] sm:text-sm uppercase tracking-wider mb-3 sm:mb-4 mt-4 sm:mt-6 pb-2 border-b border-pink-500/30">{'//'} ACTIONS</h3>
            <div className="space-y-1.5 sm:space-y-2">
              <button onClick={() => setShowAddStudentModal(true)} className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-400 transition-all">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-base">+ STUDENT</span>
              </button>
              <button onClick={() => setShowAddTeacherModal(true)} className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 transition-all">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-base">+ TEACHER</span>
              </button>
              <button onClick={() => setShowInviteModal(true)} className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-base">&gt; INVITE</span>
              </button>
              <button onClick={() => setShowLMSModal(true)} className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-400 transition-all">
                <Link className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-base">&gt; LMS</span>
              </button>
            </div>

            {/* System Status */}
            <h3 className="text-green-400 text-[10px] sm:text-sm uppercase tracking-wider mb-3 sm:mb-4 mt-4 sm:mt-6 pb-2 border-b border-green-500/30">{'//'} STATUS</h3>
            <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs">
              <div className="flex justify-between"><span className="text-gray-500">DATABASE:</span><span className="text-green-400">● ONLINE</span></div>
              <div className="flex justify-between"><span className="text-gray-500">API:</span><span className="text-green-400">● ACTIVE</span></div>
              <div className="flex justify-between"><span className="text-gray-500">BACKUP:</span><span className="text-cyan-400">● SCHEDULED</span></div>
              <div className="flex justify-between"><span className="text-gray-500">ENCRYPTION:</span><span className="text-green-400">● ENABLED</span></div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 bg-gray-900/60 border border-cyan-500/30 p-3 sm:p-6 order-1 lg:order-2">
            {activeTab === 'users' && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-cyan-500/30 gap-3 sm:gap-0">
                  <h2 className="text-lg sm:text-xl font-bold text-cyan-400">{'//'} USER_DATABASE_</h2>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-gray-500 text-xs sm:text-sm">SIGNUP:</span>
                    <button onClick={toggleSignup} className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full border transition-all ${signupEnabled ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}>
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all ${signupEnabled ? 'bg-green-400 translate-x-5 sm:translate-x-6' : 'bg-red-400 translate-x-0'}`}></div>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-gray-800/50 p-3 sm:p-4 rounded-lg border border-gray-700">
                    <p className="text-[10px] sm:text-sm text-gray-400">STUDENTS</p>
                    <p className="text-xl sm:text-2xl font-bold text-cyan-400">{students.length}</p>
                  </div>
                  <div className="bg-gray-800/50 p-3 sm:p-4 rounded-lg border border-gray-700">
                    <p className="text-[10px] sm:text-sm text-gray-400">TEACHERS</p>
                    <p className="text-xl sm:text-2xl font-bold text-cyan-400">{teachers.length}</p>
                  </div>
                </div>
                
                <div className="space-y-2.5 sm:space-y-4">
                  {students.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <User className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 text-gray-600" />
                      <p className="text-gray-500 text-sm sm:text-base">No students registered</p>
                    </div>
                  ) : (
                    students.map((student) => (
                      <div key={student.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 sm:p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-cyan-500/20 text-cyan-400 rounded-full">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-white truncate">{student.name}</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 truncate">{student.email}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteStudent(student.id)} className="text-red-400 hover:text-red-200 self-end sm:self-auto">
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
            {activeTab === 'files' && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-cyan-400 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-cyan-500/30">{'//'} FILE_DATABASE_</h2>
                
                <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 px-1">
                  {[{ tab: 'all', icon: HardDrive, label: 'All', count: allFiles.length }, { tab: 'video', icon: Video, label: 'Videos', count: videoFiles.length }, { tab: 'image', icon: Image, label: 'Images', count: imageFiles.length }, { tab: 'text', icon: FileText, label: 'Docs', count: textFiles.length }, { tab: 'audio', icon: Music, label: 'Audio', count: audioFiles.length }].map(({ tab, icon: Icon, label, count }) => (
                    <button
                      key={tab}
                      onClick={() => setViewTab(tab)}
                      className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap transition-all duration-300 text-xs ${
                        viewTab === tab
                          ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'bg-gray-900/50 border border-gray-700 text-gray-400 hover:border-cyan-500/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{label === 'Videos' ? 'Vid' : label === 'Images' ? 'Img' : label === 'Docs' ? 'Doc' : label === 'Audio' ? 'Aud' : label}</span>
                      <span className="text-[10px] sm:text-xs opacity-75">({count})</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {displayedFiles.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <HardDrive className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 text-gray-600" />
                      <p className="text-gray-500 text-sm sm:text-base">No files found</p>
                    </div>
                  ) : (
                    displayedFiles.map((file) => (
                      <FileViewer
                        key={file.id}
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
                    ))
                  )}
                </div>
              </div>
            )}
            {activeTab === 'analytics' && (
              <AnalyticsDashboard
                students={students}
                teachers={teachers}
                files={files}
                comments={comments}
                likes={likes}
                shares={shares}
              />
            )}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-cyan-400 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-cyan-500/30">{'//'} SYSTEM_CONFIG_</h2>
                <div className="space-y-3.5 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-950/30 border border-gray-800 gap-2 sm:gap-0">
                    <div>
                      <p className="text-cyan-400 font-bold text-sm sm:text-base">Student Registration</p>
                      <p className="text-[10px] sm:text-sm text-gray-500">Allow new students to register</p>
                    </div>
                    <button onClick={toggleSignup} className={`w-12 h-6 sm:w-14 sm:h-7 rounded-full border transition-all ${signupEnabled ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}>
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all ${signupEnabled ? 'bg-green-400 translate-x-6 sm:translate-x-7' : 'bg-red-400 translate-x-0'}`}></div>
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-950/30 border border-gray-800 gap-2 sm:gap-0">
                    <div>
                      <p className="text-cyan-400 font-bold text-sm sm:text-base">Database Connection</p>
                      <p className="text-[10px] sm:text-sm text-gray-500">Supabase: {supabase ? 'Connected' : 'Disconnected'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${supabase ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {supabase ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/90 border border-cyan-500/30 p-4 sm:p-6 w-full max-w-sm">
            <h3 className="text-cyan-400 text-lg mb-4">INVITE_USER</h3>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="email@domain.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm"
              />
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 text-white focus:border-cyan-500 focus:outline-none text-sm"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              <div className="flex gap-2">
                <button onClick={handleInvite} disabled={inviting} className="flex-1 py-2 bg-cyan-500/20 border border-cyan-500 text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm">
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
                <button onClick={() => setShowInviteModal(false)} className="px-4 py-2 border border-gray-700 text-gray-400 hover:text-white transition-all text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LMS Modal */}
      <LMSSettingsModal isOpen={showLMSModal} onClose={() => setShowLMSModal(false)} />
    </div>
  );
};

export default AdminDashboard;