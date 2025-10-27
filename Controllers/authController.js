// Importar funciones del modelo de usuario y pool de BD
const { createUser, findUserByEmail, findUserByUsername, verifyPassword, findUserById } = require('../models/userModel');
const pool = require('../config/db');

// Función para validar requisitos de contraseña
const validatePasswordStrength = (password) => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-]/.test(password)
  };

  const allMet = Object.values(requirements).every(Boolean);
  
  return {
    isValid: allMet,
    requirements: requirements,
    message: allMet ? 'Contraseña válida' : 'La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales'
  };
};

// GET /register - Muestra formulario de registro
const getRegister = (req, res) => {
  res.render('auth/register', { 
    title: 'Registro',
    activePage: 'register'
  });
};

// POST /register - Procesa el registro de nuevo usuario
const postRegister = async (req, res) => {
  try {
    // Extraer datos del formulario
    const { nombre_usuario, nombre, apellido, email, contrasena, confirmar_contrasena, direccion } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre_usuario || !nombre || !apellido || !email || !contrasena || !confirmar_contrasena || !direccion) {
      req.flash('error', 'Todos los campos son obligatorios');
      return res.redirect('/register');
    }

    // Validar que las contraseñas coincidan
    if (contrasena !== confirmar_contrasena) {
      req.flash('error', 'Las contraseñas no coinciden');
      return res.redirect('/register');
    }

    // Validar fortaleza de contraseña
    const passwordValidation = validatePasswordStrength(contrasena);
    if (!passwordValidation.isValid) {
      req.flash('error', passwordValidation.message);
      return res.redirect('/register');
    }

    // Validar formato de email con regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.flash('error', 'El formato del email no es válido');
      return res.redirect('/register');
    }

    // Validar longitud mínima de usuario
    if (nombre_usuario.length < 3) {
      req.flash('error', 'El nombre de usuario debe tener al menos 3 caracteres');
      return res.redirect('/register');
    }

    // Validar que el usuario no contenga espacios
    if (/\s/.test(nombre_usuario)) {
      req.flash('error', 'El nombre de usuario no puede contener espacios');
      return res.redirect('/register');
    }

    // Verificar que el email no esté ya registrado
    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      req.flash('error', 'Este email ya está registrado');
      return res.redirect('/register');
    }

    // Verificar que el nombre de usuario no esté en uso
    const existingUsername = await findUserByUsername(nombre_usuario);
    if (existingUsername) {
      req.flash('error', 'Este nombre de usuario ya está en uso');
      return res.redirect('/register');
    }

    // Crear el usuario (la contraseña se hashea en userModel)
    await createUser(nombre_usuario, nombre, apellido, email, contrasena, direccion);
    
    req.flash('success', '¡Registro exitoso! Ahora puedes iniciar sesión');
    res.redirect('/login');
  } catch (error) {
    console.error('Error en registro:', error);
    req.flash('error', 'Error al registrar usuario. Por favor intenta nuevamente');
    res.redirect('/register');
  }
};

// GET /login - Muestra formulario de login
const getLogin = (req, res) => {
  res.render('auth/login', { 
    title: 'Iniciar Sesión',
    activePage: 'login'
  });
};

// POST /login - Procesa el inicio de sesión
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
    req.session.userRole = user.rol;

    req.flash('success', `¡Bienvenido, ${user.nombre}!`);
    
    // Redirigir según el rol
    if (user.rol === 'admin' || user.rol === 'superadmin') {
      return res.redirect('/admin/dashboard');
    }
    
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(returnTo);
  } catch (error) {
    console.error('Error en login:', error);
    req.flash('error', 'Error al iniciar sesión. Por favor intenta nuevamente');
    res.redirect('/login');
  }
};

// POST /logout - Cierra la sesión del usuario
const postLogout = (req, res) => {
  // Destruir sesión en BD y memoria
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.redirect('/');
    }
    
    // Eliminar cookie del navegador
    res.clearCookie('connect.sid');
    res.redirect('/?logout=true');
  });
};

// GET /profile - Muestra perfil del usuario con estadísticas
const getProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Obtener datos del usuario
    const user = await findUserById(userId);
    
    if (!user) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/');
    }

    // Consultar estadísticas: total de pedidos y gasto acumulado
    const [statsResult] = await pool.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(monto_total), 0) as gasto_total
      FROM ordenes
      WHERE id_usuario = ?
    `, [userId]);

    const stats = statsResult[0];

    // Sistema de niveles basado en cantidad de pedidos
    let nivel = 'Nuevo';
    let puntosAcumulados = stats.total_pedidos * 100;
    
    if (stats.total_pedidos >= 10) {
      nivel = 'VIP Oro';
    } else if (stats.total_pedidos >= 5) {
      nivel = 'VIP Plata';
    } else if (stats.total_pedidos >= 2) {
      nivel = 'Bronce';
    }

    // Renderizar vista con datos del usuario y estadísticas
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