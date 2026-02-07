#!/bin/bash
# Senior-level Production Deployment Script
# Deploys frontend, admin, and backend to production VPS

set -e

SERVER_IP="72.60.168.4"
BACKEND_PORT="3008"
DOMAIN="efimero.cerounocero.app"

echo "=========================================="
echo "SENIOR-LEVEL PRODUCTION DEPLOYMENT"
echo "=========================================="
echo "Server: $SERVER_IP"
echo "Domain: $DOMAIN"
echo "Backend Port: $BACKEND_PORT"
echo ""

# 1. BUILD FRONTEND & ADMIN LOCALLY
echo "Step 1: Building frontend and admin..."
npm run build
cd admin && npm run build && cd ..
echo "✓ Build completed"
echo ""

# 2. DEPLOY FRONTEND
echo "Step 2: Deploying frontend..."
scp -r dist/* root@$SERVER_IP:/var/www/efimero.cerounocero.app/
echo "✓ Frontend deployed"
echo ""

# 3. DEPLOY ADMIN
echo "Step 3: Deploying admin..."
scp -r admin/dist/* root@$SERVER_IP:/var/www/efimero.cerounocero.app/admin/
echo "✓ Admin deployed"
echo ""

# 4. DEPLOY BACKEND & RESTART
echo "Step 4: Deploying backend..."
ssh root@$SERVER_IP << 'REMOTE_COMMANDS'
  cd /var/www/efimero-backend
  
  # Update code
  echo "Updating backend code..."
  git pull origin main || echo "Note: Git pull failed, manual update required"
  
  # Install dependencies
  echo "Installing dependencies..."
  npm install
  
  # Stop existing process
  echo "Stopping existing backend process..."
  pm2 stop efimero-api || true
  
  # Verify port is free
  PORT=$(ss -tuln | grep :$BACKEND_PORT | awk '{print $5}')
  if [ -z "$PORT" ]; then
    echo "✓ Port $BACKEND_PORT is free"
  else
    echo "✗ Port $BACKEND_PORT is in use!"
    exit 1
  fi
  
  # Start backend on correct port
  echo "Starting backend on port $BACKEND_PORT..."
  PORT=$BACKEND_PORT pm2 start src/server.js --name efimero-api
  pm2 save
  
  # Verify backend is running
  sleep 2
  curl -s http://localhost:$BACKEND_PORT/api/settings || {
    echo "✗ Backend health check failed"
    exit 1
  }
  echo "✓ Backend is running and responding"
REMOTE_COMMANDS

echo "✓ Backend deployed and restarted"
echo ""

# 5. RELOAD NGINX
echo "Step 5: Reloading nginx..."
ssh root@$SERVER_IP "nginx -t && systemctl reload nginx"
echo "✓ Nginx reloaded"
echo ""

# 6. VERIFY DEPLOYMENT
echo "Step 6: Verifying deployment..."
echo "Testing endpoints..."

# Test frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/)
echo "  Frontend: $FRONTEND_STATUS"

# Test API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/settings)
echo "  API: $API_STATUS"

# Test admin
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/admin/)
echo "  Admin: $ADMIN_STATUS"

if [ "$FRONTEND_STATUS" = "200" ] && [ "$API_STATUS" = "200" ]; then
  echo ""
  echo "=========================================="
  echo "✓ DEPLOYMENT SUCCESSFUL"
  echo "=========================================="
  echo "Frontend:  https://$DOMAIN/"
  echo "Admin:     https://$DOMAIN/admin/"
  echo "API:       https://$DOMAIN/api"
  echo ""
else
  echo "✗ Some endpoints returned non-200 status"
  echo "  Please verify manually"
  exit 1
fi
