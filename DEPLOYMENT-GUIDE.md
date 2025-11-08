# 🚀 Votelytics EC2 Deployment Guide

**✅ TESTED & VERIFIED - Successfully deployed November 4, 2025**

**Live Site:** https://votelytics.in 🔒

---

## 🎯 Deployment Summary

This guide documents the **successful production deployment** of Votelytics to AWS EC2.

**Actual Deployment Details:**
- **Domain:** votelytics.in
- **Elastic IP:** 13.204.202.217
- **Instance:** EC2 t2.micro (Ubuntu 22.04 LTS)
- **SSL:** Let's Encrypt (FREE)
- **Total Time:** ~4 hours (first deployment)
- **Monthly Cost:** ~₹765 (~$9.50)

---

## 📋 Table of Contents

1. [Initial EC2 Setup](#initial-ec2-setup)
2. [Connect to EC2](#connect-to-ec2)
3. [Install Required Software](#install-required-software)
4. [Deploy Backend](#deploy-backend)
5. [Deploy Frontend](#deploy-frontend)
6. [Configure Nginx](#configure-nginx)
7. [Set Up Backend Service](#set-up-backend-service)
8. [Get Elastic IP](#get-elastic-ip)
9. [Configure Domain (Route 53)](#configure-domain-route-53)
10. [Add SSL Certificate](#add-ssl-certificate)
11. [Fix Mixed Content (IMPORTANT!)](#fix-mixed-content-after-ssl)
12. [Update Code After Changes](#update-code-after-changes)
13. [Useful Commands](#useful-commands)
14. [Common Issues & Solutions](#common-issues--solutions)
15. [Troubleshooting](#troubleshooting)

---

## Initial EC2 Setup

### Create EC2 Instance

1. **AWS Console** → Search "EC2" → Click **EC2**
2. Click **Launch Instance**

**Configuration:**
- **Name:** `votelytics-server`
- **OS Image:** Ubuntu Server 22.04 LTS (Free tier eligible)
- **Instance Type:**
  - Testing: `t2.micro` (Free tier, 1GB RAM) ✅ Used for votelytics.in
  - Production: `t3.small` (2GB RAM, ~$15/month)
- **Key Pair:** Create new → Name: `votelytics-key` → Type: RSA → Format: `.ppk` (Windows) or `.pem` (Mac/Linux)
  - ⚠️ **SAVE THIS FILE SAFELY!** You cannot download it again!

**Security Groups:**
- **SSH (22):** My IP only (for security)
- **HTTP (80):** Anywhere (0.0.0.0/0)
- **HTTPS (443):** Anywhere (0.0.0.0/0)
- **Custom TCP (8000):** Anywhere (for testing backend - can remove after setup)

**Storage:** 20 GB gp3

3. Click **Launch Instance**
4. Wait for status: **Running** and **2/2 checks passed** (takes 2-3 minutes)
5. **Copy Public IPv4 address** (e.g., `13.204.86.27`)

---

## Connect to EC2

### Windows (PuTTY)

1. Open **PuTTY**
2. **Host Name:** `ubuntu@YOUR_PUBLIC_IP`
3. **Port:** 22
4. **Connection → SSH → Auth → Credentials:**
   - Browse to your `votelytics-key.ppk` file
5. **Session → Saved Sessions:** Type `votelytics` → Click **Save**
6. Click **Open**
7. Accept security alert (first time only)

**You should see:** `Welcome to Ubuntu 22.04.5 LTS`

### Mac/Linux (Terminal)

```bash
chmod 400 votelytics-key.pem
ssh -i votelytics-key.pem ubuntu@YOUR_PUBLIC_IP
```

---

## Install Required Software

⏱️ **Total Time: ~10-15 minutes**

### 1. Update System

```bash
sudo apt update
sudo apt upgrade -y
```

**Note:** You may see a purple screen asking about services - press **Tab** then **Enter** to continue.

### 2. Install Python 3.11

```bash
sudo apt install python3.11 python3.11-venv python3-pip -y
python3.11 --version
```

Should show: `Python 3.11.0rc1` or similar

### 3. Install Poetry

```bash
curl -sSL https://install.python-poetry.org | python3 -
echo 'export PATH="/home/ubuntu/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
poetry --version
```

Should show: `Poetry (version 2.x.x)`

### 4. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### 5. Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

**Test:** Open `http://YOUR_EC2_IP` in browser - should see "Welcome to nginx!"

### 6. Install Git

```bash
sudo apt install git -y
git --version
```

---

## Deploy Backend

⏱️ **Time: ~5-10 minutes**

### 1. Create Application Directory

```bash
sudo mkdir -p /var/www/votelytics
sudo chown -R ubuntu:ubuntu /var/www/votelytics
cd /var/www/votelytics
```

**Why `/var/www/`?** Standard location for web applications on Linux. Makes it easy for anyone to find.

### 2. Clone Repository

```bash
git clone https://github.com/GireeshS22/votelytics.git .
```

Note the `.` at the end - puts files in current directory.

### 3. Set Up Backend Dependencies

```bash
cd /var/www/votelytics/server
poetry install --only main --no-root
```

**Note:** Use `--only main` (not `--no-dev`) for Poetry 2.x. This takes 2-3 minutes.

**If you see error about "current project could not be installed"** - that's normal! The dependencies are still installed correctly.

### 4. Create .env File

```bash
nano .env
```

**Paste this (IMPORTANT: Generate new SECRET_KEY!):**

```env
DATABASE_URL=postgresql://postgres.mksoocqeoylprohcbwtr:neO2Q26fgvZkUf%40f@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

API_V1_PREFIX=/api
PROJECT_NAME=Votelytics API

SECRET_KEY=GENERATE_NEW_KEY_HERE

SUPABASE_URL=https://mksoocqeoylprohcbwtr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rc29vY3Flb3lscHJvaGNid3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDYxMDIsImV4cCI6MjA3NzQyMjEwMn0.lxaPC63XXCpZAemYipifink6sTtZWn6XHerrDrnnXq0

ADMIN_API_KEY=admin_4wZb9yyEGKA6Y5Qm5J3GHc0nTyEJ70diiMoBk6mWThE
ENV=production
```

**Generate SECRET_KEY:**

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output (looks like: `eHlq7VdaMtsHfdTtblp0YEHS6Qjir5cYzTaaY2UPEDI`)

Edit .env again and replace `GENERATE_NEW_KEY_HERE` with your generated key.

Save: `Ctrl+X`, `Y`, `Enter`

### 5. Test Backend

```bash
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Test in browser:** `http://YOUR_EC2_IP:8000/api/health`

Should see: `{"status":"healthy"}` ✅

**Stop server:** Press `Ctrl+C`

---

## Deploy Frontend

⏱️ **Time: ~5-10 minutes**

### 1. Navigate to Client Folder

```bash
cd /var/www/votelytics/client
```

### 2. Create Frontend .env

```bash
nano .env
```

**For IP-based deployment (temporarily):**

```env
VITE_API_URL=http://YOUR_EC2_IP/api
VITE_SITE_URL=http://YOUR_EC2_IP
```

**For domain-based deployment:**

```env
VITE_API_URL=http://yourdomain.com/api
VITE_SITE_URL=http://yourdomain.com
```

**⚠️ IMPORTANT:** After adding SSL, you MUST change `http://` to `https://` (see [Fix Mixed Content](#fix-mixed-content-after-ssl))

Save: `Ctrl+X`, `Y`, `Enter`

### 3. Install Dependencies

```bash
npm ci --legacy-peer-deps
```

**Why `--legacy-peer-deps`?** React 19 and react-helmet-async have version conflicts. This flag tells npm to proceed anyway (it's safe).

Takes 2-3 minutes.

### 4. Build Frontend

```bash
npm run build
```

Takes 1-2 minutes. Creates optimized production build in `dist/` folder.

Verify: `ls -lh dist/` - should show files

---

## Configure Nginx

⏱️ **Time: ~5 minutes**

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/votelytics
```

**Paste this complete configuration:**

```nginx
server {
    listen 80;
    server_name YOUR_EC2_IP_OR_DOMAIN;

    # Frontend - Serve static files
    location / {
        root /var/www/votelytics/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API - Reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

**Replace:** `YOUR_EC2_IP_OR_DOMAIN` with:
- Your EC2 IP: `13.204.86.27`
- OR your domain: `yourdomain.com www.yourdomain.com`

Save: `Ctrl+X`, `Y`, `Enter`

### 2. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/votelytics /etc/nginx/sites-enabled/votelytics
sudo rm /etc/nginx/sites-enabled/default
```

### 3. Test and Restart

```bash
sudo nginx -t
```

Should show: `syntax is ok` and `test is successful` ✅

```bash
sudo systemctl restart nginx
```

**⚠️ IMPORTANT:** If nginx doesn't start on port 80, check that the symlink exists:

```bash
ls -la /etc/nginx/sites-enabled/
```

Should show `votelytics` link. If empty, recreate the symlink (step 2 above).

---

## Set Up Backend Service

⏱️ **Time: ~3-5 minutes**

Makes backend run automatically and survive reboots.

### 1. Create Service File

```bash
sudo nano /etc/systemd/system/votelytics-api.service
```

**Paste this (make sure ExecStart is ONE line!):**

```ini
[Unit]
Description=Votelytics FastAPI Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/votelytics/server
Environment="PATH=/home/ubuntu/.local/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/home/ubuntu/.local/bin/poetry run uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**⚠️ CRITICAL:** The `ExecStart` line MUST be on ONE single line. If it wraps in your editor, that's okay, but don't add line breaks!

Save: `Ctrl+X`, `Y`, `Enter`

### 2. Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable votelytics-api
sudo systemctl start votelytics-api
sudo systemctl status votelytics-api
```

Should see: `active (running)` in **green** ✅

Press `q` to exit

**If you see "exit-code" or "failed":**
- Check logs: `sudo journalctl -u votelytics-api -n 30 --no-pager`
- Common issue: ExecStart command split across lines (must be ONE line!)

---

## Get Elastic IP

⏱️ **Time: ~5 minutes**

**Purpose:** Permanent IP address that doesn't change when you restart EC2

**Cost:** **FREE** when attached to running EC2, $3.60/month if unattached

### Steps:

1. **AWS Console** → **EC2** → **Elastic IPs** (left sidebar under Network & Security)
2. Click **Allocate Elastic IP address**
3. Leave defaults, click **Allocate**
4. You'll see your new IP (e.g., `13.204.202.217`) ✅
5. Select the IP (checkbox) → **Actions** → **Associate Elastic IP address**
6. **Instance:** Select `votelytics-server`
7. Click **Associate**

**Your IP is now permanent!** Save it somewhere safe.

### Update Server with New IP

**⚠️ IMPORTANT:** Your old IP won't work anymore! Update everything to use the new Elastic IP.

```bash
# 1. Update frontend .env
cd /var/www/votelytics/client
nano .env
```

Change to new Elastic IP:
```env
VITE_API_URL=http://13.204.202.217/api
VITE_SITE_URL=http://13.204.202.217
```

```bash
# 2. Rebuild frontend
npm run build

# 3. Update Nginx
sudo nano /etc/nginx/sites-available/votelytics
```

Change `server_name` to: `13.204.202.217;`

```bash
# 4. Restart
sudo systemctl restart nginx
```

**Test:** `http://13.204.202.217` - website should load!

---

## Configure Domain (Route 53)

⏱️ **Time: ~10 minutes + 24-48 hours wait**

### Buy Domain

1. **AWS Console** → **Route 53**
2. Click **Register domain**
3. Search for domain name
4. Select TLD:
   - `.com` = $13/year
   - `.in` = $11/year ✅ Used for votelytics.in
   - `.net` = $11/year
5. Complete registration (fill details, payment)
6. **Wait 24-48 hours** for registration (usually faster!)

**You'll receive email when ready.**

### Point Domain to Elastic IP

**After domain is registered:**

1. **Route 53** → **Hosted zones**
2. Click your domain name
3. Click **Create record**

**Record 1 (Root domain - yourdomain.com):**
- **Record name:** Leave blank
- **Record type:** A
- **Value:** Your Elastic IP (e.g., `13.204.202.217`)
- **TTL:** 300 (default)
- Click **Create records**

**Record 2 (www subdomain - www.yourdomain.com):**
- Click **Create record** again
- **Record name:** www
- **Record type:** A
- **Value:** Your Elastic IP (same as above)
- **TTL:** 300
- Click **Create records**

**DNS propagation takes 5-30 minutes.** Usually works in 5-10 minutes.

### Update Server Configuration

```bash
# 1. Update frontend .env
cd /var/www/votelytics/client
nano .env
```

Change to your domain:
```env
VITE_API_URL=http://yourdomain.in/api
VITE_SITE_URL=http://yourdomain.in
```

**Example (actual votelytics.in):**
```env
VITE_API_URL=http://votelytics.in/api
VITE_SITE_URL=http://votelytics.in
```

```bash
# 2. Rebuild
npm run build

# 3. Update Nginx
sudo nano /etc/nginx/sites-available/votelytics
```

Change `server_name` to:
```nginx
server_name yourdomain.in www.yourdomain.in;
```

**Example:**
```nginx
server_name votelytics.in www.votelytics.in;
```

```bash
# 4. Restart
sudo systemctl restart nginx
```

**Test:** `http://yourdomain.in` - website should load from your domain! 🎉

---

## Add SSL Certificate

⏱️ **Time: ~5 minutes**

**Makes your site HTTPS (secure)** 🔒

**Cost:** **FREE** forever (Let's Encrypt + auto-renewal)

### Prerequisites:
- ✅ Domain pointed to EC2
- ✅ Nginx configured with domain name
- ✅ Website accessible via `http://yourdomain.com`

### Steps:

```bash
# 1. Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# 2. Get certificate (automatic configuration)
sudo certbot --nginx -d yourdomain.in -d www.yourdomain.in
```

**Example for votelytics.in:**
```bash
sudo certbot --nginx -d votelytics.in -d www.votelytics.in
```

**Follow prompts:**
1. **Email:** Enter your email (for renewal reminders)
2. **Terms:** Type `Y` (agree)
3. **Share email with EFF?** Type `N` (optional)

**Certbot will:**
- Get SSL certificate
- Auto-configure Nginx for HTTPS
- Set up HTTP → HTTPS redirect
- Enable auto-renewal (every 90 days)

**Done!** Your site is now: `https://yourdomain.in` 🔒✨

**Test auto-renewal:**
```bash
sudo certbot renew --dry-run
```

---

## Fix Mixed Content (After SSL)

⏱️ **Time: ~3 minutes**

**⚠️ CRITICAL STEP - DO NOT SKIP!**

### The Problem

After adding SSL, your website will be `https://` but your frontend will still call API with `http://`. Browsers block this "mixed content" for security.

**Error in browser console:**
```
Mixed Content: The page at 'https://votelytics.in/' was loaded over HTTPS,
but requested an insecure XMLHttpRequest endpoint 'http://votelytics.in/api/'.
This request has been blocked.
```

### The Solution

Update frontend to use `https://` for API calls:

```bash
# 1. Edit frontend .env
cd /var/www/votelytics/client
nano .env
```

**Change from:**
```env
VITE_API_URL=http://votelytics.in/api
VITE_SITE_URL=http://votelytics.in
```

**To:**
```env
VITE_API_URL=https://votelytics.in/api
VITE_SITE_URL=https://votelytics.in
```

**Just add the `s` to both URLs!**

Save: `Ctrl+X`, `Y`, `Enter`

```bash
# 2. Rebuild frontend
npm run build

# 3. Restart Nginx
sudo systemctl restart nginx
```

**Test:** Open `https://yourdomain.in` and hard refresh:
- **Windows:** `Ctrl + F5`
- **Mac:** `Cmd + Shift + R`

**Everything should work now!** ✅
- 🔒 Green padlock
- Map loads
- Data appears
- No errors in console

---

## Update Code After Changes

### Full Update (Backend + Frontend Changed)

```bash
# 1. Push changes to GitHub (on your local machine)
git add .
git commit -m "Your changes"
git push

# 2. On EC2, pull latest code
cd /var/www/votelytics
git pull

# 3. Update backend
cd server
poetry install --only main --no-root
sudo systemctl restart votelytics-api

# 4. Update frontend
cd ../client
npm run build
sudo systemctl restart nginx

# 5. Verify
sudo systemctl status votelytics-api
```

### Frontend Only

```bash
cd /var/www/votelytics/client
git pull
npm run build
sudo systemctl restart nginx
```

### Backend Only

```bash
cd /var/www/votelytics/server
git pull
poetry install --only main --no-root
sudo systemctl restart votelytics-api
```

---

## Useful Commands

### Check Service Status

```bash
# Backend status
sudo systemctl status votelytics-api

# Nginx status
sudo systemctl status nginx
```

### Restart Services

```bash
# Restart backend
sudo systemctl restart votelytics-api

# Restart Nginx
sudo systemctl restart nginx

# Restart both
sudo systemctl restart votelytics-api nginx
```

### View Logs

```bash
# Backend logs (live)
sudo journalctl -u votelytics-api -f

# Backend logs (last 50 lines)
sudo journalctl -u votelytics-api -n 50 --no-pager

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### Check What's Running on Ports

```bash
# Check port 80 (Nginx)
sudo ss -tlnp | grep :80

# Check port 8000 (Backend)
sudo ss -tlnp | grep :8000
```

### Test Nginx Configuration

```bash
sudo nginx -t
```

### Rebuild Frontend

```bash
cd /var/www/votelytics/client
npm run build
```

### Connect to EC2

**After getting Elastic IP, update PuTTY:**
- Open PuTTY
- Host Name: `ubuntu@YOUR_ELASTIC_IP`
- Load your saved session, update IP
- Save it again

---

## Common Issues & Solutions

### Issue 1: Nginx Not Listening on Port 80

**Symptom:** `ERR_CONNECTION_REFUSED` when accessing website

**Solution:**
```bash
# Check if symlink exists
ls -la /etc/nginx/sites-enabled/

# If empty, recreate symlink
sudo ln -s /etc/nginx/sites-available/votelytics /etc/nginx/sites-enabled/votelytics
sudo systemctl restart nginx

# Verify port 80 is listening
sudo ss -tlnp | grep :80
```

### Issue 2: Backend Service Fails to Start

**Symptom:** `sudo systemctl status votelytics-api` shows "failed" or "exit-code"

**Common cause:** ExecStart command split across multiple lines

**Solution:**
```bash
# Edit service file
sudo nano /etc/systemd/system/votelytics-api.service

# Make sure ExecStart is ONE continuous line (no line breaks!)
# Should look like:
# ExecStart=/home/ubuntu/.local/bin/poetry run uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart votelytics-api
sudo systemctl status votelytics-api
```

### Issue 3: Mixed Content Error After SSL

**Symptom:** Website loads but no data appears. Console shows "Mixed Content" error.

**Solution:** See [Fix Mixed Content](#fix-mixed-content-after-ssl) section above.

### Issue 4: npm ci Fails with ERESOLVE

**Symptom:** `npm ci` shows React version conflict error

**Solution:**
```bash
npm ci --legacy-peer-deps
```

This is safe! It's just React 19 being newer than some dependencies expect.

### Issue 5: Poetry Install Error "Package could not be installed"

**Symptom:** After `poetry install --only main`, shows error about "current project"

**Solution:** This is normal! The error is harmless. All dependencies are still installed correctly. Add `--no-root` flag:
```bash
poetry install --only main --no-root
```

---

## Troubleshooting

### Website Not Loading (Connection Refused)

**Check Nginx:**
```bash
sudo systemctl status nginx
sudo nginx -t
sudo systemctl restart nginx
```

**Check if Nginx is listening on port 80:**
```bash
sudo ss -tlnp | grep :80
```

Should show nginx. If not, recreate symlink (see Common Issues above).

### API Not Working (502 Bad Gateway)

**Check backend service:**
```bash
sudo systemctl status votelytics-api
```

If not running:
```bash
# Check logs for errors
sudo journalctl -u votelytics-api -n 50 --no-pager

# Restart
sudo systemctl restart votelytics-api
```

### Database Connection Error

**Check .env file:**
```bash
cd /var/www/votelytics/server
cat .env
```

Verify DATABASE_URL is correct.

**Test connection:**
```bash
cd /var/www/votelytics/server
poetry run python -c "from app.database import engine; print(engine.connect())"
```

### Frontend Shows Old Content

**Clear build and rebuild:**
```bash
cd /var/www/votelytics/client
rm -rf dist/
npm run build
sudo systemctl restart nginx
```

**In browser:** Hard refresh (Ctrl+F5 or Cmd+Shift+R)

### SSL Certificate Issues

**Check certificate status:**
```bash
sudo certbot certificates
```

**Renew manually:**
```bash
sudo certbot renew
```

**If broken, remove and reinstall:**
```bash
sudo certbot delete --cert-name yourdomain.com
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### DNS Not Propagating

**Check DNS status:**
```bash
nslookup yourdomain.in
```

Should show your Elastic IP.

**If not:**
- Wait 5-30 minutes
- Check Route 53 records are correct
- Try from different device/network

---

## Monthly Costs Summary

| Item | Cost |
|------|------|
| EC2 t2.micro | Free tier (12 months) then ~$8/month |
| EC2 t3.small | ~$15/month |
| Elastic IP | **FREE** (when attached to running EC2) |
| Route 53 Domain (.com) | $13/year (~$1.08/month) |
| Route 53 Domain (.in) | $11/year (~$0.92/month) ✅ |
| Route 53 Hosted Zone | $0.50/month |
| SSL Certificate | **FREE** (Let's Encrypt) |
| **Total (.in domain, t2.micro)** | **~$9.42/month** (~₹765) |
| **Total (.com domain, t2.micro)** | **~$9.58/month** (~₹780) |

**Actual votelytics.in cost:** ~₹765/month (~$9.42)

---

## Important Notes

### Why No CORS Update Needed?

**Question:** "Why didn't we need to update backend CORS settings?"

**Answer:** Because of **Nginx reverse proxy magic!** 🎩✨

```
Browser sees: https://votelytics.in → Same origin!
Frontend: https://votelytics.in/
API calls: https://votelytics.in/api/ → Same origin!
```

Behind the scenes:
```
https://votelytics.in/api/ → Nginx → http://localhost:8000
```

**No CORS check needed!** This is actually best practice - keeps everything simple and secure.

### Security

- ⚠️ **Never commit .env files to GitHub**
- ✅ SSH key pair is saved safely
- ✅ SECRET_KEY is cryptographically random
- ✅ Restrict SSH (port 22) to your IP only in Security Groups

### Backups

**Database:** Supabase handles backups automatically

**Code:** Already in GitHub

**Server configs:** This guide documents everything!

**Important:** Keep your `.env` files backed up locally (securely)

### Performance

- **t2.micro:** Good for 100-1000 visitors/day
- **t3.small:** Good for 1000-10000 visitors/day
- Need more? Upgrade instance type or add load balancer

### SSL Certificate Auto-Renewal

Let's Encrypt certificates last **90 days** and auto-renew.

**Certbot automatically:**
- Checks for renewal twice daily
- Renews if within 30 days of expiration
- Reloads Nginx after renewal

**No action needed!** But you can test it:
```bash
sudo certbot renew --dry-run
```

---

## EC2 Instance Management

### Stop EC2 (Save Money)

**In AWS Console:**
- Select instance → **Instance State** → **Stop instance**

**What happens:**
- ✅ With Elastic IP: IP stays same, website back after restart
- ❌ Without Elastic IP: IP changes, need to reconfigure everything
- ✅ All files saved (nothing deleted)
- ⏸️ Billing stops (only charged for storage, ~$1/month)

### Start EC2

**In AWS Console:**
- Select instance → **Instance State** → **Start instance**
- Wait for **Running** status (2-3 minutes)

**With Elastic IP:**
- Just start instance, everything works! ✅

**Without Elastic IP:**
- Note new IP
- Update PuTTY connection
- Update frontend .env
- Update Nginx config
- Rebuild and restart

---

## Quick Reference: Actual Deployment

**Successfully Deployed:** November 4, 2025

**EC2 Instance:**
- Name: votelytics-server
- Type: t2.micro
- OS: Ubuntu 22.04 LTS
- Region: ap-south-1 (Mumbai)

**Elastic IP:** 13.204.202.217

**Domain:** votelytics.in (Route 53)

**Live Website:** https://votelytics.in 🔒

**SSH Command:**
```bash
ssh -i votelytics-key.ppk ubuntu@13.204.202.217
```

**PuTTY:**
- Host: ubuntu@13.204.202.217
- Port: 22
- Key: votelytics-key.ppk

**URLs:**
- Website: https://votelytics.in
- API Health: https://votelytics.in/api/health
- API Docs: https://votelytics.in/api/docs

**GitHub:** https://github.com/GireeshS22/votelytics

---

## Lessons Learned (From Actual Deployment)

### What Worked Perfectly
1. ✅ Ubuntu 22.04 LTS (very stable)
2. ✅ Poetry for Python dependencies
3. ✅ npm with --legacy-peer-deps
4. ✅ Nginx reverse proxy (no CORS headaches!)
5. ✅ Let's Encrypt SSL (automatic, free)
6. ✅ Systemd service (auto-restart, survives reboot)

### What Required Fixes
1. ⚠️ Nginx symlink sometimes doesn't create properly - check with `ls -la /etc/nginx/sites-enabled/`
2. ⚠️ Service file ExecStart MUST be one line (breaks if split)
3. ⚠️ After SSL, must update .env to use `https://` (mixed content error)
4. ⚠️ Route 53 domain takes 5-30 min to propagate (be patient!)

### Best Practices Discovered
1. ✅ Get Elastic IP FIRST - saves hassle of updating configs
2. ✅ Test backend standalone before setting up Nginx
3. ✅ Use domain names in configs, not IPs (easier to change later)
4. ✅ Keep deployment guide updated with actual values
5. ✅ Save all credentials securely (LastPass, 1Password, etc.)

---

## Next Steps After Deployment

### Immediate (Done! ✅)
1. ✅ EC2 instance running
2. ✅ Elastic IP allocated
3. ✅ Route 53 domain configured
4. ✅ SSL certificate installed
5. ✅ Website live: https://votelytics.in

### This Week
- [ ] Set up AWS billing alerts ($10, $20 thresholds)
- [ ] Add monitoring (AWS CloudWatch basic)
- [ ] Test all features thoroughly
- [ ] Share with users/stakeholders

### This Month
- [ ] Set up error tracking (Sentry - free tier)
- [ ] Add Google Analytics (optional)
- [ ] Create database backup procedure
- [ ] Document any additional features added
- [ ] Consider upgrading to t3.small if traffic grows

### Future
- [ ] Add CloudFront CDN for faster global loading
- [ ] Implement CI/CD pipeline (GitHub Actions)
- [ ] Set up staging environment
- [ ] Add comprehensive monitoring (Datadog, New Relic)
- [ ] Scale horizontally with load balancer (if needed)

---

## Need Help?

### Check Logs First

```bash
# Backend
sudo journalctl -u votelytics-api -n 50 --no-pager

# Nginx
sudo tail -50 /var/log/nginx/error.log
```

### Common Fix

90% of issues fixed by:
```bash
sudo systemctl restart votelytics-api nginx
```

### Nuclear Option

If everything is broken:
```bash
cd /var/www/votelytics
git pull
cd server && poetry install --only main --no-root
cd ../client && npm run build
sudo systemctl restart votelytics-api nginx
```

### Still Stuck?

1. Check this guide's [Common Issues](#common-issues--solutions)
2. Check [Troubleshooting](#troubleshooting)
3. Review error logs (commands above)
4. Google the specific error message
5. Check AWS EC2 / Route 53 console for issues

---

## Success Checklist

Use this to verify your deployment is complete:

### Infrastructure
- [ ] EC2 instance running
- [ ] Elastic IP allocated and associated
- [ ] Security groups configured (22, 80, 443)
- [ ] SSH key saved safely

### Domain & DNS
- [ ] Route 53 domain registered
- [ ] A record points to Elastic IP (root domain)
- [ ] A record points to Elastic IP (www subdomain)
- [ ] DNS resolves correctly (`nslookup yourdomain.in`)

### Backend
- [ ] Code cloned to `/var/www/votelytics`
- [ ] Poetry dependencies installed
- [ ] .env file created with strong SECRET_KEY
- [ ] Backend service running (`systemctl status votelytics-api`)
- [ ] Health check works: https://yourdomain.in/api/health

### Frontend
- [ ] Node.js and npm installed
- [ ] Dependencies installed with `--legacy-peer-deps`
- [ ] .env file created with correct domain
- [ ] Build completed successfully (`dist/` folder exists)

### Nginx
- [ ] Nginx installed and running
- [ ] Config file created in sites-available
- [ ] Symlink created in sites-enabled
- [ ] Default site removed
- [ ] Config test passes (`nginx -t`)
- [ ] Listening on port 80 (`ss -tlnp | grep :80`)

### SSL/HTTPS
- [ ] Certbot installed
- [ ] Certificate obtained for domain
- [ ] Nginx configured for HTTPS (automatic)
- [ ] Frontend .env updated to use `https://`
- [ ] Website loads with green padlock 🔒
- [ ] No mixed content errors

### Testing
- [ ] Website loads: https://yourdomain.in
- [ ] Map displays correctly
- [ ] Constituency data loads
- [ ] All pages work (About, Analysis, etc.)
- [ ] No console errors
- [ ] Mobile responsive (check on phone)

---

**Last Updated:** November 4, 2025 (After successful deployment)

**Tested and verified by:** First-time deployment of votelytics.in

**Status:** ✅ PRODUCTION READY

🎉 **Congratulations on your successful AWS deployment!** 🎉

---

## Support This Guide

If this guide helped you deploy successfully:
- ⭐ Star the repository on GitHub
- 📝 Share your deployment experience
- 🐛 Report any issues or improvements
- 💡 Suggest enhancements

**Happy deploying!** 🚀
