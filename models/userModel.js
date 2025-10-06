const pool = require('../config/db');
const bcrypt = require('bcryptjs'); // Librería para hashear contraseñas

// Crear nuevo usuario en la BD
const createUser = async (nombreUsuario, nombre, apellido, email, contrasena, direccion) => {
  try {
    // Hashear contraseña con bcrypt (10 rondas de salt)
    // NUNCA guardar contraseñas en texto plano
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre_usuario, nombre, apellido, email, contrasena, direccion, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [nombreUsuario, nombre, apellido, email, hashedPassword, direccion]
    );
    
    return result.insertId; // Retorna ID del usuario creado
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
};

// Buscar usuario por email (usado en login)
const findUserByEmail = async (email) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    return rows[0]; // Retorna usuario o undefined
  } catch (error) {
    console.error('Error al buscar usuario:', error);
    throw error;
  }
};

// Buscar usuario por nombre de usuario (validación en registro)
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

// Buscar usuario por ID (usado en perfil y sesiones)
const findUserById = async (id) => {
  try {
    // No incluir contraseña en el SELECT por seguridad
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

// Comparar contraseña ingresada con hash almacenado
const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    // bcrypt.compare() desencripta y compara de forma segura
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    throw error;
  }
};

// Actualizar datos del usuario (excepto contraseña)
const updateUser = async (id, nombreUsuario, nombre, apellido, direccion) => {
  try {
    const [result] = await pool.query(
      'UPDATE usuarios SET nombre_usuario = ?, nombre = ?, apellido = ?, direccion = ? WHERE id_usuario = ?',
      [nombreUsuario, nombre, apellido, direccion, id]
    );
    return result.affectedRows > 0; // true si se actualizó algo
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

module.exports = {
  createUser,          // Registro de usuarios
  findUserByEmail,     // Login
  findUserByUsername,  // Validación unicidad
  findUserById,        // Cargar perfil
  verifyPassword,      // Autenticación
  updateUser          // Editar perfil
};