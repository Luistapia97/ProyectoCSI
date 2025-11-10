# 📧 Flujo de Notificación de Tareas - Explicación Completa

## 🔍 ¿Cómo sabe el sistema dónde enviar la notificación?

El sistema obtiene automáticamente el **email del usuario** cuando se asigna una tarea. Aquí está el flujo completo:

---

## 📊 Flujo Paso a Paso

### **1. Creación de la Tarea** (POST /api/tasks)

Cuando creas una tarea, envías un array de IDs de usuarios asignados:

```javascript
// Request Body
{
  "title": "Implementar login",
  "description": "Crear sistema de autenticación",
  "project": "64abc123...",
  "assignedTo": [
    "64user001...",  // ID de María
    "64user002...",  // ID de Juan
    "64user003..."   // ID de Pedro
  ],
  "dueDate": "2025-11-15",
  "priority": "high"
}
```

### **2. Guardado en Base de Datos**

La tarea se guarda con los IDs de los usuarios:

```javascript
const task = await Task.create({
  title: "Implementar login",
  assignedTo: ["64user001...", "64user002...", "64user003..."],
  // ... otros campos
});
```

### **3. Populate - Obtención de Datos Completos** ⭐

Aquí está la **magia**. El sistema usa `.populate()` de MongoDB para obtener la información completa de los usuarios:

```javascript
const populatedTask = await Task.findById(task._id)
  .populate('assignedTo', 'name email avatar')
  .populate('createdBy', 'name email avatar zohoAccessToken');
```

**Antes del populate:**
```javascript
assignedTo: ["64user001...", "64user002...", "64user003..."]
```

**Después del populate:**
```javascript
assignedTo: [
  {
    _id: "64user001...",
    name: "María García",
    email: "maria.garcia@example.com",
    avatar: "https://..."
  },
  {
    _id: "64user002...",
    name: "Juan Pérez",
    email: "juan.perez@zohomail.com",
    avatar: "https://..."
  },
  {
    _id: "64user003...",
    name: "Pedro López",
    email: "pedro.lopez@gmail.com",
    avatar: "https://..."
  }
]
```

### **4. Envío de Emails** 📧

El sistema itera por cada usuario asignado y envía el email:

```javascript
// Código actual en backend/routes/tasks.js (líneas 166-183)
for (const userId of assignedTo) {
  // Buscar el usuario completo en el array populado
  const assignedUser = populatedTask.assignedTo.find(
    u => u._id.toString() === userId.toString()
  );
  
  if (assignedUser) {
    // Aquí assignedUser tiene: name, email, avatar
    const emailResult = await sendTaskAssignmentEmail(
      populatedTask,     // Datos de la tarea
      assignedUser,      // Usuario destino con su email
      req.user           // Usuario que asigna (con su email y token)
    );
    
    if (emailResult.success) {
      console.log(`✅ Email enviado a ${assignedUser.email}`);
      // Muestra: "✅ Email enviado a maria.garcia@example.com"
    }
  }
}
```

---

## 📋 Información del Usuario en Base de Datos

Cada usuario en MongoDB tiene estos campos (modelo User.js):

```javascript
{
  _id: "64user001...",
  name: "María García",
  email: "maria.garcia@example.com",  // ← Este campo se usa para enviar el email
  avatar: "https://ui-avatars.com/api/?name=Maria+Garcia",
  role: "usuario",
  
  // Si tiene cuenta de Zoho
  zohoId: "zoho123...",
  zohoAccessToken: "1000.abc123...",
  zohoRefreshToken: "1000.def456...",
  authProvider: "zoho"
}
```

---

## 🎯 ¿De Dónde Sale el Email del Usuario?

### **Opción 1: Registro Local** (Email Manual)

Cuando un usuario se registra con el formulario normal:

```javascript
// Frontend: Register.jsx
const userData = {
  name: "María García",
  email: "maria.garcia@example.com",  // ← Usuario lo ingresa
  password: "password123"
};

// Backend: auth.js
const user = await User.create({
  name: userData.name,
  email: userData.email,  // ← Se guarda en BD
  password: hashedPassword,
  authProvider: 'local'
});
```

### **Opción 2: Login con Zoho** (Email de Zoho)

Cuando un usuario inicia sesión con Zoho:

```javascript
// Backend: passport.js (líneas 60-90)
// Zoho devuelve el token ID con la información del usuario
const decoded = jwt.decode(params.id_token);
const userEmail = decoded.email;  // ← Email de la cuenta de Zoho

// Buscar o crear usuario
let user = await User.findOne({ email: userEmail });

if (!user) {
  user = await User.create({
    email: userEmail,           // ← Email de Zoho
    name: decoded.name,
    zohoId: decoded.sub,
    zohoAccessToken: accessToken,
    authProvider: 'zoho'
  });
}
```

### **Opción 3: Login con Google** (Email de Google)

```javascript
// Similar a Zoho, pero con Google OAuth
const userEmail = googleProfile.email;
```

---

## 🔄 Ejemplo Completo de Flujo

### Escenario: Administrador asigna tarea a 3 usuarios

**1. Usuarios en la BD:**
```javascript
// Usuario 1 (registrado local)
{
  _id: "64user001",
  name: "María García",
  email: "maria.garcia@example.com"
}

// Usuario 2 (login con Zoho)
{
  _id: "64user002",
  name: "Juan Pérez",
  email: "juan.perez@zohomail.com",
  zohoAccessToken: "1000.abc123..."
}

// Usuario 3 (login con Google)
{
  _id: "64user003",
  name: "Pedro López",
  email: "pedro.lopez@gmail.com"
}
```

**2. Administrador crea tarea:**
```javascript
POST /api/tasks
{
  "title": "Revisar documentación",
  "assignedTo": ["64user001", "64user002", "64user003"]
}
```

**3. Sistema hace populate:**
```javascript
const populatedTask = await Task.findById(task._id)
  .populate('assignedTo', 'name email avatar');

// populatedTask.assignedTo ahora contiene los 3 usuarios completos
```

**4. Sistema envía emails:**
```javascript
// Iteración 1: María
Email enviado a: maria.garcia@example.com
Método: SMTP (no tiene cuenta Zoho)

// Iteración 2: Juan
Email enviado a: juan.perez@zohomail.com
Método: Zoho Mail (tiene token)
Desde: cuenta del administrador en Zoho

// Iteración 3: Pedro
Email enviado a: pedro.lopez@gmail.com
Método: SMTP (no tiene cuenta Zoho)
```

**5. Logs en consola:**
```
📧 Enviando notificaciones por email...
🔵 Intentando enviar email desde Zoho Mail...
✅ Email enviado desde Zoho Mail
   De: admin@zohomail.com
   Para: maria.garcia@example.com
   Tarea: Revisar documentación

🔵 Intentando enviar email desde Zoho Mail...
✅ Email enviado desde Zoho Mail
   De: admin@zohomail.com
   Para: juan.perez@zohomail.com
   Tarea: Revisar documentación

📧 Enviando email usando SMTP...
✅ Email enviado: <message-id>
   Para: pedro.lopez@gmail.com
   Tarea: Revisar documentación
```

---

## 🛠️ ¿Qué Pasa Si...?

### ❓ ¿El usuario no tiene email?

El sistema detecta esto y no envía el email:

```javascript
if (!assignedUser.email) {
  console.log('⚠️ Usuario sin email, no se puede enviar notificación:', assignedUser.name);
  return { success: false, reason: 'no_email' };
}
```

### ❓ ¿El email es inválido?

El envío falla pero no bloquea la creación de la tarea:

```javascript
try {
  // Intentar enviar email
} catch (error) {
  console.error('❌ Error enviando emails:', error);
  // No bloqueamos la creación de la tarea si falla el envío de emails
}
```

### ❓ ¿El usuario cambió su email?

El email se actualiza cuando:
1. El usuario edita su perfil (si implementado)
2. Vuelve a hacer login con OAuth (actualiza automáticamente)

---

## 📝 Código Relevante

### 1. Populate en tasks.js (línea 145-147):
```javascript
const populatedTask = await Task.findById(task._id)
  .populate('assignedTo', 'name email avatar')
  .populate('createdBy', 'name email avatar');
```

### 2. Obtener usuario del array (línea 168):
```javascript
const assignedUser = populatedTask.assignedTo.find(
  u => u._id.toString() === userId.toString()
);
```

### 3. Enviar email (línea 171-174):
```javascript
const emailResult = await sendTaskAssignmentEmail(
  populatedTask,  // Tarea completa
  assignedUser,   // {name, email, avatar}
  req.user        // Usuario que asigna
);
```

---

## ✅ Resumen

**Pregunta:** *"¿Cómo sabe el sistema dónde enviar la notificación?"*

**Respuesta:**

1. **Obtiene el ID del usuario** de `assignedTo` en la tarea
2. **Hace populate** para obtener datos completos del usuario desde MongoDB
3. **Extrae el email** del objeto usuario populado
4. **Envía el correo** a ese email usando Zoho Mail o SMTP

**El email siempre viene de la base de datos**, donde se guardó cuando el usuario:
- Se registró manualmente (ingresó su email)
- Inició sesión con Zoho (Zoho proporcionó su email)
- Inició sesión con Google (Google proporcionó su email)

**No necesitas configurar nada adicional** - el sistema ya tiene toda la información que necesita. ✨

---

## 🎓 Conceptos Clave

- **Populate**: Función de MongoDB que "rellena" referencias con objetos completos
- **ObjectId**: ID único que referencia a otro documento en MongoDB
- **Schema Reference**: Define qué campos traer cuando se hace populate

```javascript
// Definición en Task.js
assignedTo: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'  // ← Indica que debe buscar en la colección User
}]
```
