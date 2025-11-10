# 🔐 Sistema de Registro Separado - Admins y Usuarios

## ✅ Implementación Completada

Se ha implementado un sistema de registro completamente separado con las siguientes características:

---

## 🎯 Características Principales

### 1. **Registro de Administradores (Máximo 3)**
- ✅ Ruta exclusiva: `/register-admin`
- ✅ Requiere **código secreto** de administrador
- ✅ Límite de **3 administradores** en total
- ✅ Muestra contador de espacios disponibles
- ✅ Validación de código en backend

### 2. **Registro de Usuarios (Ilimitado)**
- ✅ Ruta estándar: `/register`
- ✅ Sin límite de usuarios
- ✅ No requiere código especial
- ✅ Acceso simplificado

### 3. **Base de Datos Limpia**
- ✅ Script para borrar todos los usuarios
- ✅ Ejecutado exitosamente
- ✅ Listo para empezar desde cero

---

## 🚀 Cómo Usar el Sistema

### 📋 Paso 1: Registrar Administradores

1. **Abre la aplicación**: http://localhost:5173
2. **Ve a Login** y click en "Registro de Admin"
3. **Completa el formulario**:
   - Nombre
   - Email
   - Contraseña
   - **Código de Admin**: `NEXUS2025`
4. Click en "Registrar Administrador"

**Límite**: Solo se pueden registrar **3 administradores**.

#### 🔑 Código de Administrador
```
NEXUS2025
```
*Este código está configurado en `backend/.env` como `ADMIN_REGISTRATION_CODE`*

---

### 👤 Paso 2: Registrar Usuarios

1. **Ve a Login** y click en "Regístrate como Usuario"
2. **Completa el formulario**:
   - Nombre
   - Email
   - Contraseña
3. Click en "Crear cuenta"

**Sin límite**: Puedes crear usuarios ilimitados.

---

## 📁 Archivos Creados/Modificados

### 🆕 Nuevos Archivos

#### Backend:
1. **`backend/scripts/clearUsers.js`**
   - Script para eliminar todos los usuarios de la BD
   - Útil para reiniciar el sistema

#### Frontend:
1. **`frontend/src/pages/RegisterAdmin.jsx`**
   - Página exclusiva de registro para administradores
   - Muestra contador de espacios disponibles (X/3)
   - Campo para código secreto
   - Validación en tiempo real

---

### 📝 Archivos Modificados

#### Backend:
1. **`backend/routes/auth.js`**
   - Nueva ruta: `POST /api/auth/register-admin`
     - Valida código de administrador
     - Verifica límite de 3 admins
     - Crea admin con rol 'administrador'
   - Ruta modificada: `POST /api/auth/register`
     - Ahora solo crea usuarios regulares
     - Rol fijo: 'usuario'
   - Nueva ruta: `GET /api/auth/admin-count`
     - Devuelve cantidad de admins registrados
     - Muestra espacios disponibles

2. **`backend/.env`**
   - Nueva variable: `ADMIN_REGISTRATION_CODE=NEXUS2025`

#### Frontend:
1. **`frontend/src/services/api.js`**
   - Nuevo endpoint: `registerAdmin(data)`
   - Nuevo endpoint: `getAdminCount()`

2. **`frontend/src/store/authStore.js`**
   - Nueva función: `registerAdmin(userData)`

3. **`frontend/src/App.jsx`**
   - Nueva ruta: `/register-admin`

4. **`frontend/src/pages/Register.jsx`**
   - Eliminado mensaje de "primer usuario = admin"
   - Agregado enlace a registro de admin

5. **`frontend/src/pages/Login.jsx`**
   - Agregado enlace a registro de admin

---

## 🔒 Seguridad Implementada

### Validaciones Backend

1. **Código de Administrador**
   ```javascript
   const ADMIN_CODE = process.env.ADMIN_REGISTRATION_CODE || 'NEXUS2025';
   if (adminCode !== ADMIN_CODE) {
     return res.status(403).json({ 
       message: 'Código de administrador incorrecto' 
     });
   }
   ```

2. **Límite de 3 Administradores**
   ```javascript
   const adminCount = await User.countDocuments({ role: 'administrador' });
   if (adminCount >= 3) {
     return res.status(403).json({ 
       message: 'Ya existen 3 administradores. No se pueden registrar más.' 
     });
   }
   ```

3. **Rol Fijo por Endpoint**
   - `/register` → Siempre crea 'usuario'
   - `/register-admin` → Siempre crea 'administrador' (con validaciones)

---

## 🎨 Interfaz de Usuario

### Página de Registro de Admin

```
┌──────────────────────────────────────────┐
│         🛡️ Registro de Administrador     │
│   Acceso exclusivo para administradores  │
├──────────────────────────────────────────┤
│                                          │
│  ℹ️  2 de 3 espacios disponibles         │
│  Ya hay 1 administrador registrado.      │
│  Puedes registrar 2 más.                 │
│                                          │
│  Nombre: [________________]              │
│  Email:  [________________]              │
│  Contraseña: [___________]               │
│  Confirmar:  [___________]               │
│  🔑 Código Admin: [_______]              │
│     (Solicita este código al admin)      │
│                                          │
│      [Registrar Administrador]           │
│                                          │
│  ¿Eres usuario regular? Regístrate aquí  │
│  ¿Ya tienes cuenta? Inicia sesión        │
└──────────────────────────────────────────┘
```

### Página de Registro de Usuario

```
┌──────────────────────────────────────────┐
│         👤 Crear cuenta                   │
│     Únete a Nexus y gestiona tus tareas  │
├──────────────────────────────────────────┤
│                                          │
│  ℹ️  Registro de Usuario: Los usuarios   │
│  pueden ver y completar las tareas       │
│  asignadas por los administradores.      │
│  ¿Eres administrador? Click aquí         │
│                                          │
│  Nombre: [________________]              │
│  Email:  [________________]              │
│  Contraseña: [___________]               │
│  Confirmar:  [___________]               │
│                                          │
│         [Crear cuenta]                   │
│                                          │
│  ¿Ya tienes cuenta? Inicia sesión        │
└──────────────────────────────────────────┘
```

---

## 📊 Flujo de Registro

### Flujo Admin

```
Usuario → /register-admin
    ↓
Completa formulario + Código
    ↓
Backend valida código
    ↓
Backend verifica límite (< 3)
    ↓
Crea usuario con role='administrador'
    ↓
Retorna token + mensaje "Admin creado (X/3)"
    ↓
Redirect a Dashboard con permisos completos
```

### Flujo Usuario

```
Usuario → /register
    ↓
Completa formulario (sin código)
    ↓
Backend crea usuario con role='usuario'
    ↓
Retorna token
    ↓
Redirect a Dashboard (vista limitada)
```

---

## 🧪 Pruebas

### Test 1: Registrar Primer Admin
```bash
1. Ir a: http://localhost:5173/register-admin
2. Llenar formulario
3. Código: NEXUS2025
4. ✅ Debería crear admin 1/3
```

### Test 2: Registrar Segundo y Tercer Admin
```bash
1. Logout
2. Repetir proceso con diferentes emails
3. ✅ Debería crear admin 2/3 y 3/3
```

### Test 3: Intentar Cuarto Admin
```bash
1. Intentar registrar un cuarto admin
2. ❌ Debería mostrar: "Ya existen 3 administradores"
3. ✅ Formulario deshabilitado
```

### Test 4: Registrar Usuarios
```bash
1. Ir a: http://localhost:5173/register
2. Crear múltiples usuarios
3. ✅ Sin límite, todos con role='usuario'
```

### Test 5: Código Incorrecto
```bash
1. Ir a registro de admin
2. Usar código incorrecto
3. ❌ Debería mostrar: "Código de administrador incorrecto"
```

---

## 🔧 Configuración

### Cambiar Código de Administrador

Edita `backend/.env`:
```env
ADMIN_REGISTRATION_CODE=TU_CODIGO_SECRETO_AQUI
```

### Cambiar Límite de Administradores

Edita `backend/routes/auth.js`:
```javascript
// Cambiar de 3 a otro número
if (adminCount >= 5) { // Ejemplo: 5 admins
  return res.status(403).json({ 
    message: 'Ya existen 5 administradores...' 
  });
}
```

### Limpiar Base de Datos

Ejecuta el script:
```bash
cd backend
node scripts/clearUsers.js
```

---

## 📡 Endpoints API

### Nuevos Endpoints

```bash
# Registrar administrador
POST /api/auth/register-admin
Body: {
  "name": "Admin Principal",
  "email": "admin@empresa.com",
  "password": "123456",
  "adminCode": "NEXUS2025"
}
Response: {
  "success": true,
  "message": "Administrador creado exitosamente (1/3)",
  "user": {...},
  "token": "..."
}

# Registrar usuario regular
POST /api/auth/register
Body: {
  "name": "Usuario Test",
  "email": "usuario@test.com",
  "password": "123456"
}
Response: {
  "success": true,
  "user": {...},
  "token": "..."
}

# Obtener cantidad de admins
GET /api/auth/admin-count
Response: {
  "success": true,
  "count": 2,
  "max": 3,
  "available": 1
}
```

---

## ✅ Ventajas del Sistema

1. **Separación Clara**
   - Admins y usuarios tienen procesos de registro distintos
   - No hay confusión sobre qué tipo de cuenta crear

2. **Seguridad**
   - Solo quien tiene el código puede crear admins
   - Límite previene creación masiva de admins

3. **Control**
   - Máximo 3 administradores garantiza gobernanza
   - Usuarios ilimitados para escalar el equipo

4. **Flexibilidad**
   - Código configurable por empresa
   - Límite ajustable según necesidades

5. **UX Mejorada**
   - Contador en tiempo real (X/3 disponibles)
   - Mensajes claros de validación
   - Enlaces cruzados entre registros

---

## 🎯 Casos de Uso

### Caso 1: Empresa Pequeña
- **3 fundadores** → Registran como admins
- **10 empleados** → Registran como usuarios
- Admins gestionan proyectos, usuarios ejecutan

### Caso 2: Agencia
- **Director + 2 Project Managers** → Admins
- **Diseñadores, devs, etc.** → Usuarios
- Jerarquía clara de responsabilidades

### Caso 3: Startup
- **CTO + 2 leads técnicos** → Admins
- **Developers junior/mid** → Usuarios
- Control sobre arquitectura y tareas

---

## 🚀 Estado Actual

✅ **Sistema completamente funcional**
- Backend con validaciones robustas
- Frontend con UI intuitiva
- Base de datos limpia y lista
- Documentación completa

### URLs Disponibles

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Login**: http://localhost:5173/login
- **Registro Usuario**: http://localhost:5173/register
- **Registro Admin**: http://localhost:5173/register-admin

---

## 🎊 ¡Listo para Usar!

El sistema está **100% operativo**. Puedes:

1. ✅ Registrar hasta 3 administradores con código `NEXUS2025`
2. ✅ Registrar usuarios ilimitados
3. ✅ Cada tipo tiene su flujo separado
4. ✅ Validaciones en frontend y backend

**¡Empieza creando tu primer administrador!** 🚀

---

**Fecha de implementación**: 23 de octubre de 2025  
**Versión**: 2.0.0  
**Estado**: ✅ Producción
