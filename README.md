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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_ORG/easy-note)

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
