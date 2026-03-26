#!/bin/bash
# Run this script ONCE on the server to set up the environment.
# Usage: bash server-setup.sh
set -e

REPO_URL="git@github.com:MohamedAbuZamil/lms-eg.git"
APP_DIR="/home/ubuntu/lms"

echo "======================================"
echo "  LMS-EG Server Setup"
echo "======================================"

# ── 1. System packages ──────────────────────────────────────────────────────
echo "==> Installing system packages..."
sudo apt-get update -y
sudo apt-get install -y git curl build-essential nginx

# ── 2. Node.js 20 via nvm ───────────────────────────────────────────────────
echo "==> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Node: $(node -v)  |  npm: $(npm -v)"

# ── 3. PM2 ─────────────────────────────────────────────────────────────────
echo "==> Installing PM2..."
sudo npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | sudo bash

# ── 4. Clone repo ───────────────────────────────────────────────────────────
echo "==> Cloning repository..."
if [ -d "$APP_DIR" ]; then
  echo "Directory already exists, pulling latest..."
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── 5. Build all services ───────────────────────────────────────────────────
echo "==> Building backend services..."
SERVICES=(
  identity-service
  course-service
  content-service
  enrollment-service
  assessment-service
  progress-service
  grade-service
  commerce-service
  notification-service
  staff-service
)

for svc in "${SERVICES[@]}"; do
  echo "--- $svc ---"
  cd "$APP_DIR/services/$svc"
  npm ci --omit=dev
  npm run build
done

# ── 6. Build frontend ───────────────────────────────────────────────────────
echo "==> Building frontend..."
cd "$APP_DIR/frontend"
npm ci
npm run build

# ── 7. Start PM2 ────────────────────────────────────────────────────────────
echo "==> Starting all processes with PM2..."
cd "$APP_DIR"
pm2 start ecosystem.config.js --env production
pm2 save

# ── 8. Nginx config ─────────────────────────────────────────────────────────
echo "==> Configuring Nginx..."
sudo tee /etc/nginx/sites-available/lms-eg > /dev/null <<'NGINX'
server {
    listen 80;
    server_name 92.222.226.72;

    # Frontend
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API routes
    location /api/identity/   { proxy_pass http://localhost:3001/; }
    location /api/courses/    { proxy_pass http://localhost:3002/; }
    location /api/content/    { proxy_pass http://localhost:3003/; }
    location /api/enrollment/ { proxy_pass http://localhost:3004/; }
    location /api/assessment/ { proxy_pass http://localhost:3005/; }
    location /api/progress/   { proxy_pass http://localhost:3006/; }
    location /api/grades/     { proxy_pass http://localhost:3007/; }
    location /api/commerce/   { proxy_pass http://localhost:3008/; }
    location /api/notify/     { proxy_pass http://localhost:3009/; }
    location /api/staff/      { proxy_pass http://localhost:3010/; }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/lms-eg /etc/nginx/sites-enabled/lms-eg
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "======================================"
echo "  Setup Complete ✅"
echo "  Frontend:  http://92.222.226.72"
echo "  PM2:       pm2 status"
echo "======================================"
