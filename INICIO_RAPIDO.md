# 🚀 Guía de Inicio Rápido  Nexus

## Instalación en 3 pasos

### 1️⃣ Instalar dependencias

```powershell
.\install.ps1
```

Este script:
 ✅ Verifica Node.js y MongoDB
 ✅ Instala dependencias del backend y frontend
 ✅ Crea el archivo .env desde .env.example

### 2️⃣ Configurar variables de entorno

Edita `backend/.env`:

```env
# Configuración mínima para empezar
MONGODB_URI=mongodb://localhost:27017/proyecto_nexus
JWT_SECRET=cambia_esto_por_una_clave_segura
FRONTEND_URL=http://localhost:5173

# Opcional: Google OAuth (puedes dejarlo vacío por ahora)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### 3️⃣ Iniciar la aplicación

```powershell
.\start.ps1
```

Esto iniciará:
 🔹 Backend en http://localhost:5000
 🔹 Frontend en http://localhost:5173

## Primer Uso

1. **Abre tu navegador** en http://localhost:5173
2. **Crea una cuenta** con email y contraseña
3. **Crea tu primer proyecto** haciendo clic en "Nuevo Proyecto"
4. **Agrega tareas** haciendo clic en el botón "+" de cualquier columna
5. **¡Disfruta!** Arrastra tareas, agrega comentarios y colabora

## Comandos Útiles

### Desarrollo

```powershell
# Instalar todo
.\install.ps1

# Iniciar todo (backend + frontend)
.\start.ps1

# Solo backend
cd backend
npm run dev

# Solo frontend
cd frontend
npm run dev
```

### Producción

```powershell
# Construir frontend
cd frontend
npm run build

# Iniciar backend en producción
cd backend
npm start
```

## Solución Rápida de Problemas

### ❌ MongoDB no conecta
```powershell
# Opción 1: Iniciar MongoDB local
mongod

# Opción 2: Usar MongoDB Atlas
# Regístrate en https://www.mongodb.com/atlas/database
# Obtén tu connection string y actualiza MONGODB_URI
```

### ❌ Puerto 5000 en uso
```powershell
# Cambia el puerto en backend/.env
PORT=5001
```

### ❌ Error de CORS
```powershell
# Verifica que FRONTEND_URL en backend/.env sea correcto
FRONTEND_URL=http://localhost:5173
```

## Características Principales

### ✅ Sin configuración compleja
 No necesitas configurar Google OAuth para empezar
 Solo email y contraseña

### 🎨 Interfaz Simple
 Diseño limpio y moderno
 Modo claro/oscuro
 Responsive (móvil y desktop)

### ⚡ Tiempo Real
 Los cambios se reflejan instantáneamente
 Socket.IO para colaboración

### 🔐 Seguro
 Contraseñas encriptadas con bcrypt
 JWT para sesiones
 CORS configurado

## Próximos Pasos

 📖 Lee el [README.md](README.md) completo
 🎨 Personaliza los colores de tus proyectos
 👥 Invita miembros a tus proyectos (próximamente)
 📊 Visualiza el progreso de tus tareas

## Soporte

¿Problemas? Revisa:
1. Que MongoDB esté corriendo
2. Que el archivo .env esté configurado
3. Que ambos servidores estén iniciados
4. Los logs en la consola



**¡Listo para gestionar tus proyectos de forma simple! 🚀**

