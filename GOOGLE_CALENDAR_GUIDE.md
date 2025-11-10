# Guía de Integración de Google OAuth y Google Calendar

## 📋 Índice
1. [Configuración de Google Cloud](#configuración-de-google-cloud)
2. [Credenciales de OAuth](#credenciales-de-oauth)
3. [Funcionalidades](#funcionalidades)
4. [Uso](#uso)
5. [Solución de Problemas](#solución-de-problemas)

---

## 🔧 Configuración de Google Cloud

### Paso 1: Habilitar APIs necesarias

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Ve a **APIs & Services** → **Library**
4. Busca y habilita las siguientes APIs:
   - **Google+ API** (para obtener perfil del usuario)
   - **Google Calendar API** (para crear eventos)

### Paso 2: Configurar pantalla de consentimiento OAuth

1. Ve a **APIs & Services** → **OAuth consent screen**
2. Selecciona **External** (o Internal si es para tu organización)
3. Completa la información requerida:
   - **App name**: Proyecto Nexus
   - **User support email**: Tu email
   - **Developer contact information**: Tu email
4. En **Scopes**, agrega:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `../auth/calendar`
   - `../auth/calendar.events`
5. Guarda y continúa

### Paso 3: Crear credenciales OAuth 2.0

1. Ve a **APIs & Services** → **Credentials**
2. Clic en **Create Credentials** → **OAuth client ID**
3. Tipo de aplicación: **Web application**
4. Nombre: Proyecto Nexus Web Client
5. **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
7. Guarda y copia el **Client ID** y **Client Secret**

---

## 🔑 Credenciales de OAuth

### Credenciales actuales configuradas:

```env
GOOGLE_CLIENT_ID=25244012769-gflgs651ggkchnl02dse7fmmjuo42h2l.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

Estas credenciales ya están configuradas en el archivo `backend/.env`.

---

## ✨ Funcionalidades

### 1. Autenticación con Google

- Los usuarios pueden iniciar sesión usando su cuenta de Google
- Se crea automáticamente un perfil en la base de datos
- Se almacenan los tokens de acceso y refresh para usar con Calendar API

### 2. Sincronización con Google Calendar

Una vez autenticado, los usuarios pueden:

- **Sincronizar tareas**: Crear eventos en Google Calendar basados en tareas
- **Recordatorios automáticos**: 
  - 1 día antes del vencimiento
  - 2 horas antes del vencimiento
- **Colores por prioridad**:
  - 🔴 **Urgente**: Rojo
  - 🟠 **Alta**: Naranja
  - 🟡 **Media**: Amarillo
  - 🟢 **Baja**: Verde
- **Eliminar eventos**: Borrar eventos de Calendar cuando ya no son necesarios

### 3. Endpoints de API

#### Calendar Status
```http
GET /api/calendar/status
Authorization: Bearer {token}
```
Verifica si el usuario tiene Google Calendar conectado.

#### Sincronizar Tarea
```http
POST /api/calendar/sync-task/:taskId
Authorization: Bearer {token}
```
Crea un evento en Google Calendar para la tarea especificada.

#### Eliminar Sincronización
```http
DELETE /api/calendar/unsync-task/:taskId
Authorization: Bearer {token}
```
Elimina el evento de Google Calendar asociado a la tarea.

#### Próximos Eventos
```http
GET /api/calendar/upcoming
Authorization: Bearer {token}
```
Obtiene los próximos 20 eventos del calendario del usuario.

---

## 🚀 Uso

### Para Usuarios

#### 1. Iniciar sesión con Google

1. Ve a la página de login
2. Haz clic en **"Continuar con Google"**
3. Selecciona tu cuenta de Google
4. Acepta los permisos solicitados
5. Serás redirigido automáticamente al dashboard

#### 2. Sincronizar tarea con Calendar

1. Abre una tarea (debe tener fecha límite)
2. En el panel derecho, busca la sección **"Google Calendar"**
3. Si no has conectado tu cuenta:
   - Clic en **"Conectar con Google Calendar"**
   - Acepta los permisos
4. Una vez conectado:
   - Clic en **"📅 Sincronizar con Calendar"**
   - El evento se creará automáticamente
   - Recibirás recordatorios 1 día y 2 horas antes

#### 3. Eliminar de Calendar

1. Abre la tarea sincronizada
2. Clic en **"🗑️ Eliminar de Calendar"**
3. El evento se eliminará de Google Calendar

---

## 🔍 Solución de Problemas

### Error: "Google Calendar API has not been used"

**Solución**: 
1. Ve a Google Cloud Console
2. Habilita la **Google Calendar API** en la biblioteca de APIs
3. Espera 2-3 minutos para que se propague

### Error: "Invalid grant"

**Causas comunes**:
- Token de acceso expirado
- Token de refresh inválido
- Usuario revocó el acceso

**Solución**:
1. Desconecta la cuenta de Google en configuración
2. Vuelve a conectar dando permisos nuevamente

### Error: "redirect_uri_mismatch"

**Solución**:
1. Ve a Google Cloud Console → Credentials
2. Verifica que la URI de redirección sea exactamente:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
3. No debe haber espacios ni caracteres adicionales

### No aparece el botón de Google Calendar

**Verificar**:
1. La tarea debe tener una **fecha límite** configurada
2. El usuario debe estar autenticado
3. El backend debe estar corriendo en puerto 5000
4. Revisa la consola del navegador para ver errores

### Los recordatorios no llegan

**Configuración de Calendar**:
1. Ve a Google Calendar en tu navegador
2. Settings → Notifications
3. Verifica que las notificaciones estén habilitadas
4. Asegúrate de tener la app de Calendar en tu móvil

---

## 📊 Arquitectura Técnica

### Backend

```
backend/
├── config/
│   └── passport.js          # Configuración de Passport.js con GoogleStrategy
├── utils/
│   └── googleCalendar.js    # Servicio para interactuar con Calendar API
├── routes/
│   ├── auth.js              # Rutas de autenticación OAuth
│   └── calendar.js          # Rutas de Calendar API
└── models/
    ├── User.js              # Modelo con tokens de Google
    └── Task.js              # Modelo con IDs de eventos de Calendar
```

### Frontend

```
frontend/src/
├── components/
│   ├── GoogleCalendarButton.jsx    # Componente de sincronización
│   └── GoogleCalendarButton.css
├── pages/
│   ├── Login.jsx                    # Botón de Google OAuth
│   ├── AuthCallback.jsx             # Manejo del callback OAuth
│   └── AuthCallback.css
```

---

## 🔐 Seguridad

### Tokens almacenados

- **Access Token**: Se almacena en la base de datos (campo `googleAccessToken`)
- **Refresh Token**: Se almacena en la base de datos (campo `googleRefreshToken`)
- **JWT**: Se almacena en localStorage del navegador

### Permisos solicitados

- `profile`: Información básica del perfil
- `email`: Dirección de correo electrónico
- `calendar`: Lectura y escritura de eventos en Calendar
- `calendar.events`: Gestión de eventos

### Refresh automático

El sistema utiliza el **Refresh Token** para obtener nuevos Access Tokens automáticamente cuando expiran (cada 1 hora aproximadamente).

---

## 📝 Notas Importantes

1. **Zona horaria**: Los eventos se crean en zona horaria `America/Mexico_City`. Puedes cambiarla en `backend/utils/googleCalendar.js`.

2. **Producción**: Para producción, actualiza las URIs autorizadas en Google Cloud Console con tu dominio real.

3. **Límites de API**: Google Calendar API tiene límites de uso. Para proyectos grandes, considera implementar rate limiting.

4. **Privacidad**: Los usuarios pueden revocar el acceso en cualquier momento desde su cuenta de Google.

---

## ✅ Checklist de Implementación

- [x] Credenciales de OAuth configuradas
- [x] Passport.js implementado
- [x] Google Calendar API service creado
- [x] Rutas de autenticación OAuth
- [x] Rutas de Calendar API
- [x] Modelos actualizados (User y Task)
- [x] Componente GoogleCalendarButton
- [x] Página AuthCallback
- [x] Botón de Google en Login
- [ ] **Habilitar Google Calendar API en Cloud Console** ⚠️
- [ ] Probar flujo completo de OAuth
- [ ] Probar sincronización de tareas

---

## 🎯 Próximos Pasos

1. **Habilitar Google Calendar API** en Google Cloud Console
2. Reiniciar el servidor backend
3. Probar el flujo de autenticación completo
4. Crear una tarea con fecha límite
5. Sincronizar con Google Calendar
6. Verificar el evento en Google Calendar

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Revisa los logs del servidor backend
3. Verifica que todas las APIs estén habilitadas en Google Cloud
4. Asegúrate de que las URIs de redirección coincidan exactamente
