# 🔐 Sistema de Roles - Administrador y Usuario

## ✅ Implementación Completada

### 📋 Resumen

Se ha implementado un sistema completo de roles con dos niveles de acceso:

1. **👑 Administrador** - Control total del sistema
2. **👤 Usuario** - Solo puede trabajar en tareas asignadas

---

## 🎯 Funcionalidades por Rol

### 👑 Administrador

**Puede hacer:**
- ✅ Crear proyectos
- ✅ Eliminar proyectos
- ✅ Crear tareas
- ✅ Editar tareas completamente (título, descripción, prioridad, fechas, etc.)
- ✅ Asignar tareas a usuarios
- ✅ Crear nuevos usuarios
- ✅ Ver todos los proyectos
- ✅ Gestionar miembros del equipo
- ✅ Acceso completo al sistema

**Interfaz:**
- Botón "Crear Usuario" en el Dashboard
- Botón "Nuevo Proyecto" en el Dashboard
- Botón "+" en cada columna del Kanban para crear tareas
- Badge dorado "Administrador" con icono de escudo

---

### 👤 Usuario

**Puede hacer:**
- ✅ Ver tareas asignadas a él
- ✅ Marcar tareas como completadas
- ✅ Actualizar subtareas
- ✅ Agregar comentarios
- ✅ Ver proyectos donde está asignado
- ✅ Mover tareas en el tablero (drag & drop)

**NO puede hacer:**
- ❌ Crear proyectos
- ❌ Crear tareas
- ❌ Editar detalles de tareas (título, descripción, prioridad)
- ❌ Asignar tareas a otros
- ❌ Crear usuarios

**Interfaz:**
- No ve botón "Crear Proyecto"
- No ve botón "Crear Usuario"
- No ve botón "+" en las columnas
- Badge azul "Usuario" con icono de persona
- Mensaje: "El administrador te asignará proyectos y tareas pronto"

---

## 🚀 Cómo Funciona

### 1️⃣ Primer Usuario = Admin Automático

Cuando el **primer usuario** se registra en el sistema:
- Automáticamente recibe el rol de **Administrador**
- Puede comenzar a crear proyectos y usuarios inmediatamente
- Ve un mensaje informativo en el registro

```javascript
// Lógica en backend/routes/auth.js
const userCount = await User.countDocuments();
const isFirstUser = userCount === 0;

const user = await User.create({
  ...userData,
  role: isFirstUser ? 'administrador' : (role || 'usuario'),
});
```

---

### 2️⃣ Admin Crea Más Usuarios

El administrador puede crear usuarios adicionales:

1. Va al Dashboard
2. Click en "Crear Usuario"
3. Rellena el formulario:
   - Nombre
   - Email
   - Contraseña
   - **Rol**: Usuario o Administrador

---

### 3️⃣ Protección de Rutas Backend

Las rutas están protegidas con middleware:

```javascript
// Solo admins
router.post('/projects', protect, isAdmin, async (req, res) => {...});
router.post('/tasks', protect, isAdmin, async (req, res) => {...});
router.post('/auth/create-user', protect, isAdmin, async (req, res) => {...});

// Usuarios pueden actualizar solo su estado
router.put('/tasks/:id', protect, async (req, res) => {
  const isAdmin = req.user.role === 'administrador';
  const isAssigned = task.assignedTo.toString() === req.user._id.toString();
  
  if (!isAdmin && !isAssigned) {
    return res.status(403).json({ message: 'Sin permisos' });
  }
  // ...
});
```

---

### 4️⃣ Interfaz Adaptativa

La UI se adapta automáticamente al rol:

```jsx
const isAdmin = user?.role === 'administrador';

{isAdmin && (
  <button onClick={() => setShowCreateModal(true)}>
    Crear Proyecto
  </button>
)}

{!isAdmin && projects.length === 0 && (
  <div>El administrador te asignará proyectos pronto</div>
)}
```

---

## 📁 Archivos Modificados/Creados

### Backend

✅ **Nuevos archivos:**
- `backend/middleware/roleAuth.js` - Middleware de autorización por roles

✅ **Archivos modificados:**
- `backend/routes/auth.js` - Registro con roles, crear usuarios, listar usuarios
- `backend/routes/projects.js` - Protección con `isAdmin`
- `backend/routes/tasks.js` - Protección diferenciada (admin vs usuario)

### Frontend

✅ **Nuevos archivos:**
- `frontend/src/components/CreateUserModal.jsx` - Modal para crear usuarios

✅ **Archivos modificados:**
- `frontend/src/services/api.js` - Nuevos endpoints (getAllUsers, createUser)
- `frontend/src/pages/Dashboard.jsx` - Interfaz adaptativa por rol
- `frontend/src/pages/Board.jsx` - Botón crear tarea solo para admins
- `frontend/src/pages/Register.jsx` - Mensaje informativo primer usuario

---

## 🔒 Seguridad

### Validaciones Implementadas

1. **Token JWT requerido** en todas las rutas protegidas
2. **Verificación de rol** en middleware antes de ejecutar acciones críticas
3. **Validación de permisos** en cada operación sensible
4. **Usuario solo puede editar sus tareas asignadas**
5. **Admin tiene control total pero respeta lógica de negocio**

---

## 🧪 Cómo Probar

### Paso 1: Crear Primer Usuario (Admin)

1. Abre http://localhost:5173
2. Ve a "Crear cuenta"
3. Registra el primer usuario
4. Automáticamente será **Administrador**
5. Verás en el Dashboard: botones "Crear Usuario" y "Nuevo Proyecto"

### Paso 2: Crear un Usuario Regular

1. Como admin, click en "Crear Usuario"
2. Completa el formulario:
   - Nombre: "Usuario Test"
   - Email: usuario@test.com
   - Contraseña: 123456
   - Rol: **Usuario** (no administrador)
3. Click "Crear Usuario"

### Paso 3: Crear Proyecto y Tarea

1. Como admin, click "Nuevo Proyecto"
2. Crea un proyecto
3. Entra al proyecto (tablero Kanban)
4. Click en "+" en cualquier columna
5. Crea una tarea y **asígnala al usuario test**

### Paso 4: Probar Como Usuario

1. Cierra sesión (botón logout)
2. Inicia sesión como "usuario@test.com"
3. Verás el proyecto (porque tienes tareas asignadas)
4. Entra al tablero
5. **No verás** el botón "+" para crear tareas
6. Pero **SÍ puedes**:
   - Abrir la tarea
   - Marcar subtareas
   - Cambiar estado a completado
   - Agregar comentarios
   - Mover la tarea entre columnas

---

## 🎨 Diferencias Visuales

### Dashboard - Admin
```
┌─────────────────────────────────────────┐
│ 👑 Administrador                  [🌙] │
├─────────────────────────────────────────┤
│ Bienvenido, Admin 👋                    │
│ Panel de administración - Crea          │
│ proyectos, tareas y gestiona usuarios   │
│                                         │
│      [👤 Crear Usuario] [+ Nuevo       │
│                            Proyecto]    │
└─────────────────────────────────────────┘
```

### Dashboard - Usuario
```
┌─────────────────────────────────────────┐
│ 👤 Usuario                        [🌙] │
├─────────────────────────────────────────┤
│ Bienvenido, Usuario 👋                  │
│ Visualiza y completa las tareas         │
│ asignadas a ti                          │
│                                         │
│ (Sin botones de creación)               │
└─────────────────────────────────────────┘
```

### Tablero Kanban - Admin
```
┌────────────────────────────────────┐
│ Pendiente              [+]         │
├────────────────────────────────────┤
│ [Tarea 1]                          │
│ [Tarea 2]                          │
└────────────────────────────────────┘
     ↑ Botón + visible
```

### Tablero Kanban - Usuario
```
┌────────────────────────────────────┐
│ Pendiente                          │
├────────────────────────────────────┤
│ [Tarea 1] ← Solo sus tareas        │
└────────────────────────────────────┘
     ↑ Sin botón +
```

---

## 🔑 Endpoints API Nuevos

```bash
# Obtener todos los usuarios (solo admin)
GET /api/auth/users
Authorization: Bearer {token}

# Crear usuario (solo admin)
POST /api/auth/create-user
Authorization: Bearer {token}
Body: {
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "123456",
  "role": "usuario"
}
```

---

## 💡 Casos de Uso

### Caso 1: Empresa con Gerente y Empleados

- **Gerente** (Admin):
  - Crea proyectos para diferentes departamentos
  - Crea tareas y las asigna a empleados
  - Supervisa el progreso
  - Crea cuentas para nuevos empleados

- **Empleados** (Usuarios):
  - Ven solo sus tareas asignadas
  - Marcan tareas como completadas
  - Comentan dudas o actualizaciones

### Caso 2: Freelancer con Clientes

- **Freelancer** (Admin):
  - Crea proyectos por cliente
  - Define tareas y entregables
  - Invita a clientes como usuarios (opcional)

- **Clientes** (Usuarios):
  - Ven el progreso
  - Comentan feedback
  - No pueden modificar el proyecto

---

## ✅ Ventajas del Sistema

1. **Seguridad**: Solo admins gestionan estructura del proyecto
2. **Simplicidad**: Usuarios no se confunden con muchas opciones
3. **Control**: Admin tiene visibilidad y control total
4. **Colaboración**: Usuarios participan sin romper nada
5. **Escalable**: Fácil agregar más roles en el futuro

---

## 🚀 Próximos Pasos Sugeridos

1. **Roles adicionales**: Project Manager, Viewer (solo lectura)
2. **Permisos granulares**: Por proyecto o tarea
3. **Notificaciones**: Avisar cuando te asignan tarea
4. **Historial**: Ver quién hizo qué cambio
5. **Reportes**: Dashboard de productividad por usuario

---

**Estado:** ✅ Sistema de roles completamente funcional  
**Fecha:** 23 de octubre de 2025  
**Versión:** 1.0.0
