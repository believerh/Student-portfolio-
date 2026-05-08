import { createClient } from '@supabase/supabase-js';
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import DatabaseSetup from './components/DatabaseSetup';
import LoginPage from './components/LoginPage';
import Notification from './components/common/Notification';
import NotificationPanel from './components/common/NotificationPanel';
import ShareModal from './components/common/ShareModal';
import SendFileModal from './components/common/SendFileModal';
import AddStudentModal from './components/common/AddStudentModal';
import AddTeacherModal from './components/common/AddTeacherModal';
import ChatModal from './components/common/ChatModal';
import { performSearch } from './utils/searchUtils';
import { API_CONFIG } from './utils/apiConfig';
import { initStorageClient, uploadFileToStorage, deleteFileFromStorage, getBucketForType } from './utils/storageUtils';
import { generateFileTags, extractTextContent, generateSummary } from './utils/aiUtils';

// Lazy load dashboard components for code splitting
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

// Loading fallback component
const DashboardLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
    </div>
  </div>
);

// Admin credentials should be set via environment variables for security
// REACT_APP_ADMIN_EMAIL and REACT_APP_ADMIN_PASSWORD
const ADMIN_ACCOUNT = {
  id: 'admin_001',
  name: 'Administrator',
  email: process.env.REACT_APP_ADMIN_EMAIL || 'admin@school.com',
  password: process.env.REACT_APP_ADMIN_PASSWORD || 'admin123',
  role: 'admin'
};

const App = () => {
  const [currentView, setCurrentView] = useState('setup');
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [files, setFiles] = useState({});
  const [comments, setComments] = useState({});
  const [likes, setLikes] = useState({});
  const [shares, setShares] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [notification, setNotification] = useState(null);
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSendFileModal, setShowSendFileModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedFileForShare, setSelectedFileForShare] = useState(null);
  const [dbConfig, setDbConfig] = useState({ url: '', key: '' });
  const [isConnected, setIsConnected] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [supabase, setSupabase] = useState(null);
  // Search state
  const [searchState, setSearchState] = useState({ query: '', type: 'all', dateFrom: '', dateTo: '', role: 'all' });
  const [searchResults, setSearchResults] = useState({ files: [], users: [], comments: [], active: false });
  const [showUnverifiedEmailNotification, setShowUnverifiedEmailNotification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  // configError state removed — setup form shown instead of error screen
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Pagination states for better performance
  const FILES_PAGE_SIZE = 20;

  const loadFromDatabase = useCallback(async (config, user = null) => {
    if (!config.url || !config.key) return;
    
    try {
      setLoadingMessage('Loading data...');
      setLoadingProgress(10);

      const userRole = user?.role;
      const userDbId = user?.dbId;

      let studentsRes, teachersRes, filesRes, commentsRes, likesRes, sharesRes, chatRes;

      if (userRole === 'student' && userDbId) {
        [studentsRes, teachersRes, filesRes, commentsRes, likesRes, sharesRes, chatRes] = await Promise.all([
          fetch(`${config.url}/rest/v1/students?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/teachers?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/files?select=*&student_id=eq.${userDbId}`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/comments?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/likes?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/shares?select=*&or=(recipient_id.eq.${userDbId},owner_id.eq.${userDbId})`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/chat_messages?select=*&order=created_at.desc&limit=200`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          })
        ]);
      } else if (userRole === 'teacher' && userDbId) {
        [studentsRes, teachersRes, filesRes, commentsRes, likesRes, sharesRes, chatRes] = await Promise.all([
          fetch(`${config.url}/rest/v1/students?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/teachers?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/files?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/comments?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/likes?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/shares?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/chat_messages?select=*&order=created_at.desc&limit=200`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          })
        ]);
      } else if (userRole === 'admin') {
        [studentsRes, teachersRes, filesRes, commentsRes, likesRes, sharesRes, chatRes] = await Promise.all([
          fetch(`${config.url}/rest/v1/students?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/teachers?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/files?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/comments?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/likes?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/shares?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/chat_messages?select=*&order=created_at.desc&limit=200`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          })
        ]);
      } else {
        [studentsRes, teachersRes, filesRes, commentsRes, likesRes, sharesRes, chatRes] = await Promise.all([
          fetch(`${config.url}/rest/v1/students?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/teachers?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/files?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/comments?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/likes?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/shares?select=*`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          }),
          fetch(`${config.url}/rest/v1/chat_messages?select=*&order=created_at.desc&limit=200`, {
            headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
          })
        ]);
      }

      // Process all responses in parallel
      const [studentsData, teachersData, filesData, commentsData, likesData, sharesData, chatData] = await Promise.all([
        studentsRes.json(),
        teachersRes.json(),
        filesRes.json(),
        commentsRes.json(),
        likesRes.json(),
        sharesRes.json(),
        chatRes.json()
      ]);

      // Update all states
      setStudents(studentsData || []);
      setTeachers(teachersData || []);
      
      // Build files map
      const filesMap = {};
      (filesData || []).forEach(file => {
        if (!filesMap[file.student_id]) filesMap[file.student_id] = [];
        filesMap[file.student_id].push(file);
      });
      setFiles(filesMap);

      // Build comments map
      const commentsMap = {};
      (commentsData || []).forEach(comment => {
        if (!commentsMap[comment.file_id]) commentsMap[comment.file_id] = [];
        commentsMap[comment.file_id].push(comment);
      });
      setComments(commentsMap);

      // Build likes map
      const likesMap = {};
      (likesData || []).forEach(like => {
        if (!likesMap[like.file_id]) likesMap[like.file_id] = [];
        likesMap[like.file_id].push(like.user_id);
      });
      setLikes(likesMap);

      // Build shares map
      const sharesMap = {};
      (sharesData || []).forEach(share => {
        sharesMap[share.id] = {
          fileId: share.file_id,
          ownerId: share.owner_id,
          recipientId: share.recipient_id,
        };
      });
      setShares(sharesMap);

      // Set chat messages
      setChatMessages(chatData || []);

    } catch (error) {
      console.error('Error loading from database:', error);
      showNotification('Error loading data from database');
    } 
  }, []);

  const restoreSessionUser = useCallback(async (client, config) => {
    try {
      const { data: sessionData } = await client.auth.getSession();
      const sessionUser = sessionData?.session?.user;
      if (!sessionUser) {
        setCurrentView('login');
        return;
      }

      const role = sessionUser.user_metadata?.role || 'student';
      const baseUser = {
        id: sessionUser.id,
        name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
        email: sessionUser.email,
        role,
      };

      if (role === 'teacher') {
        const res = await fetch(`${config.url}/rest/v1/teachers?email=eq.${encodeURIComponent(sessionUser.email)}&select=*`, {
          headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
        });
        const data = await res.json();
        if (data?.length > 0) {
          baseUser.dbId = data[0].id;
          baseUser.dashboard_link = data[0].dashboard_link;
        }
        setCurrentUser(baseUser);
        setCurrentView('teacher');
        loadFromDatabase(config, baseUser);
      } else {
        const res = await fetch(`${config.url}/rest/v1/students?email=eq.${encodeURIComponent(sessionUser.email)}&select=*`, {
          headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
        });
        const data = await res.json();
        if (data?.length > 0) {
          baseUser.dbId = data[0].id;
          baseUser.dashboard_link = data[0].dashboard_link;
        }
        setCurrentUser(baseUser);
        setCurrentView('dashboard');
        loadFromDatabase(config, baseUser);
      }
    } catch (e) {
      console.error('Session restore failed:', e);
      setCurrentView('login');
    }
  }, [loadFromDatabase]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
      setDarkMode(true);
    }

    // Try env vars first, then localStorage saved config
    const envUrl = API_CONFIG.SUPABASE_URL;
    const envKey = API_CONFIG.SUPABASE_KEY;

    let savedConfig = null;
    try {
      const raw = localStorage.getItem('dbConfig');
      if (raw) savedConfig = JSON.parse(raw);
    } catch(e) {}

    const urlToTry = envUrl || savedConfig?.url || '';
    const keyToTry = envKey || savedConfig?.key || '';

    if (!urlToTry || !keyToTry) {
      // No credentials anywhere — show setup form
      setCurrentView('setup');
      return;
    }

    // Try to connect using students table (works with anon key unlike root endpoint)
    fetch(`${urlToTry}/rest/v1/students?limit=1`, {
      headers: {
        'apikey': keyToTry,
        'Authorization': `Bearer ${keyToTry}`
      }
    }).then(res => {
      // 200 = ok, 406 = no rows but connected, both mean valid credentials
      if (res.ok || res.status === 406) {
        const client = createClient(urlToTry, keyToTry);
        setSupabase(client);
        initStorageClient(urlToTry, keyToTry);
        const cfg = { url: urlToTry, key: keyToTry };
        setDbConfig(cfg);
        setIsConnected(true);
        restoreSessionUser(client, cfg);
      } else {
        console.error('Database connection failed — showing setup');
        setCurrentView('setup');
      }
    }).catch(err => {
      console.error('Database connection error:', err);
      setCurrentView('setup');
    });
  }, [loadFromDatabase, restoreSessionUser]);

  // Use ref to track currentUser for real-time subscriptions to avoid stale closures
  const currentUserRef = React.useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!supabase || !isConnected) return;

    const channels = [];

    // Subscribe to files table changes
    const filesChannel = supabase
      .channel('files-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, (payload) => {
        console.log('Files change detected:', payload);

        if (payload.eventType === 'INSERT') {
          const newFile = payload.new;
          setFiles(prev => {
            const studentFiles = prev[newFile.student_id] || [];
            if (studentFiles.some(f => f.id === newFile.id)) return prev;
            return {
              ...prev,
              [newFile.student_id]: [...studentFiles, newFile]
            };
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedFile = payload.new;
          setFiles(prev => {
            const studentFiles = prev[updatedFile.student_id] || [];
            return {
              ...prev,
              [updatedFile.student_id]: studentFiles.map(f => f.id === updatedFile.id ? { ...f, ...updatedFile } : f)
            };
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedFile = payload.old;
          setFiles(prev => {
            const studentFiles = prev[deletedFile.student_id] || [];
            return {
              ...prev,
              [deletedFile.student_id]: studentFiles.filter(f => f.id !== deletedFile.id)
            };
          });
        }
      })
      .subscribe();
    channels.push(filesChannel);

    // Subscribe to students table changes
    const studentsChannel = supabase
      .channel('students-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
        console.log('Students change detected:', payload);
        
        if (payload.eventType === 'INSERT') {
          setStudents(prev => {
            if (prev.some(s => s.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          // Note: Notification is already handled in signup process
        } else if (payload.eventType === 'DELETE') {
          setStudents(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .subscribe();
    channels.push(studentsChannel);

    // Subscribe to teachers table changes
    const teachersChannel = supabase
      .channel('teachers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, (payload) => {
        console.log('Teachers change detected:', payload);
        
        if (payload.eventType === 'INSERT') {
          setTeachers(prev => {
            if (prev.some(t => t.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          // Note: Notification is already handled in signup process
        } else if (payload.eventType === 'DELETE') {
          setTeachers(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();
    channels.push(teachersChannel);

    // Subscribe to shares table changes
    const sharesChannel = supabase
      .channel('shares-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shares' }, (payload) => {
        console.log('Shares change detected:', payload);

        if (payload.eventType === 'INSERT') {
          const newShare = payload.new;
          setShares(prev => {
            if (prev[newShare.id]) return prev;
            return {
              ...prev,
              [newShare.id]: {
                fileId: newShare.file_id,
                ownerId: newShare.owner_id,
                recipientId: newShare.recipient_id,
              }
            };
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedShare = payload.new;
          setShares(prev => ({
            ...prev,
            [updatedShare.id]: {
              fileId: updatedShare.file_id,
              ownerId: updatedShare.owner_id,
              recipientId: updatedShare.recipient_id,
            }
          }));
        } else if (payload.eventType === 'DELETE') {
          const oldShare = payload.old;
          setShares(prev => {
            const next = { ...prev };
            delete next[oldShare.id];
            return next;
          });
        }
      })
      .subscribe();
    channels.push(sharesChannel);

    // Subscribe to comments table changes
    const commentsChannel = supabase
      .channel('comments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, (payload) => {
        console.log('Comments change detected:', payload);

        if (payload.eventType === 'INSERT') {
          const newComment = payload.new;
          setComments(prev => {
            const fileComments = prev[newComment.file_id] || [];
            if (fileComments.some(c => c.id === newComment.id)) return prev;
            return {
              ...prev,
              [newComment.file_id]: [...fileComments, newComment]
            };
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedComment = payload.new;
          setComments(prev => {
            const fileComments = prev[updatedComment.file_id] || [];
            return {
              ...prev,
              [updatedComment.file_id]: fileComments.map(c => c.id === updatedComment.id ? { ...c, ...updatedComment } : c)
            };
          });
        } else if (payload.eventType === 'DELETE') {
          const oldComment = payload.old;
          setComments(prev => {
            const fileComments = prev[oldComment.file_id] || [];
            return {
              ...prev,
              [oldComment.file_id]: fileComments.filter(c => c.id !== oldComment.id)
            };
          });
        }
      })
      .subscribe();
    channels.push(commentsChannel);

    // Subscribe to likes table changes
    const likesChannel = supabase
      .channel('likes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, (payload) => {
        console.log('Likes change detected:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newLike = payload.new;
          setLikes(prev => {
            const fileLikes = prev[newLike.file_id] || [];
            if (fileLikes.includes(newLike.user_id)) return prev;
            return {
              ...prev,
              [newLike.file_id]: [...fileLikes, newLike.user_id]
            };
          });
          // Note: Notification is already handled in handleLikeFile
        } else if (payload.eventType === 'DELETE') {
          const oldLike = payload.old;
          setLikes(prev => {
            const fileLikes = prev[oldLike.file_id] || [];
            return {
              ...prev,
              [oldLike.file_id]: fileLikes.filter(id => id !== oldLike.user_id)
            };
          });
        }
      })
      .subscribe();
    channels.push(likesChannel);

    // Subscribe to chat messages for real-time updates
    const chatChannel = supabase
      .channel('chat-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload) => {
        console.log('Chat change received:', payload);

        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new;
          setChatMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedMessage = payload.new;
          setChatMessages(prev => prev.map(m => m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m));
        } else if (payload.eventType === 'DELETE') {
          const oldMessage = payload.old;
          setChatMessages(prev => prev.filter(m => m.id !== oldMessage.id));
        }
      })
      .subscribe();
    channels.push(chatChannel);

    // Subscribe to notifications table for real-time notifications
    const notificationsChannel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        console.log('Notification change received:', payload);

        const currentUser = currentUserRef.current;
        const targetUserId = currentUser?.role === 'admin' ? currentUser.id : currentUser?.dbId;

        if (payload.eventType === 'INSERT') {
          const newNotif = payload.new;
          if (newNotif.user_id === targetUserId) {
            setNotifications(prev => {
              if (prev.some(n => n.id === newNotif.id)) return prev;
              return [{
                id: newNotif.id,
                userId: newNotif.user_id,
                message: newNotif.message,
                type: newNotif.type,
                read: newNotif.read,
                timestamp: newNotif.created_at
              }, ...prev];
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedNotif = payload.new;
          if (updatedNotif.user_id === targetUserId) {
            setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? {
              id: updatedNotif.id,
              userId: updatedNotif.user_id,
              message: updatedNotif.message,
              type: updatedNotif.type,
              read: updatedNotif.read,
              timestamp: updatedNotif.created_at
            } : n));
          }
        } else if (payload.eventType === 'DELETE') {
          const oldNotif = payload.old;
          if (oldNotif.user_id === targetUserId) {
            setNotifications(prev => prev.filter(n => n.id !== oldNotif.id));
          }
        }
      })
      .subscribe();
    channels.push(notificationsChannel);

    // Cleanup subscriptions on unmount
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [supabase, isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  // Full-text search handler
  const handleSearch = useCallback((filters) => {
    setSearchState(filters);
    const results = performSearch(filters.query || '', filters, { files, students, teachers, comments });
    setSearchResults(results);
  }, [files, students, teachers, comments]);

  const sendEmailNotification = (to, subject, message) => {
    console.log(`Email sent to ${to}: ${subject} - ${message}`);
    showNotification(`Email notification sent to ${to}`);
  };

  const addNotification = async (userId, message, type = 'info') => {
    const newNotification = {
      id: crypto.randomUUID(),
      userId,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString()
    };
    
    // Add to local state first for immediate UI update
    setNotifications(prev => [...prev, newNotification]);
    
    // Also save to database for persistence
    if (isConnected && supabase) {
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          message: message,
          type: type,
          read: false,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving notification to database:', error);
      }
    }
  };

  const markNotificationRead = async (notifId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notifId ? { ...n, read: true } : n)
    );

    // Persist read state in DB for real-time sync across sessions/devices
    if (isConnected && supabase) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('id', notifId);
      } catch (err) {
        console.error('Failed to mark notification as read in DB:', err);
      }
    }
  };

  // Mark all chat notifications as read
  const markAllChatNotificationsRead = () => {
    const userId = currentUser?.role === 'admin' ? currentUser?.id : currentUser?.dbId;
    setNotifications(prev => 
      prev.map(n => 
        (n.userId === userId && n.type === 'chat' && !n.read) 
          ? { ...n, read: true } 
          : n
      )
    );
  };

  // Expose function to window for ChatModal to call
  useEffect(() => {
    window.markChatNotificationsRead = markAllChatNotificationsRead;
    return () => {
      delete window.markChatNotificationsRead;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);


  const saveToDatabase = async (endpoint, data, method = 'POST') => {
    try {
      const response = await fetch(`${dbConfig.url}/rest/v1/${endpoint}`, {
        method,
        headers: {
          'apikey': dbConfig.key,
          'Authorization': `Bearer ${dbConfig.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();

        // Backward compatibility: retry files insert without storage_path if DB schema cache is stale
        if (
          endpoint === 'files' &&
          error?.code === 'PGRST204' &&
          typeof error?.message === 'string' &&
          error.message.includes('storage_path')
        ) {
          const fallbackData = { ...data };
          delete fallbackData.storage_path;

          const retryResponse = await fetch(`${dbConfig.url}/rest/v1/${endpoint}`, {
            method,
            headers: {
              'apikey': dbConfig.key,
              'Authorization': `Bearer ${dbConfig.key}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(fallbackData)
          });

          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }

        console.error('Database error:', error);
        const errorMessage = error.message || error.error_description || JSON.stringify(error);
        showNotification(`Error saving to database: ${errorMessage}`);
        return null;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Database error:', error);
      showNotification('Error saving to database. Check console for details.');
      return null;
    }
  };

  const toggleSignup = async () => {
    const newValue = !signupEnabled;
    setSignupEnabled(newValue);

    if (isConnected) {
      try {
        const settingsRes = await fetch(`${dbConfig.url}/rest/v1/settings?select=id&limit=1`, {
          headers: {
            'apikey': dbConfig.key,
            'Authorization': `Bearer ${dbConfig.key}`
          }
        });
        const settingsData = await settingsRes.json();
        if (settingsData.length > 0) {
          const settingsId = settingsData[0].id;
          saveToDatabase(`settings?id=eq.${settingsId}`, { signup_enabled: newValue }, 'PATCH');
        }
      } catch (error) {
        console.error('Error toggling signup:', error);
        showNotification('Error updating signup status');
      }
    }
    showNotification(`Student signup ${newValue ? 'enabled' : 'disabled'}`);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSignup = async (name, email, password, role = 'student', isAdminCreated = false) => {
    if (!signupEnabled && !isAdminCreated && role === 'student') {
      showNotification('Student signup is currently disabled');
      return false;
    }

    // Check if email already exists in database
    const emailExists = students.find(s => s.email.toLowerCase() === email.toLowerCase()) || 
                       teachers.find(t => t.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      showNotification('Email already exists');
      return false;
    }

    if (!isConnected || !supabase) {
      showNotification('Not connected to database. Cannot create account.');
      return false;
    }

    try {
      // Create auth user via Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        showNotification(`Signup error: ${error.message}`);
        return false;
      }

      // If admin created, the user is created but needs email confirmation
      // OR we can use the user immediately if email is auto-confirmed
      if (data.user) {
        const newUserProfile = {
          user_id: data.user.id,
          name,
          email,
          role,
          dashboard_link: `${window.location.origin}?user=${data.user.id}`,
        };

        const endpoint = role === 'teacher' ? 'teachers' : 'students';
        console.log('Creating user profile:', endpoint, newUserProfile);
        
        const saved = await saveToDatabase(endpoint, newUserProfile);
        console.log('Save result:', saved);

        if (saved && saved.length > 0) {
          if (role === 'teacher') {
            setTeachers(prev => [...prev, saved[0]]);
          } else {
            setStudents(prev => [...prev, saved[0]]);
          }
          
          if (isAdminCreated) {
            showNotification(`${role === 'teacher' ? 'Teacher' : 'Student'} added! Email: ${email}, Password: ${password}`);
          } else {
            showNotification('Signup successful! Please check your email to verify your account. If you don\'t see it, check your spam folder.');
          }
          return true;
        } else {
          // Show more helpful error
          console.error('Failed to save user profile. Check if tables exist and RLS policies allow insert.');
          showNotification('Error: Could not create profile. Please ensure the students/teachers table exists with proper permissions.');
          return false;
        }
      } else {
        showNotification('This email has already been registered.');
        return false;
      }
    } catch (error) {
      console.error('Signup error:', error);
      showNotification('An error occurred during signup');
      return false;
    }
  };

  const persistLocalSession = (user) => {
    localStorage.setItem('appSessionUser', JSON.stringify({
      id: user.id,
      dbId: user.dbId,
      name: user.name,
      email: user.email,
      role: user.role,
      dashboard_link: user.dashboard_link,
      timestamp: Date.now()
    }));
  };

  const handleLogin = async (email, password) => {
    setIsLoggingIn(true);
    setLoadingProgress(0);
    setLoadingMessage('Connecting...');
    
    if (email === ADMIN_ACCOUNT.email && password === ADMIN_ACCOUNT.password) {
      // Instant login — show dashboard immediately, load data in background
      setCurrentUser(ADMIN_ACCOUNT);
      persistLocalSession(ADMIN_ACCOUNT);
      setCurrentView('admin');
      showNotification('Welcome Administrator!');
      setIsLoggingIn(false);
      setLoadingProgress(0);
      setLoadingMessage('');

      // Load all data in background after dashboard is shown
      Promise.all([
        fetch(`${dbConfig.url}/rest/v1/students?select=*`, {
          headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` }
        }),
        fetch(`${dbConfig.url}/rest/v1/teachers?select=*`, {
          headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` }
        }),
        fetch(`${dbConfig.url}/rest/v1/files?select=*&limit=${FILES_PAGE_SIZE}&order=created_at.desc`, {
          headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` }
        }),
        fetch(`${dbConfig.url}/rest/v1/comments?select=*&limit=100`, {
          headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` }
        }),
        fetch(`${dbConfig.url}/rest/v1/likes?select=*&limit=100`, {
          headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` }
        }),
        fetch(`${dbConfig.url}/rest/v1/shares?select=*&limit=100`, {
          headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` }
        }),
        fetch(`${dbConfig.url}/rest/v1/chat_messages?select=*&order=created_at.desc&limit=50`, {
          headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` }
        })
      ]).then(responses => Promise.all(responses.map(r => r.json())))
        .then(([studentsData, teachersData, filesData, commentsData, likesData, sharesData, chatData]) => {
          setStudents(studentsData || []);
          setTeachers(teachersData || []);
          const filesMap = {};
          (filesData || []).forEach(file => {
            if (!filesMap[file.student_id]) filesMap[file.student_id] = [];
            filesMap[file.student_id].push(file);
          });
          setFiles(filesMap);
          const commentsMap = {};
          (commentsData || []).forEach(comment => {
            if (!commentsMap[comment.file_id]) commentsMap[comment.file_id] = [];
            commentsMap[comment.file_id].push(comment);
          });
          setComments(commentsMap);
          const likesMap = {};
          (likesData || []).forEach(like => {
            if (!likesMap[like.file_id]) likesMap[like.file_id] = [];
            likesMap[like.file_id].push(like.user_id);
          });
          setLikes(likesMap);
          const sharesMap = {};
          (sharesData || []).forEach(share => {
            sharesMap[share.id] = {
              fileId: share.file_id,
              ownerId: share.owner_id,
              recipientId: share.recipient_id,
            };
          });
          setShares(sharesMap);
          setChatMessages(chatData || []);
        }).catch(err => console.error('Background load error:', err));

      return;
    }

    if (isConnected && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        showNotification(`Login error: ${error.message}`);
        setIsLoggingIn(false);
        return;
      }

      if (data.user) {
        // Allow login if confirmed OR if email confirmation is disabled in Supabase
        if (data.user.email_confirmed_at || data.user.confirmed_at || data.user.aud === 'authenticated') {
          setShowUnverifiedEmailNotification(false);
          setUnverifiedEmail('');
          const userRole = data.user.user_metadata.role || 'student';
          
          const user = {
            id: data.user.id,
            name: data.user.user_metadata.name,
            email: data.user.email,
            role: userRole,
          };

          showNotification(`Welcome back, ${user.name}!`);
          setIsLoggingIn(false);
          setLoadingProgress(0);
          setLoadingMessage('');

          if (userRole === 'teacher') {
            // ⚡ INSTANT: fetch profile first (needed for dbId), show dashboard, rest loads in background
            const teacherProfileRes = await fetch(
              `${dbConfig.url}/rest/v1/teachers?email=eq.${encodeURIComponent(email)}&select=*`,
              { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } }
            );
            const teacherProfile = await teacherProfileRes.json();
            if (teacherProfile && teacherProfile.length > 0) {
              user.dbId = teacherProfile[0].id;
              user.dashboard_link = teacherProfile[0].dashboard_link;
            } else {
              showNotification('Teacher profile not found. Ask admin to add your account.');
              setIsLoggingIn(false);
              return;
            }
            setCurrentUser({ ...user });
            persistLocalSession({ ...user });
            setCurrentView('teacher');

            // Load everything else in parallel in background
            Promise.all([
              fetch(`${dbConfig.url}/rest/v1/students?select=*`, { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } }),
              fetch(`${dbConfig.url}/rest/v1/files?select=*&limit=${FILES_PAGE_SIZE}&order=created_at.desc`, { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } }),
              fetch(`${dbConfig.url}/rest/v1/shares?select=*&limit=100`, { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } }),
              fetch(`${dbConfig.url}/rest/v1/comments?select=*&limit=100`, { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } }),
              fetch(`${dbConfig.url}/rest/v1/likes?select=*&limit=100`, { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } }),
              fetch(`${dbConfig.url}/rest/v1/chat_messages?select=*&order=created_at.desc&limit=50`, { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } }),
              supabase ? supabase.from('notifications').select('*').eq('user_id', user.dbId).order('created_at', { ascending: false }).limit(50) : Promise.resolve({ data: [] })
            ]).then(async ([sRes, fRes, shRes, cRes, lRes, chRes, notifResult]) => {
              const [studentsData, filesData, sharesData, commentsData, likesData, chatData] = await Promise.all([
                sRes.json(), fRes.json(), shRes.json(), cRes.json(), lRes.json(), chRes.json()
              ]);
              setStudents(studentsData || []);
              const filesMap = {};
              (filesData || []).forEach(f => {
                if (!filesMap[f.student_id]) filesMap[f.student_id] = [];
                filesMap[f.student_id].push(f);
              });
              setFiles(filesMap);
              const sharesMap = {};
              (sharesData || []).forEach(s => { sharesMap[s.id] = { fileId: s.file_id, ownerId: s.owner_id, recipientId: s.recipient_id }; });
              setShares(sharesMap);
              const commentsMap = {};
              (commentsData || []).forEach(c => { if (!commentsMap[c.file_id]) commentsMap[c.file_id] = []; commentsMap[c.file_id].push(c); });
              setComments(commentsMap);
              const likesMap = {};
              (likesData || []).forEach(l => { if (!likesMap[l.file_id]) likesMap[l.file_id] = []; likesMap[l.file_id].push(l.user_id); });
              setLikes(likesMap);
              setChatMessages(chatData || []);
              if (notifResult?.data?.length > 0) {
                setNotifications(notifResult.data.map(n => ({ id: n.id, userId: n.user_id, message: n.message, type: n.type, read: n.read, timestamp: n.created_at })));
              }
            }).catch(err => console.error('Background load error (teacher):', err));

          } else {
            // ⚡ INSTANT STUDENT LOGIN: fetch profile first (needed for dbId), show dashboard, rest in background
            const studentProfileRes = await fetch(
              `${dbConfig.url}/rest/v1/students?email=eq.${encodeURIComponent(email)}&select=*`,
              { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } }
            );
            const studentProfile = await studentProfileRes.json();

            if (!studentProfile || studentProfile.length === 0) {
              // First login — create profile
              const newUserProfile = {
                user_id: data.user.id,
                name: data.user.user_metadata?.name || email.split('@')[0],
                email: data.user.email,
                role: 'student',
                dashboard_link: `${window.location.origin}?user=${data.user.id}`,
              };
              const saved = await saveToDatabase('students', newUserProfile);
              if (saved && saved.length > 0) {
                user.dbId = saved[0].id;
                user.dashboard_link = saved[0].dashboard_link;
                setStudents(prev => [...prev, saved[0]]);
              } else {
                showNotification('Error creating profile. Check Supabase RLS policies.');
                setIsLoggingIn(false);
                return;
              }
            } else {
              user.dbId = studentProfile[0].id;
              user.dashboard_link = studentProfile[0].dashboard_link;
            }

            if (!user.dbId) {
              showNotification('Could not load your profile. Please contact admin.');
              setIsLoggingIn(false);
              return;
            }

            setCurrentUser({ ...user });
            persistLocalSession({ ...user });
            setCurrentView('dashboard');

            // Load everything else in parallel in background
            if (user.dbId) {
              Promise.all([
                fetch(`${dbConfig.url}/rest/v1/students?select=*`, { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } }),
                fetch(`${dbConfig.url}/rest/v1/teachers?select=*`, { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } }),
                fetch(`${dbConfig.url}/rest/v1/files?student_id=eq.${user.dbId}&select=*&order=created_at.desc&limit=${FILES_PAGE_SIZE}`, { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } }),
                fetch(`${dbConfig.url}/rest/v1/shares?recipient_id=eq.${user.dbId}&select=*&limit=50`, { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } }),
                fetch(`${dbConfig.url}/rest/v1/chat_messages?select=*&order=created_at.desc&limit=50`, { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } }),
                supabase ? supabase.from('notifications').select('*').eq('user_id', user.dbId).order('created_at', { ascending: false }).limit(50) : Promise.resolve({ data: [] })
              ]).then(async ([sRes, tRes, fRes, shRes, chRes, notifResult]) => {
                const [studentsData, teachersData, filesData, sharesData, chatData] = await Promise.all([
                  sRes.json(), tRes.json(), fRes.json(), shRes.json(), chRes.json()
                ]);
                setStudents(studentsData || []);
                setTeachers(teachersData || []);
                const filesMap = {};
                filesMap[user.dbId] = filesData || [];
                setFiles(filesMap);
                const sharesMap = {};
                (sharesData || []).forEach(s => { sharesMap[s.id] = { fileId: s.file_id, ownerId: s.owner_id, recipientId: s.recipient_id }; });
                setShares(sharesMap);
                setChatMessages(chatData || []);
                // Load comments & likes only if student has files
                if (filesData && filesData.length > 0) {
                  const fileIds = filesData.map(f => f.id).join(',');
                  Promise.all([
                    fetch(`${dbConfig.url}/rest/v1/comments?file_id=in.(${fileIds})&select=*`, { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } }),
                    fetch(`${dbConfig.url}/rest/v1/likes?file_id=in.(${fileIds})&select=*`, { headers: { 'apikey': dbConfig.key, 'Authorization': `Bearer ${dbConfig.key}` } })
                  ]).then(async ([cRes, lRes]) => {
                    const [commentsData, likesData] = await Promise.all([cRes.json(), lRes.json()]);
                    const commentsMap = {};
                    (commentsData || []).forEach(c => { if (!commentsMap[c.file_id]) commentsMap[c.file_id] = []; commentsMap[c.file_id].push(c); });
                    setComments(commentsMap);
                    const likesMap = {};
                    (likesData || []).forEach(l => { if (!likesMap[l.file_id]) likesMap[l.file_id] = []; likesMap[l.file_id].push(l.user_id); });
                    setLikes(likesMap);
                  });
                }
                if (notifResult?.data?.length > 0) {
                  setNotifications(notifResult.data.map(n => ({ id: n.id, userId: n.user_id, message: n.message, type: n.type, read: n.read, timestamp: n.created_at })));
                }
              }).catch(err => console.error('Background load error (student):', err));
            }
          }
        } else {
          setUnverifiedEmail(email);
          setShowUnverifiedEmailNotification(true);
          setIsLoggingIn(false);
        }
      } else {
        showNotification('Invalid credentials. Please try again.');
        setIsLoggingIn(false);
      }
    }
  };

  const handleResendVerification = async (email) => {
    if (!supabase) {
      showNotification('Not connected to database');
      return;
    }
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (error) {
        showNotification(`Error: ${error.message}. Make sure email confirmations are enabled in Supabase.`);
      } else {
        showNotification('Verification email sent! Check your inbox.');
      }
    } catch (err) {
      showNotification('Failed to resend verification email. Try again later.');
      console.error('Resend verification error:', err);
    }
  };

  // Password Reset
  const handlePasswordReset = async (email) => {
    if (!supabase) {
      showNotification('Not connected to database');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}?reset=true`,
      });
      if (error) {
        showNotification(`Error: ${error.message}`);
      } else {
        showNotification('Password reset email sent! Check your inbox. 📧');
      }
    } catch (err) {
      showNotification('Failed to send reset email. Try again later.');
    }
  };

  // Magic Link Login
  const handleMagicLink = async (email, role = 'student') => {
    if (!supabase) {
      showNotification('Not connected to database');
      return;
    }
    if (!email) {
      showNotification('Please enter your email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification('Please enter a valid email address');
      return;
    }
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          role: role, // Store role in metadata for new users
        }
      }
    });
    
    if (error) {
      showNotification(`Error: ${error.message}`);
    } else {
      showNotification('Magic link sent! Check your email to log in.');
    }
  };

  // Invite User (Admin feature) - creates user directly without email verification
  const handleInviteUser = async (email, role = 'student') => {
    if (!supabase || !isConnected) {
      showNotification('Not connected to database');
      return false;
    }
    
    // Generate a random password for the invited user
    const randomPassword = Math.random().toString(36).slice(-8) + 'A1!';
    
    // Create user via signup (which will work if we disable confirmation or if it's auto-confirmed)
    const { data, error } = await supabase.auth.signUp({
      email,
      password: randomPassword,
      options: {
        data: { role },
        emailRedirectTo: window.location.origin,
      },
    });
    
    if (error) {
      // If signup fails (e.g., email already exists), try to get the user
      if (error.message.includes('already been registered')) {
        showNotification('User already exists with this email');
      } else {
        showNotification(`Error: ${error.message}`);
      }
      return false;
    }
    
    if (data.user) {
      // Create profile in database
      const newUserProfile = {
        user_id: data.user.id,
        email,
        name: email.split('@')[0], // Use email prefix as name
        role,
        dashboard_link: `${window.location.origin}?user=${data.user.id}`,
      };
      
      const endpoint = role === 'teacher' ? 'teachers' : 'students';
      console.log('Inviting user:', endpoint, newUserProfile);
      
      const saved = await saveToDatabase(endpoint, newUserProfile);
      console.log('Invite save result:', saved);
      
      if (saved && saved.length > 0) {
        if (role === 'teacher') {
          setTeachers(prev => [...prev, saved[0]]);
        } else {
          setStudents(prev => [...prev, saved[0]]);
        }
        showNotification(`Invited ${email}! Password: ${randomPassword} (share with user)`);
        return true;
      }
      
      console.error('Failed to invite user - check table exists and RLS policies');
      showNotification('Failed to invite user. Check console for details.');
      return false;
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student account? This action cannot be undone.')) {
      if (isConnected) {
        await fetch(`${dbConfig.url}/rest/v1/students?id=eq.${studentId}`, {
          method: 'DELETE',
          headers: {
            'apikey': dbConfig.key,
            'Authorization': `Bearer ${dbConfig.key}`
          }
        });
        await fetch(`${dbConfig.url}/rest/v1/files?student_id=eq.${studentId}`, {
          method: 'DELETE',
          headers: {
            'apikey': dbConfig.key,
            'Authorization': `Bearer ${dbConfig.key}`
          }
        });
      }
      
      const updatedStudents = students.filter(s => s.id !== studentId);
      const updatedFiles = { ...files };
      delete updatedFiles[studentId];
      setStudents(updatedStudents);
      setFiles(updatedFiles);
      showNotification('Student account deleted successfully');
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher account? This action cannot be undone.')) {
      if (isConnected) {
        await fetch(`${dbConfig.url}/rest/v1/teachers?id=eq.${teacherId}`, {
          method: 'DELETE',
          headers: {
            'apikey': dbConfig.key,
            'Authorization': `Bearer ${dbConfig.key}`
          }
        });
      }
      
      const updatedTeachers = teachers.filter(t => t.id !== teacherId);
      setTeachers(updatedTeachers);
      showNotification('Teacher account deleted successfully');
    }
  };

  const handleFileUpload = async (studentId, file, type) => {
    // Check file size (limit to 15GB for Supabase storage)
    const maxSize = 15 * 1024 * 1024 * 1024; // 15GB
    if (file.size > maxSize) {
      showNotification('File too large! Maximum size is 15GB');
      return;
    }

    // Validate file type matches the selected category
    const mimeType = file.type.toLowerCase();
    const validTypes = {
      video: ['video/'],
      image: ['image/'],
      audio: ['audio/'],
      text: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown', 'application/json']
    };
    const validExtensions = {
      video: ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'],
      image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'],
      audio: ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma'],
      text: ['.pdf', '.doc', '.docx', '.txt', '.md', '.json']
    };
    
    const allowedMimes = validTypes[type] || [];
    const allowedExts = validExtensions[type] || [];
    const hasValidMime = allowedMimes.some(m => mimeType.startsWith(m));
    const hasValidExt = allowedExts.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidMime && !hasValidExt) {
      showNotification(`Invalid file type for ${type}. Please select a valid ${type} file.`);
      return;
    }

    // Determine file type based on MIME type
    let fileType = type;
    if (mimeType.startsWith('video/')) fileType = 'video';
    else if (mimeType.startsWith('image/')) fileType = 'image';
    else if (mimeType.startsWith('audio/')) fileType = 'audio';
    else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) fileType = 'text';

    // Use the dbId from currentUser (already the correct student ID)
    const actualStudentId = currentUser.dbId;
    if (!actualStudentId) {
      showNotification('Error: Student profile not found. Please contact admin.');
      return;
    }

    if (!isConnected) {
      showNotification('Error: Not connected to database.');
      return;
    }

    showNotification('Uploading file...');

    try {
      // Upload to Supabase Storage
      const bucket = getBucketForType(fileType);
      let fileUrl = null;
      let storagePath = null;

      try {
        const uploaded = await uploadFileToStorage(bucket, actualStudentId, file);
        fileUrl = uploaded.url;
        storagePath = uploaded.path;
      } catch (storageErr) {
        // Storage bucket may not exist yet — fall back to base64
        console.warn('Storage upload failed, falling back to base64:', storageErr.message);
        fileUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const newFile = {
        student_id: actualStudentId,
        name: file.name,
        type: fileType,
        upload_date: new Date().toLocaleDateString(),
        size: file.size < 1024 * 1024
          ? (file.size / 1024).toFixed(1) + ' KB'
          : (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        data: fileUrl,
        storage_path: storagePath,
        mime_type: file.type,
        created_at: new Date().toISOString()
      };

       const saved = await saveToDatabase('files', newFile);
       if (saved && saved.length > 0) {
         const savedFile = { ...newFile, id: saved[0].id };
         setFiles(prev => ({
           ...prev,
           [actualStudentId]: [...(prev[actualStudentId] || []), savedFile]
         }));
         
         // Process file with AI for tags and summary
         try {
           // Generate tags for the file
           const tags = await generateFileTags(file, fileType);
           
           // Save tags to database
           const tagPromises = tags.map(tag => 
             saveToDatabase('file_tags', {
               file_id: saved[0].id,
               tag: tag,
               confidence: 0.8 // Default confidence for AI-generated tags
             })
           );
           await Promise.all(tagPromises);
           
           // Extract text content and generate summary for text-based files
           if (fileType === 'text' || file.type.startsWith('text/')) {
             const content = await extractTextContent(file);
             if (content && content.trim() !== '') {
               const summary = await generateSummary(content);
               
               // Save summary to database
               await saveToDatabase('file_summaries', {
                 file_id: saved[0].id,
                 summary: summary,
                 language: 'en' // Default to English, could detect language
               });
             }
           }
         } catch (aiError) {
           console.warn('AI processing failed:', aiError);
           // Don't fail the upload if AI processing fails
         }
         
         addNotification('admin_001', `New file uploaded by ${currentUser.name}: ${file.name}`, 'upload');
         showNotification('File uploaded successfully! ✅');
       } else {
         showNotification('Error saving file record. Check Supabase permissions.');
       }
    } catch (err) {
      console.error('Upload error:', err);
      showNotification(`Upload failed: ${err.message}`);
    }
  };

  // Chat functions
  const handleSendMessage = async (messageText, recipient, sender) => {
    if (!isConnected) {
      showNotification('Not connected to database');
      return;
    }

    // Determine if this is a general chat message
    const isGeneral = !recipient || recipient.id === 'general';
    const senderId = sender.dbId || sender.id;

    console.log('Sending message:', { messageText, recipient, isGeneral, senderId });

    const newMessage = {
      sender_id: senderId,
      sender_name: sender.name,
      sender_role: sender.role,
      recipient_id: isGeneral ? null : recipient.id,
      recipient_name: isGeneral ? null : recipient.name,
      recipient_role: isGeneral ? null : recipient.role,
      message_type: 'text',
      message: messageText,
      is_general: isGeneral,
      created_at: new Date().toISOString()
    };

    console.log('New message object:', newMessage);

    const saved = await saveToDatabase('chat_messages', newMessage);
    if (saved && saved.length > 0) {
      console.log('Message saved successfully:', saved[0]);
      setChatMessages(prev => {
        const newMessages = [...prev, saved[0]];
        console.log('Chat messages updated, total:', newMessages.length);
        return newMessages;
      });
      
      // Send notifications for private messages
      if (!isGeneral && recipient && recipient.id !== 'general') {
        const notificationMessage = `${sender.name} sent you a message: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`;
        await addNotification(recipient.id, notificationMessage, 'chat');
        sendEmailNotification(
          recipient.email, 
          'New Chat Message', 
          `${sender.name} sent you a message: ${messageText}`
        );
      }
    }
  };

  const handleSendAudio = async (audioData, recipient, sender) => {
    if (!isConnected) {
      showNotification('Not connected to database');
      return;
    }

    const isGeneral = recipient?.id === 'general' || !recipient;
    const senderId = sender.dbId || sender.id;

    const newMessage = {
      sender_id: senderId,
      sender_name: sender.name,
      sender_role: sender.role,
      recipient_id: isGeneral ? null : recipient.id,
      recipient_name: isGeneral ? null : recipient.name,
      recipient_role: isGeneral ? null : recipient.role,
      message_type: 'audio',
      message: 'Voice message',
      audio_data: audioData,
      is_general: isGeneral,
      created_at: new Date().toISOString()
    };

    const saved = await saveToDatabase('chat_messages', newMessage);
    if (saved && saved.length > 0) {
      setChatMessages(prev => [...prev, saved[0]]);
      
      // Send notifications for private messages
      if (!isGeneral && recipient && recipient.id !== 'general') {
        const notificationMessage = `${sender.name} sent you a voice message`;
        await addNotification(recipient.id, notificationMessage, 'chat');
        sendEmailNotification(
          recipient.email, 
          'New Voice Message', 
          `${sender.name} sent you a voice message`
        );
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!isConnected) return;
    
    await fetch(`${dbConfig.url}/rest/v1/chat_messages?id=eq.${messageId}`, {
      method: 'DELETE',
      headers: {
        'apikey': dbConfig.key,
        'Authorization': `Bearer ${dbConfig.key}`
      }
    });
    
    setChatMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const handleDeleteFile = async (studentId, fileId) => {
    if (window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      if (isConnected && supabase) {
        try {
          // Find file to get storage_path for cleanup
          const fileToDelete = (files[studentId] || []).find(f => f.id === fileId);

          const { error } = await supabase.from('files').delete().eq('id', fileId);
          if (error) throw error;

          // Delete from Supabase Storage if it was stored there
          if (fileToDelete?.storage_path) {
            const bucket = getBucketForType(fileToDelete.type);
            try {
              await deleteFileFromStorage(bucket, fileToDelete.storage_path);
            } catch (storageErr) {
              console.warn('Storage delete failed (file may already be gone):', storageErr.message);
            }
          }

          setFiles(prev => ({
            ...prev,
            [studentId]: (prev[studentId] || []).filter(f => f.id !== fileId)
          }));
          showNotification('File deleted successfully!');
        } catch (error) {
          console.error('Error deleting file:', error);
          showNotification(`Error: ${error.message || 'File not deleted.'}`);
        }
      } else {
        showNotification('Error: Not connected to database. File not deleted.');
      }
    }
  };

  const handleAddComment = async (fileId, comment) => {
    const userId = currentUser.role === 'admin' ? currentUser.id : (currentUser.dbId || currentUser.id);
    const newComment = {
      file_id: fileId,
      user_id: userId,
      user_name: currentUser.name,
      user_role: currentUser.role,
      text: comment,
    };

    if (isConnected) {
      const saved = await saveToDatabase('comments', newComment);
      if (saved && saved.length > 0) {
        setComments(prev => ({
          ...prev,
          [fileId]: [...(prev[fileId] || []), saved[0]]
        }));

        const file = Object.values(files).flat().find(f => f.id === fileId);
        if (file && currentUser.role === 'teacher') {
          const student = students.find(s => s.id === file.student_id);
          if (student) {
            addNotification(student.id, `${currentUser.name} commented on your file: ${file.name}`, 'comment');
            sendEmailNotification(student.email, 'New Comment on Your File', `${currentUser.name} commented: "${comment}"`);
          }
        }
        showNotification('Comment added successfully!');
      }
    } 
  };

  const handleLikeFile = async (fileId) => {
    const currentUserId = currentUser.role === 'admin' ? currentUser.id : (currentUser.dbId || currentUser.id);
    const currentLikes = likes[fileId] || [];
    const hasLiked = currentLikes.includes(currentUserId);

    if (isConnected) {
      if (hasLiked) {
        await fetch(`${dbConfig.url}/rest/v1/likes?file_id=eq.${fileId}&user_id=eq.${currentUserId}`, {
          method: 'DELETE',
          headers: {
            'apikey': dbConfig.key,
            'Authorization': `Bearer ${dbConfig.key}`
          }
        });
        setLikes(prev => ({
          ...prev,
          [fileId]: currentLikes.filter(id => id !== currentUserId)
        }));
      } else {
        const saved = await saveToDatabase('likes', { file_id: fileId, user_id: currentUserId });
        if (saved && saved.length > 0) {
          setLikes(prev => ({
            ...prev,
            [fileId]: [...currentLikes, currentUserId]
          }));
        }
      }
    } 

    const file = Object.values(files).flat().find(f => f.id === fileId);
    // For students: check if they own the file to skip self-notification
    // For teachers: always notify the student
    const isOwnFile = currentUser.role === 'student' && file?.student_id === currentUser.dbId;
    if (file && !isOwnFile && !hasLiked) {
      const student = students.find(s => s.id === file.student_id);
      if (student) {
        addNotification(student.id, `${currentUser.name} liked your file: ${file.name}`, 'like');
      }
    }
  };

  const handleShareFile = async (fileId, recipientIds) => {
    const file = Object.values(files).flat().find(f => f.id === fileId);
    if (!file) {
      showNotification('File not found. Please try again.');
      return;
    }

    if (!isConnected) {
      showNotification('Not connected to database. Please configure Supabase first.');
      return;
    }

    const sharesToSave = recipientIds.map(recipientId => ({
      file_id: fileId,
      owner_id: file.student_id,
      recipient_id: recipientId,
    }));
    const saved = await saveToDatabase('shares', sharesToSave);
    if (saved && saved.length > 0) {
      setShares(prev => {
        const newShares = { ...prev };
        saved.forEach(share => {
          newShares[share.id] = {
            fileId: share.file_id,
            ownerId: share.owner_id,
            recipientId: share.recipient_id,
          };
        });
        return newShares;
      });

      recipientIds.forEach(recipientId => {
        // Check both students and teachers arrays
        const studentRecipient = students.find(s => s.id === recipientId);
        const teacherRecipient = teachers.find(t => t.id === recipientId);
        const recipient = studentRecipient || teacherRecipient;
        
        if (recipient) {
          const roleLabel = studentRecipient ? 'student' : 'teacher';
          addNotification(recipientId, `${currentUser.name} shared a file with you: ${file.name}`, 'share');
          sendEmailNotification(recipient.email, 'File Shared With You', `${currentUser.name} (${roleLabel}) shared ${file.name} with you`);
        }
      });

      showNotification('File shared successfully!');
    }
    setShowShareModal(false);
    setSelectedFileForShare(null);
  };

  // Teacher sends file to students
  const handleSendFileToStudents = async (file, recipientIds, note) => {
    if (!isConnected) {
      showNotification('Not connected to database');
      return;
    }

    // Validate file type
    const mimeType = file.type.toLowerCase();
    const validExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma', '.pdf', '.doc', '.docx', '.txt', '.md'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidExt) {
      showNotification('Invalid file type. Please select a video, image, audio, or document file.');
      return;
    }

    // Determine file type
    let fileType = 'text';
    if (mimeType.startsWith('video/')) fileType = 'video';
    else if (mimeType.startsWith('image/')) fileType = 'image';
    else if (mimeType.startsWith('audio/')) fileType = 'audio';

    showNotification('Uploading and sending file...');

    try {
      // Upload once to Storage, share URL with all recipients
      const bucket = getBucketForType(fileType);
      let fileUrl = null;
      let storagePath = null;

      try {
        const uploaded = await uploadFileToStorage(bucket, `teacher_${currentUser.dbId}`, file);
        fileUrl = uploaded.url;
        storagePath = uploaded.path;
      } catch (storageErr) {
        console.warn('Storage upload failed, falling back to base64:', storageErr.message);
        fileUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const filesToSave = recipientIds.map(recipientId => ({
        student_id: recipientId,
        name: file.name,
        type: fileType,
        upload_date: new Date().toLocaleDateString(),
        size: file.size < 1024 * 1024
          ? (file.size / 1024).toFixed(1) + ' KB'
          : (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        data: fileUrl,
        storage_path: storagePath,
        mime_type: file.type,
        created_at: new Date().toISOString(),
        note: note || '',
        sent_by_teacher: true,
        teacher_id: currentUser.dbId,
      }));

      const saved = await saveToDatabase('files', filesToSave);
      if (saved && saved.length > 0) {
        const updatedFiles = { ...files };
        saved.forEach((newFile) => {
          if (!updatedFiles[newFile.student_id]) updatedFiles[newFile.student_id] = [];
          updatedFiles[newFile.student_id].push(newFile);
        });
        setFiles(updatedFiles);
        recipientIds.forEach(recipientId => {
          const recipient = students.find(s => s.id === recipientId);
          if (recipient) {
            const message = note
              ? `${currentUser.name} sent you a file: ${file.name}. Note: ${note}`
              : `${currentUser.name} sent you a file: ${file.name}`;
            addNotification(recipientId, message, 'teacher_file');
          }
        });
        showNotification(`File sent to ${recipientIds.length} student${recipientIds.length !== 1 ? 's' : ''}! ✅`);
      } else {
        showNotification('Error sending file. Check Supabase permissions.');
      }
    } catch (err) {
      console.error('Send file error:', err);
      showNotification(`Failed to send file: ${err.message}`);
    }
  };



  return (
    <>
      <Notification notification={notification} darkMode={darkMode} />
      <NotificationPanel
        showNotificationPanel={showNotificationPanel}
        setShowNotificationPanel={setShowNotificationPanel}
        notifications={notifications}
        currentUser={currentUser}
        markNotificationRead={markNotificationRead}
        darkMode={darkMode}
        setShowChat={setShowChat}
      />
      <ShareModal
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        selectedFileForShare={selectedFileForShare}
        setSelectedFileForShare={setSelectedFileForShare}
        students={students}
        teachers={teachers}
        currentUser={currentUser}
        handleShareFile={handleShareFile}
        darkMode={darkMode}
      />
      <SendFileModal
        showSendFileModal={showSendFileModal}
        setShowSendFileModal={setShowSendFileModal}
        students={students}
        handleSendFileToStudents={handleSendFileToStudents}
        darkMode={darkMode}
      />
      <AddStudentModal
        showAddStudentModal={showAddStudentModal}
        setShowAddStudentModal={setShowAddStudentModal}
        handleSignup={handleSignup}
        showNotification={showNotification}
        darkMode={darkMode}
      />
      <AddTeacherModal
        showAddTeacherModal={showAddTeacherModal}
        setShowAddTeacherModal={setShowAddTeacherModal}
        handleSignup={handleSignup}
        showNotification={showNotification}
        darkMode={darkMode}
      />
      
      {currentView === 'setup' && <DatabaseSetup 
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        showNotification={showNotification}
        setSupabase={setSupabase}
        setDbConfig={setDbConfig}
        setIsConnected={setIsConnected}
        loadFromDatabase={loadFromDatabase}
        setCurrentView={setCurrentView}
      />}
      
      {currentView === 'login' && (
        <>
          {isLoggingIn && loadingProgress > 0 && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-6 w-80 max-w-[90vw]`}>
                <div className="text-center mb-4">
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${darkMode ? 'bg-indigo-900' : 'bg-indigo-100'}`}>
                    <svg className="animate-spin w-8 h-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Loading...</h3>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{loadingMessage}</p>
                </div>
                <div className={`h-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <p className={`text-center text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{loadingProgress}%</p>
              </div>
            </div>
          )}
          <LoginPage
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            showNotification={showNotification}
            signupEnabled={signupEnabled}
            handleSignup={handleSignup}
            handleLogin={handleLogin}
            handleResendVerification={handleResendVerification}
            handleMagicLink={handleMagicLink}
            handlePasswordReset={handlePasswordReset}
            showUnverifiedEmailNotification={showUnverifiedEmailNotification}
            unverifiedEmail={unverifiedEmail}
            isLoggingIn={isLoggingIn}
          />
        </>
      )}
      {currentView === 'dashboard' && (
        <Suspense fallback={<DashboardLoader />}>
          <StudentDashboard
            currentUser={currentUser}
            files={files}
            shares={shares}
            notifications={notifications}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            setShowNotificationPanel={setShowNotificationPanel}
            setCurrentUser={setCurrentUser}
            setCurrentView={setCurrentView}
            handleFileUpload={handleFileUpload}
            handleDeleteFile={handleDeleteFile}
            comments={comments}
            likes={likes}
            handleLikeFile={handleLikeFile}
            handleAddComment={handleAddComment}
            setSelectedFileForShare={setSelectedFileForShare}
            setShowShareModal={setShowShareModal}
            students={students}
            showChat={showChat}
            setShowChat={setShowChat}
            handleSearch={handleSearch}
            searchResults={searchResults}
            searchState={searchState}
          />
        </Suspense>
      )}
      {currentView === 'teacher' && (
        <Suspense fallback={<DashboardLoader />}>
          <TeacherDashboard
            currentUser={currentUser}
            students={students}
            files={files}
            shares={shares}
            notifications={notifications}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            setShowNotificationPanel={setShowNotificationPanel}
            setCurrentUser={setCurrentUser}
            setCurrentView={setCurrentView}
            comments={comments}
            likes={likes}
            handleLikeFile={handleLikeFile}
            handleAddComment={handleAddComment}
            setSelectedFileForShare={setSelectedFileForShare}
            setShowShareModal={setShowShareModal}
            setShowSendFileModal={setShowSendFileModal}
            handleSendFileToStudents={handleSendFileToStudents}
            showChat={showChat}
            setShowChat={setShowChat}
            handleSearch={handleSearch}
            searchResults={searchResults}
            searchState={searchState}
          />
        </Suspense>
      )}
      {currentView === 'admin' && (
        <Suspense fallback={<DashboardLoader />}>
          <AdminDashboard
            currentUser={currentUser}
            students={students}
            teachers={teachers}
            files={files}
            shares={shares}
            notifications={notifications}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            setShowNotificationPanel={setShowNotificationPanel}
            setCurrentUser={setCurrentUser}
            setCurrentView={setCurrentView}
            signupEnabled={signupEnabled}
            toggleSignup={toggleSignup}
            isConnected={isConnected}
            setShowAddStudentModal={setShowAddStudentModal}
            setShowAddTeacherModal={setShowAddTeacherModal}
            handleDeleteStudent={handleDeleteStudent}
            handleDeleteTeacher={handleDeleteTeacher}
            comments={comments}
            likes={likes}
            handleLikeFile={handleLikeFile}
            handleAddComment={handleAddComment}
            handleInviteUser={handleInviteUser}
            setSelectedFileForShare={setSelectedFileForShare}
            setShowShareModal={setShowShareModal}
            showChat={showChat}
            setShowChat={setShowChat}
            handleSearch={handleSearch}
            searchResults={searchResults}
            searchState={searchState}
          />
        </Suspense>
      )}

       {/* Chat Modal */}
       <ChatModal
         showChat={showChat}
         setShowChat={setShowChat}
         currentUser={currentUser}
         students={students}
         teachers={teachers}
         admin={ADMIN_ACCOUNT}
         chatMessages={chatMessages}
         darkMode={darkMode}
         handleSendMessage={handleSendMessage}
         handleSendAudio={handleSendAudio}
         handleDeleteMessage={handleDeleteMessage}
         isConnected={isConnected}
         supabase={supabase}
         showNotification={showNotification}
       />
      
      {/* Fallback loading state */}
      {!currentView && (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
