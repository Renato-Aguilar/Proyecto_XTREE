const pool = require('../config/db');

// ✅ Middleware: Protege rutas que requieren autenticación
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  
  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Debes iniciar sesión para acceder a esta página');
  res.redirect('/login');
};

// ✅ Middleware: Protege rutas que solo invitados pueden ver
const isGuest = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return next();
  }
  
  res.redirect('/');
};

// ✅ Middleware: Carga datos del usuario en TODAS las vistas
const loadUser = async (req, res, next) => {
  // Inicializar variables de flash
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  
  // Inicializar usuario como null por defecto
  res.locals.user = null;
  res.locals.cartCount = 0;
  
  if (req.session && req.session.userId) {
    try {
      // ✅ Consultar usuario con su rol
      const [users] = await pool.query(
        'SELECT id_usuario, nombre_usuario, nombre, apellido, email, direccion, rol FROM usuarios WHERE id_usuario = ?',
        [req.session.userId]
      );

      if (users.length > 0) {
        const userData = users[0];
        
        // ✅ IMPORTANTE: Pasar TODOS los datos que necesita header.ejs
        res.locals.user = {
          id: userData.id_usuario,
          nombre: userData.nombre,
          apellido: userData.apellido,
          email: userData.email,
          username: userData.nombre_usuario,
          nombre_usuario: userData.nombre_usuario,
          direccion: userData.direccion,
          rol: userData.rol
        };

        // Guardar también en sesión para middleware admin
        req.session.userRole = userData.rol;

        // ✅ Consultar contador del carrito
        try {
          const [count] = await pool.query(
            'SELECT SUM(cantidad) as total FROM carritos WHERE id_usuario = ?',
            [req.session.userId]
          );
          res.locals.cartCount = count[0].total || 0;
        } catch (error) {
          console.error('Error al contar carrito:', error);
          res.locals.cartCount = 0;
        }
      } else {
        // Usuario no encontrado en BD, limpiar sesión
        console.warn(`⚠️ Usuario ${req.session.userId} no encontrado en BD`);
        req.session.destroy((err) => {
          if (err) {
            console.error('Error al destruir sesión:', err);
          }
        });
        res.locals.user = null;
        res.locals.cartCount = 0;
      }
    } catch (error) {
      console.error('Error al cargar usuario en loadUser:', error);
      res.locals.user = null;
      res.locals.cartCount = 0;
    }
  }
  
  next();
};

module.exports = {
  isAuthenticated,
  isGuest,
  loadUser
};