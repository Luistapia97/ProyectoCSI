# 📅 Guía de Configuración: Zoho OAuth y Calendar

Esta guía te ayudará a integrar **autenticación de usuarios con Zoho** y **sincronización con Zoho Calendar** en Nexus.

---

## 📋 Requisitos Previos

1. **Cuenta de Zoho**: Necesitas una cuenta en [Zoho](https://www.zoho.com)
2. **Zoho Calendar activado**: Asegúrate de tener acceso a Zoho Calendar

---

## 🔧 Paso 1: Crear Aplicación en Zoho API Console

### 1.1 Acceder a Zoho API Console

1. Ve a [Zoho API Console](https://api-console.zoho.com/)
2. Inicia sesión con tu cuenta de Zoho
3. Haz clic en **"Add Client"** (Agregar Cliente)

### 1.2 Configurar el Cliente

1. **Client Type**: Selecciona **"Server-based Applications"**
2. **Client Name**: `Nexus - Gestión de Proyectos`
3. **Homepage URL**: `http://localhost:5173`
4. **Authorized Redirect URIs**: 
   ```
   http://localhost:5000/api/auth/zoho/callback
   ```
5. Haz clic en **"Create"**

### 1.3 Obtener Credenciales

Después de crear el cliente, verás:
- **Client ID**: Una cadena larga de caracteres (ejemplo: `1000.XXXXXXXXXXXXXXXXXXXXXXXXXX`)
- **Client Secret**: Otra cadena de caracteres

⚠️ **¡Guarda estas credenciales de forma segura!**

---

## 🔑 Paso 2: Configurar Scopes (Permisos)

En la configuración de tu aplicación en Zoho API Console:

1. Ve a la sección **"Scope"**
2. Busca y agrega los siguientes scopes:

   **Para Autenticación de Usuarios:**
   ```
   profile.userinfo.READ
   ```

   **Para Zoho Calendar:**
   ```
   ZohoCalendar.calendar.ALL
   ZohoCalendar.event.ALL
   ```

   O de forma más granular:
   ```
   ZohoCalendar.calendar.CREATE
   ZohoCalendar.calendar.READ
   ZohoCalendar.calendar.UPDATE
   ZohoCalendar.calendar.DELETE
   ZohoCalendar.event.CREATE
   ZohoCalendar.event.READ
   ZohoCalendar.event.UPDATE
   ZohoCalendar.event.DELETE
   ```

3. Guarda los cambios
   ZohoCalendar.calendar.READ
   ZohoCalendar.calendar.UPDATE
   ZohoCalendar.calendar.DELETE
   ZohoCalendar.event.CREATE
   ZohoCalendar.event.READ
   ZohoCalendar.event.UPDATE
   ZohoCalendar.event.DELETE
   ```
3. Guarda los cambios

---

## ⚙️ Paso 3: Configurar Variables de Entorno

### 3.1 Editar archivo .env del backend

Abre el archivo `backend/.env` y agrega tus credenciales de Zoho:

```bash
# Zoho OAuth and Calendar Integration
ZOHO_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXXXXXXXX
ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_REDIRECT_URI=http://localhost:5000/api/auth/zoho/callback
```

**Reemplaza** los valores con tus credenciales reales de Zoho API Console.

### 3.2 Reiniciar el servidor

Después de guardar el archivo `.env`:

```bash
cd backend
npm start
```

El servidor debe mostrar: **"✅ Zoho OAuth Strategy configurada correctamente"**

---

## � Paso 4: Usar la Autenticación con Zoho

### 4.1 Iniciar Sesión con Zoho

1. Ve a la página de login: `http://localhost:5173/login`
2. Haz clic en el botón **"Continuar con Zoho"** (naranja)
3. Serás redirigido a Zoho para autorizar la aplicación
4. Después de autorizar, serás redirigido de vuelta a Nexus
5. Tu cuenta será creada automáticamente con acceso a Zoho Calendar

### 4.2 Registro con Zoho

1. Ve a la página de registro: `http://localhost:5173/register`
2. Haz clic en el botón **"Continuar con Zoho"**
3. Sigue el mismo proceso de autorización
4. Tu cuenta será creada con información de tu perfil de Zoho

---

## 📅 Paso 5: Sincronizar Tareas con Zoho Calendar

Una vez que inicies sesión con Zoho:

1. Ve a cualquier tablero (Board)
2. Abre los detalles de una tarjeta
3. Asigna fechas de inicio y fin
4. Haz clic en el botón **"Sincronizar con Zoho Calendar"** (naranja)
5. El evento será creado automáticamente en tu Zoho Calendar

### 5.1 Funciones de Sincronización

- ✅ **Crear eventos**: Al hacer clic en "Sincronizar con Zoho Calendar"
- ✅ **Actualizar eventos**: Los cambios en fechas se sincronizan automáticamente
- ✅ **Eliminar eventos**: Al desvincular o eliminar la tarjeta

---

## 🔐 Paso 6 (Opcional): Generar Token Manual

Si necesitas generar un token de acceso manualmente (para desarrollo/testing):

### 6.1 Generar Authorization Code

1. Crea una URL de autorización reemplazando `YOUR_CLIENT_ID`:

```
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCalendar.calendar.ALL,ZohoCalendar.event.ALL,profile.userinfo.READ&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=http://localhost:5000/api/auth/zoho/callback
```

2. Abre esta URL en tu navegador
3. Inicia sesión en Zoho y autoriza la aplicación
4. Serás redirigido a una URL con un `code` en los parámetros
   ```
   http://localhost:5000/api/auth/zoho/callback?code=XXXXXX...
   ```
5. **Copia ese código** (lo usarás en el siguiente paso)

### 4.2 Intercambiar Code por Tokens

Usa este comando cURL (reemplaza los valores):

```bash
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "code=YOUR_AUTHORIZATION_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=http://localhost:5000/api/auth/zoho/callback" \
  -d "grant_type=authorization_code"
```

Recibirás una respuesta JSON con:
```json
{
  "access_token": "1000.xxxx...",
  "refresh_token": "1000.yyyy...",
  "expires_in": 3600
}
```

**Guarda el `refresh_token`**, lo necesitarás para configurar usuarios.

---

## 👤 Paso 5: Configurar Usuario en la Base de Datos

Para cada usuario que quiera usar Zoho Calendar, necesitas agregar sus tokens a la base de datos.

### Opción A: Usando MongoDB Compass o CLI

```javascript
db.users.updateOne(
  { email: "usuario@example.com" },
  { 
    $set: {
      zohoAccessToken: "1000.xxxx...",
      zohoRefreshToken: "1000.yyyy...",
      zohoId: "ID_DEL_USUARIO_ZOHO"
    }
  }
)
```

### Opción B: Crear Ruta de Autenticación (Recomendado)

Puedes crear una ruta en el backend para manejar el flujo OAuth completo. 

*(Próximamente se implementará en el sistema)*

---

## ✅ Paso 6: Probar la Integración

### 6.1 Reiniciar el Servidor

```bash
cd backend
npm run dev
```

### 6.2 Verificar Conexión

1. Abre Nexus en tu navegador: `http://localhost:5173`
2. Inicia sesión con un usuario que tenga Zoho configurado
3. Abre cualquier tarea con fecha límite
4. Deberías ver el botón **"Sincronizar con Zoho"**

### 6.3 Sincronizar una Tarea

1. Haz clic en **"Sincronizar con Zoho"**
2. La tarea debería aparecer en tu Zoho Calendar
3. Ve a [Zoho Calendar](https://calendar.zoho.com) y verifica

---

## 🧪 API de Zoho Calendar

### Endpoints Utilizados

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/events` | POST | Crear evento |
| `/events/{id}` | PUT | Actualizar evento |
| `/events/{id}` | DELETE | Eliminar evento |
| `/events` | GET | Listar eventos |
| `/calendars` | GET | Listar calendarios |

### Formato de Fechas

Zoho Calendar usa timestamps en **milisegundos**:
```javascript
const timestamp = new Date('2025-11-03T09:00:00').getTime();
// 1730635200000
```

---

## 🛑 Troubleshooting

### Error: "Invalid OAuth token"

**Solución**: El `access_token` expiró. El sistema automáticamente usará el `refresh_token` para obtener uno nuevo.

### Error: "Scope not authorized"

**Solución**: Verifica que agregaste todos los scopes necesarios en Zoho API Console.

### Error: "Usuario no tiene cuenta de Zoho vinculada"

**Solución**: Asegúrate de haber guardado los tokens (`zohoAccessToken` y `zohoRefreshToken`) en el usuario en la base de datos.

### Evento no aparece en Zoho Calendar

**Solución**:
1. Verifica que la tarea tenga una fecha límite
2. Revisa los logs del backend para errores
3. Verifica que el `refresh_token` sea válido

---

## 🔐 Seguridad

### Tokens

- **Access Token**: Expira cada hora
- **Refresh Token**: No expira (úsalo para obtener nuevos access tokens)
- **Almacenamiento**: Los tokens se guardan encriptados en MongoDB

### Mejores Prácticas

1. **Nunca** compartas tus `Client Secret` o tokens
2. **No** subas el archivo `.env` a Git
3. Usa **HTTPS** en producción
4. Regenera tokens si sospechas que fueron comprometidos

---

## 📊 Diferencias con Google Calendar

| Característica | Google Calendar | Zoho Calendar |
|----------------|-----------------|---------------|
| Formato de Fecha | ISO 8601 | Timestamp (ms) |
| Autenticación | OAuth 2.0 | OAuth 2.0 |
| Colores | IDs numéricos | Nombres de colores |
| Recordatorios | Array de objetos | Array simple |
| API Docs | [Google](https://developers.google.com/calendar) | [Zoho](https://www.zoho.com/calendar/help/api/) |

---

## 🎯 Próximos Pasos

Una vez configurado:

1. ✅ Sincroniza tareas con fechas límite
2. ✅ Las tareas aparecerán en Zoho Calendar automáticamente
3. ✅ Actualiza la fecha en Nexus → se actualiza en Zoho
4. ✅ Elimina la sincronización cuando lo desees

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs del backend: `backend/logs`
2. Verifica la consola del navegador (F12)
3. Consulta la [documentación oficial de Zoho API](https://www.zoho.com/calendar/help/api/)

---

## 🔗 Enlaces Útiles

- [Zoho API Console](https://api-console.zoho.com/)
- [Zoho Calendar API Docs](https://www.zoho.com/calendar/help/api/)
- [Zoho OAuth 2.0 Guide](https://www.zoho.com/accounts/protocol/oauth.html)
- [Zoho Developer Portal](https://www.zoho.com/developer/)

---

**¡Listo! Ahora puedes sincronizar tus tareas de Nexus con Zoho Calendar automáticamente.** 🎉
