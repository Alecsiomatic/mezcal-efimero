# 🔐 Sistema de Recuperación de Contraseña - Documentación

## 📋 Resumen de Cambios

Se implementó un sistema completo de recuperación de contraseña olvidada con envío de email y link de reset.

## 🛠️ Cambios en Backend

### 1. **Modelo User** (`backend/src/models/User.js`)
Agregados campos para manejo de tokens de reset:
- `resetToken` (STRING): Token único para reset de contraseña
- `resetTokenExpiry` (DATE): Fecha de expiración del token (1 hora)

```javascript
resetToken: {
  type: DataTypes.STRING(255),
  allowNull: true
},
resetTokenExpiry: {
  type: DataTypes.DATE,
  allowNull: true
}
```

### 2. **Servicio de Email** (`backend/src/services/emailService.js`)
Agregada función `sendPasswordResetEmail(user, resetToken)`:
- Crea email con diseño de Efímero
- Incluye botón clickeable para reset
- Enlace manual alternativo (copy-paste)
- Advertencia sobre expiración en 1 hora
- Validación de seguridad integrada

```javascript
async sendPasswordResetEmail(user, resetToken) {
  // Construye email con link de reset y plantilla HTML personalizada
}
```

### 3. **Controlador de Auth** (`backend/src/controllers/authController.js`)
Agregados dos nuevos métodos:

#### `forgotPassword(req, res)`
- **Endpoint:** `POST /auth/forgot-password`
- **Entrada:** `{ email }`
- **Salida:** Mensaje genérico (no revela si email existe)
- **Acciones:**
  - Genera token aleatorio de 32 bytes
  - Establece expiración de 1 hora
  - Envía email con link de recuperación
  - Usa rate limiting (5 intentos/15min)

#### `resetPassword(req, res)`
- **Endpoint:** `POST /auth/reset-password`
- **Entrada:** `{ token, password }`
- **Validaciones:**
  - Verifica que el token sea válido
  - Comprueba que no haya expirado
  - Valida longitud mínima de contraseña (6 caracteres)
- **Acciones:**
  - Actualiza contraseña con hash bcrypt
  - Limpia tokens de reset
  - Retorna mensaje de éxito

### 4. **Rutas** (`backend/src/routes/auth.js`)
Agregadas nuevas rutas públicas:
```javascript
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
```

## 🎨 Cambios en Frontend

### 1. **Página de Login** (`src/pages/Login.tsx`)
Mejoras:
- Agregado botón "¿Olvidaste tu contraseña?"
- Modal de recuperación integrado en la misma página
- Alterna entre login y forgot password
- Estilos consistentes con diseño de Efímero

**Estados:**
- Normal: Formulario de login
- Modal: Formulario de forgot password con campo de email
- Mensajes: Éxito/error con auto-cierre

### 2. **Página de Reset Password** (`src/pages/ResetPassword.tsx`) - NUEVA
Características:
- Recibe token de query parameter: `/restablecer-contraseña?token=xxxxx`
- Campos de contraseña con validaciones
- Toggle para mostrar/ocultar contraseña
- Validación de coincidencia de contraseñas
- Longitud mínima de 6 caracteres
- Pantalla de éxito con redirección a login
- Manejo de errores (token expirado, inválido, etc.)

### 3. **Rutas** (`src/App.tsx`)
Agregada nueva ruta:
```javascript
<Route path="/restablecer-contraseña" element={<ResetPassword />} />
```

### 4. **Estilos** (`src/pages/Auth.css`)
Agregada clase `.success-message`:
- Estilo verde para mensajes de éxito
- Consistente con el diseño actual
- Color: #10b981 (verde éxito)

## 🔄 Flujo Completo

### Flujo de Recuperación:
1. Usuario hace click en "¿Olvidaste tu contraseña?" en login
2. Modal solicita email
3. Backend genera token + expiry (1 hora)
4. Envía email con link: `https://efimero.com/restablecer-contraseña?token=xxxxx`
5. Usuario hace click en email
6. Página ResetPassword valida token
7. Usuario ingresa nueva contraseña
8. Backend actualiza password y limpia tokens
9. Usuario puede iniciar sesión con nueva contraseña

### Seguridad:
- ✅ Token de 32 bytes (256 bits) - altamente seguro
- ✅ Token expira en 1 hora
- ✅ Token se limpia después de uso
- ✅ Rate limiting en endpoints (5 intentos/15 min)
- ✅ Email no revela si existe en sistema (previene enumeración)
- ✅ Contraseña hasheada con bcrypt
- ✅ HTTPS obligatorio en producción

## 📧 Email Template

**Asunto:** 🔐 Restablecer tu Contraseña - EFÍMERO Mezcal

**Contenido:**
- Logo de Efímero
- Mensaje personalizado con nombre del usuario
- Botón dorado clickeable con link de reset
- Enlace manual alternativo (copy-paste)
- Advertencia: Enlace válido por 1 hora
- Footer con contacto y branding

## 🚀 Deployment

### Scripts incluidos:
1. `backend/migrate-add-reset-token.js` - Crea las columnas en BD
2. `deploy-password-reset.sh` - Script de deployment completo

### Pasos de deployment:
```bash
# 1. Ejecutar migración en producción
ssh root@72.60.168.4 "cd /root/vinateria-ecommerce/backend && node migrate-add-reset-token.js"

# 2. Subir archivos backend
scp backend/src/models/User.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/models/
scp backend/src/services/emailService.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/services/
scp backend/src/controllers/authController.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/controllers/
scp backend/src/routes/auth.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/routes/

# 3. Reiniciar backend
ssh root@72.60.168.4 "pm2 restart backend"

# 4. Build y deploy frontend
npm run build
scp -r dist/* root@72.60.168.4:/var/www/efimero.com/html/
```

## ✅ Checklist de Validación

- [x] Modelo User con campos de reset
- [x] Servicio de email con template
- [x] Endpoint `/auth/forgot-password`
- [x] Endpoint `/auth/reset-password`
- [x] Página Login con modal de recuperación
- [x] Página ResetPassword con validaciones
- [x] Ruta frontend agregada
- [x] Estilos CSS para success message
- [x] Migration script creado
- [x] Documentación completada

## 📝 Notas

- El sistema usa la configuración SMTP existente de Efímero
- Los emails se envían de fondo (no bloqueante)
- Rate limiting protege contra ataques de fuerza bruta
- El token se genera con crypto.randomBytes (seguro)
- Contraseña mínima: 6 caracteres (puede ajustarse)
- Expiración del token: 1 hora (configurable)

## 🔗 URLs Relacionadas

- **Login:** `https://efimero.com/login`
- **Reset:** `https://efimero.com/restablecer-contraseña?token=TOKEN`
- **API forgot:** `POST https://api.efimero.com/auth/forgot-password`
- **API reset:** `POST https://api.efimero.com/auth/reset-password`
