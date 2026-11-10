# Production Deployment Guide: Kisan Hardware Billing System

This guide explains how to deploy the Kisan Hardware Billing Website on a Virtual Private Server (VPS) running Ubuntu 22.04 / 24.04 LTS with Nginx, PM2, and MongoDB Atlas (or local MongoDB).

---

## 1. Architecture Overview

```
 [ Client Browser ]
        │ HTTPS (Port 443)
        ▼
   [ Nginx Reverse Proxy & SSL ]
        ├── /api/* ──────────────► [ Node.js Express API (PM2 on Port 5000) ]
        └── /* (Static Frontend) ──► [ React Vite Build in /dist ]
                                                      │
                                                      ▼
                                       [ MongoDB Atlas Cloud Cluster ]
                                              (Encrypted TLS)
```

---

## 2. Server Prerequisites & Node.js LTS Installation

SSH into your Ubuntu server:
```bash
ssh root@your-server-ip
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx
```

Install Node.js 22+ (LTS):
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
node -v && npm -v
```

---

## 3. Clone Repository & Setup Backend

```bash
# Clone the codebase
cd /var/www
sudo git clone https://github.com/your-username/hardware-billing.git kisan-billing
cd kisan-billing/server

# Install dependencies
npm install --production

# Create Production Environment File
cp .env.example .env
nano .env
```

Configure `.env`:
```ini
PORT=5000
NODE_ENV=production

# MongoDB Atlas Connection String with TLS
MONGODB_URI=mongodb+srv://kisan_admin:<password>@cluster0.abcde.mongodb.net/hardware_billing?retryWrites=true&w=majority

# Strong Cryptographic Secrets (minimum 32 characters)
JWT_ACCESS_SECRET=c8e792f447b9491a9b2b51336495143a598c21759d57519ea81b5c00e1234567
JWT_REFRESH_SECRET=7f5e12aa449019b84a92bb1c5837a44c9b83b3819e99217bca88174a98765432
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Domain of your frontend
CLIENT_URL=https://billing.yourdomain.com

# Cookie Security (Strict over HTTPS)
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300
AUTH_RATE_LIMIT_MAX_REQUESTS=20
```

Seed the default owner and hardware inventory:
```bash
npm run seed
```

---

## 4. Build the Frontend (React + Vite)

```bash
cd /var/www/kisan-billing/client

# Install dependencies and build production assets
npm install
npm run build
```
This generates the optimized production bundle in `/var/www/kisan-billing/client/dist`.

---

## 5. Start Backend Process with PM2

```bash
cd /var/www/kisan-billing/server

# Start server in cluster mode
pm2 start src/server.js --name "hardware-billing-api" -i max

# Ensure PM2 starts on server reboot
pm2 startup
pm2 save
```

Verify PM2 status:
```bash
pm2 status
pm2 logs hardware-billing-api
```

---

## 6. Configure Nginx Reverse Proxy & Static Hosting

Create an Nginx server block:
```bash
sudo nano /etc/nginx/sites-available/hardware-billing
```

Paste the following configuration:
```nginx
server {
    listen 80;
    server_name billing.yourdomain.com;

    # Client body limit for imports
    client_max_body_size 5M;

    # Frontend Static Files
    root /var/www/kisan-billing/client/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/javascript application/javascript application/json image/svg+xml;

    # Serve React SPA Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API Requests to Node.js Backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/hardware-billing /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Install Free SSL Certificate (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d billing.yourdomain.com
```
Certbot will configure automatic SSL renewal.

---

## 8. Automated Daily Database Backup

Setup automated daily backups via Linux cron:
```bash
crontab -e
```
Add the following line to run every night at 2:00 AM:
```cron
0 2 * * * cd /var/www/kisan-billing/server && /usr/bin/node src/scripts/backup.js >> /var/log/billing_backup.log 2>&1
```

To restore from a backup:
```bash
node src/scripts/restore.js backups/backup-2026-11-10T00-00-00-000Z
```
