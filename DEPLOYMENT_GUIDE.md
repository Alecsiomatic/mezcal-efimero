## 🚀 GUÍA DE DEPLOYMENT - SISTEMA DE RESET DE CONTRASEÑA

### 📋 Pre-requisitos

Antes de desplegar, asegúrate de tener:

- [ ] Acceso SSH al servidor (`root@72.60.168.4`)
- [ ] PM2 instalado y corriendo en el servidor
- [ ] Node.js LTS instalado
- [ ] pnpm o npm disponible
- [ ] SMTP configurado en BD (comprasweb@efimero.com)
- [ ] Base de datos SQLite accesible

---

## 🔧 INSTALACIÓN PASO A PASO

### **PASO 1: Preparar el Código Local**

```bash
# En tu máquina local
cd "C:\Users\Alecs\Desktop\SOFTWARES LISTOS EN BLANCO\vinateria-ecommerce"

# Verificar que los cambios están presentes
git status  # O simplemente verifica los archivos

# Archivos que deben estar modificados:
# - src/pages/Login.tsx
# - src/pages/ResetPassword.tsx (NUEVO)
# - src/App.tsx
# - src/pages/Auth.css
# - backend/src/models/User.js
# - backend/src/controllers/authController.js
# - backend/src/services/emailService.js
# - backend/src/routes/auth.js
# - backend/migrate-add-reset-token.js (NUEVO)
```

### **PASO 2: Build del Frontend**

```bash
# En directorio raíz del proyecto
npm run build
# o
pnpm build

# Esto genera la carpeta 'dist/' con el código compilado
```

### **PASO 3: Deploy Automático (Recomendado)**

```bash
# Usar el script de deployment (si tienes bash)
bash deploy-password-reset.sh

# O hacer el deployment manual (ver PASO 4)
```

### **PASO 4: Deploy Manual (Alternativa)**

#### **4a. Subir cambios del backend**

```bash
# Desde tu máquina local, ejecuta en la terminal SSH:

# Subir modelo User
scp backend/src/models/User.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/models/User.js

# Subir servicio de email
scp backend/src/services/emailService.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/services/emailService.js

# Subir controlador de auth
scp backend/src/controllers/authController.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/controllers/authController.js

# Subir rutas de auth
scp backend/src/routes/auth.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/routes/auth.js

# Subir script de migración
scp backend/migrate-add-reset-token.js root@72.60.168.4:/root/vinateria-ecommerce/backend/migrate-add-reset-token.js
```

#### **4b. Ejecutar migración en el servidor**

```bash
# Conectar al servidor
ssh root@72.60.168.4

# Navegar al directorio backend
cd /root/vinateria-ecommerce/backend

# Ejecutar migración
node migrate-add-reset-token.js

# Debería ver: "✅ Migration completed successfully!"
# Y: "Added columns: resetToken, resetTokenExpiry"
```

#### **4c. Reiniciar el backend**

```bash
# En el servidor (continuando en SSH)
pm2 restart backend

# O si quieres ver los logs:
pm2 logs backend --lines 50
```

#### **4d. Deploy del frontend**

```bash
# En tu máquina local
# Subir los archivos compilados
scp -r dist/* root@72.60.168.4:/var/www/efimero.com/html/

# Verificar que se copió correctamente
ssh root@72.60.168.4 "ls -la /var/www/efimero.com/html/"
```

---

## ✅ VALIDACIÓN POST-DEPLOYMENT

### **Test 1: Verificar Migración**

```bash
# En el servidor
sqlite3 /root/vinateria-ecommerce/backend/database.db

# En el prompt de SQLite
.schema User

# Debería mostrar: resetToken y resetTokenExpiry
```

### **Test 2: Verificar Endpoints**

```bash
# En tu máquina local, test forgot-password
curl -X POST https://api.efimero.com/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Respuesta esperada:
# {"message":"Si el email existe, recibirás un link de recuperación."}
```

### **Test 3: Verificar Frontend**

1. Abrir `https://efimero.com/login`
2. Hacer click en "¿Olvidaste tu contraseña?"
3. Verificar que aparece el modal
4. Ingresar email y hacer click
5. Verificar mensaje de éxito

### **Test 4: Email de Recuperación**

1. Completar Test 3
2. Revisar tu email (puede tardar 30-60 segundos)
3. Verificar que llegó email con:
   - Asunto: "🔐 Restablecer tu Contraseña - EFÍMERO Mezcal"
   - Botón dorado "Restablecer Contraseña"
   - Link alternativo para copiar

### **Test 5: Flujo Completo**

```bash
# 1. Hacer click en link del email
# 2. Debería abrir: https://efimero.com/restablecer-contraseña?token=xxxxx
# 3. Ingresar nueva contraseña (mín. 6 caracteres)
# 4. Confirmar contraseña
# 5. Click en "Restablecer Contraseña"
# 6. Ver pantalla de éxito
# 7. Esperar redirección a login (3 segundos)
# 8. Intentar login con nueva contraseña
# 9. Debería funcionar ✅
```

---

## 🐛 TROUBLESHOOTING

### **Problema: Migración falla**
```
Error: Column 'resetToken' already exists

Solución:
- Las columnas ya existen (deployment anterior)
- Puedes ignorar este error y continuar
```

### **Problema: Email no llega**
```
Verificar:
1. Settings de SMTP en admin (verificar espacios)
2. Logs del backend: pm2 logs backend
3. Buscar: "sending password reset email"
4. Revisar carpeta de spam del email
```

### **Problema: Página de reset no funciona**
```
Verificar:
1. Token está en la URL: ?token=xxxxx
2. Token no ha expirado (máximo 1 hora)
3. Limpiar cache del navegador (Ctrl+Shift+Delete)
4. Ver console (F12) para errores de JS
```

### **Problema: PM2 no reinicia**
```bash
# Verificar estado de PM2
pm2 status

# Si está muerto
pm2 restart backend

# Si hay error
pm2 logs backend --lines 100

# Si sigue fallando, revisar errores de Node
node /root/vinateria-ecommerce/backend/src/server.js
```

### **Problema: CORS error en frontend**
```
Verificar:
1. Backend está corriendo en producción
2. URL de API es correcta en src/api/client.ts
3. Headers CORS están configurados en backend
4. Nginx proxy está bien configurado
```

---

## 📊 VERIFICACIÓN DE SALUD

Después de deployment, ejecutar:

```bash
# 1. Verificar que backend está corriendo
ssh root@72.60.168.4 "pm2 status | grep backend"

# 2. Verificar que frontend está actualizado
ssh root@72.60.168.4 "ls -la /var/www/efimero.com/html/ | tail -5"

# 3. Verificar conexión a BD
ssh root@72.60.168.4 "sqlite3 /root/vinateria-ecommerce/backend/database.db 'SELECT COUNT(*) FROM Users;'"

# 4. Verificar logs
ssh root@72.60.168.4 "pm2 logs backend --lines 20"
```

---

## 🔄 ROLLBACK (Si algo sale mal)

```bash
# Revertir a versión anterior (si tienes git)
ssh root@72.60.168.4 "cd /root/vinateria-ecommerce && git revert HEAD"

# O restaurar desde backup
ssh root@72.60.168.4 "cp -r /backup/vinateria-ecommerce/* /root/vinateria-ecommerce/"

# Reiniciar
ssh root@72.60.168.4 "pm2 restart backend"
```

---

## 📝 CHECKLIST FINAL

Antes de considerar deployment completado:

- [ ] Migración ejecutada sin errores
- [ ] Backend reiniciado correctamente
- [ ] Frontend actualizado
- [ ] Login con modal funciona
- [ ] Email de recuperación llega
- [ ] Link del email abre página de reset
- [ ] Reset de contraseña funciona
- [ ] Login con nueva contraseña funciona
- [ ] PM2 logs muestran que todo está bien
- [ ] Nginx/Web server responde correctamente

---

## 📞 SOPORTE

Si algo sale mal:

1. **Ver logs:** `pm2 logs backend`
2. **Revisar BD:** `sqlite3 database.db ".schema User"`
3. **Probar endpoints:** Usar curl o Postman
4. **Revisar console:** F12 en navegador
5. **Contactar soporte:** Revisar esta documentación

---

## ✨ ¡Deployment Completado!

Una vez que todos los tests pasen, el sistema de reset de contraseña estará **100% funcional en producción**.

🎉 **¡EFÍMERO Mezcal ahora tiene sistema seguro de recuperación de contraseña!**

---

**Versión:** 1.0  
**Fecha:** $(date)  
**Status:** 🟢 LISTO PARA PRODUCCIÓN
