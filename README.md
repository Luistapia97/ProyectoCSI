# 🚀 Nexus  Plataforma de Gestión de Trabajo

Una aplicación web moderna y simple para la gestión de tareas y proyectos colaborativos, con interfaz tipo Kanban, drag & drop, y colaboración en tiempo real.

![Nexus](https://img.shields.io/badge/Version1.0.0blue)
![License](https://img.shields.io/badge/LicenseMITgreen)

## 🌐 Acceso desde Red Local

**¡NUEVO!** Ahora puedes acceder a Nexus desde tu celular, tablet u otros dispositivos en tu red local.

📱 **Ver guía completa**: [ACCESO_RED_LOCAL.md](./ACCESO_RED_LOCAL.md)

**Inicio Rápido:**
1. Ejecuta `configurefirewall.ps1` como Administrador
2. Inicia backend y frontend
3. Accede desde otro dispositivo usando tu IP: `http://192.168.1.XX:5173`



## ✨ Características Principales

### 🔐 Autenticación
 Login con email/contraseña
 Integración con Google OAuth
 JWT para sesiones seguras
 Roles de usuario y administrador
 Sincronización automática entre pestañas

### 📊 Gestión de Proyectos
 Crear, editar y eliminar proyectos
 Asignar colores y etiquetas personalizadas
 Vista tipo tablero Kanban
 Estadísticas de progreso en tiempo real
 Miembros se agregan automáticamente al asignar tareas

### ✅ Gestión de Tareas
 Crear tareas rápidas con título y fecha
 Añadir comentarios tipo chat
 Etiquetas y prioridades (baja, media, alta, urgente)
 Subtareas opcionales
 Drag & drop entre columnas
 Asignación múltiple de usuarios
 Sistema de validación de tareas

### � Integración con Google Calendar
 Sincronizar tareas con Google Calendar
 Crear eventos automáticamente
 Actualizar fechas en ambas plataformas
 Eliminar sincronización cuando sea necesario

### �👥 Colaboración
 Agregar miembros a proyectos
 Comentarios en tiempo real con Socket.IO
 Notificaciones internas
 Avatares y perfiles de usuario

### 📈 Analytics y Reportes
 Dashboard con gráficos interactivos
 Estadísticas de tareas por estado
 Análisis de progreso
 Visualización con Recharts

### 🎨 Diseño UX/UI
 Interfaz limpia y minimalista
 Modo claro/oscuro
 Microinteracciones suaves
 Responsive design
 Colores suaves con contraste claro
 Accesible desde cualquier dispositivo

## 🛠️ Tecnologías

### Backend
 **Node.js** + **Express**  Servidor y API REST
 **MongoDB** + **Mongoose**  Base de datos
 **Socket.IO**  Comunicación en tiempo real
 **JWT**  Autenticación
 **Passport.js**  Google OAuth
 **Google Calendar API**  Integración de calendario
 **Bcrypt**  Encriptación de contraseñas

### Frontend
 **React 18**  Librería UI
 **Vite**  Build tool y dev server
 **Zustand**  State management
 **@hellopangea/dnd**  Drag and drop
 **Lucide React**  Iconos
 **datefns**  Manejo de fechas
 **Axios**  HTTP client

## 📦 Instalación

### Prerrequisitos
 Node.js 18+ 
 MongoDB 6+ (local o Atlas)
 NPM o Yarn

### 1. Clonar el repositorio
```bash
git clone <turepositorio>
cd Proyecto_Nexus
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` en la carpeta `backend`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/proyecto_nexus
JWT_SECRET=tu_clave_secreta_super_segura
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### 3. Configurar Frontend

```bash
cd ../frontend
npm install
```

### 4. Iniciar MongoDB

```bash
# Si usas MongoDB local
mongod
```

O usa MongoDB Atlas (cloud) y actualiza `MONGODB_URI` en el `.env`

### 5. Iniciar la aplicación

**Terminal 1  Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2  Frontend:**
```bash
cd frontend
npm run dev
```

La aplicación estará disponible en:
 Frontend: http://localhost:5173
 Backend: http://localhost:5000

## 🔑 Configurar Google OAuth (Opcional)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita la API de Google+
4. Crea credenciales OAuth 2.0
5. Agrega las URIs autorizadas:
    `http://localhost:5000/api/auth/google/callback`
    `http://localhost:5173`
6. Copia el Client ID y Client Secret al `.env`

## 📖 Uso

### Flujo de Usuario

1. **Registrarse/Login**  Crea una cuenta o usa Google
2. **Crear Proyecto**  Click en "Nuevo Proyecto"
3. **Agregar Tareas**  Click en "+" en cualquier columna
4. **Arrastrar Tareas**  Mueve tareas entre columnas
5. **Ver Detalles**  Click en una tarea para ver/editar
6. **Comentar**  Agrega comentarios tipo chat
7. **Completar**  Marca tareas como completadas

### Estructura del Proyecto

```
Proyecto_Nexus/
├── backend/
│   ├── config/          # Configuración DB
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Auth, validaciones
│   ├── models/          # Modelos Mongoose
│   ├── routes/          # Rutas API
│   ├── utils/           # Utilidades
│   └── server.js        # Punto de entrada
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas/Vistas
│   │   ├── services/    # API calls, Socket
│   │   ├── store/       # Zustand stores
│   │   └── App.jsx      # Componente raíz
│   └── index.html
│
└── README.md
```

## 🎯 Características Avanzadas (Próximamente)

 [ ] Vista de calendario semanal/mensual
 [ ] Sincronización con Google Calendar
 [ ] Notificaciones por email
 [ ] Modo enfoque/minimal
 [ ] Gráficos de progreso avanzados
 [ ] Exportar proyectos a PDF
 [ ] Aplicación móvil (React Native)

## 🐛 Solución de Problemas

### Error: Cannot connect to MongoDB
```bash
# Asegúrate de que MongoDB esté corriendo
mongod dbpath /ruta/a/tu/db
```

### Error: Port 5000 already in use
```bash
# Cambia el puerto en backend/.env
PORT=5001
```

### Error: CORS issues
 Verifica que `FRONTEND_URL` en `.env` sea correcto
 Asegúrate de que ambos servidores estén corriendo

## 📄 Licencia

MIT License  siéntete libre de usar este proyecto para aprender o para tus propios proyectos.

## 👤 Autor

Creado con ❤️ para aprender y practicar desarrollo Full Stack.

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout b feature/AmazingFeature`)
3. Commit tus cambios (`git commit m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:
 Abre un issue en GitHub
 Revisa la documentación
 Contacta al equipo de desarrollo



**¡Hecho con dedicación para hacer la gestión de proyectos más simple! 🚀**

