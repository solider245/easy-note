# Easy Note

A premium, near-zero-config Markdown note app with a multi-tier storage architecture.

## ✨ Features

### Core
- **WYSIWYG Markdown Editor** — Powered by [Milkdown](https://milkdown.dev), with full rich-text editing.
- **AI Writing Assistant** — Continue writing, summarize, or auto-generate titles via OpenAI.
- **Pin Notes** — Keep important notes at the top of your list.
- **Trash & Restore** — Soft-delete with 30-day auto-purge and one-click restore.
- **Image Uploads** — Paste or drag-and-drop images (Vercel Blob or S3/R2).
- **Export / Import** — One-click JSON backup and restore.
- **In-App Settings** — Change password, configure AI & S3 — all from the UI.
- **Dark Mode** — Toggle or auto-detect system preference, persisted across sessions.
- **Zero Config** — Works out of the box on Vercel with just a Blob store.

### Search & Organization
- **Instant Search** — Debounced full-text search across title, content, and tags (⌘K).
- **Tags** — Add/remove tags on any note; filter the note list by tag.
- **Sort** — Sort by last modified, created date, or title (asc/desc). Pinned notes always first.
- **Content Preview** — See the first 120 characters of each note in the list.
- **Word Count Badge** — Per-note word count shown in the list.

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `⌘N` | New note |
| `⌘K` | Focus search |
| `⌘P` | Open command palette |
| `⌘⌫` | Delete selected note |
| `ESC` | Close modals / cancel |

### Command Palette (⌘P)
- Fuzzy search across all notes by title, preview, and tags.
- Arrow key navigation, Enter to select.
- "New Note" action always available at the top.

### Note Templates
6 built-in templates accessible from the sidebar or empty state:
- 📋 Meeting Notes
- ✅ To-Do List
- 📔 Daily Journal
- 🚀 Project Brief
- 🔬 Research Notes
- 📄 Blank Note

### Import & Export
- **Import Markdown** — Drag & drop `.md` / `.txt` files onto the sidebar, or click "Import .md". Batch import supported.
- **Export as Markdown** — Download any note as a `.md` file from the toolbar.
- **Export All (JSON)** — Full backup of all notes.

### Sharing
- **Public Share Links** — Generate a shareable URL for any note (`/share/[token]`).
- **Revoke Sharing** — Disable sharing at any time.
- Public pages render full Markdown with tags and metadata.

### Editor
- **Status Bar** — Live word count, character count, estimated reading time, and last-updated timestamp.
- **Auto-save** — Debounced 1-second auto-save with visual indicator.
- **AI Title Suggestion** — Auto-suggests a title when a new note reaches 50+ characters.

---

## 🚀 Quick Start

### 1. One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/solider245/easy-note&stores=[{"type":"blob"}])

### 2. Connect Vercel Blob

1. After deployment, open your project in the **Vercel Dashboard**.
2. Go to the **Storage** tab → **Create Database** → select **Blob**.
3. Connect the Blob store to your project. Vercel will automatically inject `BLOB_READ_WRITE_TOKEN`.
4. **Redeploy** (the first deploy will fail until Blob is connected).

### 3. Login

- Default password: **`admin123`**
- ⚠️ **Change your password immediately** from the Settings page after first login.

---

## 🗄️ Storage Tiers

| Tier | Storage | Use Case |
|------|---------|----------|
| **Demo** | In-Memory | Local dev / preview (data lost on restart) |
| **Phase 1** | Vercel Blob | Personal use, zero-config cloud |
| **Phase 2** | Turso (SQLite) / Supabase (PostgreSQL) | Persistent settings, team use |

---

## 🔧 Local Development

```bash
npm install
npm run dev
```

Create a `.env.local` file for local development:

```env
# Required for Blob storage (get from Vercel dashboard)
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Optional: use a local SQLite file instead
# DATABASE_URL=file:./local.db

# Optional: set a custom admin password
# ADMIN_PASSWORD=your-password

# Optional: AI features
# OPENAI_API_KEY=sk-...
```

---

## 🗃️ Phase 2: Database Integration (Optional)

Connect a real database to unlock **persistent settings** and **in-app password changes**.

### Supported Databases
- **[Turso](https://turso.tech)** (SQLite at the edge) — recommended for personal use
- **[Supabase](https://supabase.com) / [Neon](https://neon.tech)** (PostgreSQL) — recommended for teams

### Setup
Add environment variables in **Vercel → Settings → Environment Variables**:

```env
DATABASE_URL=libsql://your-db.turso.io   # or postgresql://...
DATABASE_AUTH_TOKEN=your-turso-token      # Turso only
```

Redeploy. The app auto-creates tables on first visit. You can then change your password from the **Settings** page.

---

## 🖼️ Phase 2-B: S3 Media Storage (Optional)

Switch image uploads to any S3-compatible storage (Cloudflare R2, AWS S3, etc.).

```env
S3_ENDPOINT=https://<id>.r2.cloudflarestorage.com
S3_PUBLIC_URL=https://pub-your-id.r2.dev
S3_BUCKET=easy-note-media
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_REGION=auto
```

---

## 🤖 Phase 2-C: AI Writing Assistant (Optional)

Supercharge your notes with AI powered by the **Vercel AI SDK**.

### Features
- ✨ **Continue Writing** — Let AI finish your sentence.
- 📝 **Summarize** — Get a concise summary of your selection.
- 🏷️ **Suggest Title** — One-click AI title generation from content.
- 🤖 **Auto-Title** — Automatically suggests a title when a new note reaches 50+ characters.

### Setup
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini   # optional, defaults to gpt-4o-mini
```

Or configure directly from the **Settings → Writing Assistant** section in the app.

---

## 🐳 Docker / VPS Deployment

```bash
# Clone and start
git clone https://github.com/solider245/easy-note.git
cd easy-note
cp .env.example .env   # edit as needed
docker compose up -d
```

The app will be available at `http://localhost:3000`.

For persistent storage, set `DATABASE_URL=file:/data/notes.db` and mount a volume:

```yaml
# docker-compose.yml (already configured)
volumes:
  - ./data:/data
```

---

## 🔒 Security Notes

- Auth tokens are **HMAC-SHA256 signed** (not plain strings).
- Sensitive config values (API keys, passwords) are **AES-256-GCM encrypted** in the database.
- File uploads are restricted to **images only** (JPEG, PNG, GIF, WebP, SVG, AVIF) with a **10MB size limit**.
- Password changes require the current password for verification.
- Share links use random 16-character tokens; revocable at any time.

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | List all notes (supports `?q=` search) |
| POST | `/api/notes` | Create a note |
| GET | `/api/notes/:id` | Get a note |
| PUT | `/api/notes/:id` | Update a note (title, content, tags, isPinned, shareToken) |
| DELETE | `/api/notes/:id` | Soft-delete (move to trash) |
| POST | `/api/notes/:id/restore` | Restore from trash |
| GET | `/api/notes/trash` | List trashed notes |
| POST | `/api/notes/:id/share` | Enable sharing, returns `{shareToken, url}` |
| DELETE | `/api/notes/:id/share` | Disable sharing |
| GET | `/api/share/:token` | Public: get shared note by token |
| GET | `/api/tags` | List all tags with counts |
| GET | `/api/export` | Export all notes as JSON |
| POST | `/api/import` | Import notes from JSON |
| POST | `/api/upload` | Upload an image |
| POST | `/api/ai/process` | AI: suggest-title, summarize |
| POST | `/api/ai/complete` | AI: continue writing (streaming) |
| GET | `/api/status` | Storage usage stats |
| GET | `/api/status/config` | Active storage/DB config |
