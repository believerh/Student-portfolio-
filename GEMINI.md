# Student Portfolio - Project Documentation

## Project Overview
This is a React application with Supabase backend (authentication, database). It features student, teacher, and admin dashboards with file management, sharing, commenting, and liking capabilities.

---

## Features

### 🔐 Authentication
- **Email/Password Login** - Traditional login with Supabase Auth
- **Magic Link** - Passwordless login via one-time email link
- **Email Verification** - Users must verify email before login
- **Invite Users** - Admin can invite students/teachers via email

### 👥 User Roles

#### Admin
- Login with credentials: `admin@school.com` / `admin123`
- View all students and teachers
- View all uploaded files
- Enable/disable student signup
- Add students/teachers directly
- Invite users via email
- Delete student accounts

#### Teacher
- View all students' files
- Send files to all students or selected students
- Add notes/comments to sent files
- Like and comment on files
- Receive notifications

#### Student
- Upload files (videos, images, audio, documents)
- Share files with other students
- Like and comment on files
- View shared files
- Receive files from teachers

### 📁 File Management
- **Upload** - Support for videos, images, audio, documents (max 15GB)
- **Validation** - File type and extension validation
- **Share** - Student-to-student file sharing
- **Teacher Send** - Teachers can send files to students with notes
- **Preview** - Built-in file viewer for all types
- **Like & Comment** - Interactive engagement

### 🎨 UI/UX Features
- **Dark Mode** - Toggle between light and dark themes
- **Animations** - Smooth fade, slide, scale, and float animations
- **Responsive Design** - Works on mobile and desktop
- **Modern Design** - Gradients, glass effects, custom scrollbars
- **Notifications** - Real-time in-app notifications
- **Chat** - Real-time messaging with private and general chat options
- **Voice Messages** - Record and send voice messages

---

## Database Schema (Supabase)

```sql
-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students Table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student',
  dashboard_link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Teachers Table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'teacher',
  dashboard_link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Files Table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  upload_date TEXT,
  size TEXT,
  data TEXT,
  mime_type TEXT,
  note TEXT,
  sent_by_teacher BOOLEAN DEFAULT FALSE,
  teacher_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Settings Table
CREATE TABLE settings (
  id BIGSERIAL PRIMARY KEY,
  signup_enabled BOOLEAN DEFAULT true
);

-- Comments Table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  user_name TEXT,
  user_role TEXT,
  text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Likes Table
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  UNIQUE(file_id, user_id)
);

-- Shares Table (owner_id and recipient_id are intentionally not FK-constrained
-- because both students, teachers and admins can be owners/recipients)
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  owner_id uuid,
  recipient_id uuid
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  sender_role TEXT,
  recipient_id TEXT,
  recipient_name TEXT,
  recipient_role TEXT,
  message_type TEXT DEFAULT 'text',
  message TEXT,
  audio_data TEXT,
  is_general BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable all for students" ON students FOR ALL USING (true);
CREATE POLICY "Enable all for teachers" ON teachers FOR ALL USING (true);
CREATE POLICY "Enable all for files" ON files FOR ALL USING (true);
CREATE POLICY "Enable all for settings" ON settings FOR ALL USING (true);
CREATE POLICY "Enable all for comments" ON comments FOR ALL USING (true);
CREATE POLICY "Enable all for likes" ON likes FOR ALL USING (true);
CREATE POLICY "Enable all for shares" ON shares FOR ALL USING (true);
CREATE POLICY "Enable all for notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Enable all for chat_messages" ON chat_messages FOR ALL USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

---

## Technical Details

### Technology Stack
- **Frontend**: React 18, Tailwind CSS, Lucide React Icons
- **Backend**: Supabase (Auth, Database, PostgreSQL)
- **Build**: Create React App

### Key Components
- `App.jsx` - Main application with state management
- `LoginPage.jsx` - Authentication (login, signup, magic link)
- `StudentDashboard.jsx` - Student file management
- `TeacherDashboard.jsx` - Teacher file distribution
- `AdminDashboard.jsx` - Admin user management
- `FileViewer.jsx` - File preview and interactions
- `ChatModal.jsx` - Real-time chat with general and private messaging
- `ShareModal.jsx` - Student file sharing
- `SendFileModal.jsx` - Teacher file distribution with notes
- `AddStudentModal.jsx` / `AddTeacherModal.jsx` - User creation

### Custom Hooks/Utilities
- File upload with base64 encoding
- Magic link authentication handling
- Real-time notifications
- Dark mode toggle

---

## Email Templates

### Magic Link Template
Custom beautiful HTML template with gradient design for passwordless login.

### Invite User Template
Custom invitation email with platform description and features.

---

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
- **Netlify**: Drag and drop the `build` folder
- **Vercel**: `vercel --prod`
- **GitHub Pages**: Deploy from build folder
- **Any static hosting**: Upload build folder

### Supabase Configuration
1. Go to **Authentication → Providers → Email**
2. Enable "Confirm email" for production
3. Configure SMTP (Brevo, SendGrid) in **Authentication → Email Templates → Custom SMTP**

---

## Default Credentials
- **Admin Email**: `admin@school.com`
- **Admin Password**: `admin123`

---

## Recent Updates

### Version 1.2.3 (Latest - 2026-05-09)
- Added **Mobile Responsiveness** - Full mobile optimization across all dashboards
  - AdminDashboard: Responsive grid layouts (`grid-cols-2 lg:grid-cols-4`), stacked sidebar on mobile (`order-2 lg:order-1`), abbreviated tab labels (`hidden sm:inline`)
  - TeacherDashboard: Responsive navigation, student card layouts, file type tabs with mobile abbreviations (Vid/Img/Doc/Aud)
  - StudentDashboard: Already had responsive patterns
  - All dashboards now support 44px minimum touch targets, text truncation (`truncate`), horizontal scroll tabs
- Fixed **Vercel Deployment Failure** caused by CI lint rules (`process.env.CI=true`)

### Version 1.2.2 (2026-04-12)
- Fixed **Vercel Deployment Failure** caused by CI lint rules (`process.env.CI=true`)
- Removed unused variable in `src/App.jsx` (`const row = payload.new || payload.old;`) that triggered `no-unused-vars`
- Confirmed production build passes locally after fix (`npm run build`)
- Confirmed realtime subscriptions remain intact for:
  - `chat_messages` (insert/update/delete)
  - `files`, `notifications`, `comments`, `likes`, `shares`
- Pushed fix to GitHub `main` branch

### Version 1.2.1
- Added **Chat Functionality** - Real-time messaging between students, teachers, and admin
  - General chat (broadcast to all)
  - Private chat (one-on-one)
  - Voice message recording
  - Chat messages persisted to database
  - Notifications for private messages
  - Email notifications for new messages
  - Chat notification badge on chat button
  - Auto-mark chat notifications as read when opening chat
- Added **Teacher ↔ Admin Chat** - Teachers and students can now chat privately with admin
- Added **Login Speed Optimization**:
  - Immediate dashboard view after authentication
  - Background loading for non-essential data
  - Priority loading for essential data (students, teachers, user's files)
  - Loading spinner during login
- Added **Mobile UI Preview** - Created `Documents/mobile-ui-preview.html` with iPhone 16 interface
- Added **Login Page Preview** - Created `Documents/login-page-iphone16.html` with iPhone 16 GUI
- Improved **Responsive Design** - All components updated with mobile-first responsive classes
- Fixed **Private Chat Filtering** - String-based ID comparison for message filtering
- Added **Debug Logging** - Console logs for troubleshooting chat issues
- Updated **Documentation** - Added chat_messages table to database schema

### Version 1.2.0
- Added **Real-time Updates** - All changes sync instantly without page reload
- Added **File Type Validation** - Videos go to video tab, images to image tab, etc.
- Added **Extension Validation** - Validates file extensions (mp4, mp3, jpg, etc.)
- Updated **Max File Size** to 15GB (from 5MB)
- Added **Dashboard Link Display** - Students and teachers can see their dashboard link
- Added **Notifications Table** - Real-time notifications persisted to database
- Added **Teacher Dashboard Link** - Teachers can see their dashboard link
- Fixed **Delete Function** - Fixed ID mismatch for file deletion
- Fixed **Admin Delete Users** - Separate functions for students and teachers
- Fixed **Notification ID Issues** - Correct ID handling for admin/students/teachers
- Fixed **Like/Comment Notifications** - Proper notification flow
- Fixed **Share Function** - Students can share and receive files
- Fixed **Admin Can Like Files** - Admin can like any file
- Fixed **JSX Warnings** - Cleaned up unused imports and comments
- Added **Realtime Subscriptions** - Supabase realtime for files, comments, likes, shares

### Version 1.1.0
- Added **Magic Link** login option
- Added **Invite User** functionality for admin
- Added **Teacher Send File** feature with notes
- Fixed ID mismatch issues between auth and database
- Added beautiful email templates
- Enhanced UI with animations and glass effects

### Version 1.0.0
- Initial release with basic features
- Student file upload and management
- Student-to-student sharing
- Like and comment system
- Admin user management
- Dark mode support
