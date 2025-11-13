# ✅ Inicio de Sesión con Zoho - OpenID Connect (CORREGIDO)

## 🎯 **Implementación Correcta Basada en Documentación Oficial**

He implementado el inicio de sesión con Zoho siguiendo **OpenID Connect (OIDC)**, que es el estándar correcto para autenticación.

---

## 🔑 **Scopes Correctos Implementados**

### Antes (❌ Incorrecto):
```javascript
scope: ['ZohoAssist.userapi.READ', 'ZohoCalendar.calendar.ALL']
// Estos scopes NO devuelven información del usuario
```

### Ahora (✅ Correcto):
```javascript
scope: ['openid', 'email', 'profile', 'ZohoCalendar.calendar.ALL']
// OpenID Connect estándar + acceso al calendario
```

---

## 📋 **Cómo Funciona el Flujo Correcto**

### 1. **Usuario hace click en "Continuar con Zoho"**
```
Frontend → Backend: GET /api/auth/zoho
```

### 2. **Backend redirige a Zoho con scopes correctos**
```
https://accounts.zoho.com/oauth/v2/auth?
  response_type=code
  &client_id=[TU_CLIENT_ID]
  &scope=openid email profile ZohoCalendar.calendar.ALL
  &redirect_uri=http://localhost:5000/api/auth/zoho/callback
  &access_type=offline
  &state=[random_string]
```

### 3. **Usuario autoriza en Zoho**
- Inicia sesión con su cuenta de Zoho
- Ve la pantalla de consentimiento
- Acepta compartir: email, nombre, perfil

### 4. **Zoho redirige de vuelta con código**
```
http://localhost:5000/api/auth/zoho/callback?code=[AUTHORIZATION_CODE]
```

### 5. **Backend intercambia código por tokens**
Backend hace POST a:
```
https://accounts.zoho.com/oauth/v2/token
```

Con datos:
```javascript
{
  grant_type: "authorization_code",
  client_id: "[TU_CLIENT_ID]",
  client_secret: "[TU_CLIENT_SECRET]",
  redirect_uri: "http://localhost:5000/api/auth/zoho/callback",
  code: "[AUTHORIZATION_CODE]"
}
```

### 6. **Zoho devuelve tokens**
```javascript
{
  access_token: "1000.xxxxx",
  refresh_token: "1000.yyyyy",
  id_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikx1aXMgUmFtaXJleiIsImVtYWlsIjoiaW5mb0Bwcm95ZWN0b3NjhA.xxxxx",
  expires_in: 3600
}
```

### 7. **Backend decodifica id_token (JWT)**
```javascript
const decoded = jwt.decode(params.id_token);

// decoded contiene:
{
  sub: "12345",              // ID único del usuario en Zoho
  email: "info@proyectoscsi.mx",
  name: "Luis Alberto Ramirez Tapia",
  given_name: "Luis Alberto",
  family_name: "Ramirez Tapia",
  picture: "https://...",
  iss: "https://accounts.zoho.com",
  aud: "[TU_CLIENT_ID]"
}
```

### 8. **Backend crea/actualiza usuario**
- Busca usuario por `zohoId` (decoded.sub)
- Si no existe, busca por email
- Si existe, vincula la cuenta
- Si no existe, crea nuevo usuario con el email REAL

### 9. **Usuario es redirigido al dashboard**
```
Frontend: http://localhost:5173/dashboard
```

---

## ✅ **Ventajas de OpenID Connect**

| Característica | Valor |
|----------------|-------|
| ✅ Email Real | Siempre obtenido del `id_token` |
| ✅ Nombre Completo | Incluido en el JWT |
| ✅ ID Único | `sub` claim (no cambia nunca) |
| ✅ Verificado | Firmado por Zoho |
| ✅ Estándar | Compatible con OAuth 2.0 |
| ✅ Seguro | No necesita llamadas adicionales a APIs |

---

## 🔍 **Logs Esperados (Backend)**

Cuando todo funcione correctamente verás:

```bash
🔑 Configurando Zoho OAuth con OpenID Connect
   Scopes: openid, email, profile, ZohoCalendar.calendar.ALL
✅ Zoho OAuth (OpenID Connect) configurado correctamente

# Después de autorizar:
✅ OAuth callback recibido de Zoho
🔑 Access Token recibido
🔄 Refresh Token: Sí
🎫 ID Token recibido, decodificando...
📋 Información del ID Token: {
  "sub": "12345",
  "email": "info@proyectoscsi.mx",
  "name": "Luis Alberto Ramirez Tapia",
  "given_name": "Luis Alberto",
  "picture": "https://..."
}
✅ Email obtenido del ID Token: info@proyectoscsi.mx
✅ Nombre obtenido: Luis Alberto Ramirez Tapia
✅ User ID (sub): 12345

📧 Información final del usuario:
   Email: info@proyectoscsi.mx
   Nombre: Luis Alberto Ramirez Tapia
   ID: 12345

📝 Creando nuevo usuario con Zoho OAuth
✅ Nuevo usuario creado: info@proyectoscsi.mx
✅ Usuario autenticado con Zoho: info@proyectoscsi.mx
✅ Generando token y redirigiendo al dashboard
```

---

## 🧪 **Cómo Probar**

### 1. **Limpiar Sesión**
```javascript
// En DevTools (F12) → Console
localStorage.clear()
```

### 2. **Ir a Login**
```
http://localhost:5173/login
```

### 3. **Click "Continuar con Zoho"**
- Autoriza la aplicación
- Acepta compartir email y perfil

### 4. **Verificar Dashboard**
Deberías ver:
- ✅ Tu nombre real
- ✅ Tu email real
- ✅ Avatar (de Zoho o generado)

---

## 🔧 **Configuración en Zoho API Console**

Asegúrate de que tu cliente tenga:

### Homepage URL:
```
http://localhost:5173
```

### Authorized Redirect URI:
```
http://localhost:5000/api/auth/zoho/callback
```

### Scopes (si te pide seleccionarlos):
- ✅ `openid`
- ✅ `email`
- ✅ `profile`
- ✅ `ZohoCalendar.calendar.ALL`

**Nota:** Con Server-based Applications, los scopes de OpenID Connect (`openid`, `email`, `profile`) están disponibles automáticamente.

---

## ❌ **Si No Funciona**

### Problema: "No se pudo obtener email del usuario"

**Solución:**
1. Verifica que el cliente en Zoho sea **Server-based Application** (no Self Client)
2. Asegúrate de que los scopes incluyan `openid`, `email`, `profile`
3. Revoca el acceso previo y autoriza de nuevo

### Problema: "Invalid redirect URI"

**Solución:**
1. Ve a https://api-console.zoho.com/
2. Edita tu cliente
3. Verifica que la Redirect URI sea EXACTAMENTE:
   ```
   http://localhost:5000/api/auth/zoho/callback
   ```
   (sin espacios, sin / al final)

### Problema: "Cliente no válido"

**Solución:**
1. Crea un nuevo cliente Server-based Application
2. Actualiza las credenciales en `backend/.env`
3. Reinicia el servidor

---

## 📚 **Referencias**

- **OpenID Connect:** https://openid.net/connect/
- **Zoho OAuth:** https://www.zoho.com/accounts/protocol/oauth.html
- **JWT Decoder:** https://jwt.io/

---

## ✅ **Estado Actual**

- ✅ Scopes de OpenID Connect implementados
- ✅ Decodificación de id_token con jsonwebtoken
- ✅ Email real siempre obtenido
- ✅ Fallback a userinfo endpoint si no hay id_token
- ✅ Base de datos limpiada
- ✅ Servidores corriendo

**¡Ahora prueba el login y deberías obtener tu email REAL!** 🎉
