# Deployment Guide

Complete guide for deploying Easy Note to various platforms.

## Table of Contents

- [Vercel (Recommended)](#vercel-recommended)
- [Turso Setup](#turso-setup)
- [Supabase Setup](#supabase-setup)
- [Docker](#docker)
- [Troubleshooting](#troubleshooting)

---

## Vercel (Recommended)

The easiest way to deploy Easy Note.

### Step 1: Fork the Repository

1. Go to https://github.com/yourusername/easy-note
2. Click the "Fork" button
3. Wait for the fork to complete

### Step 2: Create Database

Choose **Turso** (easier) or **Supabase** (more powerful).

#### Turso Setup

1. Install Turso CLI:
   ```bash
   brew install tursodatabase/tap/turso
   ```

2. Login and create database:
   ```bash
   turso auth login
   turso db create my-notes
   ```

3. Get connection details:
   ```bash
   # Get database URL
   turso db show my-notes
   # Output: libsql://my-notes-username.turso.io
   
   # Create auth token
   turso db tokens create my-notes
   # Output: eyJhbGciOiJFZERTQSIs...
   ```

4. Save these values for Step 3.

#### Supabase Setup

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for the project to be ready
4. Go to Settings → Database
5. Under "Connection string", select "URI"
6. Copy the connection string (replace `[YOUR-PASSWORD]` with your actual password)

### Step 3: Deploy to Vercel

#### Option A: Vercel Web UI

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your forked GitHub repository
4. In the "Configure Project" step:
   - Framework Preset: Next.js
   - Add Environment Variables:

   **For Turso:**
   ```
   TURSO_DATABASE_URL=libsql://your-db.turso.io
   TURSO_AUTH_TOKEN=your-token-here
   ```

   **For Supabase:**
   ```
   DATABASE_URL=postgresql://postgres.your-project:password@aws-0-region.pooler.supabase.com:6543/postgres
   ```

   **Optional:**
   ```
   ADMIN_PASSWORD=your-secure-password
   ```

5. Click "Deploy"
6. Wait for deployment to complete (2-3 minutes)

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from project directory
vercel

# Set environment variables
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN

# Redeploy with new env vars
vercel --prod
```

### Step 4: Verify Deployment

1. Visit your deployed URL (e.g., `https://easy-note-xyz.vercel.app`)
2. You should see the login page
3. Default password: `admin123` (change this in settings!)

---

## Docker

Deploy Easy Note using Docker for self-hosting.

### Prerequisites

- Docker and Docker Compose installed
- Database (Turso, Supabase, or local PostgreSQL)

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    image: yourusername/easy-note:latest
    ports:
      - "3000:3000"
    environment:
      - TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
      - TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

Create `.env` file:

```bash
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
ADMIN_PASSWORD=your-secure-password
```

Run:

```bash
docker-compose up -d
```

### Building from Source

```bash
# Clone repository
git clone https://github.com/yourusername/easy-note.git
cd easy-note

# Build Docker image
docker build -t easy-note .

# Run container
docker run -d \
  -p 3000:3000 \
  -e TURSO_DATABASE_URL=libsql://your-db.turso.io \
  -e TURSO_AUTH_TOKEN=your-token \
  -e ADMIN_PASSWORD=your-password \
  -v $(pwd)/data:/app/data \
  --name easy-note \
  easy-note
```

---

## Troubleshooting

### Database Connection Issues

**Problem:** "Failed to connect to database" error

**Solutions:**

1. **Verify environment variables are set:**
   ```bash
   # In Vercel dashboard, check:
   # Project Settings → Environment Variables
   ```

2. **Test database connection locally:**
   ```bash
   # For Turso
   turso db shell my-notes
   
   # Should open SQLite prompt
   ```

3. **Check token permissions:**
   ```bash
   # Recreate token if needed
   turso db tokens create my-notes
   ```

### Build Failures

**Problem:** Build fails on Vercel

**Solutions:**

1. Check Node.js version (requires 18+)
2. Clear build cache and redeploy
3. Check Vercel build logs for specific errors

### Memory/Demo Mode

**Problem:** App runs in "Demo Mode" with memory storage

**Cause:** Database environment variables not configured

**Solution:** 
- Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to environment variables
- Redeploy the application

### Data Loss Concerns

**Problem:** Worried about losing notes

**Solution:**
1. Regularly export backups:
   - Settings → Data Management → Export Backup
2. Store backups in safe location
3. Your data is in your database - we don't have access

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `TURSO_DATABASE_URL` | Turso database URL | `libsql://my-db.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso auth token | `eyJhbGciOi...` |
| **OR** | | |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Login password | `admin123` |
| `OPENAI_API_KEY` | Enable AI features | - |
| `S3_ENDPOINT` | External storage endpoint | - |
| `BLOB_READ_WRITE_TOKEN` | Use Vercel Blob instead of DB | - |

---

## Next Steps

After deployment:

1. **Change default password:**
   - Go to Settings → Security
   - Update from `admin123` to a secure password

2. **Enable advanced features (optional):**
   - AI writing assistant
   - S3 media storage
   - Note sharing

3. **Set up backups:**
   - Export data regularly
   - Consider database-level backups

---

**Need help?** 
- Open an issue on GitHub
- Check the main README for usage tips
