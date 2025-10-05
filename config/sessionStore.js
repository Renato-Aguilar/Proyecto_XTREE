const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = require('./db');

// Configuración del store de sesiones con MySQL
const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutos
  expiration: 86400000, // 24 horas
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, pool);

// Configuración de la sesión
const sessionConfig = {
  key: 'connect.sid',
  secret: process.env.SESSION_SECRET || 'xtree-energy-secret-key-2025',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 horas
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true solo en producción
    sameSite: 'lax'
  }
};

module.exports = { sessionStore, sessionConfig };