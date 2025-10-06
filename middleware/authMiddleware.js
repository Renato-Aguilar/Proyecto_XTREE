const pool = require('../config/db');

// Middleware: Protege rutas que requieren autenticación
// Si el usuario NO está logueado, redirige a /login
const isAuthenticated = (req, res, next) => {
  // Verificar si existe sesión activa con userId
  if (req.session && req.session.userId) {
    return next(); // Usuario autenticado, continuar
  }
  
  // Guardar URL a la que intentaba acceder para redirigir después del login
  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Debes iniciar sesión para acceder a esta página');
  res.redirect('/login');
};

// Middleware: Protege rutas que solo invitados pueden ver (login, register)
// Si el usuario YA está logueado, redirige al inicio
const isGuest = (req, res, next) => {
  // Si NO hay sesión o NO hay userId, es invitado
  if (!req.session || !req.session.userId) {
    return next(); // Usuario invitado, continuar
  }
  
  // Usuario ya autenticado, no necesita ver login/register
  res.redirect('/');
};

// Middleware: Carga datos del usuario en TODAS las vistas (res.locals)
// Se ejecuta en cada request antes de renderizar cualquier página
const loadUser = async (req, res, next) => {
  // Cargar mensajes flash (success/error) para mostrar en las vistas
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  
  // Si hay usuario autenticado, cargar sus datos
  if (req.session && req.session.userId) {
    // Pasar datos del usuario a las vistas vía res.locals
    res.locals.user = {
      id: req.session.userId,
      nombre: req.session.userName || '',
      apellido: req.session.userLastName || '',
      email: req.session.userEmail || '',
      username: req.session.userUsername || '',
      direccion: req.session.userAddress || ''
    };

    // Consultar BD para obtener el total de packs en el carrito
    // Esto actualiza el contador del navbar en tiempo real
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
    // Usuario no autenticado, valores por defecto
    res.locals.user = null;
    res.locals.cartCount = 0;
  }
  
  next(); // Continuar con la siguiente función
};

module.exports = {
  isAuthenticated,  // Usar en rutas protegidas: router.get('/carrito', isAuthenticated, ...)
  isGuest,          // Usar en login/register: router.get('/login', isGuest, ...)
  loadUser          // Usar globalmente en app.js: app.use(loadUser)
};