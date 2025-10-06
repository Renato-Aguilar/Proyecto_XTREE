// Importar express-session para manejar sesiones HTTP
const session = require('express-session');

// Importar y configurar el store de MySQL para guardar sesiones en la BD
const MySQLStore = require('express-mysql-session')(session);

// Importar la configuración del pool de conexiones
const pool = require('./db');

// ===== CONFIGURACIÓN DEL ALMACENAMIENTO DE SESIONES =====
// Crear una instancia de MySQLStore para guardar las sesiones en la BD
const sessionStore = new MySQLStore({
  clearExpired: true, // Eliminar sesiones expiradas automáticamente
  checkExpirationInterval: 900000, // Revisar cada 15 minutos las sesiones expiradas
  expiration: 86400000, // Expiración de sesión después de 24 horas
  createDatabaseTable: true, // Crear tabla 'sessions' si no existe
  schema: { // Definir esquema de la tabla de sesiones
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id', // ID único de la sesión
      expires: 'expires', // Fecha de expiración
      data: 'data' // Datos de la sesión
    }
  }
}, pool); // Usar el pool de conexiones

// ===== CONFIGURACIÓN DE LA SESIÓN =====
// Configuración de express-session
const sessionConfig = {
  key: 'connect.sid', // Nombre de la cookie de sesión
  secret: process.env.SESSION_SECRET || 'xtree-energy-secret-key-2025', // Clave secreta para firmar la cookie
  store: sessionStore, // Usar el store configurado
  resave: false, // No guardar la sesión si no hay cambios
  saveUninitialized: false, // No crear sesiones vacías
  cookie: { // Configuración de la cookie
    maxAge: 1000 * 60 * 60 * 24, // Duración de la cookie: 24 horas
    httpOnly: true, // Acceso solo por HTTP (no por JavaScript)
    secure: process.env.NODE_ENV === 'production', // Usar HTTPS en producción
    sameSite: 'lax' // Protección contra CSRF
  }
};

// Exportar store y configuración
module.exports = { sessionStore, sessionConfig };
