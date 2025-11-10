import express from 'express';
import passport from 'passport';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

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

    // Verificar si ya existen 3 administradores
    const adminCount = await User.countDocuments({ role: 'administrador' });
    if (adminCount >= 3) {
      return res.status(403).json({ 
        message: 'Ya existen 3 administradores. No se pueden registrar más.' 
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
      message: `Administrador creado exitosamente (${adminCount + 1}/3)`,
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
      
      // Guardar la URL de origen del frontend para redireccionar correctamente
      const referer = req.get('referer') || req.get('origin');
      if (referer) {
        try {
          const url = new URL(referer);
          const frontendOrigin = `${url.protocol}//${url.host}`;
          res.cookie('frontend_origin', frontendOrigin, {
            httpOnly: true,
            maxAge: 10 * 60 * 1000, // 10 minutos
            sameSite: 'lax'
          });
          console.log(`🌐 Frontend origin guardado: ${frontendOrigin}`);
        } catch (e) {
          console.error('Error parseando referer:', e);
        }
      }
      
      if (registerType === 'admin') {
        console.log('🔐 Registro de administrador solicitado via Zoho');
        // Guardar en una cookie temporal que el callback puede leer
        res.cookie('register_type', 'admin', { 
          httpOnly: true, 
          maxAge: 5 * 60 * 1000, // 5 minutos
          sameSite: 'lax'
        });
      } else {
        console.log('👤 Login/Registro de usuario regular via Zoho');
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
    passport.authenticate('zoho', { 
      session: false, 
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` 
    }),
    async (req, res) => {
      try {
        // Obtener la URL del frontend dinámicamente
        const frontendURL = getFrontendURL(req);
        console.log(`🌐 Redirigiendo a frontend: ${frontendURL}`);
        
        // Limpiar las cookies
        res.clearCookie('register_type');
        res.clearCookie('frontend_origin');
        
        if (!req.user) {
          console.error('❌ No se recibió usuario después de Zoho OAuth');
          return res.redirect(`${frontendURL}/login?error=no_user`);
        }

        console.log('✅ Usuario autenticado con Zoho:', req.user.email);
        console.log('🆔 ID del usuario:', req.user._id);
        console.log('👤 Rol del usuario:', req.user.role);

        // Verificar que el usuario realmente existe en la base de datos
        const userExists = await User.findById(req.user._id);
        if (!userExists) {
          console.error('❌ Usuario no encontrado en BD después de OAuth');
          return res.redirect(`${frontendURL}/login?error=user_not_saved`);
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
      console.log('📥 Solicitud de completar registro recibida');
      const { tempToken, email, name } = req.body;
      console.log('📧 Email recibido:', email);
      console.log('🎫 Token recibido:', tempToken ? 'Sí' : 'No');

      if (!tempToken || !email) {
        console.log('❌ Faltan datos requeridos');
        return res.status(400).json({ message: 'Token y email son requeridos' });
      }

      // Verificar el token temporal
      const jwt = await import('jsonwebtoken');
      let decoded;
      try {
        decoded = jwt.default.verify(tempToken, process.env.JWT_SECRET);
        console.log('✅ Token verificado, ID de usuario:', decoded.id);
      } catch (error) {
        console.log('❌ Error al verificar token:', error.message);
        return res.status(401).json({ message: 'Token inválido o expirado' });
      }

      // Buscar el usuario con el ID del token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log('❌ Usuario no encontrado con ID:', decoded.id);
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      console.log('👤 Usuario encontrado:', user.email);

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
        console.log('🗑️ Usuario temporal eliminado');
        
        // Generar token para el usuario existente
        const token = generateToken(existingUser._id);
        
        console.log('✅ Cuenta vinculada exitosamente');
        return res.json({
          success: true,
          user: existingUser.toPublicJSON(),
          token,
          message: 'Cuenta vinculada exitosamente'
        });
      }

      console.log('📝 Actualizando usuario con email real');
      // Si no existe, actualizar el usuario actual con el email y nombre real
      user.email = email;
      if (name) {
        user.name = name;
      }
      await user.save();

      console.log('✅ Usuario actualizado con email real:', email);

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
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleAuth.js';

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
      max: 3,
      available: 3 - adminCount,
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

export default router;
