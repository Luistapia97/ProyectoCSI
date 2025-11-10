# 📅 Integración con Zoho Calendar

## ✨ Descripción General

La integración con Zoho Calendar permite sincronizar automáticamente las tareas asignadas en Nexus con el calendario de Zoho de cada usuario. Cuando se asigna una tarea a un usuario que tiene su cuenta de Zoho conectada, se crea automáticamente un evento en su calendario.

## 🔑 Características Principales

### 1. **Sincronización Automática**
 ✅ Creación automática de eventos cuando se asigna una tarea
 ✅ Actualización de eventos cuando cambian los detalles de la tarea
 ✅ Eliminación de eventos cuando se elimina/archiva la tarea

### 2. **MultiUsuario**
 📊 Cada usuario asignado a una tarea obtiene su propio evento en su calendario
 👥 Si una tarea tiene múltiples asignados, cada uno recibe el evento
 🔄 Los eventos se gestionan independientemente para cada usuario

### 3. **Sincronización Selectiva**
 ⚡ Solo se sincronizan usuarios con cuenta Zoho conectada
 📆 Solo tareas con fecha de vencimiento generan eventos
 🎯 No bloquea la creación de tareas si falla la sincronización

## 🏗️ Arquitectura

### Middleware: `zohoCalendarSync.js`

Ubicación: `backend/middleware/zohoCalendarSync.js`

#### Funciones Principales:

```javascript
// 1. Sincronizar tarea al calendario
export async function syncTaskToZohoCalendar(task, assignedUsers)

// 2. Actualizar evento existente
export async function updateZohoCalendarEvent(task, changes)

// 3. Eliminar evento del calendario
export async function deleteZohoCalendarEvent(task)
```

### Integración en Rutas

Ubicación: `backend/routes/tasks.js`

#### 1. **Creación de Tarea** (POST /api/tasks)

```javascript
// Después de crear la tarea y asignar usuarios
if (assignedTo && assignedTo.length > 0 && dueDate) {
  try {
    const syncResult = await syncTaskToZohoCalendar(populatedTask, assignedTo);
    console.log('✅ Sincronización completada:', syncResult);
  } catch (error) {
    console.error('❌ Error sincronizando:', error);
    // No bloquea la creación de la tarea
  }
}
```

#### 2. **Actualización de Tarea** (PUT /api/tasks/:id)

```javascript
// Se maneja en dos escenarios:

// A) Cambio de asignados
if (assignedToChanged) {
  // Eliminar eventos de usuarios removidos
  // Crear eventos para nuevos usuarios asignados
}

// B) Cambio de contenido (título, descripción, fecha, prioridad)
if (Object.keys(changes).length > 0) {
  await updateZohoCalendarEvent(updatedTask, changes);
}
```

#### 3. **Eliminación de Tarea** (DELETE /api/tasks/:id)

```javascript
// Antes de archivar la tarea
if (task.zohoCalendarEventIds && task.zohoCalendarEventIds.length > 0) {
  try {
    await deleteZohoCalendarEvent(task);
    console.log('✅ Eventos eliminados');
  } catch (error) {
    console.error('❌ Error eliminando eventos:', error);
  }
}
```

## 📋 Estructura de Datos

### Task Model  Campo `zohoCalendarEventIds`

```javascript
zohoCalendarEventIds: [{
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  eventId: String,        // ID del evento en Zoho Calendar
  eventLink: String       // URL directa al evento
}]
```

### Formato de Evento en Zoho

```javascript
{
  title: "📋 Nombre de la Tarea",
  description: `
    📝 Descripción: [descripción de la tarea]
    
    📊 Proyecto: [nombre del proyecto]
    🎯 Prioridad: [alta/media/baja]
    👤 Asignado por: [nombre del usuario]
    
    🔗 Ver en Nexus: http://localhost:5173/project/[projectId]
  `,
  start: "20250115T10:00:00Z",    // ISO 8601
  end: "20250115T11:00:00Z",      // ISO 8601 (1 hora después)
  location: "Nexus  Plataforma de Gestión"
}
```

## 🔄 Flujo de Trabajo

### Escenario 1: Crear Nueva Tarea con Asignación

```
1. Usuario admin crea tarea
   ↓
2. Asigna usuarios y establece fecha de vencimiento
   ↓
3. Backend crea la tarea en MongoDB
   ↓
4. Para cada usuario asignado:
   a. Verifica si tiene zohoAccessToken
   b. Crea ZohoCalendarService con su token
   c. Prepara datos del evento
   d. Llama a zohoService.syncTaskToEvent()
   e. Guarda eventId en task.zohoCalendarEventIds
   ↓
5. Usuario ve evento en su Zoho Calendar
```

### Escenario 2: Actualizar Tarea Existente

```
1. Usuario admin actualiza tarea (cambia título o fecha)
   ↓
2. Backend guarda cambios en MongoDB
   ↓
3. Detecta cambios relevantes para el calendario
   ↓
4. Para cada evento existente en zohoCalendarEventIds:
   a. Obtiene el usuario asociado
   b. Crea ZohoCalendarService con su token
   c. Llama a zohoService.updateEvent() con nuevos datos
   ↓
5. Usuario ve evento actualizado en su Zoho Calendar
```

### Escenario 3: Cambiar Asignación

```
1. Usuario admin cambia asignados de la tarea
   ↓
2. Backend identifica:
    Usuarios removidos: [A, B]
    Usuarios nuevos: [C, D]
   ↓
3. Elimina eventos de usuarios removidos:
    Filtra zohoCalendarEventIds removiendo A y B
   ↓
4. Crea eventos para nuevos usuarios:
    Llama syncTaskToZohoCalendar([C, D])
   ↓
5. Usuarios C y D ven nuevo evento
6. Usuarios A y B ya no ven el evento
```

### Escenario 4: Eliminar/Archivar Tarea

```
1. Usuario admin elimina tarea
   ↓
2. Backend recupera zohoCalendarEventIds
   ↓
3. Para cada evento:
   a. Obtiene el usuario asociado
   b. Crea ZohoCalendarService con su token
   c. Llama a zohoService.deleteEvent(eventId)
   ↓
4. Archiva la tarea en MongoDB
   ↓
5. Eventos eliminados de Zoho Calendar de todos los usuarios
```

## 🔐 Requisitos Previos

### 1. Usuario debe autenticarse con Zoho

```javascript
// El usuario debe haber iniciado sesión con Zoho OAuth
// para tener un zohoAccessToken válido

user.provider === 'zoho'
user.zohoAccessToken !== null
```

### 2. Tarea debe tener fecha de vencimiento

```javascript
// Solo tareas con dueDate generan eventos
task.dueDate !== null
```

### 3. Scopes OAuth Requeridos

```javascript
scope: [
  'openid',
  'email', 
  'profile',
  'ZohoCalendar.calendar.ALL'  // ← Permiso para calendario
]
```

## 🎯 Casos de Uso

### ✅ Casos Exitosos

1. **Usuario con Zoho conectado + Tarea con fecha**
    ✅ Se crea evento automáticamente

2. **Múltiples usuarios asignados con Zoho**
    ✅ Cada uno recibe su propio evento

3. **Actualización de título/descripción**
    ✅ Eventos se actualizan automáticamente

4. **Cambio de fecha de vencimiento**
    ✅ Eventos se actualizan con nueva fecha

### ⚠️ Casos Especiales

1. **Usuario SIN Zoho conectado**
    ⚠️ No se crea evento (se omite silenciosamente)
    ✅ Tarea se crea/asigna normalmente

2. **Tarea SIN fecha de vencimiento**
    ⚠️ No se crea evento
    ✅ Tarea se crea normalmente

3. **Error en API de Zoho**
    ❌ Se registra error en logs
    ✅ Tarea se crea/actualiza normalmente
    ✅ No se interrumpe el flujo

4. **Token de Zoho expirado**
    ❌ Falla la sincronización
    🔄 TODO: Implementar refresh token automático

## 🐛 Debugging

### Logs a Observar

```bash
# Creación de tarea
📅 Iniciando sincronización con Zoho Calendar
   Usuario: user@example.com (ID: 123...)
   Tarea: Implementar login (ID: 456...)

# Evento creado exitosamente
✅ Evento de calendario creado para user@example.com
   Event ID: event_123
   Event Link: https://calendar.zoho.com/event/123

# Usuario sin Zoho
⚠️  Usuario user@example.com no tiene Zoho conectado, omitiendo sincronización

# Error en API
❌ Error creando evento en Zoho Calendar para user@example.com: Token expired

# Resumen
✅ Sincronización completada: { success: true, synced: 2, total: 3 }
```

### Verificar Estado de Sincronización

```javascript
// En MongoDB o API, revisar:
task.zohoCalendarEventIds

// Debe contener:
[
  {
    userId: "user_id_1",
    eventId: "zoho_event_1", 
    eventLink: "https://..."
  },
  {
    userId: "user_id_2",
    eventId: "zoho_event_2",
    eventLink: "https://..."
  }
]
```

## 🚀 Mejoras Futuras

### 1. Refresh Token Automático
```javascript
// Implementar en ZohoCalendarService
async refreshAccessToken(user) {
  // Usar refreshToken para obtener nuevo accessToken
  // Actualizar user.zohoAccessToken en DB
}
```

### 2. Sincronización Bidireccional
```javascript
// Escuchar cambios en Zoho Calendar
// Actualizar tareas en Nexus cuando cambien en Zoho
```

### 3. Configuración por Usuario
```javascript
// Permitir al usuario elegir:
user.settings.autoSyncCalendar = true/false
user.settings.calendarNotifications = true/false
```

### 4. Batch Processing
```javascript
// Procesar múltiples usuarios en paralelo
await Promise.all(users.map(user => syncTask(task, user)))
```

### 5. Webhook de Zoho
```javascript
// Recibir notificaciones cuando eventos cambian en Zoho
POST /api/webhooks/zoho/calendar
```

### 6. UI Indicators
```jsx
// Mostrar en el frontend si la tarea está sincronizada
<TaskCard 
  task={task}
  syncedToCalendar={task.zohoCalendarEventIds.length > 0}
/>
```

## 📚 Recursos

 [Zoho Calendar API Documentation](https://www.zoho.com/calendar/help/api/)
 [OpenID Connect Specification](https://openid.net/connect/)
 Archivo interno: `ZOHO_OPENID_CONNECT.md`
 Service: `backend/services/zohoCalendar.js`
 Middleware: `backend/middleware/zohoCalendarSync.js`

## ❓ Preguntas Frecuentes

### ¿Qué pasa si un usuario no tiene Zoho conectado?
Se omite la sincronización para ese usuario pero la tarea se crea normalmente.

### ¿Se puede sincronizar una tarea existente?
Actualmente solo se sincronizan tareas nuevas o actualizadas. Para sincronizar una existente, actualiza cualquier campo.

### ¿Los eventos se eliminan si se completa la tarea?
No, actualmente solo se eliminan al archivar/eliminar la tarea. Esto permite mantener historial.

### ¿Puedo ver el link al evento en Nexus?
Actualmente se guarda en `task.zohoCalendarEventIds[].eventLink` pero no se muestra en UI. Es una mejora pendiente.

### ¿Qué pasa si expira el token de Zoho?
La sincronización falla pero no afecta la funcionalidad de tareas. El usuario debe reconectar su cuenta Zoho.



**Última actualización:** Enero 2025
**Versión:** 1.0.0
**Autor:** Proyecto Nexus

