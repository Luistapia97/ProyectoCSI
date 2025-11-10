# 📋 Integración con Zoho Tasks (Zoho Mail Tasks)

## ✅ Implementación Completa

He integrado **Zoho Tasks** para que las tareas asignadas en Nexus se sincronicen automáticamente con el sistema de tareas de Zoho Mail.



## 🎯 Características Implementadas

### ✅ Sincronización Automática

**Al crear una tarea en Nexus:**
 ✅ Se crea automáticamente en Zoho Tasks de cada usuario asignado
 ✅ Incluye título, descripción, fecha límite y prioridad
 ✅ Marca de referencia: `[Nexus Task ID: xxx]`
 ✅ Visible en mail.zoho.com → Tasks

**Al actualizar una tarea:**
 ✅ Se actualiza en Zoho Tasks de todos los usuarios
 ✅ Sincroniza cambios de título, descripción, fecha y prioridad
 ✅ Marca como completada si se completa en Nexus

**Al eliminar una tarea:**
 ✅ Se elimina automáticamente de Zoho Tasks de todos los usuarios

**Al completar una tarea:**
 ✅ Se marca como completada en Zoho Tasks
 ✅ Porcentaje de completado: 100%



## 🔧 Componentes Creados

### 1. **ZohoTasksService** (`backend/services/zohoTasks.js`)

Servicio completo para gestionar tareas en Zoho:

```javascript
// Métodos disponibles:
 createTask()      // Crear tarea
 updateTask()      // Actualizar tarea
 deleteTask()      // Eliminar tarea
 completeTask()    // Marcar como completada
 getTasks()        // Obtener todas las tareas
```

**API Endpoint:**
```
POST   https://mail.zoho.com/api/accounts/{email}/tasks
PUT    https://mail.zoho.com/api/accounts/{email}/tasks/{taskId}
DELETE https://mail.zoho.com/api/accounts/{email}/tasks/{taskId}
GET    https://mail.zoho.com/api/accounts/{email}/tasks
```

### 2. **Middleware de Sincronización** (`backend/middleware/zohoTasksSync.js`)

Middleware automático que se ejecuta en cada operación:

```javascript
 syncTaskToZoho()      // Al crear tarea
 updateZohoTask()      // Al actualizar tarea
 deleteZohoTask()      // Al eliminar tarea
 completeZohoTask()    // Al completar tarea
```

### 3. **Modelo actualizado** (`backend/models/Task.js`)

Agregado campo para almacenar IDs de Zoho:

```javascript
zohoTaskIds: [{
  userId: ObjectId,        // Usuario de Zoho
  taskId: String,          // ID en Zoho Tasks
  syncedAt: Date          // Fecha de sincronización
}]
```

### 4. **Scopes de OAuth actualizados** (`backend/config/passport.js`)

```javascript
scopes: [
  'openid',
  'email',
  'profile',
  'ZohoMail.messages.CREATE',  // Enviar emails
  'ZohoMail.tasks.ALL'         // ← NUEVO: Gestionar tareas
]
```

### 5. **Rutas actualizadas** (`backend/routes/tasks.js`)

```javascript
// POST /api/tasks
// Crea tarea + sincroniza con Zoho Tasks

// PUT /api/tasks/:id  
// Actualiza tarea + actualiza en Zoho Tasks

// DELETE /api/tasks/:id
// Archiva tarea + elimina de Zoho Tasks
```



## 📊 Flujo de Sincronización

### Crear Tarea

```
Usuario crea tarea en Nexus
         ↓
Tarea se guarda en MongoDB
         ↓
Middleware detecta usuarios asignados
         ↓
Para cada usuario con cuenta Zoho:
   Crear tarea en Zoho Tasks
   Guardar Zoho Task ID en MongoDB
         ↓
Usuario ve la tarea en:
  ✅ Nexus (web)
  ✅ Zoho Mail → Tasks
  ✅ App móvil de Zoho Mail
```

### Actualizar Tarea

```
Usuario actualiza tarea en Nexus
         ↓
Cambios se guardan en MongoDB
         ↓
Middleware detecta cambios
         ↓
Para cada Zoho Task ID almacenado:
   Actualizar tarea en Zoho Tasks
         ↓
Cambios se reflejan en:
  ✅ Nexus
  ✅ Zoho Tasks
```

### Completar Tarea

```
Usuario marca tarea como completada
         ↓
Estado se actualiza en MongoDB
         ↓
Middleware detecta cambio de estado
         ↓
Actualiza tarea en Zoho (completed: true)
Marca como completada en Zoho (100%)
         ↓
✅ Tarea completada en ambos sistemas
```

### Eliminar Tarea

```
Usuario elimina tarea en Nexus
         ↓
Tarea se archiva en MongoDB
         ↓
Middleware obtiene Zoho Task IDs
         ↓
Elimina tarea de Zoho Tasks de cada usuario
         ↓
❌ Tarea eliminada de ambos sistemas
```



## 🔐 Requisitos de OAuth

### Scope Necesario

```javascript
'ZohoMail.tasks.ALL'
```

**Permisos que otorga:**
 Crear tareas
 Leer tareas
 Actualizar tareas
 Eliminar tareas
 Marcar como completada/incompleta

### Reautenticación Necesaria

⚠️ **IMPORTANTE**: Los usuarios existentes deben **volver a iniciar sesión con Zoho** para obtener el nuevo scope.

**Pasos:**
1. Cerrar sesión en Nexus
2. Clic en "Continuar con Zoho"
3. Zoho pedirá autorización para "Gestionar tareas"
4. Aceptar permisos
5. Ya puedes sincronizar tareas ✅



## 📱 Dónde Ver las Tareas Sincronizadas

### En Zoho Mail Web

1. Ve a https://mail.zoho.com
2. En el menú izquierdo, clic en "Tasks" (📋)
3. Verás todas las tareas sincronizadas desde Nexus
4. Identificadas con el ícono 📋 al inicio del título

### En App Móvil de Zoho Mail

1. Abre la app de Zoho Mail (iOS/Android)
2. Menú → Tasks
3. Todas las tareas sincronizadas aparecen aquí
4. Notificaciones push cuando se crea/actualiza

### En Zoho Projects (Si lo usas)

Las tareas de Zoho Mail Tasks también pueden integrarse con Zoho Projects si tienes ambos servicios conectados.



## 🧪 Cómo Probar

### Test 1: Crear Tarea

```javascript
1. Inicia sesión con Zoho (para obtener nuevo scope)
2. Crea un proyecto
3. Crea una tarea
4. Asígnala a ti mismo
5. Ve a mail.zoho.com → Tasks
6. ✅ Deberías ver la tarea ahí
```

**Logs esperados:**
```
📋 Iniciando sincronización con Zoho Tasks
   Tarea: Mi tarea de prueba
   Usuarios asignados: 1
📤 Sincronizando tarea con Zoho Tasks de info@proyectoscsi.mx...
📋 Creando tarea en Zoho Tasks...
   Título: 📋 Mi tarea de prueba
   Usuario: info@proyectoscsi.mx
✅ Tarea creada en Zoho Tasks
   Zoho Task ID: 123456789
✅ Tarea sincronizada con Zoho Tasks de info@proyectoscsi.mx
✅ IDs de Zoho Tasks guardados en la tarea
```

### Test 2: Actualizar Tarea

```javascript
1. Edita la tarea en Nexus
2. Cambia el título o fecha
3. Guarda cambios
4. Refresca Zoho Tasks
5. ✅ Cambios reflejados
```

### Test 3: Completar Tarea

```javascript
1. Marca tarea como completada en Nexus
2. Ve a Zoho Tasks
3. ✅ Tarea marcada como completada
```

### Test 4: Eliminar Tarea

```javascript
1. Elimina tarea en Nexus
2. Ve a Zoho Tasks
3. ✅ Tarea eliminada
```



## 🐛 Manejo de Errores

### Error: `URL_RULE_NOT_CONFIGURED`

**Causa:** El scope `ZohoMail.tasks.ALL` no está autorizado

**Solución:**
1. Cierra sesión
2. Vuelve a iniciar sesión con Zoho
3. Acepta el nuevo permiso de Tasks

### Error: Token expirado

**Causa:** El token de Zoho ha caducado

**Solución:**
1. Cierra sesión
2. Vuelve a iniciar sesión con Zoho
3. Nuevo token se generará

### Error: Usuario sin cuenta Zoho

**Causa:** Usuario no tiene cuenta de Zoho conectada

**Solución:**
 Las tareas se guardan normalmente en Nexus
 No se sincronizan con Zoho Tasks
 Usuario debe iniciar sesión con Zoho para activar sincronización



## 📊 Ventajas de Esta Integración

### ✅ Para Usuarios

 📱 **Acceso móvil**: Ve tareas en app de Zoho Mail
 🔔 **Notificaciones push**: Zoho Mail notifica nuevas tareas
 📅 **Vista de calendario**: Tareas con fecha aparecen en calendario
 ✔️ **Marcar completadas**: Desde Zoho o Nexus (sincronización bidireccional*)
 🔍 **Búsqueda**: Busca tareas en Zoho Mail
 📧 **Un solo lugar**: Email + Tareas en Zoho Mail

*Nota: Sincronización bidireccional (Zoho → Nexus) requiere webhooks

### ✅ Para Administradores

 🎯 **Gestión centralizada**: Crea tareas en Nexus, se sincronizan automáticamente
 📊 **Reportes**: Usa herramientas de Zoho para análisis
 🔐 **Seguridad**: OAuth seguro, tokens encriptados
 🔄 **Sincronización automática**: Sin intervención manual
 📝 **Logs detallados**: Tracking completo de sincronización



## 🚀 Mejoras Futuras (Opcional)

### Fase 1: Sincronización Bidireccional

Implementar webhooks para que cambios en Zoho Tasks se reflejen en Nexus:

```javascript
// Zoho Tasks → Nexus
// Webhook endpoint: POST /api/webhooks/zohotasks
// Actualizar tarea en Nexus cuando cambia en Zoho
```

### Fase 2: Subtareas

Sincronizar subtareas de Nexus como checklist en Zoho:

```javascript
// Subtareas de Nexus → Checklist de Zoho Tasks
```

### Fase 3: Comentarios

Sincronizar comentarios entre ambos sistemas:

```javascript
// Comentarios de Nexus → Notas de Zoho Tasks
```

### Fase 4: Recordatorios

Configurar recordatorios automáticos en Zoho Tasks:

```javascript
// Recordatorio 24h antes en Zoho Tasks
// Notificación push nativa de Zoho
```



## 📝 Resumen

✅ **Implementado:**
 Crear tarea en Zoho Tasks
 Actualizar tarea en Zoho Tasks
 Eliminar tarea de Zoho Tasks
 Completar tarea en Zoho Tasks
 Sincronización automática
 Soporte multiusuario
 Manejo de errores robusto

⏳ **Requiere:**
 Usuario debe iniciar sesión con Zoho
 Aceptar scope `ZohoMail.tasks.ALL`

🎯 **Resultado:**
 Tareas de Nexus visibles en Zoho Mail
 Acceso móvil a todas las tareas
 Notificaciones push nativas
 Un solo sistema de tareas



## 🧪 Prueba Ahora

1. **Cierra sesión** en Nexus
2. **Inicia sesión con Zoho** (para obtener nuevo scope)
3. **Crea una tarea** y asígnala
4. **Ve a Zoho Mail** → Tasks
5. **¡Disfruta!** ✨



¿Necesitas ayuda configurando o tienes alguna pregunta? 🤔

