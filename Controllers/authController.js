const { createUser, findUserByEmail, findUserByUsername, verifyPassword, findUserById } = require('../models/userModel');
const pool = require('../config/db');

// Mostrar formulario de registro
const getRegister = (req, res) => {
  res.render('auth/register', { 
    title: 'Registro',
    activePage: 'register'
  });
};

// Procesar registro
const postRegister = async (req, res) => {
  try {
    const { nombre_usuario, nombre, apellido, email, contrasena, confirmar_contrasena, direccion } = req.body;

    if (!nombre_usuario || !nombre || !apellido || !email || !contrasena || !confirmar_contrasena || !direccion) {
      req.flash('error', 'Todos los campos son obligatorios');
      return res.redirect('/register');
    }

    if (contrasena !== confirmar_contrasena) {
      req.flash('error', 'Las contraseñas no coinciden');
      return res.redirect('/register');
    }

    if (contrasena.length < 6) {
      req.flash('error', 'La contraseña debe tener al menos 6 caracteres');
      return res.redirect('/register');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.flash('error', 'El formato del email no es válido');
      return res.redirect('/register');
    }

    if (nombre_usuario.length < 3) {
      req.flash('error', 'El nombre de usuario debe tener al menos 3 caracteres');
      return res.redirect('/register');
    }

    if (/\s/.test(nombre_usuario)) {
      req.flash('error', 'El nombre de usuario no puede contener espacios');
      return res.redirect('/register');
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      req.flash('error', 'Este email ya está registrado');
      return res.redirect('/register');
    }

    const existingUsername = await findUserByUsername(nombre_usuario);
    if (existingUsername) {
      req.flash('error', 'Este nombre de usuario ya está en uso');
      return res.redirect('/register');
    }

    await createUser(nombre_usuario, nombre, apellido, email, contrasena, direccion);
    
    req.flash('success', '¡Registro exitoso! Ahora puedes iniciar sesión');
    res.redirect('/login');
  } catch (error) {
    console.error('Error en registro:', error);
    req.flash('error', 'Error al registrar usuario. Por favor intenta nuevamente');
    res.redirect('/register');
  }
};

// Mostrar formulario de login
const getLogin = (req, res) => {
  res.render('auth/login', { 
    title: 'Iniciar Sesión',
    activePage: 'login'
  });
};

// Procesar login
const postLogin = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      req.flash('error', 'Email y contraseña son requeridos');
      return res.redirect('/login');
    }

    const user = await findUserByEmail(email);
    if (!user) {
      req.flash('error', 'Credenciales incorrectas');
      return res.redirect('/login');
    }

    const isValidPassword = await verifyPassword(contrasena, user.contrasena);
    if (!isValidPassword) {
      req.flash('error', 'Credenciales incorrectas');
      return res.redirect('/login');
    }

    req.session.userId = user.id_usuario;
    req.session.userName = user.nombre;
    req.session.userLastName = user.apellido;
    req.session.userEmail = user.email;
    req.session.userUsername = user.nombre_usuario;
    req.session.userAddress = user.direccion;

    req.flash('success', `¡Bienvenido, ${user.nombre}!`);
    
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(returnTo);
  } catch (error) {
    console.error('Error en login:', error);
    req.flash('error', 'Error al iniciar sesión. Por favor intenta nuevamente');
    res.redirect('/login');
  }
};

// Cerrar sesión
const postLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.redirect('/');
    }
    
    res.clearCookie('connect.sid');
    res.redirect('/?logout=true');
  });
};

// Obtener perfil de usuario con estadísticas
const getProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const user = await findUserById(userId);
    
    if (!user) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/');
    }

    // Obtener estadísticas de pedidos
    const [statsResult] = await pool.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(monto_total), 0) as gasto_total
      FROM ordenes
      WHERE id_usuario = ?
    `, [userId]);

    const stats = statsResult[0];

    // Calcular nivel basado en pedidos (ejemplo simple)
    let nivel = 'Nuevo';
    let puntosAcumulados = stats.total_pedidos * 100; // 100 puntos por pedido
    
    if (stats.total_pedidos >= 10) {
      nivel = 'VIP Oro';
    } else if (stats.total_pedidos >= 5) {
      nivel = 'VIP Plata';
    } else if (stats.total_pedidos >= 2) {
      nivel = 'Bronce';
    }

    res.render('auth/profile', {
      title: 'Mi Perfil',
      activePage: 'profile',
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        username: user.nombre_usuario,
        direccion: user.direccion,
        fechaRegistro: user.fecha_registro
      },
      stats: {
        totalPedidos: stats.total_pedidos,
        gastoTotal: stats.gasto_total,
        puntosAcumulados: puntosAcumulados,
        nivel: nivel
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    req.flash('error', 'Error al cargar el perfil');
    res.redirect('/');
  }
};

module.exports = {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  postLogout,
  getProfile
};