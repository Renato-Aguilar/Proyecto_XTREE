const pool = require('../config/db');

// Middleware para verificar si el usuario está autenticado
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  
  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Debes iniciar sesión para acceder a esta página');
  res.redirect('/login');
};

// Middleware para verificar si el usuario es invitado (no autenticado)
const isGuest = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return next();
  }
  
  res.redirect('/');
};

// Middleware para cargar información del usuario y contador del carrito
const loadUser = async (req, res, next) => {
  // Cargar mensajes flash
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  
  // Si hay usuario autenticado, cargar sus datos
  if (req.session && req.session.userId) {
    res.locals.user = {
      id: req.session.userId,
      nombre: req.session.userName || '',
      apellido: req.session.userLastName || '',
      email: req.session.userEmail || '',
      username: req.session.userUsername || '',
      direccion: req.session.userAddress || ''
    };

    // Cargar contador del carrito (suma de cantidades)
    try {
      const [count] = await pool.query(
        'SELECT SUM(cantidad) as total FROM carritos WHERE id_usuario = ?',
        [req.session.userId]
      );
      res.locals.cartCount = count[0].total || 0;
    } catch (error) {
      console.error('Error al cargar contador del carrito:', error);
      res.locals.cartCount = 0;
    }
  } else {
    res.locals.user = null;
    res.locals.cartCount = 0;
  }
  
  next();
};

module.exports = {
  isAuthenticated,
  isGuest,
  loadUser
};