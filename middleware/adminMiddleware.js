const pool = require('../config/db');

// ✅ Verificar si el usuario es administrador (admin o superadmin)
const isAdmin = async (req, res, next) => {
  try {
    // Verificar que existe sesión y userId
    if (!req.session || !req.session.userId) {
      req.flash('error', 'Debes iniciar sesión para acceder a esta página');
      return res.redirect('/login');
    }

    // Consultar rol del usuario en la BD
    const [users] = await pool.query(
      'SELECT id_usuario, rol, nombre, apellido FROM usuarios WHERE id_usuario = ?',
      [req.session.userId]
    );

    // Verificar que el usuario existe
    if (users.length === 0) {
      req.session.destroy();
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/login');
    }

    const userRole = users[0].rol;

    // ✅ Verificar que sea admin o superadmin
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      console.warn(`⚠️ Intento de acceso no autorizado - Usuario ${req.session.userId} (${userRole}) intentó acceder a ruta admin`);
      req.flash('error', 'No tienes permisos para acceder a esta sección');
      return res.redirect('/');
    }

    // Guardar rol en la sesión para uso posterior
    req.session.userRole = userRole;
    
    // ✅ IMPORTANTE: Pasar información del usuario al sidebar
    res.locals.user = {
      id: users[0].id_usuario,
      rol: userRole,
      nombre: users[0].nombre,
      apellido: users[0].apellido
    };

    next();
  } catch (error) {
    console.error('❌ Error en middleware isAdmin:', error);
    req.flash('error', 'Error al verificar permisos');
    res.redirect('/');
  }
};

// ✅ Verificar si el usuario es SUPERADMIN (solo para funciones críticas)
const isSuperAdmin = async (req, res, next) => {
  try {
    // Primero verificar que sea admin
    if (!req.session || !req.session.userId) {
      req.flash('error', 'Debes iniciar sesión para acceder a esta página');
      return res.redirect('/login');
    }

    // Consultar rol del usuario
    const [users] = await pool.query(
      'SELECT id_usuario, rol FROM usuarios WHERE id_usuario = ?',
      [req.session.userId]
    );

    // Verificar que el usuario existe
    if (users.length === 0) {
      req.session.destroy();
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/login');
    }

    const userRole = users[0].rol;

    // ✅ Verificar que sea SOLO superadmin
    if (userRole !== 'superadmin') {
      console.warn(`⚠️ Intento de acceso superadmin no autorizado - Usuario ${req.session.userId} (${userRole})`);
      req.flash('error', 'Solo los superadministradores pueden acceder a esta función');
      return res.redirect('/admin/dashboard');
    }

    req.session.userRole = 'superadmin';
    
    res.locals.user = {
      id: users[0].id_usuario,
      rol: 'superadmin'
    };

    next();
  } catch (error) {
    console.error('❌ Error en middleware isSuperAdmin:', error);
    req.flash('error', 'Error al verificar permisos');
    res.redirect('/admin/dashboard');
  }
};

// ✅ Registrar acción de admin en logs (auditoría)
const logAdminAction = async (adminId, accion, tablaAfectada, idRegistro = null, detalles = null, ipAddress = null) => {
  try {
    // ✅ Validación de entrada
    if (!adminId) {
      console.warn('⚠️ Intento de log sin adminId');
      return false;
    }

    if (!accion || !tablaAfectada) {
      console.warn('⚠️ Intento de log con datos incompletos');
      return false;
    }

    // Insertar log con todos los parámetros
    await pool.query(
      `INSERT INTO logs_admin 
       (id_admin, accion, tabla_afectada, id_registro, detalles, ip_address, fecha) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        adminId,
        accion.substring(0, 100),
        tablaAfectada.substring(0, 50),
        idRegistro || null,
        detalles ? detalles.substring(0, 500) : null,
        ipAddress || null
      ]
    );

    console.log(`✅ [LOG ADMIN] ${accion} - ${tablaAfectada}:${idRegistro || 'N/A'} por usuario ${adminId}`);
    return true;
  } catch (error) {
    console.error('❌ Error al registrar log de admin:', error);
    // No lanzar error para no afectar la operación principal
    return false;
  }
};

module.exports = {
  isAdmin,
  isSuperAdmin,
  logAdminAction
};