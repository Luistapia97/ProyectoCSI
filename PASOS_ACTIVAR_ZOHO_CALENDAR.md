# 🚀 Pasos para Activar Zoho Calendar

## ✅ Estado Actual de los Servidores

 ✅ **Backend**: http://localhost:5000  Corriendo con correcciones aplicadas
 ✅ **Frontend**: http://localhost:5173  Corriendo

## 📋 Pasos a Seguir (EN ORDEN)

### 1️⃣ Cerrar Sesión Actual

1. Abre http://localhost:5173
2. Si ya estás logueado, haz clic en tu avatar/menú
3. Selecciona **"Cerrar Sesión"** o borra el localStorage:
    Presiona F12 (Developer Tools)
    Ve a la pestaña "Console"
    Escribe: `localStorage.clear()` y presiona Enter
    Recarga la página (F5)

### 2️⃣ Iniciar Sesión con Zoho

1. Verás la página de login
2. Haz clic en el botón **"Continuar con Zoho"** (no uses email/contraseña)
3. Serás redirigido a la página de autorización de Zoho
4. **IMPORTANTE**: Autoriza la aplicación, acepta los permisos solicitados:
    ✅ OpenID
    ✅ Email
    ✅ Profile
    ✅ ZohoCalendar.calendar.ALL (permiso de calendario)

### 3️⃣ Verificación

Después de iniciar sesión, verifica que todo funciona:

1. **En la consola del backend** deberías ver:
   ```
   ✅ OAuth callback recibido de Zoho
   🔑 Access Token: Sí
   🔄 Refresh Token: Sí    ← ¡ESTO ES IMPORTANTE!
   ```

2. **En el frontend**:
    Deberías estar en el dashboard
    Tu email de Zoho debería aparecer en el perfil

### 4️⃣ Probar Sincronización de Calendar

#### Opción A: Crear Nueva Tarea (Si eres Admin)

1. Ve a un proyecto
2. Crea una nueva tarea:
    ✅ Dale un título: "Prueba Zoho Calendar"
    ✅ Agrégale descripción
    ✅ **IMPORTANTE**: Establece una fecha de vencimiento (ej: mañana)
    ✅ Asígnate a ti mismo
    ✅ Guarda la tarea

3. **Verifica en la consola del backend**:
   ```
   📅 Iniciando sincronización con Zoho Calendar
   📅 Creando evento en Zoho Calendar para: [tu email]
   ✅ Evento de calendario creado para [tu email]
   ```

4. **Ve a tu Zoho Calendar**:
    Abre https://calendar.zoho.com
    Busca el evento "📋 Prueba Zoho Calendar"
    ¡Debería estar ahí!

#### Opción B: Verificar el Botón de Calendar

1. Abre cualquier tarea existente
2. Busca la sección "Zoho Calendar"
3. Deberías ver:
   ```
   ✓ Zoho Calendar conectado
   [📅 Sincronizar Tarea]
   ```

4. Si dice "No conectado", significa que hay un problema con los tokens

## 🐛 Solución de Problemas

### ❌ Problema: No aparece "Refresh Token: Sí" en los logs

**Causa**: Zoho no está enviando el refresh token

**Solución**:
1. Ve a https://apiconsole.zoho.com/
2. Selecciona tu aplicación: "Proyecto Nexus"
3. Verifica que el tipo sea "Serverbased Application"
4. Asegúrate que los scopes incluyan:
    `ZohoCalendar.calendar.ALL`
    `openid`
    `email`
    `profile`

### ❌ Problema: "Invalid OAuth token"

**Causa**: El token guardado ya expiró

**Solución**:
 Vuelve a hacer el proceso de login con Zoho (pasos 13)

### ❌ Problema: El botón sigue diciendo "No conectado"

**Causa**: No se guardaron los tokens correctamente

**Verificación**:
```javascript
// En la consola del navegador (F12)
const token = localStorage.getItem('token');
console.log('Token guardado:', !!token);

// Luego verifica en el backend con el script:
cd backend
node scripts/checkusers.js
```

Deberías ver:
```
1. [Tu nombre] ([tu email])
   Auth Provider: zoho    ← Debe decir "zoho"
   Zoho Access Token: ✅ Sí
   Zoho Refresh Token: ✅ Sí    ← ¡IMPORTANTE!
```

### ❌ Problema: La tarea no se sincroniza automáticamente

**Verificación**:
1. ¿La tarea tiene fecha de vencimiento? (requerido)
2. ¿Estás asignado a la tarea? (requerido)
3. ¿Tienes Zoho conectado? (requerido)

**Logs esperados en el backend**:
```
📅 Iniciando sincronización con Zoho Calendar
📅 Creando evento en Zoho Calendar para: [email]
📅 Calendar UID obtenido: [uid]
✅ Evento de calendario creado para [email]
```

## 📊 Verificación Final

Para verificar que TODO está funcionando:

```bash
# 1. Verifica usuario en la base de datos
cd backend
node scripts/checkusers.js

# Deberías ver:
# ✅ Zoho Access Token: Sí
# ✅ Zoho Refresh Token: Sí
# ✅ Auth Provider: zoho

# 2. Prueba la API directamente
node scripts/testcalendarsync.js

# Deberías ver:
# ✅ Evento creado exitosamente en Zoho Calendar!
# 🎉 Revisa tu calendario de Zoho para ver el evento!
```

## 🎉 ¡Éxito!

Si todo funciona correctamente, deberías:

1. ✅ Ver "Zoho Calendar conectado ✓" en las tareas
2. ✅ Las nuevas tareas aparecen automáticamente en tu calendario
3. ✅ Los cambios en las tareas actualizan el calendario
4. ✅ Al eliminar tareas, se eliminan del calendario

## 📝 Notas Importantes

 **Solo usuarios con Zoho conectado** reciben eventos en su calendar
 **Solo tareas con fecha de vencimiento** generan eventos
 **La sincronización es automática**  no necesitas hacer nada manual
 **Cada usuario asignado** obtiene su propio evento privado
 **Los refresh tokens** permiten renovar los access tokens cuando expiran



**¡Listo para probar!** Sigue los pasos 14 y deberías ver tus tareas en Zoho Calendar 🎊

