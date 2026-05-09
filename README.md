# Student Portfolio v3

A React-based student portfolio system with Supabase backend.

## Features

- 📁 File sharing (video, image, audio, documents)
- 💬 Chat system (general + private)
- 👥 User management (Admin, Teacher, Student roles)
- 📝 Comments & likes on files
- 🔔 Real-time notifications
- 🌙 Dark mode
- ✨ Loading progress indicators

---

## 🚀 Deploy to Vercel (Recommended)

### Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** and run the full SQL from `src/components/DatabaseSetup.jsx` (the big block inside the `<pre>` tag)
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon public** key → `REACT_APP_SUPABASE_KEY`

### Step 2 — Deploy to Vercel

#### Option A: Via GitHub (recommended)

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. Vercel auto-detects Create React App — no build config needed
5. **Add Environment Variables** (click "Environment Variables" before deploying):

| Variable | Value |
|---|---|
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL |
| `REACT_APP_SUPABASE_KEY` | Your Supabase anon public key |
| `REACT_APP_ADMIN_EMAIL` | Admin login email |
| `REACT_APP_ADMIN_PASSWORD` | Admin login password (use something strong!) |

6. Click **Deploy** ✅

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel

# Set environment variables
vercel env add REACT_APP_SUPABASE_URL
vercel env add REACT_APP_SUPABASE_KEY
vercel env add REACT_APP_ADMIN_EMAIL
vercel env add REACT_APP_ADMIN_PASSWORD

# Redeploy with env vars applied
vercel --prod
```

### Step 3 — Update Supabase Auth Settings

In your Supabase dashboard:
1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel deployment URL (e.g. `https://your-app.vercel.app`)
3. Add your Vercel URL to **Redirect URLs**
4. Go to **Authentication → Email Templates** and update the confirmation link if needed

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Create local env file
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start dev server
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## User Roles

| Role | Permissions |
|------|-------------|
| Admin | Manage users, view all files, invite users, settings |
| Teacher | View all student files, send files to students, chat |
| Student | Upload files, view own portfolio, receive files, chat |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `REACT_APP_SUPABASE_KEY` | ✅ Yes | Your Supabase anon public key |
| `REACT_APP_ADMIN_EMAIL` | ✅ Yes | Email for the admin account |
| `REACT_APP_ADMIN_PASSWORD` | ✅ Yes | Password for the admin account |

> ⚠️ **Never commit `.env` or `.env.local` to Git.** Set all secrets via Vercel's Environment Variables dashboard.

---

## Latest Update (2026-05-09)

- ✅ **Mobile Responsiveness** - Full mobile optimization across all dashboards
  - AdminDashboard: Responsive grid layouts, stacked sidebar on mobile, abbreviated tab labels
  - TeacherDashboard: Responsive navigation, student card layouts, file type tabs with mobile abbreviations
  - All dashboards now support touch-friendly 44px minimum targets, proper text truncation, and horizontal scroll tabs
- ✅ Fixed Vercel deployment failure caused by CI linting (`no-unused-vars` in `src/App.jsx`)
- ✅ Removed unused variable in chat realtime handler
- ✅ Verified `npm run build` compiles successfully
- ✅ Realtime subscriptions for chat/files/notifications/comments/likes/shares are still active

## License

MIT
# Student-portfolio-
