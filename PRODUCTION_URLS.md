## 🌐 URLS DE PRODUCCIÓN - SISTEMA DE RESET DE CONTRASEÑA

### 📍 URLs del Cliente

```
Servidor: 72.60.168.4
Dominio: efimero.com (o tu dominio)
```

| URL | Descripción |
|-----|-------------|
| `https://efimero.com/login` | Página de login (con botón "¿Olvidaste tu contraseña?") |
| `https://efimero.com/restablecer-contraseña?token=TOKEN` | Página de reset (enviada por email) |
| `https://efimero.com/registro` | Página de registro |

---

### 🔌 URLs de API

```
Base URL: https://api.efimero.com (o tu dominio/api)
```

#### **Solicitar Reset**
```bash
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "usuario@example.com"
}

Respuesta (200):
{
  "message": "Si el email existe, recibirás un link de recuperación."
}
```

#### **Confirmar Reset**
```bash
POST /auth/reset-password
Content-Type: application/json

{
  "token": "TOKEN_DEL_EMAIL",
  "password": "NuevaContraseña123"
}

Respuesta (200):
{
  "message": "Contraseña restablecida exitosamente. Puedes iniciar sesión."
}
```

---

### 📧 EMAIL DE RECUPERACIÓN

El usuario recibe un email con:
- Asunto: `🔐 Restablecer tu Contraseña - EFÍMERO Mezcal`
- Botón: "Restablecer Contraseña" (enlace directo)
- Link alternativo: Para copiar/pegar en navegador
- Validez: 1 hora

---

### 🧪 CASOS DE TEST

#### **Caso 1: Forgot Password Exitoso**
```
1. Ir a: https://efimero.com/login
2. Click en "¿Olvidaste tu contraseña?"
3. Ingresar: test@example.com
4. Esperar confirmación: "Revisa tu correo"
5. Verificar email recibido
```

#### **Caso 2: Reset exitoso**
```
1. Hacer click en link del email
2. Se abre: https://efimero.com/restablecer-contraseña?token=xxxxx
3. Ingresar contraseña nueva (mín. 6 caracteres)
4. Confirmar contraseña
5. Hacer click en "Restablecer Contraseña"
6. Ver pantalla de éxito
7. Redirección a login automática
8. Intentar login con nueva contraseña ✅
```

#### **Caso 3: Token Expirado**
```
1. Esperar más de 1 hora
2. Hacer click en link del email
3. Ver error: "Link de recuperación expirado"
4. Opción: Solicitar nuevo link
```

#### **Caso 4: Contraseñas No Coinciden**
```
1. En página de reset
2. Ingresar "Password123" en primer campo
3. Ingresar "DifferentPass" en segundo
4. Ver error: "Las contraseñas no coinciden"
```

#### **Caso 5: Contraseña Muy Corta**
```
1. En página de reset
2. Ingresar "123" en ambos campos
3. Ver error: "La contraseña debe tener al menos 6 caracteres"
```

---

### 🔒 RATE LIMITING

Límite: **5 intentos por 15 minutos** por IP

Códigos de respuesta:
- `200` - OK
- `400` - Error de validación
- `429` - Rate limit excedido (esperar 15 min)
- `500` - Error del servidor

---

### 📝 LOGS ÚTILES

En el servidor, monitorear:

```bash
# Ver logs del backend
pm2 logs backend

# Ver logs de email (nodemailer)
# Buscar: "sending password reset email"

# Ver registro de BD
# Buscar cambios en tabla users: resetToken, resetTokenExpiry
```

---

### 🚨 TROUBLESHOOTING

| Problema | Solución |
|----------|----------|
| Email no llega | Verificar SMTP en admin settings / Ver logs |
| Token inválido | Solicitar nuevo (token de 32 bytes) |
| Página blanca | Verificar que token está en URL |
| Error 429 | Esperar 15 minutos o cambiar IP |
| Redirección no funciona | Limpiar cache del navegador |

---

### 🔐 HEADERS RECOMENDADOS (Nginx)

```nginx
# En /etc/nginx/sites-available/efimero.com

add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

---

### 📊 MÉTRICAS A MONITOREAR

- Cantidad de requests a `/auth/forgot-password`
- Cantidad de requests a `/auth/reset-password`
- Tasa de error (4xx, 5xx)
- Tiempo de respuesta de emails
- Tokens expirados vs utilizados

---

### 🎯 PRÓXIMOS PASOS (DESPUÉS DE DEPLOY)

1. ✅ Deploy a producción
2. ✅ Probar flujo completo en vivo
3. ✅ Monitorear logs
4. ✅ Esperar feedback de usuarios
5. ⏳ Considerar mejoras (2FA, backup codes, etc.)

---

**Última actualización:** $(date)
**Estado:** 🟢 LISTO PARA PRODUCCIÓN
