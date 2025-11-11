# 🧪 Guía para Probar las Notificaciones

## 📋 Prerequisitos
- Backend corriendo en http://localhost:5000
- Frontend corriendo en http://localhost:5173
- Usuario logueado

---

## ✅ Método 1: Desde la Interfaz (MÁS FÁCIL)

### Paso 1: Crear Tarea que Vence Hoy

1. Abre http://localhost:5173
2. Inicia sesión
3. Ve a cualquier proyecto (o crea uno)
4. Click en **"+ Nueva Tarea"** en cualquier columna
5. Llena el formulario:
   ```
   Título: Tarea de prueba - vence hoy
   Descripción: Testing notificaciones
   Fecha de vencimiento: HOY (11 de noviembre 2025)
   Asignar a: Tu usuario
   ```
6. Click en **"Crear Tarea"**

### Paso 2: Ejecutar Verificación Manual

Abre el modal de la tarea que acabas de crear y verás el botón:

```
┌─────────────────────────────┐
│  [🔔 Enviar Recordatorio]  │
└─────────────────────────────┘
```

Click en ese botón para recibir una notificación INMEDIATA.

### Paso 3: Ver la Notificación

Mira la esquina superior derecha del Dashboard:

```
🔔 [1]  ← Badge con contador
```

Click en la campana para ver:

```
┌─────────────────────────────────┐
│ Notificaciones    [✓✓ Marcar]  │
├─────────────────────────────────┤
│ ● 🔔 Recordatorio Manual        │
│   Recordatorio sobre la tarea:  │
│   "Tarea de prueba - vence hoy" │
│   hace unos segundos       [🗑️] │
└─────────────────────────────────┘
```

---

## ✅ Método 2: Trigger Automático de "Vence HOY"

### Opción A: Esperar al Horario Programado

Los recordatorios de "vence HOY" se ejecutan automáticamente a:
- **9:00 AM**
- **3:00 PM**

Si tienes una tarea que vence hoy, recibirás la notificación automáticamente en esos horarios.

### Opción B: Ejecutar Manualmente el Verificador

Necesitas hacer una petición POST autenticada. Aquí están las opciones:

#### **Usando Postman/Thunder Client:**

1. **Primero, obtén tu token:**
   - Login en el frontend
   - Abre DevTools (F12)
   - Ve a Application → Local Storage
   - Copia el valor de `token`

2. **Haz la petición:**
   ```
   POST http://localhost:5000/api/tasks/test-reminders/today
   
   Headers:
   Authorization: Bearer TU_TOKEN_AQUI
   Content-Type: application/json
   ```

#### **Usando el navegador (DevTools Console):**

1. Abre el frontend en http://localhost:5173
2. Inicia sesión
3. Abre DevTools (F12) → Console
4. Ejecuta:

```javascript
// Verificar tareas que vencen HOY
fetch('http://localhost:5000/api/tasks/test-reminders/today', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('✅ Verificación ejecutada:', data))
.catch(err => console.error('❌ Error:', err));
```

5. **Verás en la consola del backend:**
```
📅 Verificando tareas que vencen HOY...
   📆 Rango: 11/11/2025 00:00:00 → 11/11/2025 23:59:59
   Encontradas 1 tareas que vencen hoy
   ✓ "Tarea de prueba - vence hoy" - Enviado a 1 usuario(s)
   ✓ Total recordatorios enviados: 1
```

6. **Recibirás INMEDIATAMENTE:**
   - ✅ Notificación en la campana 🔔
   - ✅ Popup del navegador (si está habilitado)

---

## 📊 Verificar Otros Recordatorios

### Tareas que vencen en 24 horas:

```javascript
fetch('http://localhost:5000/api/tasks/test-reminders/24h', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('✅ Resultado:', data));
```

### Tareas que vencen en 1 hora:

```javascript
fetch('http://localhost:5000/api/tasks/test-reminders/1h', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('✅ Resultado:', data));
```

### Tareas vencidas:

```javascript
fetch('http://localhost:5000/api/tasks/test-reminders/overdue', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('✅ Resultado:', data));
```

---

## 🎯 Escenarios de Prueba

### Escenario 1: Tarea vence HOY

**Crear:**
- Fecha: Hoy (11 nov 2025)
- Asignado a: Tu usuario

**Ejecutar:**
```javascript
// DevTools Console
fetch('http://localhost:5000/api/tasks/test-reminders/today', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

**Resultado esperado:**
```
🔔 [1]  ← Nueva notificación
● 📅 Tarea vence HOY
  La tarea "[nombre]" vence hoy
  hace unos segundos
```

---

### Escenario 2: Tarea vence en 24 horas

**Crear:**
- Fecha: Mañana (12 nov 2025)
- Asignado a: Tu usuario

**Ejecutar:**
```javascript
fetch('http://localhost:5000/api/tasks/test-reminders/24h', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

**Resultado esperado:**
```
🔔 [1]  ← Nueva notificación
● ⏰ Recordatorio: Tarea vence en 24h
  La tarea "[nombre]" vence en 23 horas
  hace unos segundos
```

---

### Escenario 3: Tarea vencida (días anteriores)

**Crear:**
- Fecha: Ayer (10 nov 2025) o antes
- Asignado a: Tu usuario
- Estado: NO completada

**Ejecutar:**
```javascript
fetch('http://localhost:5000/api/tasks/test-reminders/overdue', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

**Resultado esperado:**
```
🔔 [1]  ← Nueva notificación
● Tarea Vencida
  La tarea "[nombre]" venció hace 1 día
  hace unos segundos
```

---

## 🔔 Notificaciones del Navegador

Para habilitar las notificaciones nativas del navegador:

1. Click en la campana 🔔 en el Dashboard
2. El navegador te pedirá permiso
3. Click en **"Permitir"**
4. A partir de ahora recibirás popups nativos como:

```
┌─────────────────────────────────────┐
│ Proyectos CSI                       │
│ 📅 Tarea vence HOY                  │
│ La tarea "Tarea de prueba" vence    │
│ hoy                                 │
└─────────────────────────────────────┘
```

---

## 📝 Verificar en Logs del Backend

Mientras pruebas, revisa la terminal del backend para ver:

```
📅 Verificando tareas que vencen HOY...
   📆 Rango: 11/11/2025 00:00:00 → 11/11/2025 23:59:59
   Encontradas 2 tareas que vencen hoy
   ✓ "Tarea 1" - Enviado a 1 usuario(s)
   ✓ "Tarea 2" - Enviado a 2 usuario(s)
   ✓ Total recordatorios enviados: 3
```

---

## ✅ Checklist de Verificación

- [ ] Backend corriendo (puerto 5000)
- [ ] Frontend corriendo (puerto 5173)
- [ ] Usuario logueado
- [ ] Tarea creada con fecha de hoy
- [ ] Tarea asignada a tu usuario
- [ ] Ejecutar verificación manual (DevTools Console o Postman)
- [ ] Ver notificación en la campana 🔔
- [ ] Ver contador actualizado
- [ ] Ver popup del navegador (si está habilitado)
- [ ] Verificar logs en terminal del backend

---

## 🎉 ¡Listo!

Ahora puedes probar todas las notificaciones automáticas del sistema.

**Recordatorio:** Los recordatorios automáticos se ejecutan según el horario configurado:
- **Cada 2 horas** - Tareas que vencen en 24h
- **Cada 30 minutos** - Tareas que vencen en 1h
- **9 AM y 3 PM** - Tareas que vencen HOY (NUEVO)
- **Cada 4 horas** - Tareas vencidas
