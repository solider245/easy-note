# Deployment Guide

Easy Note supports two deployment modes:
- **Vercel** (Easiest) — Zero-config serverless deployment
- **VPS/Docker** (Flexible) — Full control with runtime configuration

---

## Choose Your Platform

| Feature | Vercel | VPS |
|---------|--------|-----|
| **Setup Time** | 3 minutes | 10 minutes |
| **Configuration** | Environment variables | Env vars, UI, or file |
| **Runtime Changes** | Requires redeploy | Hot reload supported |
| **Maintenance** | Zero | Low |
| **Best For** | Personal use | Power users, teams |

---

## Vercel Deployment (Recommended for Beginners)

### Prerequisites

- Turso account (free tier available)
- GitHub account
- Vercel account

### Step 1: Get Turso Credentials

```bash
# Install Turso CLI
brew install tursodatabase/tap/turso

# Login
turso auth login

# Create database
turso db create my-notes

# Get credentials
turso db show my-notes
turso db tokens create my-notes
```

### Step 2: Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/easy-note)

During deployment:
1. Connect your GitHub account
2. Fill in environment variables:
   - `TURSO_DATABASE_URL` — from `turso db show`
   - `TURSO_AUTH_TOKEN` — from `turso db tokens create`
   - `ADMIN_PASSWORD` — your login password (optional)
3. Click "Deploy"

### Step 3: Done!

Visit your deployed URL and start taking notes.

### Making Changes

**Important:** On Vercel, configuration changes require redeployment.

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Update the variables
4. Click "Redeploy"

---

## VPS Deployment (Recommended for Power Users)

See [VPS.md](./VPS.md) for detailed VPS/Docker instructions.

### Quick Start

```bash
# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  app:
    image: yourusername/easy-note:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
    restart: unless-stopped
EOF

# Start
docker-compose up -d

# Configure via web UI
# Open http://your-server:3000/settings
```

### VPS Advantages

- **Runtime configuration** — Change settings without redeploying
- **Hot reload** — Apply changes immediately
- **File-based config** — Store config in version control
- **Full control** — Customize everything

---

## Database Options

### Turso (Recommended)

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```

**Pros:** Edge database, generous free tier, SQLite compatible

### Supabase

```
DATABASE_URL=postgresql://user:pass@host.supabase.co:5432/postgres
```

**Pros:** Full PostgreSQL, great dashboard, generous free tier

### Self-hosted SQLite (VPS only)

```
TURSO_DATABASE_URL=file:/app/data/notes.db
```

**Pros:** Zero external dependencies, works offline

---

## Environment Variables

### Required

| Variable | Description | Platforms |
|----------|-------------|-----------|
| `TURSO_DATABASE_URL` | Turso connection URL | All |
| `TURSO_AUTH_TOKEN` | Turso auth token | All |
| **OR** | | |
| `DATABASE_URL` | PostgreSQL connection string | All |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Login password | `admin123` |
| `OPENAI_API_KEY` | Enable AI features | — |
| `S3_ENDPOINT` | External storage | — |

### Platform-Specific Behavior

**Vercel:**
- Env vars are read-only
- Changes require redeployment
- Set via Vercel Dashboard

**VPS:**
- Env vars can be overridden via UI
- Changes saved to `data/local-config.json`
- File config takes precedence

---

## Troubleshooting

### "Memory storage not available in production"

You haven't configured a database. Check:
1. Environment variables are set correctly
2. Database URL is valid
3. Redeploy after setting env vars (Vercel)

### "Failed to connect to database"

1. Verify database credentials
2. Check network connectivity
3. Ensure database allows your IP

### Configuration changes not applying

**Vercel:** You must redeploy after changing env vars.

**VPS:** Try restarting the container:
```bash
docker-compose restart
```

---

## Migration Guide

### Vercel → VPS

1. Export data: Settings → Data Management → Export
2. Deploy to VPS (see VPS.md)
3. Import data: Settings → Data Management → Import

### VPS → Vercel

1. Export data from VPS
2. Deploy to Vercel
3. Import data

---

## Next Steps

- **Vercel users:** See [README.md](../README.md) for usage tips
- **VPS users:** See [VPS.md](./VPS.md) for advanced configuration
- **Advanced features:** See [ADVANCED.md](./ADVANCED.md)

---

**Need help?** [Open an issue](https://github.com/yourusername/easy-note/issues)
