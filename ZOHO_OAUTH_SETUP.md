# 🔐 Guía de Configuración: Autenticación con Zoho OAuth

Esta guía te ayudará a configurar la **autenticación de usuarios con Zoho** en Nexus.

---

## ✅ Resumen de Implementación

Nexus ahora soporta **autenticación con Zoho OAuth**, permitiendo a los usuarios:

1. ✅ **Iniciar sesión con su cuenta de Zoho**
2. ✅ **Registrarse usando Zoho** (sin necesidad de crear contraseña)
3. ✅ **Acceso automático a Zoho Calendar** (sincronización integrada)
4. ✅ **Experiencia unificada** (un solo proveedor para auth + calendar)

---

## 🏗️ Arquitectura Implementada

### Backend (Completado ✅)

- **Passport.js Strategy**: Configurada con `passport-oauth2`
- **Endpoints OAuth**:
  - `GET /api/auth/zoho` - Inicia el flujo OAuth
  - `GET /api/auth/zoho/callback` - Maneja el callback de Zoho
- **User Model**: Campos `zohoId`, `zohoAccessToken`, `zohoRefreshToken`
- **Zoho Calendar API**: Integración completa con tokens automáticos

### Frontend (Completado ✅)

- **Botones de Zoho**: Agregados en Login y Register
- **Estilo personalizado**: Tema naranja (#FF6B00) de Zoho
- **Flujo OAuth**: Redirección automática al backend

---

## 📋 Pasos de Configuración

### Paso 1: Crear Aplicación en Zoho API Console

1. Ve a [Zoho API Console](https://api-console.zoho.com/)
2. Inicia sesión con tu cuenta de Zoho
3. Haz clic en **"Add Client"**
4. Selecciona **"Server-based Applications"**
5. Completa la información:
   - **Client Name**: `Nexus - Gestión de Proyectos`
   - **Homepage URL**: `http://localhost:5173`
   - **Authorized Redirect URIs**: 
     ```
     http://localhost:5000/api/auth/zoho/callback
     ```
6. Haz clic en **"Create"**

### Paso 2: Configurar Scopes

En la configuración de tu aplicación, agrega estos scopes:

```
profile.userinfo.READ
ZohoCalendar.calendar.ALL
ZohoCalendar.event.ALL
```

### Paso 3: Obtener Credenciales

Después de crear el cliente, copia:
- **Client ID**: `1000.XXXXXXXXXXXXXXXXXXXXXXXXXX`
- **Client Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Paso 4: Configurar Variables de Entorno

Edita `backend/.env` y agrega:

```bash
# Zoho OAuth and Calendar Integration
ZOHO_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXXXXXXXX
ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_REDIRECT_URI=http://localhost:5000/api/auth/zoho/callback
```

**Reemplaza** con tus credenciales reales.

### Paso 5: Reiniciar el Servidor

```powershell
cd backend
npm start
```

Deberías ver:
```
✅ Zoho OAuth Strategy configurada correctamente
```

---

## 🚀 Cómo Usar

### Para Usuarios

1. Ve a `http://localhost:5173/login`
2. Haz clic en **"Continuar con Zoho"** (botón naranja)
3. Autoriza en Zoho
4. Serás redirigido automáticamente a tu Dashboard

### Para Desarrolladores

El flujo OAuth completo:

```
Usuario → Click en "Continuar con Zoho"
   ↓
Backend → Redirect a Zoho OAuth
   ↓
Zoho → Usuario autoriza
   ↓
Backend → Recibe callback con código
   ↓
Backend → Intercambia código por tokens
   ↓
Backend → Obtiene info del usuario de Zoho
   ↓
Backend → Crea/actualiza usuario en MongoDB
   ↓
Backend → Genera JWT token
   ↓
Frontend → Recibe token y carga usuario
   ↓
Dashboard → Usuario autenticado ✅
```

---

## 🔑 Información Almacenada

Para cada usuario autenticado con Zoho, se guarda:

```javascript
{
  zohoId: "12345678",           // ID único de Zoho
  email: "usuario@zoho.com",    // Email del usuario
  name: "Nombre Usuario",       // Nombre completo
  authProvider: "zoho",         // Proveedor de auth
  zohoAccessToken: "...",       // Token de acceso (encriptado)
  zohoRefreshToken: "...",      // Token de refresh (encriptado)
}
```

Los tokens se usan automáticamente para:
- ✅ Sincronizar tareas con Zoho Calendar
- ✅ Crear eventos en Zoho Calendar
- ✅ Actualizar eventos existentes
- ✅ Eliminar eventos vinculados

---

## 🔒 Seguridad

- ✅ **Tokens encriptados**: Los access/refresh tokens se almacenan de forma segura
- ✅ **HTTPS recomendado**: Para producción, usa HTTPS
- ✅ **Scopes limitados**: Solo permisos necesarios (perfil + calendar)
- ✅ **JWT tokens**: Autenticación stateless con expiración
- ✅ **No passwords**: Los usuarios de Zoho no necesitan contraseña en Nexus

---

## 🐛 Troubleshooting

### Error: "Zoho OAuth not configured"

**Solución**: Verifica que `ZOHO_CLIENT_ID` y `ZOHO_CLIENT_SECRET` estén en `.env`

### Error: "Redirect URI mismatch"

**Solución**: Verifica que la URI en Zoho API Console sea exactamente:
```
http://localhost:5000/api/auth/zoho/callback
```

### Error: "Invalid scope"

**Solución**: Asegúrate de agregar estos scopes en Zoho API Console:
- `profile.userinfo.READ`
- `ZohoCalendar.calendar.ALL`
- `ZohoCalendar.event.ALL`

### No se crea el usuario

**Solución**: Revisa los logs del backend. Debería mostrar:
```
📧 Intentando obtener información del usuario de Zoho...
✅ Usuario encontrado en Zoho: [email]
```

---

## 📊 Ventajas de Zoho OAuth

### Vs Google OAuth

| Característica | Google | Zoho |
|---------------|---------|------|
| **Calendar integrado** | ❌ APIs separadas | ✅ Todo en uno |
| **Tokens unificados** | ❌ Múltiples tokens | ✅ Un solo token |
| **Configuración** | ❌ Compleja | ✅ Simple |
| **Costo** | ❌ Límites estrictos | ✅ Generoso |

### Vs Registro Local

| Característica | Local | Zoho |
|---------------|-------|------|
| **Seguridad passwords** | ❌ Riesgo | ✅ Sin passwords |
| **Verificación email** | ❌ Manual | ✅ Automática |
| **Recuperación password** | ❌ Complejo | ✅ No necesario |
| **Calendar sync** | ❌ Separado | ✅ Integrado |

---

## 🌐 Producción

Para desplegar en producción:

1. **Actualiza las URLs en Zoho API Console**:
   ```
   Homepage URL: https://tu-dominio.com
   Redirect URI: https://tu-dominio.com/api/auth/zoho/callback
   ```

2. **Actualiza el .env**:
   ```bash
   ZOHO_REDIRECT_URI=https://tu-dominio.com/api/auth/zoho/callback
   FRONTEND_URL=https://tu-dominio.com
   ```

3. **Usa HTTPS**: Obligatorio para OAuth en producción

---

## 📚 Recursos

- [Zoho API Console](https://api-console.zoho.com/)
- [Zoho OAuth Documentation](https://www.zoho.com/accounts/protocol/oauth.html)
- [Zoho Calendar API](https://www.zoho.com/calendar/help/api/)

---

## ✨ Próximos Pasos

Después de configurar Zoho OAuth:

1. ✅ Prueba el login con Zoho
2. ✅ Crea una tarea y sincronízala con Zoho Calendar
3. ✅ Verifica que los eventos aparezcan en tu Zoho Calendar
4. ✅ Prueba actualizar/eliminar eventos

---

**¿Necesitas ayuda?** Revisa el archivo `ZOHO_CALENDAR_SETUP.md` para más detalles sobre la integración con Zoho Calendar.
