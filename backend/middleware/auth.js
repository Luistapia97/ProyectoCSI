import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener usuario del token (incluyendo zohoAccessToken para envío de emails)
      req.user = await User.findById(decoded.id).select('password');

      if (!req.user) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }

      next();
    } catch (error) {
      console.error('Error en autenticación:', error);
      return res.status(401).json({ message: 'No autorizado, token inválido' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No autorizado, sin token' });
  }
};

// Middleware para verificar si es administrador
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'administrador') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado: se requieren permisos de administrador' });
  }
};

// Generar JWT
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

