# 🧪 Prueba de Visualización de Tiempo Bloqueado

## ¿Por qué no aparece el tiempo bloqueado?

El tiempo bloqueado **solo aparece cuando:**
1. La tarea ha estado bloqueada previamente
2. Se ha desbloqueado (para calcular el tiempo)
3. El valor de `blockedHours` es mayor a 0

## 📋 Pasos para probar la visualización:

### 1️⃣ Crear o seleccionar una tarea
- Abre una tarea existente en el Dashboard
- O crea una nueva tarea con estimación (ej: M = 6 horas)

### 2️⃣ Registrar algo de tiempo (opcional pero recomendado)
- Click en "Iniciar Timer"
- Déjalo correr 1-2 minutos
- Click en "Detener Timer"
- **Resultado esperado**: Verás tiempo registrado (ej: 0.03h)

### 3️⃣ Bloquear la tarea
- En los detalles de la tarea, busca el badge "✅ Tarea Activa"
- Click en "Ver detalles" o el botón de bloqueo
- Selecciona un tipo de bloqueo (ej: "🚫 Dependencia Externa")
- Escribe una razón (ej: "Esperando API del backend")
- Click en "Bloquear Tarea"
- **Resultado esperado**: 
  - Badge cambia a "🚫 Tarea Bloqueada"
  - La tarea queda marcada como bloqueada

### 4️⃣ Esperar tiempo (IMPORTANTE)
⏰ **Espera al menos 2-3 minutos** mientras la tarea está bloqueada
   - El sistema está calculando el tiempo en que la tarea permanece bloqueada
   - Mientras más tiempo pase, más claro será el ejemplo

### 5️⃣ Desbloquear la tarea
- Abre nuevamente los detalles de la tarea
- Click en el botón "Desbloquear Tarea"
- **Resultado esperado**: La tarea se desbloquea y el backend calcula `blockedHours`

### 6️⃣ Verificar visualización en TimeTracker
- Cierra el modal si es necesario
- Vuelve a abrir los detalles de la tarea
- Busca la sección "Resumen de tiempo"
- **Deberías ver ahora**:
  ```
  Tiempo estimado: 6.00h
  Tiempo registrado: 0.03h
  Tiempo bloqueado: 0.05h  ← ⚠️ EN NARANJA
  Tiempo efectivo: -0.02h  ← ⚠️ EN VERDE
  Progreso: 0%
  ```

### 7️⃣ Verificar detalles del bloqueo
- Si vuelves a abrir el modal de bloqueo (aunque esté desbloqueada)
- La card amarilla mostrará:
  - Tipo de bloqueo anterior
  - Razón del bloqueo
  - Fecha desde cuando estuvo bloqueada

---

## 🔍 Verificación técnica

Si no aparece después de seguir estos pasos:

### Opción A: Verificar en la consola del navegador
```javascript
// Abre la consola (F12) y ejecuta:
console.log(task.effortMetrics);
```

Deberías ver algo como:
```json
{
  "blockedBy": "none",
  "blockedSince": "2026-01-22T10:30:00.000Z",
  "blockedUntil": "2026-01-22T10:35:00.000Z",
  "blockedHours": 0.08333,  ← Debe ser > 0
  "blockedReason": "Esperando API del backend",
  "actualHours": 0.03,
  "effectiveHours": -0.05
}
```

### Opción B: Verificar endpoint directamente
```bash
# En PowerShell:
$taskId = "TU_TASK_ID_AQUI"
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$taskId" -Method Get -Headers @{"Authorization"="Bearer TU_TOKEN"}
$response.effortMetrics
```

---

## ⚠️ Casos donde NO aparecerá:

❌ **La tarea nunca ha sido bloqueada**
   - `blockedBy` siempre ha sido `'none'`
   - `blockedHours` es 0 o undefined

❌ **La tarea está bloqueada ACTUALMENTE**
   - Solo se calcula cuando desbloqueas
   - Mientras está bloqueada, `blockedUntil` es null

❌ **El tiempo bloqueado es muy corto**
   - Si bloqueaste y desbloqueaste en menos de 1 segundo
   - `blockedHours` podría ser 0.0001 (prácticamente 0)

❌ **Cache del navegador**
   - Refresca con `Ctrl + Shift + R` (hard refresh)
   - O cierra y vuelve a abrir el modal

---

## ✅ Cómo debe verse cuando funciona:

### TimeTracker (cuando blockedHours > 0):
```
┌─────────────────────────────────────┐
│  📊 Resumen de tiempo               │
├─────────────────────────────────────┤
│  Tiempo estimado:      6.00h        │
│  Tiempo registrado:    2.50h        │
│  Tiempo bloqueado:     0.75h 🟠     │ ← NARANJA
│  Tiempo efectivo:      1.75h 🟢     │ ← VERDE
│  Progreso:             [====    ] 42%│
└─────────────────────────────────────┘
```

### BlockedTaskModal (cuando se bloqueó antes):
```
┌───────────────────────────────────────┐
│  ⚠️ Información del Bloqueo          │
├───────────────────────────────────────┤
│  🚫 Dependencia Externa              │
│                                       │
│  RAZÓN:                               │
│  Esperando API del backend           │
│                                       │
│  BLOQUEADA DESDE:                     │
│  22/1/2026, 10:30:45                 │
└───────────────────────────────────────┘
```

---

## 🎯 Escenario de prueba completo (5 minutos)

1. **[00:00]** Crear tarea "Test Bloqueos" con estimación M
2. **[00:30]** Iniciar timer
3. **[01:30]** Detener timer (1 minuto registrado)
4. **[01:45]** Bloquear tarea (Dependencia Externa)
5. **[04:45]** Desbloquear tarea (3 minutos bloqueada)
6. **[05:00]** Abrir detalles → Verificar TimeTracker

**Resultado esperado**:
- Tiempo registrado: 0.02h (1 minuto)
- Tiempo bloqueado: 0.05h (3 minutos) ← EN NARANJA
- Tiempo efectivo: -0.03h (negativo porque no trabajaste durante bloqueo)

---

## 🐛 Solución de problemas

### Problema: No aparece después de desbloquear
**Solución**: Cierra y vuelve a abrir el modal de detalles para que recargue los datos

### Problema: blockedHours es 0
**Solución**: Asegúrate de esperar al menos 10-20 segundos antes de desbloquear

### Problema: effectiveHours es negativo
**Explicación**: Es normal si el tiempo bloqueado > tiempo trabajado. Significa que pasaste más tiempo bloqueado que trabajando.

### Problema: Los colores no se ven (naranja/verde)
**Solución**: Verifica que el archivo `TimeTracker.css` tiene:
```css
.blocked-time {
  color: #ff9800 !important;
  font-weight: 600;
}

.effective-time {
  color: #4caf50 !important;
  font-weight: 600;
}
```

---

## 📞 Si aún no funciona:

1. Revisa la consola del navegador (F12) buscando errores
2. Verifica que el backend esté corriendo en `localhost:5000`
3. Confirma que la tarea se guardó correctamente después de desbloquear
4. Usa las herramientas de React DevTools para inspeccionar el componente TimeTracker y sus props
