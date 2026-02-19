# Easy Note

A minimalist, private Markdown note-taking app. Deploy in 3 minutes on Vercel.

![Screenshot](https://via.placeholder.com/800x400?text=Easy+Note+Screenshot)

## ✨ Features

- **WYSIWYG Markdown Editor** — Beautiful editing powered by Milkdown
- **Full-text Search** — Instant search across all notes (⌘K)
- **Tags & Organization** — Organize notes with tags
- **Auto-save** — Never lose your work
- **Dark Mode** — Easy on the eyes
- **Data Export/Import** — JSON backup & restore
- **Mobile-friendly** — Works on all devices

## 🚀 Quick Start (3 Minutes)

### 1. Fork & Deploy

```bash
# Fork this repository on GitHub, then deploy to Vercel
# Or use the button below:
```

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/easy-note)

### 2. Create Database (Choose One)

#### Option A: Turso (Recommended)
1. Go to [turso.io](https://turso.io) and create an account
2. Install CLI: `brew install tursodatabase/tap/turso`
3. Create database: `turso db create my-notes`
4. Get connection URL: `turso db show my-notes`
5. Create auth token: `turso db tokens create my-notes`

#### Option B: Supabase
1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Settings → Database → Connection string
3. Copy the PostgreSQL connection string

### 3. Configure Environment Variables

In your Vercel project settings, add:

**For Turso:**
```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

**For Supabase:**
```
DATABASE_URL=postgresql://postgres:password@host.supabase.co:5432/postgres
```

**Optional:**
```
ADMIN_PASSWORD=your-secure-password  # Default: admin123
```

### 4. Done! 🎉

Visit your deployed URL and start taking notes!

## 📝 Usage

| Shortcut | Action |
|----------|--------|
| `⌘N` | New note |
| `⌘K` | Search notes |
| `⌘P` | Command palette |
| `⌘⌫` | Delete note |

## ⚙️ Advanced Features

Easy Note supports optional advanced features that can be enabled via environment variables:

### AI Writing Assistant
Add your OpenAI API key to enable AI-powered writing assistance:
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### External Storage (S3)
Configure S3-compatible storage for media files:
```
S3_ENDPOINT=https://...
S3_REGION=auto
S3_BUCKET=my-notes
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

### Note Sharing
Enable public note sharing links:
```
ENABLE_SHARING=true
```

## 🏗️ Architecture

- **Frontend:** Next.js 16 + React 19 + TypeScript
- **Editor:** Milkdown (WYSIWYG Markdown)
- **Database:** SQLite (Turso) or PostgreSQL (Supabase)
- **Storage:** Database (notes) + Vercel Blob/S3 (media)
- **Auth:** Session-based with configurable password

## 📦 Deployment Options

### Vercel (Recommended)
One-click deployment with serverless functions.

### Docker
```bash
docker build -t easy-note .
docker run -p 3000:3000 -e DATABASE_URL=... easy-note
```

### Self-Hosted
```bash
git clone https://github.com/yourusername/easy-note.git
cd easy-note
npm install
npm run build
npm start
```

## 💾 Data Backup

Your notes are stored in your own database. We recommend regular backups:

1. Go to Settings → Data Management
2. Click "Export Backup" to download all notes as JSON
3. Store the backup file safely

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

**Made with ❤️ for people who love writing.**
