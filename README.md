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
3. **Redeploy**. The app will automatically create the required tables on the first visit. You can then change your password from the **Settings** page inside the app.

## Phase 2-B: S3 Media Storage (Optional Upgrade)

By default, the app uses Vercel Blob for images. You can switch to any S3-compatible storage (like **Cloudflare R2** or **AWS S3**) for better control and lower costs.

### Setup Steps
1. Create a bucket in Cloudflare R2 or AWS S3.
2. Add environment variables in Vercel:
   ```
   S3_ENDPOINT=https://<id>.r2.cloudflarestorage.com
   S3_PUBLIC_URL=https://pub-your-id.r2.dev  # or your custom domain
   AWS_S3_BUCKET=easy-note-media
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=auto  # use 'auto' for R2
   ```
3. Redeploy. New image uploads will now go to your S3/R2 bucket.

## Phase 2-C: AI Writing Assistant (Optional Upgrade)

Supercharge your note-taking with a built-in AI assistantpowered by **Vercel AI SDK**.

### Features
- ✨ **Continue Writing**: Let AI finish your sentence.
- 📝 **Summarize**: Get a concise summary of your selection.
- 🏷️ **Suggest Title**: One-click AI title generation based on content.

### Setup Steps
1. Get an API key from [OpenAI](https://platform.openai.com/).
2. Add environment variables in Vercel:
   ```
   OPENAI_API_KEY=sk-...
   ```
3. Redeploy. A new **Sparkle** icon will appear on text selection and next to the note title.

## 🚀 Roadmap / Future Plans

- [ ] **AI Writing Assistant**: Integrate Vercel AI SDK for smart autocompletion, summaries, and title generation.
- [ ] **Settings UI**: Add a secure web interface for changing the password and managing app settings.
- [ ] **Tagging System**: Organize notes with tags and advanced filtering.
- [ ] **S3 Media Migration**: Automated tool to move local/Blob media to S3-compatible storage.
- [ ] **Search**: Full-text search across all notes (especially for Phase 2 DB).
