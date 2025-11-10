# 🔐 Guía de Inicio de Sesión con Zoho OAuth

## 📋 Implementación Basada en Documentación Oficial de Zoho

Esta implementación sigue la documentación oficial de Zoho Assist OAuth 2.0 y es compatible con todas las API de Zoho.

---

## 🎯 Flujo de Autenticación

### 1. **Registro de la Aplicación**
La aplicación ya está registrada en Zoho con las siguientes credenciales:

- **Client ID:** `1000.PV5VLITLAS39ZUV6L26PDH87BFTQQK`
- **Client Secret:** `d3b5b398b36b34f61700a407c36bc020d4b49b8361`
- **Redirect URI:** `http://localhost:5000/api/auth/zoho/callback`

### 2. **Scopes Configurados**

Según la documentación de Zoho, estos son los scopes utilizados:

```javascript
scope: [
  'ZohoAssist.userapi.READ',      // Saber quién es el usuario
  'ZohoCalendar.calendar.ALL'     // Acceso completo al calendario
]
```

#### Scopes Disponibles en Zoho:

| Scope | Operaciones | Descripción |
|-------|------------|-------------|
| `ZohoAssist.userapi.READ` | READ | Obtener información del usuario |
| `ZohoAssist.sessionapi.CREATE` | CREATE | Crear sesiones de soporte remoto |
| `ZohoAssist.unattended.computer.READ` | READ | Ver computadoras desatendidas |
| `ZohoCalendar.calendar.ALL` | ALL | Gestión completa del calendario |
| `ZohoCalendar.event.ALL` | ALL | Gestión completa de eventos |

---

## 🚀 Cómo Usar el Inicio de Sesión con Zoho

### Paso 1: Acceder a la Página de Login
```
http://localhost:5173/login
```

### Paso 2: Click en "Continuar con Zoho"
- El usuario será redirigido a: `https://accounts.zoho.com/oauth/v2/auth`
- Se solicitará autorización para los scopes configurados

### Paso 3: Autorización en Zoho
El usuario debe:
1. Iniciar sesión con su cuenta de Zoho
2. Autorizar el acceso de la aplicación
3. Será redirigido automáticamente a Nexus

### Paso 4: Callback y Creación de Cuenta
El sistema automáticamente:
- Recibe el `access_token` y `refresh_token`
- Intenta obtener el email del usuario desde Zoho Assist API
- Si no está disponible, intenta Zoho Accounts API
- Si ninguno funciona, genera un email temporal

---

## 🔄 APIs Utilizadas para Obtener Información del Usuario

### 1. **Zoho Assist User API** (Método Principal)

**Endpoint:**
```
GET {api_domain}/assist/v2/user
```

**Headers:**
```javascript
{
  'Authorization': 'Zoho-oauthtoken {access_token}',
  'Content-Type': 'application/json'
}
```

**Respuesta Esperada:**
```json
{
  "email": "usuario@ejemplo.com",
  "zsoid": "123456789",
  "name": "Juan Pérez",
  "display_name": "Juan",
  "organization": "Mi Empresa"
}
```

### 2. **Zoho Accounts API** (Fallback)

**Endpoint:**
```
GET https://accounts.zoho.com/oauth/user/info
```

**Headers:**
```javascript
{
  'Authorization': 'Bearer {access_token}'
}
```

**Respuesta Esperada:**
```json
{
  "Email": "usuario@ejemplo.com",
  "ZUID": "123456789",
  "Display_Name": "Juan Pérez",
  "First_Name": "Juan",
  "Last_Name": "Pérez"
}
```

### 3. **Email Temporal** (Última Opción)

Si ninguna API funciona, se genera un email temporal:
```
zoho_{últimos_8_caracteres_del_token}@temp.nexus.local
```

---

## 📡 Proceso de Obtención de Access Token

Según la documentación oficial de Zoho:

### 1. **Autorización (Authorization Grant)**

**URL:**
```
https://accounts.zoho.com/oauth/v2/auth
```

**Parámetros:**
```javascript
{
  scope: 'ZohoAssist.userapi.READ ZohoCalendar.calendar.ALL',
  client_id: '{ZOHO_CLIENT_ID}',
  state: '{random_string}',
  response_type: 'code',
  redirect_uri: 'http://localhost:5000/api/auth/zoho/callback',
  access_type: 'offline',  // Para obtener refresh token
  prompt: 'consent'        // Forzar pantalla de consentimiento
}
```

### 2. **Intercambio de Código por Token**

Después de la autorización, Zoho redirige con un `code`:
```
http://localhost:5000/api/auth/zoho/callback?code=1000.xxxxx&state=xxxxx
```

El backend automáticamente intercambia el código por tokens haciendo:

**URL:**
```
POST https://accounts.zoho.com/oauth/v2/token
```

**Body:**
```javascript
{
  code: '{authorization_code}',
  client_id: '{ZOHO_CLIENT_ID}',
  client_secret: '{ZOHO_CLIENT_SECRET}',
  redirect_uri: 'http://localhost:5000/api/auth/zoho/callback',
  grant_type: 'authorization_code'
}
```

**Respuesta:**
```json
{
  "access_token": "1000.xxxxx",
  "refresh_token": "1000.yyyyy",
  "expires_in": 3600,
  "api_domain": "https://www.zohoapis.com",
  "token_type": "Bearer"
}
```

---

## 🔑 Gestión de Tokens

### Access Token
- **Duración:** 1 hora (3600 segundos)
- **Uso:** Llamadas a las APIs de Zoho
- **Formato:** `1000.xxxxxxxxxxxxxx`

### Refresh Token
- **Duración:** Permanente (hasta que se revoque)
- **Uso:** Obtener nuevos access tokens
- **Se obtiene solo con:** `access_type=offline` y `prompt=consent`

### Almacenamiento en BD

Campos en el modelo `User`:
```javascript
{
  zohoId: String,              // ID único de Zoho (ZUID o zsoid)
  zohoAccessToken: String,     // Token de acceso actual
  zohoRefreshToken: String,    // Token para renovar
  authProvider: 'zoho'         // Proveedor de autenticación
}
```

---

## 🧪 Testing del Flujo OAuth

### 1. **Verificar Configuración**
```bash
# En el backend, deberías ver:
🔑 Configurando Zoho OAuth
✅ Zoho OAuth Configurado
📋 Scopes: ZohoAssist.userapi.READ, ZohoCalendar.calendar.ALL
```

### 2. **Iniciar Sesión**
1. Ve a: `http://localhost:5173/login`
2. Click en "Continuar con Zoho"
3. Autoriza la aplicación en Zoho
4. Verifica la redirección exitosa

### 3. **Ver Logs del Backend**
```bash
# Deberías ver:
✅ OAuth Callback Recibido
🔑 Access Token: 1000.xxxxxxxx...
🔄 Refresh Token: Sí
📡 Intentando Zoho Assist User API...
✅ Respuesta Zoho Assist: {...}
📧 Email: usuario@ejemplo.com
🆔 User ID: 123456789
📝 Creando nuevo usuario / ✅ Usuario existente encontrado
```

---

## 🔧 Configuración de Zoho Client

Si necesitas crear un nuevo cliente o modificar el existente:

### 1. **Acceder a API Console**
```
https://api-console.zoho.com/
```

### 2. **Crear Client**
1. Click en "Add Client"
2. Selecciona:
   - **Server-based Applications** (para OAuth)
   - **Self Client** (para testing sin dominio público)

### 3. **Configurar Redirect URI**
```
http://localhost:5000/api/auth/zoho/callback
```

### 4. **Seleccionar Scopes**
- `ZohoAssist.userapi.READ`
- `ZohoCalendar.calendar.ALL`
- `ZohoCalendar.event.ALL`

### 5. **Obtener Credenciales**
- Copia el **Client ID**
- Copia el **Client Secret**
- Actualiza el archivo `.env`

---

## 🛡️ Seguridad

### State Parameter
- Se genera automáticamente con `passport-oauth2`
- Previene ataques CSRF
- Se valida en el callback

### HTTPS en Producción
Para producción, actualiza:
```env
ZOHO_REDIRECT_URI=https://tu-dominio.com/api/auth/zoho/callback
FRONTEND_URL=https://tu-dominio.com
```

### Revocación de Tokens
Los usuarios pueden revocar el acceso desde:
```
https://accounts.zoho.com/oauth/v2/token/revoke
```

---

## 🐛 Troubleshooting

### Error: "Cliente no válido"
**Solución:**
1. Verifica que `ZOHO_CLIENT_ID` y `ZOHO_CLIENT_SECRET` estén correctos
2. Asegúrate de que el Redirect URI coincida exactamente
3. Verifica que el cliente esté activo en Zoho API Console

### Error: "INVALID_OAUTHSCOPE"
**Solución:**
1. Verifica que los scopes estén habilitados para tu cliente en Zoho
2. Usa scopes válidos según la documentación
3. Para testing, usa un **Self Client** que tiene todos los scopes

### No se obtiene el email del usuario
**Solución:**
1. El sistema generará un email temporal automáticamente
2. El usuario puede completar su perfil después
3. O vincular la cuenta Zoho con una cuenta existente

### Refresh Token no se genera
**Solución:**
1. Asegúrate de tener `access_type: 'offline'`
2. Agrega `prompt: 'consent'` para forzar la pantalla de consentimiento
3. Revoca el acceso previo y vuelve a autorizar

---

## 📚 Referencias

- **Documentación Oficial de Zoho OAuth:** https://www.zoho.com/assist/api/v2/oauth.html
- **Zoho API Console:** https://api-console.zoho.com/
- **Zoho Assist API Docs:** https://www.zoho.com/assist/api/v2/
- **Zoho Calendar API Docs:** https://www.zoho.com/calendar/help/api/

---

## ✅ Estado Actual

- ✅ OAuth configurado con documentación oficial
- ✅ Scopes según Zoho Assist API
- ✅ Múltiples APIs para obtener información del usuario
- ✅ Fallback a email temporal si no se obtiene email
- ✅ Integración con calendario de Zoho lista
- ✅ Refresh token habilitado
- ✅ Botón de login habilitado en frontend

---

## 🎯 Próximos Pasos

1. **Probar el flujo OAuth completo**
2. **Verificar que se obtenga el email del usuario**
3. **Implementar refresh de tokens automático**
4. **Usar los tokens para sincronizar con Zoho Calendar**
5. **Agregar manejo de errores más robusto**

