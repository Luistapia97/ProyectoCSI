import express from 'express';
import passport from 'passport';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import { generateToken, protect, admin as isAdmin } from '../middleware/auth.js';
import { cloudinary, isConfigured as isCloudinaryConfigured } from '../config/cloudinary.js';

const router = express.Router();

// Configuración de multer para subir avatares
// Si Cloudinary está configurado, usar memoria; sino, disco
const storage = isCloudinaryConfigured() 
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = 'uploads/avatars';
        // Crear directorio si no existe
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
});

/**
 * Obtener la URL del frontend dinámicamente
 * Soporta acceso desde localhost o IP de red local
 */
function getFrontendURL(req) {
  // 1. Intentar obtener de la cookie que guardamos
  if (req.cookies && req.cookies.frontend_origin) {
    return req.cookies.frontend_origin;
  }
  
  // 2. Intentar obtener del header Referer
  const referer = req.get('referer') || req.get('origin');
  if (referer) {
    try {
      const url = new URL(referer);
      // Extraer protocolo + host (ej: http://192.168.1.85:5173)
      return `${url.protocol}//${url.host}`;
    } catch (e) {
      console.error('Error parseando referer:', e);
    }
  }
  
  // 3. Fallback a la variable de entorno
  return process.env.FRONTEND_URL || 'http://localhost:5173';
}

// @route   POST /api/auth/register-admin
// @desc    Registrar administrador (máximo 3)
// @access  Public
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password, adminCode } = req.body;

    // Validaciones
    if (!name || !email || !password || !adminCode) {
      return res.status(400).json({ message: 'Por favor completa todos los campos' });
    }

    // Verificar código de administrador (puedes cambiarlo por uno más seguro)
    const ADMIN_CODE = process.env.ADMIN_REGISTRATION_CODE || 'NEXUS2025';
    if (adminCode !== ADMIN_CODE) {
      return res.status(403).json({ message: 'Código de administrador incorrecto' });
    }

    // Verificar si ya existen 4 administradores
    const adminCount = await User.countDocuments({ role: 'administrador' });
    if (adminCount >= 4) {
      return res.status(403).json({ 
        message: 'Ya existen 4 administradores. No se pueden registrar más.' 
      });
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Crear administrador
    const user = await User.create({
      name,
      email,
      password,
      role: 'administrador',
      avatar: `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(name)}`,
    });

    res.status(201).json({
      success: true,
      message: `Administrador creado exitosamente (${adminCount + 1}/4)`,
      user: user.toPublicJSON(),
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Error en registro de admin:', error);
    res.status(500).json({ message: 'Error al registrar administrador', error: error.message });
  }
});

// @route   POST /api/auth/register
// @desc    Registrar usuario regular
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validaciones
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Por favor completa todos los campos' });
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Crear usuario regular
    const user = await User.create({
      name,
      email,
      password,
      role: 'usuario',
      avatar: `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(name)}`,
    });

    res.status(201).json({
      success: true,
      user: user.toPublicJSON(),
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login con email y contraseña
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ message: 'Por favor ingresa email y contraseña' });
    }

    // Buscar usuario
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    res.json({
      success: true,
      user: user.toPublicJSON(),
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Verificar si Zoho OAuth está configurado
const isZohoConfigured = process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET;

// @route   GET /api/auth/zoho
// @desc    Iniciar login con Zoho (Zoho Assist compatible)
// @access  Public
if (isZohoConfigured) {
  router.get(
    '/zoho',
    (req, res, next) => {
      // Capturar el parámetro register y guardarlo en la sesión temporalmente
      const registerType = req.query.register;
      
      // Capturar la URL del frontend desde el parámetro (más confiable que referer)
      const frontendURL = req.query.frontend || req.get('referer') || req.get('origin');
      if (frontendURL) {
        try {
          const url = new URL(frontendURL);
          const frontendOrigin = `${url.protocol}//${url.host}`;
          res.cookie('frontend_origin', frontendOrigin, {
            httpOnly: true,
            maxAge: 10 * 60 * 1000, // 10 minutos
            sameSite: 'lax'
          });
          console.log(`Frontend origin guardado: ${frontendOrigin}`);
        } catch (e) {
          console.error('Error parseando frontend URL:', e);
        }
      }
      
      if (registerType === 'admin') {
        console.log('Registro de administrador solicitado via Zoho');
        // Guardar en una cookie temporal que el callback puede leer
        res.cookie('register_type', 'admin', { 
          httpOnly: true, 
          maxAge: 5 * 60 * 1000, // 5 minutos
          sameSite: 'lax'
        });
      } else {
        console.log('Login/Registro de usuario regular via Zoho');
        res.cookie('register_type', 'user', { 
          httpOnly: true, 
          maxAge: 5 * 60 * 1000,
          sameSite: 'lax'
        });
      }
      
      next();
    },
    passport.authenticate('zoho', { 
      session: false,
      accessType: 'offline',
      prompt: 'consent'
    })
  );

  // @route   GET /api/auth/zoho/callback
  // @desc    Callback de Zoho OAuth
  // @access  Public
  router.get(
    '/zoho/callback',
    (req, res, next) => {
      console.log('🔄 Callback de Zoho recibido');
      console.log('   URL completa:', req.originalUrl);
      console.log('   Query params:', req.query);
      
      passport.authenticate('zoho', { 
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`
      }, (err, user, info) => {
        if (err) {
          console.error('❌ Error en autenticación de Zoho:', err.message);
          console.error('   Stack:', err.stack);
          return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed&details=${encodeURIComponent(err.message)}`);
        }
        
        if (!user) {
          console.error('❌ No se pudo autenticar usuario');
          console.error('   Info:', info);
          return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed&reason=no_user`);
        }
        
        req.user = user;
        next();
      })(req, res, next);
    },
    async (req, res) => {
      try {
        // Obtener la URL del frontend dinámicamente
        const frontendURL = getFrontendURL(req);
        console.log(`Redirigiendo a frontend: ${frontendURL}`);
        
        // Limpiar las cookies
        res.clearCookie('register_type');
        res.clearCookie('frontend_origin');
        
        if (!req.user) {
          console.error('❌ No se recibió usuario después de Zoho OAuth');
          return res.redirect(`${frontendURL}/login?error=no_user`);
        }

        console.log('✓ Usuario autenticado con Zoho:', req.user.email);
        console.log('ID del usuario:', req.user._id);
        console.log('Rol del usuario:', req.user.role);
        console.log('Estado del usuario:', req.user.status);

        // Verificar que el usuario realmente existe en la base de datos
        const userExists = await User.findById(req.user._id);
        if (!userExists) {
          console.error('❌ Usuario no encontrado en BD después de OAuth');
          return res.redirect(`${frontendURL}/login?error=user_not_saved`);
        }

        // Verificar si el usuario está pendiente de aprobación
        if (userExists.status === 'pending') {
          console.log('⏳ Usuario pendiente de aprobación por administrador');
          return res.redirect(`${frontendURL}/login?error=pending_approval&email=${encodeURIComponent(userExists.email)}`);
        }

        // Verificar si el usuario fue rechazado
        if (userExists.status === 'rejected') {
          console.log('❌ Usuario rechazado por administrador');
          return res.redirect(`${frontendURL}/login?error=access_rejected`);
        }

        const isTemporary = req.user.email.includes('@temp.nexus.local');
        
        // SIEMPRE generar token y redirigir al dashboard
        // Ya sea con email temporal o real
        console.log('✅ Generando token y redirigiendo al dashboard');
        const token = generateToken(req.user._id);
        
        // Si es temporal, agregar parámetro para mostrar aviso
        if (isTemporary) {
          return res.redirect(`${frontendURL}/auth-success?token=${token}&incomplete=true`);
        }
        
        return res.redirect(`${frontendURL}/auth-success?token=${token}`);
        
      } catch (error) {
        console.error('❌ Error en callback de Zoho:', error);
        const frontendURL = getFrontendURL(req);
        res.redirect(`${frontendURL}/login?error=callback_error`);
      }
    }
  );

  // @route   POST /api/auth/zoho/complete
  // @desc    Completar registro de Zoho con email real
  // @access  Public (requiere tempToken)
  router.post('/zoho/complete', async (req, res) => {
    try {
      console.log('Solicitud de completar registro recibida');
      const { tempToken, email, name } = req.body;
      console.log('Email recibido:', email);
      console.log('Token recibido:', tempToken ? 'Sí' : 'No');

      if (!tempToken || !email) {
        console.log('✗ Faltan datos requeridos');
        return res.status(400).json({ message: 'Token y email son requeridos' });
      }

      // Verificar el token temporal
      const jwt = await import('jsonwebtoken');
      let decoded;
      try {
        decoded = jwt.default.verify(tempToken, process.env.JWT_SECRET);
        console.log('✓ Token verificado, ID de usuario:', decoded.id);
      } catch (error) {
        console.log('✗ Error al verificar token:', error.message);
        return res.status(401).json({ message: 'Token inválido o expirado' });
      }

      // Buscar el usuario con el ID del token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log('✗ Usuario no encontrado con ID:', decoded.id);
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      console.log('Usuario encontrado:', user.email);

      // Verificar si ya existe un usuario con ese email
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      
      if (existingUser) {
        // Si existe un usuario con ese email, vincular el zohoId a esa cuenta
        console.log('🔗 Vinculando cuenta de Zoho a usuario existente:', email);
        
        existingUser.zohoId = user.zohoId;
        existingUser.zohoAccessToken = user.zohoAccessToken;
        existingUser.zohoRefreshToken = user.zohoRefreshToken;
        existingUser.authProvider = 'zoho';
        await existingUser.save();
        
        // Eliminar el usuario temporal
        await User.findByIdAndDelete(user._id);
        console.log('Usuario temporal eliminado');
        
        // Generar token para el usuario existente
        const token = generateToken(existingUser._id);
        
        console.log('✓ Cuenta vinculada exitosamente');
        return res.json({
          success: true,
          user: existingUser.toPublicJSON(),
          token,
          message: 'Cuenta vinculada exitosamente'
        });
      }

      console.log('Actualizando usuario con email real');
      // Si no existe, actualizar el usuario actual con el email y nombre real
      user.email = email;
      if (name) {
        user.name = name;
      }
      await user.save();

      console.log('✓ Usuario actualizado con email real:', email);

      // Generar nuevo token con la información actualizada
      const token = generateToken(user._id);

      res.json({
        success: true,
        user: user.toPublicJSON(),
        token
      });
    } catch (error) {
      console.error('❌ Error al completar registro de Zoho:', error);
      res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
    }
  });
} else {
  // Rutas deshabilitadas si Zoho OAuth no está configurado
  router.get('/zoho', (req, res) => {
    res.status(503).json({ message: 'Zoho OAuth no está configurado en el servidor' });
  });
  
  router.get('/zoho/callback', (req, res) => {
    res.status(503).json({ message: 'Zoho OAuth no está configurado en el servidor' });
  });
}

// @route   GET /api/auth/me
// @desc    Obtener usuario actual
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: req.user.toPublicJSON(),
  });
});

// @route   POST /api/auth/add-password
// @desc    Agregar contraseña a cuenta de OAuth
// @access  Private
router.post('/add-password', protect, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'La contraseña es requerida' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si ya tiene contraseña
    if (user.password && user.password !== 'undefined') {
      return res.status(400).json({ message: 'Este usuario ya tiene una contraseña configurada' });
    }

    // Establecer la contraseña (se hasheará automáticamente por el middleware del modelo)
    user.password = password;
    await user.save();

    console.log('✅ Contraseña agregada al usuario:', user.email);

    res.json({
      success: true,
      message: 'Contraseña agregada exitosamente. Ahora puedes iniciar sesión con email y contraseña.',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('❌ Error al agregar contraseña:', error);
    res.status(500).json({ message: 'Error al agregar contraseña', error: error.message });
  }
});

// @route   GET /api/auth/admin-count
// @desc    Obtener cantidad de administradores registrados
// @access  Public
router.get('/admin-count', async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'administrador' });
    res.json({
      success: true,
      count: adminCount,
      max: 4,
      available: 4 - adminCount,
    });
  } catch (error) {
    console.error('Error obteniendo cantidad de admins:', error);
    res.status(500).json({ message: 'Error al obtener información', error: error.message });
  }
});

// @route   GET /api/auth/debug-users (TEMPORAL)
// @desc    Ver usuarios con email info@proyectoscsi.mx
// @access  Public
router.get('/debug-users', async (req, res) => {
  try {
    const users = await User.find({ 
      $or: [
        { email: 'info@proyectoscsi.mx' },
        { email: { $regex: '@temp.nexus.local$' } }
      ]
    }).select('email name authProvider zohoId zohoAccessToken');
    res.json({
      success: true,
      count: users.length,
      users: users.map(u => ({
        email: u.email,
        name: u.name,
        authProvider: u.authProvider,
        zohoId: u.zohoId,
        hasZohoToken: !!u.zohoAccessToken
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// @route   DELETE /api/auth/delete-zoho-accounts (TEMPORAL)
// @desc    Eliminar todas las cuentas de Zoho
// @access  Public (TEMPORAL - ELIMINAR DESPUÉS)
router.delete('/delete-zoho-accounts', async (req, res) => {
  try {
    const result = await User.deleteMany({ authProvider: 'zoho' });
    res.json({
      success: true,
      message: `Se eliminaron ${result.deletedCount} cuentas de Zoho`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error eliminando cuentas de Zoho:', error);
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// @route   GET /api/auth/users
// @desc    Obtener todos los usuarios (solo admin)
// @access  Private (Admin only)
router.get('/users', protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
});

// @route   POST /api/auth/create-user
// @desc    Crear un usuario (solo admin)
// @access  Private (Admin only)
router.post('/create-user', protect, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validaciones
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Por favor completa todos los campos' });
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Crear usuario
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'usuario',
      avatar: `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(name)}`,
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
});

// @route   GET /api/auth/pending-users
// @desc    Obtener usuarios pendientes de aprobación
// @access  Private (Admin only)
router.get('/pending-users', protect, isAdmin, async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' })
      .select('name email avatar createdAt authProvider')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users: pendingUsers,
      count: pendingUsers.length,
    });
  } catch (error) {
    console.error('Error obteniendo usuarios pendientes:', error);
    res.status(500).json({ message: 'Error al obtener usuarios pendientes', error: error.message });
  }
});

// @route   POST /api/auth/approve-user/:id
// @desc    Aprobar usuario pendiente
// @access  Private (Admin only)
router.post('/approve-user/:id', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ message: 'El usuario no está pendiente de aprobación' });
    }

    user.status = 'approved';
    await user.save();

    console.log(`✅ Usuario aprobado: ${user.email} por ${req.user.email}`);

    res.json({
      success: true,
      message: `Usuario ${user.name} aprobado exitosamente`,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Error aprobando usuario:', error);
    res.status(500).json({ message: 'Error al aprobar usuario', error: error.message });
  }
});

// @route   POST /api/auth/reject-user/:id
// @desc    Rechazar usuario pendiente
// @access  Private (Admin only)
router.post('/reject-user/:id', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ message: 'El usuario no está pendiente de aprobación' });
    }

    user.status = 'rejected';
    await user.save();

    console.log(`❌ Usuario rechazado: ${user.email} por ${req.user.email}`);

    res.json({
      success: true,
      message: `Usuario ${user.name} rechazado`,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Error rechazando usuario:', error);
    res.status(500).json({ message: 'Error al rechazar usuario', error: error.message });
  }
});
// @route   DELETE /api/auth/users/:id
// @desc    Eliminar usuario (solo admin)
// @access  Private (Admin only)
router.delete('/users/:id', protect, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // No permitir que el admin se elimine a sí mismo
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Eliminar el usuario
    await User.findByIdAndDelete(userId);

    console.log(`🗑️ Usuario eliminado: ${user.email} por ${req.user.email}`);

    res.json({
      success: true,
      message: `Usuario ${user.name} eliminado exitosamente`,
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
});
// @route   PUT /api/auth/profile
// @desc    Actualizar perfil de usuario
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar campos si se proporcionan
    if (name) user.name = name;
    if (email && email !== user.email) {
      // Verificar que el email no esté en uso
      const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ message: 'El email ya está en uso' });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
  }
});

// @route   POST /api/auth/upload-avatar
// @desc    Subir foto de perfil
// @access  Private
router.post('/upload-avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    let avatarUrl;

    // Si Cloudinary está configurado, subir allí
    if (isCloudinaryConfigured()) {
      // Eliminar avatar anterior de Cloudinary si existe
      if (user.avatar && user.avatar.includes('cloudinary.com')) {
        const publicId = user.avatar.split('/').pop().split('.')[0];
        try {
          await cloudinary.uploader.destroy(`avatars/${publicId}`);
        } catch (error) {
          console.log('No se pudo eliminar avatar anterior de Cloudinary:', error.message);
        }
      }

      // Subir nueva imagen a Cloudinary
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'avatars',
            public_id: `avatar-${req.user._id}-${Date.now()}`,
            transformation: [
              { width: 500, height: 500, crop: 'fill', gravity: 'face' },
              { quality: 'auto:good' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      const result = await uploadPromise;
      avatarUrl = result.secure_url;
    } else {
      // Modo local: eliminar avatar anterior si existe
      if (user.avatar && user.avatar.startsWith('/uploads/')) {
        const oldAvatarPath = path.join(process.cwd(), user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Guardar ruta local
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    // Actualizar usuario
    user.avatar = avatarUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar actualizado exitosamente',
      avatar: user.avatar,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Error subiendo avatar:', error);
    res.status(500).json({ message: 'Error al subir avatar', error: error.message });
  }
});

// @route   DELETE /api/auth/avatar
// @desc    Eliminar foto de perfil y usar iniciales
// @access  Private
router.delete('/avatar', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Eliminar de Cloudinary si está configurado y es una URL de Cloudinary
    if (isCloudinaryConfigured() && user.avatar && user.avatar.includes('cloudinary.com')) {
      const publicId = user.avatar.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(`avatars/${publicId}`);
      } catch (error) {
        console.log('No se pudo eliminar avatar de Cloudinary:', error.message);
      }
    }
    
    // Eliminar archivo local si existe
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const avatarPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Generar avatar con iniciales del email
    const emailInitials = user.email.substring(0, 2).toUpperCase();
    user.avatar = `https://ui-avatars.com/api/?background=6366f1&color=fff&name=${emailInitials}&bold=true`;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar eliminado, usando iniciales del correo',
      avatar: user.avatar,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Error eliminando avatar:', error);
    res.status(500).json({ message: 'Error al eliminar avatar', error: error.message });
  }
});

export default router;
