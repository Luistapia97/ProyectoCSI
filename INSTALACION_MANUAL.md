#  Guía de Instalación Manual - Proyectos CSI

Esta guía te ayudará a instalar y configurar el proyecto después de clonar el repositorio.

---

##  Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior) - [Descargar](https://nodejs.org/)
- **MongoDB** (versión 6 o superior) - [Descargar](https://www.mongodb.com/try/download/community)
- **Git** - [Descargar](https://git-scm.com/)
- **Editor de código** (recomendado: VS Code)

Para verificar que tienes todo instalado:

```powershell
node --version
npm --version
mongod --version
git --version
```

---

##  Paso 1: Clonar el Repositorio

```powershell
git clone https://github.com/Luistapia97/ProyectoCSI.git
cd ProyectoCSI
```

---

##  Paso 2: Configurar el Backend

### 2.1 Instalar Dependencias del Backend

```powershell
cd backend
npm install
```

### 2.2 Crear Archivo de Configuración (.env)

Crea un archivo `.env` en la carpeta `backend`:

```powershell
# En PowerShell
New-Item .env -ItemType File
```

Abre el archivo `.env` y agrega la siguiente configuración:

```env
# Puerto del servidor
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/proyecto-csi

# JWT Secret (cambia esto por una cadena aleatoria segura)
JWT_SECRET=tu_secreto_super_seguro_aqui_123456

# Session Secret (cambia esto también)
SESSION_SECRET=otra_cadena_secreta_para_sesiones_456789

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Zoho OAuth (OPCIONAL - solo si usarás login con Zoho)
ZOHO_CLIENT_ID=tu_zoho_client_id
ZOHO_CLIENT_SECRET=tu_zoho_client_secret
ZOHO_REDIRECT_URI=http://localhost:5000/api/auth/zoho/callback

# Código de registro para administradores
ADMIN_REGISTRATION_CODE=NEXUS2025
```

**Notas importantes:**
- Cambia `JWT_SECRET` y `SESSION_SECRET` por cadenas aleatorias seguras
- Si no vas a usar Zoho OAuth, puedes omitir esas líneas
- `ADMIN_REGISTRATION_CODE` es el código que necesitarán los administradores para registrarse

### 2.3 Crear Directorio de Uploads

```powershell
# Asegúrate de estar en la carpeta backend
mkdir uploads
```

---

##  Paso 3: Configurar el Frontend

### 3.1 Instalar Dependencias del Frontend

```powershell
# Regresa a la raíz del proyecto
cd ..
cd frontend
npm install
```

### 3.2 Configurar Variables de Entorno (OPCIONAL)

Si necesitas cambiar la URL del backend, crea un archivo `.env` en la carpeta `frontend`:

```env
VITE_API_URL=http://localhost:5000/api
```

**Nota:** El frontend detecta automáticamente la URL del backend, por lo que este paso es opcional.

---

##  Paso 4: Configurar MongoDB

### 4.1 Iniciar MongoDB

**Opción A: MongoDB como Servicio (Windows)**
```powershell
# MongoDB debería iniciarse automáticamente
# Verificar si está corriendo:
Get-Service MongoDB
```

**Opción B: Iniciar MongoDB Manualmente**
```powershell
# En una terminal separada:
mongod --dbpath "C:\data\db"
```

### 4.2 Verificar Conexión (OPCIONAL)

```powershell
# Abrir MongoDB Shell
mongosh
# Debería conectarse a mongodb://localhost:27017
```

---

##  Paso 5: Ejecutar el Proyecto

Necesitarás **2 terminales abiertas**: una para el backend y otra para el frontend.

### Terminal 1: Ejecutar Backend

```powershell
cd backend
npm run dev
```

Deberías ver algo como:
```
Servidor corriendo en puerto 5000
Socket.IO listo para conexiones en tiempo real
MongoDB conectado exitosamente
✓ Zoho OAuth configurado correctamente
```

### Terminal 2: Ejecutar Frontend

```powershell
cd frontend
npm run dev
```

Deberías ver algo como:
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.85:5173/
```

---

##  Paso 6: Acceder a la Aplicación

Abre tu navegador y ve a:

```
http://localhost:5173
```

---

##  Paso 7: Crear Primer Usuario

### Opción 1: Registro de Administrador

1. En la pantalla de login, haz clic en **"Registro de Admin"**
2. Completa el formulario:
   - Nombre
   - Email
   - Contraseña
   - Código de Admin: `NEXUS2025` (o el que configuraste en `.env`)
3. Haz clic en **"Registrar Administrador"**

**Límite:** Solo se pueden registrar 3 administradores.

### Opción 2: Registro de Usuario Regular

1. En la pantalla de login, haz clic en **"Regístrate como Usuario"**
2. Completa el formulario:
   - Nombre
   - Email
   - Contraseña
3. Haz clic en **"Crear cuenta"**

**Sin límite:** Puedes crear usuarios ilimitados.

---

##  Configurar Zoho OAuth (OPCIONAL)

Si quieres permitir login con Zoho:

### 1. Crear Aplicación en Zoho

1. Ve a [Zoho API Console](https://api-console.zoho.com/)
2. Clic en **"Add Client"** → **"Server-based Applications"**
3. Completa:
   - **Client Name:** Proyectos CSI
   - **Homepage URL:** http://localhost:5173
   - **Authorized Redirect URIs:** http://localhost:5000/api/auth/zoho/callback

### 2. Obtener Credenciales

1. Copia el **Client ID** y **Client Secret**
2. Agrégalos al archivo `.env` del backend:

```env
ZOHO_CLIENT_ID=1000.XXXXXXXXXXXXXXX
ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Reiniciar Backend

```powershell
# Detén el backend (Ctrl+C) y vuelve a ejecutar:
npm run dev
```

---

##  Estructura del Proyecto

```
ProyectoCSI/
├── backend/
│   ├── config/          # Configuraciones (DB, Passport, Multer)
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Middlewares (auth, errorHandler)
│   ├── models/          # Modelos de MongoDB
│   ├── routes/          # Rutas de la API
│   ├── services/        # Servicios (recordatorios, Zoho)
│   ├── uploads/         # Archivos subidos
│   ├── .env             # Variables de entorno (NO incluido en Git)
│   ├── package.json
│   └── server.js        # Punto de entrada
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Páginas de la aplicación
│   │   ├── services/    # API y Socket.io
│   │   └── store/       # Estado global (Zustand)
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

##  Solución de Problemas

### Error: "MongoDB connection failed"

**Solución:**
1. Verifica que MongoDB está corriendo:
   ```powershell
   Get-Service MongoDB
   ```
2. Si no está corriendo, inícialo:
   ```powershell
   Start-Service MongoDB
   ```

### Error: "EADDRINUSE: address already in use"

**Causa:** El puerto 5000 o 5173 ya está en uso.

**Solución:**
1. Encuentra el proceso:
   ```powershell
   netstat -ano | findstr :5000
   ```
2. Termina el proceso:
   ```powershell
   taskkill /PID <número_pid> /F
   ```

### Error: "Cannot find module..."

**Solución:**
```powershell
# Eliminar node_modules y reinstalar
rm -r node_modules
rm package-lock.json
npm install
```

### El frontend no se conecta al backend

**Solución:**
1. Verifica que el backend esté corriendo en http://localhost:5000
2. Revisa la consola del navegador (F12) para errores de CORS
3. Asegúrate que `FRONTEND_URL` en `.env` coincida con la URL del frontend

### No puedo subir archivos

**Solución:**
1. Verifica que la carpeta `backend/uploads/` existe
2. Si no existe, créala:
   ```powershell
   cd backend
   mkdir uploads
   ```

---

##  Seguridad para Producción

Cuando despliegues a producción, asegúrate de:

1. ✓ Cambiar `JWT_SECRET` y `SESSION_SECRET` por valores aleatorios seguros
2. ✓ Cambiar `ADMIN_REGISTRATION_CODE` por un código personalizado
3. ✓ Actualizar `FRONTEND_URL` con tu dominio real
4. ✓ Usar HTTPS en producción
5. ✓ Configurar MongoDB con autenticación
6. ✓ Usar variables de entorno del servidor (no subir `.env` a Git)

---

##  Funcionalidades Disponibles

Una vez instalado, podrás:

- ✅ Crear y gestionar proyectos
- ✅ Tablero Kanban con drag & drop
- ✅ Asignar tareas a usuarios
- ✅ Sistema de notificaciones en tiempo real
- ✅ Comentarios en tareas
- ✅ Archivos adjuntos (hasta 10MB)
- ✅ Recordatorios automáticos de tareas
- ✅ Validación de tareas por administradores
- ✅ Roles: Administrador y Usuario
- ✅ Login con email/contraseña o Zoho OAuth
- ✅ Temas claro/oscuro

---

##  Soporte

Si encuentras algún problema durante la instalación:

1. Revisa la sección de **Solución de Problemas** arriba
2. Verifica los logs en las terminales del backend y frontend
3. Revisa el repositorio en GitHub: https://github.com/Luistapia97/ProyectoCSI

---

## Listo!

Tu instalación está completa. Ahora puedes:

1. Crear tu primer proyecto
2. Agregar tareas al tablero Kanban
3. Invitar a otros usuarios
4. Gestionar tu flujo de trabajo

**¡Feliz gestión de proyectos!** 
