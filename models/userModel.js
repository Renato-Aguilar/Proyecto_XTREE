const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Crear un nuevo usuario con todos los campos de la BD
const createUser = async (nombreUsuario, nombre, apellido, email, contrasena, direccion) => {
  try {
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre_usuario, nombre, apellido, email, contrasena, direccion, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [nombreUsuario, nombre, apellido, email, hashedPassword, direccion]
    );
    
    return result.insertId;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
};

// Buscar usuario por email
const findUserByEmail = async (email) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    return rows[0];
  } catch (error) {
    console.error('Error al buscar usuario:', error);
    throw error;
  }
};

// Buscar usuario por nombre de usuario
const findUserByUsername = async (nombreUsuario) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE nombre_usuario = ?',
      [nombreUsuario]
    );
    return rows[0];
  } catch (error) {
    console.error('Error al buscar usuario por nombre:', error);
    throw error;
  }
};

// Buscar usuario por ID
const findUserById = async (id) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, nombre_usuario, nombre, apellido, email, direccion, fecha_registro FROM usuarios WHERE id_usuario = ?',
      [id]
    );
    return rows[0];
  } catch (error) {
    console.error('Error al buscar usuario por ID:', error);
    throw error;
  }
};

// Verificar contraseña
const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    throw error;
  }
};

// Actualizar información del usuario
const updateUser = async (id, nombreUsuario, nombre, apellido, direccion) => {
  try {
    const [result] = await pool.query(
      'UPDATE usuarios SET nombre_usuario = ?, nombre = ?, apellido = ?, direccion = ? WHERE id_usuario = ?',
      [nombreUsuario, nombre, apellido, direccion, id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  verifyPassword,
  updateUser
};