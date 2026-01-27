# 🎯 Guía de Pruebas - Sistema de Métricas de Esfuerzo

## 📋 Índice
1. [Configuración Inicial](#configuración-inicial)
2. [Crear Tarea con Estimación](#crear-tarea-con-estimación)
3. [Time Tracking Automático](#time-tracking-automático)
4. [Registro Manual de Tiempo](#registro-manual-de-tiempo)
5. [Sistema de Bloqueos](#sistema-de-bloqueos)
6. [Visualización de Métricas](#visualización-de-métricas)
7. [Reportes Avanzados](#reportes-avanzados)

---

## ⚙️ Configuración Inicial

### 1. Verificar servidores activos
```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Debe mostrar: Server running on port 5000

# Terminal 2 - Frontend  
cd frontend
npm run dev
# Debe mostrar: Local: http://localhost:5173/
```

### 2. Acceder a la aplicación
- Abre tu navegador en `http://localhost:5173/`
- Inicia sesión con tu usuario
- Ve al Dashboard

---

## 📝 Crear Tarea con Estimación

### Paso 1: Crear nueva tarea
1. En el **Dashboard**, selecciona un proyecto
2. Click en el proyecto para ir al **Board (Kanban)**
3. En cualquier columna, click en **"+ Agregar Tarea"**

### Paso 2: Configurar estimación
4. Completa los campos básicos:
   - **Título**: "Implementar login con Google"
   - **Descripción**: "Integrar OAuth2 de Google"
   - **Prioridad**: Alta
   - **Fecha límite**: Mañana
   - **Asignado a**: Selecciónate a ti mismo

5. **Sección de Estimación** (NUEVO):
   - Verás 5 opciones de tallas:
     - **XS** - 1h (Cambio trivial)
     - **S** - 2h (Tarea simple)
     - **M** - 6h (Tarea estándar) ⭐ RECOMENDADO
     - **L** - 12h (Tarea compleja)
     - **XL** - 40h (Feature completa)
   
6. Selecciona **"M - Mediana (6h)"**
   - Verás: "Esta tarea tomará aproximadamente **6 horas**"

7. Click **"Crear Tarea"**

✅ **Verificación**: La tarea aparece en la columna con la estimación guardada

---

## ⏱️ Time Tracking Automático

### Paso 1: Abrir modal de tarea
1. Click en la tarea que creaste
2. El modal se abre mostrando los detalles

### Paso 2: Iniciar timer
3. **Desplázate hacia abajo** hasta la sección **"⏱️ Seguimiento de Tiempo"**
4. Verás:
   ```
   ⏱️ Seguimiento de Tiempo
   
   [▶️ Iniciar Timer]
   
   ✏️ Registrar tiempo manualmente
   
   Tiempo estimado: 6h
   Tiempo registrado: 0h
   Progreso: [====          ] 0%
   ```

5. Click en **"▶️ Iniciar Timer"**

### Paso 3: Ver timer activo
6. El timer comienza a contar:
   ```
   00:00:15
   [⏹️ Detener Timer]
   ```
   
7. **Déjalo correr 2-3 minutos** mientras trabajas

### Paso 4: Agregar nota (opcional)
8. En el campo de texto debajo del timer:
   - Escribe: "Configurando credenciales OAuth"

### Paso 5: Detener timer
9. Click en **"⏹️ Detener Timer"**
10. Verás:
    ```
    Sesión guardada: 3 minutos (0.05h)
    Tiempo total: 0.05h
    ```

### Paso 6: Verificar actualización
11. La barra de progreso se actualiza automáticamente
12. En **"Historial de sesiones"** aparece:
    ```
    ⏱️ 0.05h  |  22/01/2026
    "Configurando credenciales OAuth"
    ```

✅ **Verificación**: 
- Timer funcionó correctamente
- Sesión guardada con timestamp
- Progreso actualizado

---

## ✏️ Registro Manual de Tiempo

### Paso 1: Abrir registro manual
1. En la misma tarea, click en **"✏️ Registrar tiempo manualmente"**
2. Se despliega un formulario:
   ```
   Horas: [  ]  :  Minutos: [  ]
   
   [Guardar Sesión]
   ```

### Paso 2: Ingresar tiempo trabajado
3. Escribe:
   - **Horas**: 2
   - **Minutos**: 30

4. En la nota (opcional):
   - "Implementé integración con API de Google"

5. Click **"Guardar Sesión"**

### Paso 3: Verificar registro
6. El tiempo se suma al total:
   ```
   Tiempo estimado: 6h
   Tiempo registrado: 2.55h  (0.05 + 2.50)
   Progreso: [======        ] 42%
   ```

7. En el historial aparecen **2 sesiones**:
   ```
   ✏️ 2.50h  |  22/01/2026
   "Implementé integración con API de Google"
   
   ⏱️ 0.05h  |  22/01/2026
   "Configurando credenciales OAuth"
   ```

✅ **Verificación**:
- Registro manual funciona
- Sesiones se acumulan correctamente
- Icono ✏️ vs ⏱️ diferencia métodos

---

## 🚫 Sistema de Bloqueos

### Paso 1: Marcar tarea como bloqueada
1. En el modal de la tarea, busca el botón:
   ```
   [🚫 Marcar bloqueada]
   ```

2. Click en el botón
3. Se abre **Modal de Bloqueo** con 4 opciones:

### Paso 2: Seleccionar tipo de bloqueo
4. Selecciona una opción:
   
   **🌐 Dependencia externa**
   - Esperando proveedor, cliente o tercero
   
   **🔗 Dependencia interna**
   - Esperando otra tarea o equipo ⭐ SELECCIONA ESTA
   
   **✅ Esperando aprobación**
   - Pendiente de revisión o autorización
   
   **❓ Falta información**
   - Necesita aclaración o especificaciones

5. Click en **"🔗 Dependencia interna"**

### Paso 3: Describir razón
6. En el campo de texto:
   ```
   Describe la razón del bloqueo *
   ```
   
7. Escribe:
   ```
   Esperando que el equipo de backend termine el endpoint /auth/google
   ```

8. Click **"Bloquear Tarea"**

### Paso 4: Verificar estado bloqueado
9. El modal se cierra y ahora verás:
   ```
   🚫 Tarea Bloqueada
   [Ver detalles]
   ```

10. El botón cambió a:
    ```
    [✅ Desbloquear tarea]
    ```

### Paso 5: Simular tiempo bloqueado
11. **Cierra el modal** (la tarea sigue bloqueada)
12. **Espera 1-2 minutos**
13. **Reabre la tarea**

### Paso 6: Desbloquear tarea
14. Click en **"✅ Desbloquear tarea"**
15. Confirma el desbloqueo

### Paso 7: Verificar tiempo bloqueado
16. El sistema calculó automáticamente:
    ```
    Tiempo bloqueado: ~2 minutos
    Tiempo efectivo: 2.53h (2.55h - 0.02h bloqueado)
    ```

✅ **Verificación**:
- Tarea se bloqueó correctamente
- Tiempo bloqueado no cuenta para eficiencia
- Desbloqueo funciona

---

## 📊 Visualización de Métricas

### Paso 1: Ver métricas en modal
1. Con la tarea abierta, verifica:

   **Sección de estadísticas básicas**:
   ```
   Tiempo estimado: 6h
   Tiempo registrado: 2.55h
   Progreso: [==========    ] 42%
   ```

### Paso 2: Completar la tarea para ver eficiencia
2. Agrega más tiempo hasta superar las 6h estimadas:
   - Registro manual: **4 horas**
   - Nota: "Testing y debugging OAuth"

3. Ahora verás:
   ```
   Tiempo estimado: 6h
   Tiempo registrado: 6.55h
   Progreso: [==============] 109%  ⚠️ SOBRE ESTIMACIÓN
   ```

4. La barra se pone **ROJA** indicando que excediste la estimación

### Paso 3: Mover a completada
5. Arrastra la tarea a la columna **"Completadas"**
6. El sistema calcula automáticamente:

### Paso 4: Calcular IEE (Índice Eficiencia Ejecución)
```
IEE = Estimado / Efectivo
IEE = 6h / (6.55h - 0.02h bloqueado)
IEE = 6 / 6.53
IEE = 0.92

Interpretación:
- IEE > 1.0 → Más rápido de lo estimado ✅
- IEE = 1.0 → Exacto según estimación ⭐
- IEE < 1.0 → Más lento de lo estimado ⚠️
- IEE = 0.92 → Tardaste 8% más de lo estimado
```

✅ **Verificación**:
- Progreso visual funciona
- Alertas de sobre-estimación
- IEE calculado automáticamente

---

## 📈 Reportes Avanzados

### Opción 1: Reporte de Usuario via API

#### Usando Postman/Thunder Client:
```http
GET http://localhost:5000/api/tasks/metrics/user/:userId?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer TU_TOKEN
```

**Reemplaza**:
- `:userId` → Tu ID de usuario (obtener del localStorage o Dashboard)
- `TU_TOKEN` → Token JWT del localStorage

**Respuesta esperada**:
```json
{
  "userId": "67890abcdef",
  "period": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  },
  "summary": {
    "totalTasks": 5,
    "completedTasks": 3,
    "totalHours": 24.5,
    "estimatedHours": 22.0,
    "effectiveHours": 23.8,
    "avgEfficiency": 0.92,
    "throughput": 23.8
  },
  "complexityBreakdown": {
    "XS": { "count": 1, "hours": 1.2 },
    "S": { "count": 2, "hours": 4.5 },
    "M": { "count": 2, "hours": 13.1 },
    "L": { "count": 0, "hours": 0 },
    "XL": { "count": 0, "hours": 0 }
  },
  "qualityMetrics": {
    "qualityScore": 87.5,
    "tasksBlocked": 1,
    "percentageBlocked": 20
  }
}
```

### Opción 2: Reporte de Proyecto

```http
GET http://localhost:5000/api/tasks/metrics/project/:projectId?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer TU_TOKEN
```

**Respuesta esperada**:
```json
{
  "projectId": "proj123",
  "projectName": "Sistema de Autenticación",
  "period": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  },
  "summary": {
    "totalTasks": 15,
    "completedTasks": 10,
    "inProgress": 3,
    "blocked": 2,
    "totalEstimated": 80,
    "totalActual": 88,
    "deviation": "+10%",
    "avgEfficiency": 0.91
  },
  "eta": {
    "remainingTasks": 5,
    "estimatedHours": 25,
    "predictedCompletion": "2026-02-10",
    "velocity": 2.5
  },
  "teamPerformance": [
    {
      "userName": "Luis",
      "tasksCompleted": 5,
      "efficiency": 0.95,
      "throughput": 28.5
    },
    {
      "userName": "Brandon",
      "tasksCompleted": 3,
      "efficiency": 0.88,
      "throughput": 18.2
    }
  ]
}
```

### Opción 3: Ver métricas en Frontend (futuro)

*Nota: Los componentes de reportes visuales se pueden agregar posteriormente para mostrar:*
- Gráficas de eficiencia por semana
- Desglose de complejidad (pie chart)
- Tabla de throughput por usuario
- Timeline de proyectos con ETA

---

## 🧪 Escenarios de Prueba Completos

### Escenario 1: Tarea Rápida (IEE > 1.0)
1. Crear tarea **XS (1h)**
2. Iniciar timer → trabajar 30 min → detener
3. Completar tarea
4. **Resultado esperado**: IEE = 2.0 (¡Muy eficiente!)

### Escenario 2: Tarea Bloqueada Múltiples Veces
1. Crear tarea **M (6h)**
2. Trabajar 2h con timer
3. Bloquear por "Falta información"
4. Esperar 1 día (o cambiar fecha manualmente en DB)
5. Desbloquear → trabajar 3h más
6. Bloquear por "Esperando aprobación"
7. Esperar medio día
8. Desbloquear → completar con 1h final
9. **Resultado esperado**: 
   - Tiempo actual: 6h
   - Tiempo bloqueado: ~1.5 días
   - Tiempo efectivo: 6h
   - IEE = 1.0 (Perfecto, sin contar bloqueos)

### Escenario 3: Proyecto Completo
1. Crear 5 tareas con diferentes tallas:
   - 1 XS (1h)
   - 2 S (2h cada una)
   - 1 M (6h)
   - 1 L (12h)
   
2. Completar todas con tiempos variados
3. Hacer request de `/metrics/project/:id`
4. **Resultado esperado**:
   - Complexity breakdown correcto
   - Desviación calculada
   - ETA basado en velocity

---

## 🎯 Checklist de Validación

Marca cada ítem después de probarlo:

### Creación y Estimación
- [ ] Crear tarea sin estimación → Error de validación
- [ ] Crear tarea con XS (1h) → Éxito
- [ ] Crear tarea con S (2h) → Éxito
- [ ] Crear tarea con M (6h) → Éxito
- [ ] Crear tarea con L (12h) → Éxito
- [ ] Crear tarea con XL (40h) → Éxito
- [ ] Estimación se guarda en `task.effortMetrics.estimatedSize`
- [ ] Horas se calculan automáticamente según talla

### Time Tracking
- [ ] Iniciar timer → contador comienza
- [ ] Timer continúa contando si recargo página
- [ ] Detener timer → sesión se guarda
- [ ] Registro manual 1h 30min → 1.5h guardado
- [ ] Sesiones se acumulan correctamente
- [ ] Historial muestra todas las sesiones
- [ ] Iconos ⏱️ (timer) y ✏️ (manual) se muestran
- [ ] Notas aparecen en el historial

### Sistema de Bloqueos
- [ ] Bloquear tarea → estado cambia
- [ ] Badge "🚫 Tarea Bloqueada" aparece
- [ ] 4 tipos de bloqueo disponibles
- [ ] Razón se guarda correctamente
- [ ] Desbloquear tarea → tiempo bloqueado calculado
- [ ] Tiempo bloqueado NO cuenta para eficiencia

### Cálculos Automáticos
- [ ] `actualHours` = suma de todas las sesiones
- [ ] `blockedHours` = diferencia entre blockedSince y blockedUntil
- [ ] `effectiveHours` = actualHours - blockedHours
- [ ] `efficiency` = estimatedHours / effectiveHours
- [ ] Pre-save hook calcula todo automáticamente

### Progreso Visual
- [ ] Barra de progreso verde cuando < 100%
- [ ] Barra de progreso roja cuando > 100%
- [ ] Porcentaje correcto: (actualHours / estimatedHours) * 100

### Reportes API
- [ ] Endpoint `/metrics/user/:id` funciona
- [ ] Endpoint `/metrics/project/:id` funciona
- [ ] Complexity breakdown correcto
- [ ] Quality metrics calculados
- [ ] ETA y velocity funcionan

---

## 🐛 Troubleshooting

### Timer no inicia
**Problema**: Click en "Iniciar Timer" pero no pasa nada

**Solución**:
1. Abre DevTools (F12) → Console
2. Busca errores 
3. Verifica que estés asignado a la tarea
4. Verifica token de autenticación

### Métricas no se calculan
**Problema**: `efficiency` aparece como `null` o `undefined`

**Solución**:
1. Verifica que la tarea tenga `effortMetrics` inicializado
2. Completa la tarea para trigger pre-save hook
3. Verifica MongoDB que los campos existen

### Reportes dan 404
**Problema**: Endpoints `/metrics/*` dan error 404

**Solución**:
1. Verifica que backend esté corriendo
2. Verifica ruta: `/api/tasks/metrics/user/:id` (no `/api/metrics/...`)
3. Verifica token JWT en headers

### Tiempo bloqueado no se calcula
**Problema**: `blockedHours` siempre es 0

**Solución**:
1. Asegúrate de DESBLOQUEAR la tarea (no solo dejarla bloqueada)
2. Al desbloquear, se setea `blockedUntil` y se calcula diferencia
3. Si bloqueas por < 1 minuto, puede redondear a 0

---

## 📞 Soporte

Si encuentras algún bug o tienes preguntas:
1. Revisa logs del backend (terminal 1)
2. Revisa console del navegador (F12)
3. Verifica que ambos servidores estén corriendo
4. Limpia caché del navegador (Ctrl+Shift+R)

---

## ✅ Conclusión

Has probado exitosamente:
- ✅ Sistema de estimación con 5 tallas
- ✅ Time tracking automático y manual
- ✅ Sistema de bloqueos con 4 tipos
- ✅ Cálculos automáticos de eficiencia
- ✅ Reportes avanzados por API
- ✅ Visualización de progreso en tiempo real

**¡El sistema de métricas de esfuerzo está completamente funcional!** 🎉
