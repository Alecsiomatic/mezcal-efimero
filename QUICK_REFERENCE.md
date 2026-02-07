## 🚀 QUICK REFERENCE - PASSWORD RESET

### 📋 Quick Start

```bash
# 1. Deploy backend files (ejecutar una por una)
scp backend/src/models/User.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/models/
scp backend/src/controllers/authController.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/controllers/
scp backend/src/services/emailService.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/services/
scp backend/src/routes/auth.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/routes/
scp backend/migrate-add-reset-token.js root@72.60.168.4:/root/vinateria-ecommerce/backend/

# 2. Run migration
ssh root@72.60.168.4 "cd /root/vinateria-ecommerce/backend && node migrate-add-reset-token.js"

# 3. Restart backend
ssh root@72.60.168.4 "pm2 restart backend"

# 4. Build and deploy frontend
npm run build
scp -r dist/* root@72.60.168.4:/var/www/efimero.com/html/
```

---

### 🧪 Quick Test

```bash
# Test 1: Forgot Password API
curl -X POST https://api.efimero.com/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test 2: Check Email (wait 30-60 seconds)

# Test 3: Reset Password (use token from email)
curl -X POST https://api.efimero.com/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_HERE","password":"NewPassword123"}'

# Test 4: Login with new password
```

---

### 📁 File Changes

| File | Changes | Type |
|------|---------|------|
| `src/pages/Login.tsx` | Modal forgot password | Modified |
| `src/pages/ResetPassword.tsx` | Reset page | **NEW** |
| `src/App.tsx` | New route | Modified |
| `src/pages/Auth.css` | Success message class | Modified |
| `backend/src/models/User.js` | Reset token fields | Modified |
| `backend/src/controllers/authController.js` | 2 new methods | Modified |
| `backend/src/services/emailService.js` | Email template | Modified |
| `backend/src/routes/auth.js` | 2 new routes | Modified |
| `backend/migrate-add-reset-token.js` | Migration script | **NEW** |

---

### 🔗 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Confirm password reset |

---

### 🌐 Frontend URLs

| Page | URL | Description |
|------|-----|-------------|
| Login | `/login` | Login page with forgot button |
| Reset | `/restablecer-contraseña?token=xxx` | Password reset page |

---

### 🔐 Security Summary

- ✅ Token: 32 bytes (256 bits)
- ✅ Expiry: 1 hour
- ✅ Hash: bcrypt (salt 12)
- ✅ Rate limit: 5 attempts/15 min
- ✅ Email privacy: Hidden enumeration
- ✅ Validation: Frontend + Backend

---

### 📧 Email Info

**From:** comprasweb@efimero.com  
**Subject:** 🔐 Restablecer tu Contraseña - EFÍMERO Mezcal  
**Type:** HTML + Plain text  
**Template:** 200+ lines with Efímero branding

---

### ⚡ Common Issues

| Issue | Solution |
|-------|----------|
| Email not received | Check SMTP settings / Check spam folder |
| Token expired | Request new link (valid for 1 hour only) |
| Password too short | Minimum 6 characters required |
| Passwords don't match | Re-enter and confirm carefully |
| Page shows error | Check URL token is present |

---

### 📊 Monitoring Commands

```bash
# Check backend status
pm2 status backend

# View logs
pm2 logs backend --lines 50

# Check database
sqlite3 /root/vinateria-ecommerce/backend/database.db \
  "SELECT COUNT(*) FROM Users WHERE resetToken IS NOT NULL;"

# Check recent emails sent
pm2 logs backend | grep "sending password reset"
```

---

### ✅ Validation Checklist

- [ ] Migration completed (columns added)
- [ ] Backend restarted successfully
- [ ] Frontend updated (new files)
- [ ] Login modal appears
- [ ] Forgot password email arrives
- [ ] Email link works
- [ ] Reset page loads
- [ ] Password update works
- [ ] Login with new password works
- [ ] No errors in pm2 logs

---

### 🎯 Success Indicators

✅ When you see these, deployment is successful:

1. Modal appears on login page
2. Email arrives in 30-60 seconds
3. Reset page shows when clicking email link
4. New password accepted
5. Login works with new credentials
6. No 500 errors in logs

---

### 📞 Documentation Files

- `PASSWORD_RESET_DOCUMENTATION.md` - Complete technical docs
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment
- `PRODUCTION_URLS.md` - All URLs and endpoints
- `RESUMEN_PASSWORD_RESET.md` - Spanish summary
- `IMPLEMENTATION_SUMMARY.md` - Visual overview

---

**Quick Deploy:** ~10 minutes  
**Quick Test:** ~5 minutes  
**Status:** 🟢 READY  

Next: Execute the commands above! 🚀
