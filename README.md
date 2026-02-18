# Easy Note

A premium, near-zero-config Markdown note app with two-phase storage.

## Features

- **Phase 1**: Vercel Blob (250MB free) — Deploy and connect in 1 click.
- **Phase 2**: Database (Turso/Supabase) & S3 (R2/AWS) upgrade path.
- **Milkdown**: A powerful WYSIWYG Markdown editor.
- **Zero Config**: No manual ENV tokens needed for Phase 1.
- **Export**: One-click JSON backup.

## Quick Start

### 1. One-click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/solider245/easy-note&stores=[{"type":"blob"}])

### 2. Setup Storage

1. After deployment, go to your project in Vercel Dashboard.
2. Go to **Storage** tab.
3. Click **Create Database** and select **Blob**.
4. Connect the Blob to your project. Vercel will automatically inject `BLOB_READ_WRITE_TOKEN`.
5. Redeploy your project (the first deploy will fail until Blob is connected).

### 3. Login

- The default password is `admin123`.
- **Security Check**: Immediately set `ADMIN_PASSWORD` in Vercel environment variables to secure your notes.

## Local Development

```bash
npm install
npm run dev
```

Note: Local development requires a `.env.local` with `BLOB_READ_WRITE_TOKEN`.

## Phase 2: Database Integration (Optional Upgrade)

Connect a real database to unlock **persistent settings** and **in-app password changes**.

### Supported Databases
- **Turso** (SQLite at the edge) — recommended for personal use
- **Supabase / Neon** (Postgres) — recommended for teams

### Setup Steps
1. Create a database on [Turso](https://turso.tech) or [Supabase](https://supabase.com).
2. Add environment variables in Vercel → Settings → Environment Variables:
   ```
   DATABASE_URL=libsql://your-db.turso.io   # or postgresql://...
   DATABASE_AUTH_TOKEN=your-turso-token      # Turso only
   ```
3. Run the migration to create tables:
   ```bash
   npx drizzle-kit push
   ```
4. Redeploy. You can now change your password from the **Settings** page inside the app.

## 🚀 Roadmap / Future Plans

- [ ] **AI Writing Assistant**: Integrate Vercel AI SDK for smart autocompletion, summaries, and title generation.
- [ ] **Settings UI**: Add a secure web interface for changing the password and managing app settings.
- [ ] **Tagging System**: Organize notes with tags and advanced filtering.
- [ ] **S3 Media Migration**: Automated tool to move local/Blob media to S3-compatible storage.
- [ ] **Search**: Full-text search across all notes (especially for Phase 2 DB).
