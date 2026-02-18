# Easy Note

A premium, near-zero-config Markdown note app with a multi-tier storage architecture.

## ✨ Features

- **WYSIWYG Markdown Editor** — Powered by [Milkdown](https://milkdown.dev), with full rich-text editing.
- **AI Writing Assistant** — Continue writing, summarize, or auto-generate titles via OpenAI.
- **Pin Notes** — Keep important notes at the top of your list.
- **Trash & Restore** — Soft-delete with 30-day auto-purge and one-click restore.
- **Image Uploads** — Paste or drag-and-drop images (Vercel Blob or S3/R2).
- **Export / Import** — One-click JSON backup and restore.
- **In-App Settings** — Change password, configure AI & S3 — all from the UI.
- **Dark Mode** — Automatic system-preference detection.
- **Zero Config** — Works out of the box on Vercel with just a Blob store.

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
