import { createClient } from '@supabase/supabase-js';
import React, { useState } from 'react';
import { FileText, Database, Sun, Moon } from 'lucide-react';
import { initStorageClient } from '../utils/storageUtils';

const DatabaseSetup = ({ darkMode, toggleDarkMode, showNotification, setSupabase, setDbConfig, setIsConnected, loadFromDatabase, setCurrentView }) => {
    const [setupData, setSetupData] = useState({ url: '', key: '' });
    const [testing, setTesting] = useState(false);

    const testConnection = async () => {
      setTesting(true);
      try {
        // Test with students table — works with anon key
        const response = await fetch(`${setupData.url}/rest/v1/students?limit=1`, {
          headers: {
            'apikey': setupData.key,
            'Authorization': `Bearer ${setupData.key}`
          }
        });
        
        // 200 = connected, 401/403 = bad key, anything else could be empty table (still connected)
        if (response.ok || response.status === 406) {
          showNotification('Connection successful!');
          localStorage.setItem('dbConfig', JSON.stringify(setupData));
          const client = createClient(setupData.url, setupData.key);
          setSupabase(client);
          initStorageClient(setupData.url, setupData.key);
          setDbConfig(setupData);
          setIsConnected(true);
          
          await initializeTables(setupData);
          await loadFromDatabase(setupData);
          setCurrentView('login');
        } else {
          showNotification('Connection failed. Please check your credentials.');
        }
      } catch (error) {
        showNotification('Connection error. Please check your URL and key.');
      } finally {
        setTesting(false);
      }
    };

    const initializeTables = async (config) => {
      try {
        const settingsData = await fetch(`${config.url}/rest/v1/settings?select=*`, {
          headers: {
            'apikey': config.key,
            'Authorization': `Bearer ${config.key}`
          }
        }).then(res => res.json());

        if (!settingsData || settingsData.length === 0) {
          await fetch(`${config.url}/rest/v1/settings`, {
            method: 'POST',
            headers: {
              'apikey': config.key,
              'Authorization': `Bearer ${config.key}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({ signup_enabled: true })
          });
        }
      } catch (error) {
        console.log('Error initializing tables:', error);
      }
    };

    const skipDatabase = () => {
      setCurrentView('login');
      showNotification('Using local storage mode');
    };

    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} flex items-center justify-center p-4 animate-fade-in`}>
        {!darkMode && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
        )}
        
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-sm'} rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative z-10 animate-scale-in`}>
          <div className="absolute top-4 right-4">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'} hover:scale-110 transition-transform`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-float">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'}`}>
              Database Setup
            </h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>Connect to Supabase for persistent storage</p>
          </div>

          <div className={`${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4 mb-6`}>
            <h3 className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-800'} mb-2`}>Quick Setup Guide:</h3>
            <ol className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-700'} space-y-1 list-decimal list-inside`}>
              <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a> and create a free account</li>
              <li>Create a new project</li>
              <li>Go to Project Settings → API</li>
              <li>Copy the "Project URL" and "anon public" key</li>
              <li>Run the SQL commands below in SQL Editor</li>
            </ol>
          </div>

          <div className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4 mb-6`}>
            <h3 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-2 flex items-center gap-2`}>
              <FileText className="w-4 h-4" />
              SQL Setup Commands:
            </h3>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`-- Drop existing tables if needed (careful: this deletes all data)
-- DROP TABLE IF EXISTS shares CASCADE;
-- DROP TABLE IF EXISTS likes CASCADE;
-- DROP TABLE IF EXISTS comments CASCADE;
-- DROP TABLE IF EXISTS files CASCADE;
-- DROP TABLE IF EXISTS teachers CASCADE;
-- DROP TABLE IF EXISTS students CASCADE;
-- DROP TABLE IF EXISTS settings CASCADE;

-- Recreate with UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student',
  dashboard_link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'teacher',
  dashboard_link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  upload_date TEXT,
  size TEXT,
  data TEXT,
  mime_type TEXT,
  sent_by_teacher BOOLEAN DEFAULT false,
  teacher_id uuid,
  note TEXT,
  storage_path TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE settings (
  id BIGSERIAL PRIMARY KEY,
  signup_enabled BOOLEAN DEFAULT true
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for students" ON students FOR ALL USING (true);
CREATE POLICY "Enable all for teachers" ON teachers FOR ALL USING (true);
CREATE POLICY "Enable all for files" ON files FOR ALL USING (true);
CREATE POLICY "Enable all for settings" ON settings FOR ALL USING (true);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  user_name TEXT,
  user_role TEXT,
  text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  UNIQUE(file_id, user_id)
);

CREATE TABLE IF NOT EXISTS shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  owner_id uuid,
  recipient_id uuid
);

-- AI Features Tables
CREATE TABLE IF NOT EXISTS file_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  confidence FLOAT DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS file_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  summary TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS file_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Advanced Collaboration Tables
CREATE TABLE IF NOT EXISTS chat_message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  reaction TEXT NOT NULL, -- emoji or reaction type
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction)
);

CREATE TABLE IF NOT EXISTS chat_message_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE, -- the message being replied to
  reply_message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE, -- the reply message
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_message_edits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  edited_text TEXT NOT NULL,
  edited_at TIMESTAMP DEFAULT NOW(),
  edited_by uuid REFERENCES auth.users(id)
);

-- Security & Privacy Tables
CREATE TABLE IF NOT EXISTS file_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  granted_to_uuid uuid REFERENCES auth.users(id),
  permission_type TEXT NOT NULL, -- 'view', 'comment', 'download', 'share'
  granted_by uuid REFERENCES auth.users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(file_id, granted_to_uuid, permission_type)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'upload', 'delete', 'share', 'login', etc.
  resource_type TEXT, -- 'file', 'user', 'chat_message', etc.
  resource_id uuid,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_type TEXT NOT NULL, -- 'file', 'chat_message', 'notification', etc.
  max_age_days INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'delete', 'archive'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_name TEXT NOT NULL,
  key_data TEXT NOT NULL, -- In real implementation, this would be encrypted
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security for new tables
ALTER TABLE file_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for file_tags" ON file_tags FOR ALL USING (true);
CREATE POLICY "Enable all for file_summaries" ON file_summaries FOR ALL USING (true);
CREATE POLICY "Enable all for file_analytics" ON file_analytics FOR ALL USING (true);
CREATE POLICY "Enable all for chat_message_reactions" ON chat_message_reactions FOR ALL USING (true);
CREATE POLICY "Enable all for chat_message_replies" ON chat_message_replies FOR ALL USING (true);
CREATE POLICY "Enable all for chat_message_edits" ON chat_message_edits FOR ALL USING (true);
CREATE POLICY "Enable all for file_permissions" ON file_permissions FOR ALL USING (true);
CREATE POLICY "Enable all for audit_log" ON audit_log FOR ALL USING (true);
CREATE POLICY "Enable all for data_retention_policies" ON data_retention_policies FOR ALL USING (true);
CREATE POLICY "Enable all for encryption_keys" ON encryption_keys FOR ALL USING (true);

-- Create notifications table for real-time notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  recipient_id TEXT,
  recipient_name TEXT,
  recipient_role TEXT,
  message_type TEXT DEFAULT 'text',
  message TEXT NOT NULL,
  audio_data TEXT,
  is_general BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for notifications" ON notifications FOR ALL USING (true);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for chat_messages" ON chat_messages FOR ALL USING (true);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for comments" ON comments FOR ALL USING (true);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for likes" ON likes FOR ALL USING (true);

ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for shares" ON shares FOR ALL USING (true);
`}
            </pre>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Supabase Project URL</label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                className={`w-full p-3 border-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'} rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none`}
                value={setupData.url}
                onChange={(e) => setSetupData({ ...setupData, url: e.target.value })}
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Supabase Anon Key</label>
              <input
                type="password"
                placeholder="Your anon public key"
                className={`w-full p-3 border-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'} rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none`}
                value={setupData.key}
                onChange={(e) => setSetupData({ ...setupData, key: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={testConnection}
                disabled={!setupData.url || !setupData.key || testing}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {testing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Testing...
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5" />
                    Connect to Database
                  </>
                )}
              </button>
              <button
                onClick={skipDatabase}
                className={`px-6 py-3 border-2 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-all duration-300`}
              >
                Skip (Use Local Storage)
              </button>
            </div>
          </div>

          <div className={`mt-6 pt-6 border-t text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>💡 With Supabase, your data persists across devices and sessions!</p>
          </div>
        </div>
      </div>
    );
  };

export default DatabaseSetup;
