# 🚀 Vercel Deployment Guide

## Step 1 — Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) → Create a free account
2. Click **New Project**, give it a name, set a strong DB password
3. Once created, go to **SQL Editor** (left sidebar)
4. Paste and run the full SQL below:

```sql
-- Enable UUID support
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
  teacher_id UUID,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE settings (
  id BIGSERIAL PRIMARY KEY,
  signup_enabled BOOLEAN DEFAULT true
);
INSERT INTO settings (signup_enabled) VALUES (true);

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
  user_id TEXT NOT NULL,
  UNIQUE(file_id, user_id)
);

CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  owner_id uuid,
  recipient_id uuid
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_messages (
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

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (open access — auth is handled at app layer)
CREATE POLICY "Enable all for students" ON students FOR ALL USING (true);
CREATE POLICY "Enable all for teachers" ON teachers FOR ALL USING (true);
CREATE POLICY "Enable all for files" ON files FOR ALL USING (true);
CREATE POLICY "Enable all for settings" ON settings FOR ALL USING (true);
CREATE POLICY "Enable all for comments" ON comments FOR ALL USING (true);
CREATE POLICY "Enable all for likes" ON likes FOR ALL USING (true);
CREATE POLICY "Enable all for shares" ON shares FOR ALL USING (true);
CREATE POLICY "Enable all for notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Enable all for chat_messages" ON chat_messages FOR ALL USING (true);

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE files;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE shares;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE teachers;
```

5. Go to **Project Settings → API**
6. Copy your **Project URL** and **anon public** key — you'll need these next

---

## Step 2 — Configure Supabase Auth

1. Go to **Authentication → Providers → Email**
2. Make sure **Enable Email Provider** is ON
3. For testing, you can turn off **Confirm email** (re-enable for production)
4. Go to **Authentication → URL Configuration**
5. Set **Site URL** to your Vercel URL (e.g. `https://your-app.vercel.app`)
   - For local dev use: `http://localhost:3000`
6. Under **Redirect URLs**, add:
   - `https://your-app.vercel.app/**`
   - `http://localhost:3000/**`

---

## Step 3 — Deploy to Vercel

### Option A: GitHub + Vercel (easiest)

1. Push this project to GitHub (public or private repo)
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repository
4. Vercel detects Create React App automatically — no config needed
5. **Before clicking Deploy**, add these Environment Variables:

| Name | Value |
|------|-------|
| `REACT_APP_SUPABASE_URL` | Your Supabase Project URL |
| `REACT_APP_SUPABASE_KEY` | Your Supabase anon public key |
| `REACT_APP_ADMIN_EMAIL` | e.g. `admin@yourschool.com` |
| `REACT_APP_ADMIN_PASSWORD` | A strong password (min 12 chars!) |

6. Click **Deploy** ✅
7. Once deployed, copy the URL (e.g. `https://student-portfolio-abc.vercel.app`)
8. Go back to Supabase → **Authentication → URL Configuration** and set the **Site URL** to this URL

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
cd student-portfolio-v-3-main
vercel

# When prompted, add env vars one by one:
vercel env add REACT_APP_SUPABASE_URL production
vercel env add REACT_APP_SUPABASE_KEY production
vercel env add REACT_APP_ADMIN_EMAIL production
vercel env add REACT_APP_ADMIN_PASSWORD production

# Redeploy to pick up env vars
vercel --prod
```

---

## Step 4 — First Login

Once deployed, open your Vercel URL:

1. Click **Sign In**
2. Use the admin credentials you set in `REACT_APP_ADMIN_EMAIL` / `REACT_APP_ADMIN_PASSWORD`
3. You're in! From the Admin dashboard you can:
   - Add students and teachers
   - Enable/disable public signup
   - Invite users by email

---

## ⚠️ Security Checklist Before Going Live

- [ ] Change `REACT_APP_ADMIN_PASSWORD` to something strong (not `admin123`)
- [ ] Change `REACT_APP_ADMIN_EMAIL` to a real email you control
- [ ] Enable **Confirm email** in Supabase Auth settings
- [ ] Set your Vercel URL as the **Site URL** in Supabase
- [ ] Never commit `.env` or `.env.local` to your Git repo

---

## 🐛 Troubleshooting

**"Database connection failed" on load**
→ Check that `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_KEY` are set in Vercel Environment Variables and redeploy.

**Login fails with "Invalid credentials"**
→ For admin: check your env var values match exactly.
→ For students/teachers: check email is confirmed in Supabase Auth dashboard.

**Real-time not working**
→ Make sure you ran the `ALTER PUBLICATION supabase_realtime ADD TABLE ...` SQL commands.

**Uploads fail**
→ Make sure Supabase Storage is enabled. Create a bucket named `files` with public access, or adjust storage policies.

**Magic Link not arriving**
→ Check your spam folder. For production, configure a custom SMTP in Supabase (Brevo/SendGrid recommended).
