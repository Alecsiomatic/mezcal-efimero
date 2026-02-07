# Production Deployment Checklist

## Pre-Deployment ✓
- [x] Frontend API client uses relative `/api` paths
- [x] Admin API client uses relative `/api` paths
- [x] Backend configured for port 3008
- [x] Nginx configured to proxy `/api` to port 3008
- [x] .env.production files configured
- [x] Deploy script created

## Deployment Steps

### 1. Local Build
```bash
npm run build
cd admin && npm run build && cd ..
```

### 2. Deploy Frontend & Admin
```bash
scp -r dist/* root@72.60.168.4:/var/www/efimero.cerounocero.app/
scp -r admin/dist/* root@72.60.168.4:/var/www/efimero.cerounocero.app/admin/
```

### 3. Deploy Backend (via SSH)
```bash
ssh root@72.60.168.4

cd /var/www/efimero-backend
npm install
PORT=3008 pm2 start src/server.js --name efimero-api
pm2 save

# Verify
curl http://localhost:3008/api/settings
```

### 4. Verify Nginx
```bash
nginx -t
systemctl reload nginx
```

### 5. Test Endpoints
- Frontend: https://efimero.cerounocero.app/
- Admin: https://efimero.cerounocero.app/admin/
- API: https://efimero.cerounocero.app/api/settings

## Troubleshooting

### API not responding
- Check backend is running: `pm2 status`
- Check port 3008 is listening: `ss -tuln | grep 3008`
- Check backend logs: `pm2 logs efimero-api`

### Frontend/Admin showing 404
- Verify files deployed: `ls -la /var/www/efimero.cerounocero.app/`
- Check nginx config: `cat /etc/nginx/sites-enabled/efimero.cerounocero.app`

### CORS errors in browser
- Frontend must use `/api` (relative path)
- Nginx must pass `X-Real-IP` and `Host` headers
- Backend CORS settings must allow the domain

## Key Configuration Files

### Backend Port (3008)
Location: `/var/www/efimero-backend/src/server.js`
Environment: `PORT=3008 pm2 start ...`

### API Proxy
Location: `/etc/nginx/sites-enabled/efimero.cerounocero.app`
```
location /api {
    proxy_pass http://localhost:3008;
}
```

### Frontend API URL
Location: `src/api/client.ts` & `admin/src/api/client.js`
```
const API_URL = import.meta.env.VITE_API_URL || '/api';
```
