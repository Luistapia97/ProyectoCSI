# 📅 Cómo Usar Zoho Calendar en Nexus

## 🎯 Descripción

La integración con Zoho Calendar permite que las tareas asignadas en Nexus se sincronicen automáticamente con tu calendario de Zoho. Esta guía explica cómo configurar y usar esta funcionalidad.

## ✅ Requisitos Previos

Para usar Zoho Calendar en Nexus, necesitas:

1. **Cuenta de Zoho** - Tener una cuenta activa en Zoho
2. **Iniciar sesión con Zoho** - Haber iniciado sesión en Nexus usando el botón "Continuar con Zoho"
3. **Permisos de Calendar** - Los permisos se solicitan automáticamente al iniciar sesión

## 🚀 Configuración Inicial

### Paso 1: Iniciar Sesión con Zoho

Si aún no lo has hecho:

1. Ve a la página de login de Nexus
2. Haz clic en el botón **"Continuar con Zoho"**
3. Autoriza la aplicación en Zoho
4. Serás redirigido de vuelta a Nexus

### Paso 2: Verificar Conexión

Puedes verificar si tu cuenta está conectada a Zoho:

1. Abre cualquier tarea en Nexus
2. Busca la sección de **Zoho Calendar**
3. Deberías ver el mensaje: **"Zoho Calendar conectado ✓"**

## 📋 Funcionalidades Automáticas

### 🔄 Sincronización Automática

Una vez conectado, las siguientes acciones se sincronizan automáticamente:

#### 1. **Crear Tarea** (Solo Administradores)

Cuando un administrador crea una tarea:

```
✅ Si la tarea tiene:
   - Fecha de vencimiento
   - Usuarios asignados
   - Usuarios con Zoho conectado

→ Se crea automáticamente un evento en el calendario de cada usuario asignado
```

**Ejemplo:**
```
Tarea: "Implementar login con OAuth"
Asignado a: Juan, María
Fecha: 2025-01-15 10:00

Resultado:
📅 Juan ve el evento en su Zoho Calendar
📅 María ve el evento en su Zoho Calendar
```

#### 2. **Actualizar Tarea**

Cuando se actualiza una tarea:

```
✅ Cambios sincronizados:
   - Título de la tarea → Actualiza título del evento
   - Descripción → Actualiza descripción del evento
   - Fecha de vencimiento → Actualiza fecha del evento
   - Prioridad → Actualiza detalles del evento
```

**Ejemplo:**
```
Tarea actualizada:
- Título: "Implementar login con OAuth" → "Implementar OAuth 2.0"
- Fecha: 2025-01-15 → 2025-01-20

Resultado:
📅 El evento en Zoho Calendar se actualiza automáticamente
```

#### 3. **Cambiar Asignación**

Cuando se modifican los usuarios asignados:

```
✅ Agregar usuarios:
   - Nuevos usuarios asignados reciben el evento en su calendario

✅ Remover usuarios:
   - El evento se elimina del calendario de usuarios removidos
```

**Ejemplo:**
```
Cambio de asignación:
- Antes: Juan, María
- Después: Juan, María, Pedro, Ana

Resultado:
📅 Juan y María: mantienen su evento
📅 Pedro y Ana: reciben nuevo evento
```

#### 4. **Eliminar Tarea**

Cuando se elimina/archiva una tarea:

```
✅ Eliminación automática:
   - Se eliminan todos los eventos del calendario
   - Afecta a todos los usuarios que tenían el evento
```

## 📱 Interfaz de Usuario

### Componente ZohoCalendarButton

Este botón aparece en el modal de detalles de cada tarea.

#### Estados del Botón:

##### 1. **No Conectado** ❌

```
┌─────────────────────────────────┐
│  🔴 Conectar con Zoho Calendar  │
└─────────────────────────────────┘

Conecta tu cuenta de Zoho para 
sincronizar tareas con tu calendario
```

**Acción al hacer clic:**
- Muestra mensaje informativo sobre cómo conectar

##### 2. **Conectado** ✅

```
┌─────────────────────────────────┐
│  ✓ Zoho Calendar conectado      │
│                                 │
│  [📅 Sincronizar Tarea]         │
└─────────────────────────────────┘

Estado: Sincronizado ✓
```

**Acciones disponibles:**
- **Sincronizar Tarea**: Sincroniza manualmente la tarea actual
- **Eliminar de Calendar**: Elimina el evento del calendario

## 🔍 Formato de Eventos en Zoho

Cada evento creado en Zoho Calendar tiene el siguiente formato:

### Título
```
📋 [Nombre de la Tarea]
```

### Descripción
```
📝 Descripción: [descripción completa de la tarea]

📊 Proyecto: [nombre del proyecto]
🎯 Prioridad: [alta/media/baja]
👤 Asignado por: [nombre del administrador]

🔗 Ver en Nexus: http://localhost:5173/project/[projectId]
```

### Fecha y Hora
```
Inicio: Fecha de vencimiento de la tarea
Fin: 1 hora después (por defecto)
```

### Ubicación
```
Nexus - Plataforma de Gestión
```

## 🎮 Casos de Uso

### Caso 1: Soy Administrador

**Escenario:**  
Quiero asignar una tarea a mi equipo y que aparezca en sus calendarios

**Pasos:**
1. Crear nueva tarea en Nexus
2. Asignar usuarios (que tengan Zoho conectado)
3. Establecer fecha de vencimiento
4. Guardar tarea

**Resultado:**
✅ Cada usuario asignado ve la tarea en su Zoho Calendar automáticamente

---

### Caso 2: Soy Usuario Asignado

**Escenario:**  
Me asignaron una tarea y quiero verla en mi calendario

**Requisito previo:**
- Haber iniciado sesión con Zoho en Nexus

**Resultado:**
✅ La tarea aparece automáticamente en mi Zoho Calendar
✅ No necesito hacer nada manualmente

---

### Caso 3: Sincronización Manual

**Escenario:**  
La tarea no se sincronizó automáticamente o quiero forzar una sincronización

**Pasos:**
1. Abrir la tarea en Nexus
2. Buscar sección "Zoho Calendar"
3. Clic en **"Sincronizar Tarea"**

**Resultado:**
✅ El evento se crea/actualiza en Zoho Calendar

---

### Caso 4: Usuario Sin Zoho

**Escenario:**  
Me asignaron una tarea pero no tengo Zoho conectado

**¿Qué pasa?**
⚠️ La tarea se crea normalmente en Nexus
⚠️ NO aparece en calendario (porque no tienes Zoho)
✅ Otros usuarios con Zoho SÍ ven el evento

**Solución:**
1. Cerrar sesión en Nexus
2. Iniciar sesión con "Continuar con Zoho"
3. Las nuevas tareas se sincronizarán automáticamente

## 🐛 Solución de Problemas

### ❓ El botón dice "No conectado"

**Causa:**  
Iniciaste sesión con email/contraseña local

**Solución:**
1. Cerrar sesión
2. Iniciar sesión con botón "Continuar con Zoho"

---

### ❓ La tarea no aparece en mi calendario

**Posibles causas:**

1. **No tienes Zoho conectado**
   - Verifica que el botón diga "Zoho Calendar conectado"
   
2. **La tarea no tiene fecha de vencimiento**
   - Solo tareas con fecha generan eventos
   
3. **No estás asignado a la tarea**
   - Solo usuarios asignados reciben el evento

**Solución:**
- Usa el botón "Sincronizar Tarea" manualmente

---

### ❓ El evento no se actualizó en Zoho

**Causa:**  
Puede haber un error temporal en la API

**Solución:**
1. Abre la tarea en Nexus
2. Haz un cambio menor (ej: agregar un espacio en la descripción)
3. Guarda la tarea
4. Esto forzará una nueva sincronización

---

### ❓ Veo eventos duplicados

**Causa:**  
La tarea se sincronizó múltiples veces

**Solución:**
1. Usa el botón "Eliminar de Calendar"
2. Luego usa "Sincronizar Tarea" para crear uno nuevo

---

### ❓ Los tokens expiraron

**Síntomas:**
- Error al sincronizar
- Dice "Token expired" en consola

**Solución:**
1. Cerrar sesión en Nexus
2. Iniciar sesión nuevamente con Zoho
3. Esto renovará los tokens automáticamente

## 📊 Logs y Debugging

Si eres desarrollador, puedes revisar los logs del servidor:

### Backend (Terminal):
```bash
📅 Iniciando sincronización con Zoho Calendar
   Usuario: user@example.com (ID: 123...)
   Tarea: Implementar login (ID: 456...)

✅ Evento de calendario creado para user@example.com
   Event ID: event_123

⚠️  Usuario sin Zoho conectado, omitiendo

❌ Error: Token expired
```

### Frontend (Consola del navegador):
```javascript
// Verificar estado de conexión
await api.get('/calendar/status')

// Resultado esperado:
{
  success: true,
  connected: true,
  email: "user@zoho.com"
}
```

## 💡 Tips y Mejores Prácticas

### Para Administradores:

1. **Establece fechas realistas**: Los eventos aparecerán en el calendario del equipo
2. **Usa descripciones claras**: Se mostrarán en Zoho Calendar
3. **Prioriza tareas**: La prioridad aparece en la descripción del evento
4. **Verifica asignaciones**: Solo usuarios con Zoho recibirán eventos

### Para Usuarios:

1. **Usa Zoho para login**: No uses email/contraseña local
2. **Mantén Zoho actualizado**: Revisa tu calendario de Zoho regularmente
3. **Sincronización automática**: No necesitas hacer nada manual
4. **Feedback al admin**: Si una tarea no aparece, repórtalo

### Para Desarrolladores:

1. **Monitorea logs**: Revisa errores de sincronización
2. **Refresh tokens**: Implementa renovación automática
3. **Manejo de errores**: No bloquees operaciones principales
4. **Testing**: Prueba con múltiples usuarios

## 🔐 Privacidad y Seguridad

### ¿Qué información se comparte con Zoho?

- ✅ Título de la tarea
- ✅ Descripción de la tarea
- ✅ Fecha de vencimiento
- ✅ Prioridad
- ❌ NO se comparten archivos adjuntos
- ❌ NO se comparten comentarios privados

### ¿Quién puede ver los eventos?

- Solo el usuario dueño del calendario de Zoho
- Cada usuario tiene su propio evento privado
- Los eventos NO son compartidos entre usuarios

### ¿Se pueden revocar los permisos?

Sí, puedes:
1. Ir a tu cuenta de Zoho
2. Configuración → Apps conectadas
3. Revocar acceso a "Nexus"
4. Volver a conectar cuando quieras

## 📚 Recursos Adicionales

- 📄 [Documentación de Zoho Calendar API](https://www.zoho.com/calendar/help/api/)
- 📄 [Guía de integración completa](./ZOHO_CALENDAR_INTEGRATION.md)
- 📄 [Configuración de OpenID Connect](./ZOHO_OPENID_CONNECT.md)

## ❓ Preguntas Frecuentes

**P: ¿Puedo usar Google Calendar en lugar de Zoho?**  
R: Actualmente solo soportamos Zoho Calendar. Google Calendar fue removido.

**P: ¿Las tareas completadas se mantienen en el calendario?**  
R: Sí, los eventos permanecen hasta que se elimine la tarea.

**P: ¿Puedo sincronizar tareas existentes?**  
R: Sí, usa el botón "Sincronizar Tarea" en cada tarea.

**P: ¿Funciona offline?**  
R: No, necesitas conexión a internet para sincronizar con Zoho.

**P: ¿Hay límite de tareas sincronizadas?**  
R: No hay límite definido, depende de tu plan de Zoho.

---

**Última actualización:** Enero 2025  
**Versión:** 1.0.0  
**Soporte:** Contacta al administrador del proyecto
