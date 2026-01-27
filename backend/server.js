import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { networkInterfaces } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno PRIMERO
dotenv.config();

// Debug: Verificar que las variables se cargaron
console.log('Variables de entorno de Zoho:');
console.log('   ZOHO_CLIENT_ID:', process.env.ZOHO_CLIENT_ID ? '✓ Cargado' : '✗ NO ENCONTRADO');
console.log('   ZOHO_CLIENT_SECRET:', process.env.ZOHO_CLIENT_SECRET ? '✓ Cargado' : '✗ NO ENCONTRADO');
console.log('   ZOHO_REDIRECT_URI:', process.env.ZOHO_REDIRECT_URI || 'No definido (usará default)');

// Ahora importar módulos que dependen de variables de entorno
import connectDB from './config/database.js';
import './config/passport.js'; // Configuración de Passport
// Mongoose logging deshabilitado en producción
// import { setupMongooseLogging } from './middleware/mongooseLogger.js';

// Conectar a la base de datos
connectDB();

// Mongoose logging solo en desarrollo
// if (process.env.NODE_ENV === 'development') {
//   setupMongooseLogging();
// }

const app = express();
const httpServer = createServer(app);

// Configurar CORS para permitir acceso desde red local Y producción
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

// Agregar URL de producción si existe
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
  console.log('✓ Frontend de producción agregado a CORS:', process.env.FRONTEND_URL);
}

// Agregar todas las IPs locales posibles
const nets = networkInterfaces();
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
    if (net.family === familyV4Value && !net.internal) {
      allowedOrigins.push(`http://${net.address}:5173`);
      allowedOrigins.push(`http://${net.address}:5174`);
    }
  }
}

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Permitir requests sin origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      
      // Permitir si está en la lista
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Permitir cualquier IP local (192.168.x.x, 10.x.x.x, 172.x.x.x)
      const localIpPattern = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):\d+$/;
      if (localIpPattern.test(origin)) {
        return callback(null, true);
      }
      
      callback(new Error('No permitido por CORS'));
    },
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Permitir si está en la lista
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Permitir cualquier IP local (192.168.x.x, 10.x.x.x, 172.x.x.x)
    const localIpPattern = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):\d+$/;
    if (localIpPattern.test(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Agregar cookie-parser ANTES de las rutas

// Configurar headers para UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Servir archivos estáticos (avatares y otros uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configurar sesión para Passport con MongoDB store (producción-ready)
app.use(session({
  secret: process.env.SESSION_SECRET || 'nexus-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600, // Solo actualizar sesión cada 24 horas (lazy update)
    crypto: {
      secret: process.env.SESSION_SECRET || 'nexus-secret-key-2024'
    }
  }),
  proxy: process.env.NODE_ENV === 'production', // Confiar en proxy (Render usa proxy)
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' permite cookies entre dominios en HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
  },
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Hacer io disponible en las rutas
app.set('io', io);

// Iniciar servicio de recordatorios
import ReminderService from './services/reminderService.js';
const reminderService = new ReminderService(io);
reminderService.start();

// Hacer reminderService disponible en las rutas
app.set('reminderService', reminderService);

// Iniciar servicio de tareas programadas (reportes)
import cronJobService from './services/cronJobs.js';
cronJobService.initializeJobs();
console.log('✅ Servicio de tareas programadas iniciado');

// Rutas de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API de Proyecto Nexus está funcionando',
    version: '1.0.0'
  });
});

// Socket.io para notificaciones en tiempo real
io.on('connection', (socket) => {
  console.log('✅ Usuario conectado:', socket.id);

  // Unirse al room del usuario para notificaciones personales
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`Usuario ${socket.id} unido a su room personal: user-${userId}`);
  });

  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    console.log(`Usuario ${socket.id} unido al proyecto ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Usuario desconectado:', socket.id);
  });
});

// Importar rutas
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Middleware 404 - Rutas no encontradas
app.use((req, res, next) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Manejador de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Escuchar en todas las interfaces de red

httpServer.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Socket.IO listo para conexiones en tiempo real`);
  console.log(`Acceso local: http://localhost:${PORT}`);
  
  // Mostrar IPs de red local
  const nets = networkInterfaces();
  
  console.log('\nAcceso desde red local:');
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
      if (net.family === familyV4Value && !net.internal) {
        console.log(`   http://${net.address}:${PORT}`);
      }
    }
  }
  console.log('');
});
