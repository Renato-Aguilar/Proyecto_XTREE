const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { findUserById, verifyPassword } = require('../models/userModel');

// GET /profile/edit - Mostrar formulario de edición
const getEditProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await findUserById(userId);
    
    if (!user) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/');
    }

    res.render('auth/edit-profile', {
      title: 'Editar Perfil',
      activePage: 'profile',
      user: {
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        direccion: user.direccion
      }
    });
  } catch (error) {
    console.error('Error al cargar formulario de edición:', error);
    req.flash('error', 'Error al cargar el formulario');
    res.redirect('/profile');
  }
};

// POST /profile/edit - Procesar edición de perfil
const postEditProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { nombre, apellido, direccion } = req.body;

    // ✅ VALIDACIONES
    if (!nombre || !apellido || !direccion) {
      req.flash('error', 'Todos los campos son obligatorios');
      return res.redirect('/profile/edit');
    }

    if (nombre.trim().length < 2) {
      req.flash('error', 'El nombre debe tener al menos 2 caracteres');
      return res.redirect('/profile/edit');
    }

    if (apellido.trim().length < 2) {
      req.flash('error', 'El apellido debe tener al menos 2 caracteres');
      return res.redirect('/profile/edit');
    }

    if (direccion.trim().length < 10) {
      req.flash('error', 'La dirección debe tener al menos 10 caracteres');
      return res.redirect('/profile/edit');
    }

    // Actualizar en BD
    await pool.query(
      'UPDATE usuarios SET nombre = ?, apellido = ?, direccion = ? WHERE id_usuario = ?',
      [nombre.trim(), apellido.trim(), direccion.trim(), userId]
    );

    // Actualizar sesión
    req.session.userName = nombre.trim();
    req.session.userLastName = apellido.trim();
    req.session.userAddress = direccion.trim();

    req.flash('success', '¡Perfil actualizado correctamente!');
    res.redirect('/profile');
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    req.flash('error', 'Error al actualizar el perfil');
    res.redirect('/profile/edit');
  }
};

// GET /profile/change-password - Mostrar formulario de cambio de contraseña
const getChangePassword = async (req, res) => {
  try {
    res.render('auth/change-password', {
      title: 'Cambiar Contraseña',
      activePage: 'profile'
    });
  } catch (error) {
    console.error('Error al cargar formulario de contraseña:', error);
    req.flash('error', 'Error al cargar el formulario');
    res.redirect('/profile');
  }
};

// POST /profile/change-password - Procesar cambio de contraseña
const postChangePassword = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { contrasena_actual, contrasena_nueva, confirmar_contrasena } = req.body;

    // ✅ VALIDACIONES
    if (!contrasena_actual || !contrasena_nueva || !confirmar_contrasena) {
      req.flash('error', 'Todos los campos son obligatorios');
      return res.redirect('/profile/change-password');
    }

    if (contrasena_nueva !== confirmar_contrasena) {
      req.flash('error', 'Las contraseñas nuevas no coinciden');
      return res.redirect('/profile/change-password');
    }

    if (contrasena_nueva.length < 8) {
      req.flash('error', 'La contraseña debe tener al menos 8 caracteres');
      return res.redirect('/profile/change-password');
    }

    // Validar requisitos de contraseña
    const requirements = {
      uppercase: /[A-Z]/.test(contrasena_nueva),
      lowercase: /[a-z]/.test(contrasena_nueva),
      number: /[0-9]/.test(contrasena_nueva),
      special: /[!@#$%^&*(),.?":{}|<>_\-]/.test(contrasena_nueva)
    };

    if (!Object.values(requirements).every(Boolean)) {
      req.flash('error', 'La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales');
      return res.redirect('/profile/change-password');
    }

    // Obtener usuario actual
    const [users] = await pool.query(
      'SELECT contrasena FROM usuarios WHERE id_usuario = ?',
      [userId]
    );

    if (users.length === 0) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/profile');
    }

    // Verificar contraseña actual
    const contrasenaValida = await bcrypt.compare(contrasena_actual, users[0].contrasena);
    if (!contrasenaValida) {
      req.flash('error', 'La contraseña actual es incorrecta');
      return res.redirect('/profile/change-password');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(contrasena_nueva, 10);

    // Actualizar en BD
    await pool.query(
      'UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?',
      [hashedPassword, userId]
    );

    req.flash('success', '¡Contraseña cambiada correctamente!');
    res.redirect('/profile');
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    req.flash('error', 'Error al cambiar la contraseña');
    res.redirect('/profile/change-password');
  }
};

module.exports = {
  getEditProfile,
  postEditProfile,
  getChangePassword,
  postChangePassword
};