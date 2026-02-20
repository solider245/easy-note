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

## 🚀 Deployment Options

### Option 1: Vercel (Easiest - 3 Minutes)

Perfect for personal use. Zero maintenance.

```bash
# 1. Fork & Deploy
# Click the button below and follow the prompts
```

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/easy-note)

**Configuration:**
1. Get your Turso credentials (see below)
2. Paste into Vercel deployment form
3. Deploy!

**Note:** Configuration changes require redeployment on Vercel.

### Option 2: VPS/Docker (Flexible)

Perfect for power users who need:
- Runtime configuration changes
- Full data control
- Custom infrastructure

See [docs/VPS.md](./docs/VPS.md) for VPS-specific instructions.

---

## 📝 Database Setup (Turso - Recommended)

### 1. Create Turso Account

```bash
# Install Turso CLI
brew install tursodatabase/tap/turso

# Login
turso auth login
```

### 2. Create Database

```bash
# Create a new database
turso db create my-notes

# Get the connection URL
turso db show my-notes
# Output: libsql://my-notes-username.turso.io

# Create an auth token
turso db tokens create my-notes
# Output: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

### 3. Configure Environment Variables

**For Vercel:**
Add these in the Vercel deployment form:
```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
```

**For VPS:**
See [docs/VPS.md](./docs/VPS.md) for configuration options.

---

## 🎯 Usage

| Shortcut | Action |
|----------|--------|
| `⌘N` | New note |
| `⌘K` | Search notes |
| `⌘P` | Command palette |
| `⌘⌫` | Delete note |

---

## ⚙️ Advanced Features (Optional)

These features can be enabled via environment variables:

### AI Writing Assistant
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### External Storage (S3)
```
S3_ENDPOINT=https://...
S3_REGION=auto
S3_BUCKET=my-notes
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

---

## 🏗️ Architecture

- **Frontend:** Next.js 16 + React 19 + TypeScript
- **Editor:** Milkdown (WYSIWYG Markdown)
- **Database:** SQLite (Turso) or PostgreSQL (Supabase)
- **Deployment:** Vercel (serverless) or VPS (Docker)

---

## 📦 Platform-Specific Guides

| Platform | Configuration | Notes |
|----------|--------------|-------|
| **Vercel** | Environment variables | Read-only, requires redeploy |
| **VPS** | File + Environment | Runtime changes supported |
| **Docker** | Environment or File | See docs/VPS.md |

---

## 💾 Data Backup

Your notes are stored in your own database. We recommend regular backups:

1. Go to Settings → Data Management
2. Click "Export Backup" to download all notes as JSON
3. Store the backup file safely

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

**Made with ❤️ for people who love writing.**
