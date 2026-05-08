# Student Portfolio — Feature Roadmap

> All features organized by phase. Each feature is a discrete task: build → test → push → done.

---

## Phase 1 — High Value, Moderate Effort

### 1.1 Full-Text Search 🔍
- Supabase full-text search over file names, descriptions, comments, tags
- Search bar in all dashboards (admin, student, teacher)
- Filter results by type, user, date
- **Deps:** None
- **Effort:** ~2 hours

### 1.2 Analytics Dashboard with Charts 📊
- Install `recharts` for charting
- Admin analytics: student count trends, upload frequency, file type distribution (bar/pie charts)
- Student analytics: personal upload stats, engagement (comments/likes received)
- Teacher analytics: files shared to students, student interaction rates
- **Deps:** None
- **Effort:** ~3 hours

### 1.3 Enhanced Notification System 🔔
- Toast notification component (success/error/info/warning)
- Notification types: new comment, new like, file shared, new chat message, new file from teacher
- Notification persistence (stored in DB)
- Unread count badge on bell icon
- Mark-as-read, clear-all
- **Deps:** None
- **Effort:** ~2.5 hours

### 1.4 Drag & Drop Upload Zone 📤
- Drag & drop area on upload tab
- Visual feedback (highlight on drag over)
- Upload progress bars per file
- Bulk file upload support
- File size/type validation with error toasts
- **Deps:** 1.3 (toasts for validation errors)
- **Effort:** ~2 hours

### 1.5 Accessibility (WCAG 2.1 AA) ♿
- Aria labels on all interactive elements
- Keyboard navigation (tab order, escape to close modals, enter to submit)
- Focus-visible outlines
- Screen reader announcements for dynamic content
- Color contrast fixes (audit cyan-on-dark)
- **Deps:** None
- **Effort:** ~3 hours

---

## Phase 2 — High Value, High Effort

### 2.1 AI Content Analysis 🤖
- Automatic tagging on file upload (AI-generated tags)
- Document text extraction (PDF, Word → searchable text)
- Auto-summarization for long documents
- Skill extraction from submissions
- **Deps:** Supabase Edge Functions or external API
- **Effort:** ~6 hours

### 2.2 Real-Time Video/Audio Chat 📹
- WebRTC peer connections
- Video call UI (grid view, mute/camera toggle)
- Screen sharing
- Whiteboard (canvas-based)
- **Deps:** Turn/STUN server setup
- **Effort:** ~8 hours

### 2.3 PWA + Offline Mode 📱
- Service worker registration
- Offline cache strategy for assets + recent data
- Installable PWA (manifest.json)
- Background sync for uploads
- Push notifications
- **Deps:** None
- **Effort:** ~5 hours

### 2.4 Advanced File Preview 👁️
- PDF viewer (PDF.js integration)
- Video player with controls (custom player)
- Audio waveform visualization (wavesurfer.js)
- Image annotation (draw/highlight overlay)
- Code syntax highlighting
- **Deps:** None
- **Effort:** ~5 hours

### 2.5 File Versioning 🔄
- Version history per file
- Upload new version → keep old ones
- Restore previous version
- Activity timeline (who uploaded, when)
- **Deps:** Supabase storage structure changes
- **Effort:** ~3 hours

### 2.6 AI Recommendations & Similarity 🔗
- Semantic search via pgvector (Supabase)
- "Similar files" suggestions
- Relevant peer suggestions
- Learning resource recommendations
- Plagiarism/code similarity detection
- **Deps:** 2.1 (AI analysis), pgvector extension
- **Effort:** ~6 hours

### 2.7 LMS Integrations 🎓
- Moodle API connector
- Canvas LMS connector
- Google Classroom integration
- Assignment deadline sync
- **Deps:** LMS API credentials
- **Effort:** ~6 hours

---

## Phase 3 — Nice to Have

### 3.1 Gamification 🏆
- Achievement badges (first upload, 10 files, 100 likes, etc.)
- Skill tree / progression system
- Leaderboards (participation, quality)
- Points / rewards system
- Portfolio showcases (featured work)
- **Deps:** DB schema for badges/points
- **Effort:** ~5 hours

### 3.2 Comment Threads & Collaboration 💬
- Nested replies on comments
- @mentions in comments
- File annotation tools
- Group/team spaces
- **Deps:** DB schema changes for threaded comments
- **Effort:** ~4 hours

### 3.3 Security Hardening 🔒
- MFA / TOTP
- Role hierarchy (department heads, assistants)
- Audit logs (who did what, when)
- GDPR: right to erasure, data export
- Content moderation (flag/report)
- **Deps:** None
- **Effort:** ~6 hours

### 3.4 Integrations 🔌
- Google Drive / OneDrive / Dropbox sync
- Calendar sync (assignments, deadlines)
- SSO (Google, Microsoft, GitHub)
- REST API for third-party tools
- **Deps:** OAuth setup
- **Effort:** ~8 hours

### 3.5 DevOps & Quality 🛠️
- Jest + React Testing Library (unit tests)
- Cypress E2E tests
- CI/CD pipeline (GitHub Actions)
- Sentry error monitoring
- A/B testing framework
- Feature flags
- Admin theming/branding customization
- **Deps:** None
- **Effort:** ~6 hours

---

## Execution Order (Recommended)

```
1.1 Full-Text Search
1.2 Analytics Dashboard
1.3 Enhanced Notifications
1.4 Drag & Drop Upload
1.5 Accessibility
─── Phase 1 Complete ───
2.5 File Versioning
2.4 Advanced File Preview
2.3 PWA + Offline Mode
2.1 AI Content Analysis
2.2 Real-Time Video Chat
2.6 AI Recommendations
2.7 LMS Integrations
─── Phase 2 Complete ───
3.2 Comment Threads
3.1 Gamification
3.3 Security Hardening
3.4 Integrations
3.5 DevOps & Quality
─── Phase 3 Complete ───
```

**Total estimated effort:** ~95 hours across 17 features

---

## Status Legend
- ✅ Done
- 🚧 In progress
- ⏳ Planned

| Feature | Status | Session | Notes |
|---------|--------|---------|-------|
| 1.1 Full-Text Search | ✅ | Done | Search across files, users, comments with filters |
| 1.2 Analytics Dashboard | ✅ | Done | Recharts charts: bar, pie, line + stat cards |
| 1.3 Enhanced Notifications | ✅ | Done | Multi-type toasts, mark-all-read, clear-all, DB sync |
| 1.4 Drag & Drop Upload Zone | ✅ | Done | Drag-and-drop file upload, multi-file queue, per-file progress, validation |
| 1.5 Accessibility (WCAG 2.1 AA) | ✅ | Done | Aria labels, keyboard navigation (Escape close, Enter submit), focus trap, skip-link, screen reader announcements, color contrast audit |
| 2.1 AI Content Analysis | ✅ | Done | Auto-tagging and summarization via Supabase Edge Function (OpenAI); fallback heuristics if undeployed |
| 2.2 Video/Audio Chat | ⏳ | — | |
| 2.3 PWA + Offline | ✅ | Done | Service worker v4, offline.html, offline indicator, install banner
| 2.4 Advanced File Preview | ✅ | Done | Image zoom/pan, video fullscreen, PDF render with react-pdf, audio controls |
| 2.5 File Versioning | ✅ | Done | file_versions table, version history UI, restore previous versions, new version upload |
| 2.6 AI Recommendations | ✅ | Done | Semantic search via pgvector; similar files panel in FileViewer (PDF, text, images via Vision API) |
| 2.7 LMS Integrations | 🚧 | — | Schema created (004_lms_integrations.sql). Deploy + connect backend. |
| 3.1 Gamification | ⏳ | — | |
| 3.2 Comment Threads | ⏳ | — | |
| 3.3 Security Hardening | ⏳ | — | |
| 3.4 Integrations | ⏳ | — | |
| 3.5 DevOps & Quality | ⏳ | — | |
