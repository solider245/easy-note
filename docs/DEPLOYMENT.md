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

### Step 2: Deploy (⚠️ Read Carefully)

**Important:** You must fill in environment variables **during deployment**, not after. Vercel reads these values at build time.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/easy-note)

During deployment, you will see a form for "Environment Variables". Fill in exactly these key names:

**Option A: Turso (SQLite)**
```
Key: TURSO_DATABASE_URL
Value: libsql://your-db.turso.io

Key: TURSO_AUTH_TOKEN
Value: eyJhbGciOiJFZERTQSIs... (your token)
```

**Option B: Any PostgreSQL Database**
```
Key: DATABASE_URL
Value: postgresql://user:password@host:5432/database
```

Works with:
- **Supabase** — `postgresql://postgres:pass@host.supabase.co:5432/postgres`
- **AWS RDS** — `postgresql://user:pass@mydb.xyz.us-east-1.rds.amazonaws.com:5432/dbname`
- **Google Cloud SQL** — `postgresql://user:pass@/dbname?host=/cloudsql/...`
- **Self-hosted** — `postgresql://user:pass@localhost:5432/mydatabase`
- **Any standard PostgreSQL** — Just use the connection string

**Optional:**
```
Key: ADMIN_PASSWORD
Value: your-secure-password
```

⚠️ **Key names must be exactly as shown above** — they are hardcoded in the application.

Then click "Deploy"

### Step 3: Done!

Visit your deployed URL and start taking notes.

### Making Changes

**Database configuration:** On Vercel, database configuration (URL, Token) cannot be changed after deployment. If you need to change databases, you must update environment variables and redeploy.

**Password:** You can change the admin password anytime after deployment:
1. Login with your current password
2. Go to Settings → Security
3. Enter current password and new password
4. Click "Update Password"

The new password is saved to your database and takes effect immediately - no redeployment needed!

**Other settings:** To change other configuration (AI keys, S3, etc.), you must update environment variables in Vercel Dashboard and redeploy.

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

### Turso (Recommended for Vercel)

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```

**Pros:** Edge database, generous free tier, SQLite compatible, works great with serverless

### Any PostgreSQL (Universal)

Easy Note works with **any standard PostgreSQL database**. Just use the connection string:

```
DATABASE_URL=postgresql://user:password@host:5432/database
```

**Supported providers:**
- **Supabase** — Great free tier, easy setup
- **AWS RDS** — Enterprise grade, scalable
- **Google Cloud SQL** — Managed PostgreSQL
- **Neon** — Serverless PostgreSQL
- **Self-hosted** — Full control, no vendor lock-in
- **Any PostgreSQL 12+** — Standard connection string format

**Pros:** Universal compatibility, mature ecosystem, familiar SQL

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
