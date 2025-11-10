// Middleware para verificar roles de usuario

// Middleware para verificar que el usuario sea administrador
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'administrador') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Acceso denegado. Se requieren permisos de administrador.' 
    });
  }
};

// Middleware para verificar que el usuario sea admin o owner del recurso
export const isAdminOrOwner = (resourceUserId) => {
  return (req, res, next) => {
    if (req.user && (req.user.role === 'administrador' || req.user._id.toString() === resourceUserId.toString())) {
      next();
    } else {
      res.status(403).json({ 
        message: 'Acceso denegado. No tienes permisos para realizar esta acción.' 
      });
    }
  };
};

// Middleware flexible para verificar múltiples roles
export const hasRole = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ 
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}` 
      });
    }
  };
};
