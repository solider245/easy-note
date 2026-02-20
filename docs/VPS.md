# VPS & Docker Deployment Guide

Complete guide for self-hosting Easy Note on your own server.

## Why VPS?

Compared to Vercel, VPS deployment offers:

- **Runtime Configuration** — Change database settings without redeploying
- **Full Data Control** — Your data stays on your infrastructure
- **Custom Infrastructure** — Use your preferred database, storage, etc.
- **No Vendor Lock-in** — Run anywhere that supports Docker

---

## Quick Start (Docker Compose)

### 1. Create Project Directory

```bash
mkdir easy-note && cd easy-note
```

### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    image: yourusername/easy-note:latest
    ports:
      - "3000:3000"
    environment:
      # Option 1: Use environment variables
      - TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
      - TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}
      
      # Optional: Enable advanced features
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
    volumes:
      # Persist configuration and any local data
      - ./data:/app/data
    restart: unless-stopped
```

### 3. Configure Environment

**Option A: Using .env file (recommended)**

Create `.env`:
```bash
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token-here
ADMIN_PASSWORD=your-secure-password
OPENAI_API_KEY=  # Optional
```

**Option B: Using UI Configuration (no env vars needed)**

Leave environment variables empty:
```yaml
environment:
  - NODE_ENV=production
```

Then configure via web UI after first start.

### 4. Start the Application

```bash
docker-compose up -d
```

### 5. Access the Application

Open http://your-server-ip:3000

---

## Configuration Methods

### Method 1: Environment Variables (Recommended)

Set all configuration via environment variables in docker-compose.yml or .env file.

**Pros:**
- Configuration is explicit and version-controlled
- Easy to backup and restore
- Works with orchestration tools (Kubernetes, etc.)

**Cons:**
- Requires restart to change configuration

### Method 2: UI Configuration (Runtime)

Configure the application through the web interface.

**Steps:**

1. Start without database configuration:
```yaml
environment:
  - NODE_ENV=production
```

2. Access http://your-server:3000/settings

3. Click "Configure Database"

4. Enter your Turso/Supabase credentials

5. Click "Test & Save Connection"

**Pros:**
- No restart required
- User-friendly interface
- Changes applied immediately

**Cons:**
- Configuration stored in container (needs volume persistence)

### Method 3: Configuration File

Edit the configuration file directly.

**File location:** `./data/local-config.json`

```json
{
  "TURSO_DATABASE_URL": "libsql://your-db.turso.io",
  "TURSO_AUTH_TOKEN": "your-token",
  "ADMIN_PASSWORD": "your-password",
  "OPENAI_API_KEY": "sk-..."
}
```

**Pros:**
- Easy to automate
- Can be version-controlled
- Works with configuration management tools

**Cons:**
- Requires restart to apply changes

---

## Configuration Priority

On VPS, the configuration priority is:

1. **File config** (`data/local-config.json`) — Highest priority
2. **Environment variables** — Override defaults
3. **Database settings** — For password and runtime settings

This means:
- File config takes precedence over env vars
- Users can override env vars via UI
- Changes via UI are persisted to file

---

## Hot Reload (Runtime Changes)

Unlike Vercel, VPS deployment supports hot reloading configuration.

### How it works:

1. User changes configuration in web UI
2. Configuration is saved to `data/local-config.json`
3. Application reloads storage adapter automatically
4. New configuration is active immediately
5. **No restart required!**

### Limitations:

- Port/host changes may still require restart
- Some changes (like ADMIN_PASSWORD) require re-login
- Always backup before making significant changes

---

## Database Options

### Turso (Recommended)

```yaml
environment:
  TURSO_DATABASE_URL=libsql://your-db.turso.io
  TURSO_AUTH_TOKEN=your-token
```

### Supabase PostgreSQL

```yaml
environment:
  DATABASE_URL=postgresql://postgres:password@host.supabase.co:5432/postgres
```

### Self-hosted SQLite

```yaml
environment:
  TURSO_DATABASE_URL=file:/app/data/notes.db
```

---

## Building from Source

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

## Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name notes.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable with HTTPS:
```bash
sudo certbot --nginx -d notes.yourdomain.com
```

---

## Backup & Restore

### Automated Backup

Add to your `docker-compose.yml`:

```yaml
services:
  # ... app service ...
  
  backup:
    image: offen/docker-volume-backup:latest
    volumes:
      - ./data:/backup/data:ro
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      BACKUP_CRON_EXPRESSION: "0 2 * * *"
      BACKUP_RETENTION_DAYS: "30"
    restart: unless-stopped
```

### Manual Backup

```bash
# Backup configuration and data
tar -czf easy-note-backup-$(date +%Y%m%d).tar.gz ./data

# Backup via UI
# Settings → Data Management → Export Backup
```

### Restore

```bash
# Stop containers
docker-compose down

# Restore data
rm -rf data
tar -xzf easy-note-backup-20240101.tar.gz

# Start containers
docker-compose up -d
```

---

## Troubleshooting

### Container won't start

Check logs:
```bash
docker-compose logs -f app
```

### Database connection failed

1. Verify credentials in `.env` or web UI
2. Check network connectivity to database
3. Ensure database allows connections from your IP

### Configuration not persisting

Ensure volume is mounted:
```yaml
volumes:
  - ./data:/app/data
```

### Hot reload not working

Hot reload only works when:
1. Running on VPS (not Vercel)
2. Configuration is valid
3. Database connection succeeds

If it fails, restart the container:
```bash
docker-compose restart
```

---

## Security Considerations

### 1. Change Default Password

Default: `admin123`

Change immediately after first login:
Settings → Security → Update Password

### 2. Use HTTPS

Always use HTTPS in production. Use Let's Encrypt:
```bash
certbot --nginx
```

### 3. Secure Database Credentials

- Use strong, unique tokens
- Rotate tokens periodically
- Don't commit credentials to git
- Use Docker secrets for sensitive data

### 4. Firewall Rules

```bash
# Only allow necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

---

## Updating

```bash
# Pull latest image
docker-compose pull

# Restart with new image
docker-compose up -d

# Check status
docker-compose ps
```

---

## Migration from Vercel

To migrate from Vercel to VPS:

1. **Export data from Vercel instance:**
   - Settings → Data Management → Export Backup
   - Download the JSON file

2. **Deploy to VPS** (follow steps above)

3. **Import data:**
   - Settings → Data Management → Import from JSON
   - Upload the backup file

4. **Verify:**
   - Check all notes are present
   - Test search functionality
   - Confirm settings are correct

---

## Next Steps

- Enable [AI features](./ADVANCED.md#ai-assistant)
- Set up [S3 storage](./ADVANCED.md#s3-storage)
- Configure [automated backups](#automated-backup)
- Join our community Discord

---

**Questions?** Open an issue on GitHub.
