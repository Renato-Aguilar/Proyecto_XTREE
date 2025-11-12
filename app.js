// Importamos las dependencias principales
const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

// Cargamos las variables de entorno
dotenv.config();

// Creamos la aplicación de Express
const app = express();

// Definimos el puerto del servidor
const PORT = process.env.PORT || 3000;

// ----------------------
// Middlewares
// ----------------------

// ✅ IMPORTANTE: Orden correcto de middlewares
// 1. JSON con límite de tamaño
app.use(express.json({ limit: '50mb' }));

// 2. URL-encoded para formularios tradicionales
app.use(express.urlencoded({ 
  extended: true,
  limit: '50mb',
  parameterLimit: 50000
}));

// ✅ IMPORTANTE: NO usar middleware global de Multer
// Multer SOLO debe estar en las rutas específicas que lo necesitan
// Esto evita conflictos y el error "Unexpected end of form"

// Configuración de sesiones
const { sessionConfig } = require('./config/sessionStore');
app.use(session(sessionConfig));

// Flash messages
app.use(flash());

// Middleware para pasar información de usuario a las vistas
const { loadUser } = require('./middleware/authMiddleware');
app.use(loadUser);

// ----------------------
// Configuración de Vistas
// ----------------------

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ----------------------
// Archivos estáticos
// ----------------------

app.use(express.static(path.join(__dirname, 'public')));

// ----------------------
// Rutas
// ----------------------

const pageRoutes = require('./Routes/pageRoutes');
const authRoutes = require('./Routes/authRoutes');
const cartRoutes = require('./Routes/cartRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const helpRoutes = require('./Routes/helpRoutes');
const apiRoutes = require('./Routes/apiRoutes');

// Montar rutas
app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/', cartRoutes);
app.use('/admin', adminRoutes);
app.use('/ayuda', helpRoutes);
app.use('/api', apiRoutes);

// ----------------------
// Manejo de Errores Global
// ----------------------

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  // Error de Multer
  if (err.name === 'MulterError') {
    console.error('🔴 Multer Error - Código:', err.code);
    
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({
        success: false,
        error: '❌ La imagen no puede superar 5MB'
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: '❌ Solo se puede subir un archivo'
      });
    }
    
    return res.status(400).json({
      success: false,
      error: '❌ Error al procesar archivo: ' + err.message
    });
  }

  // Error personalizado (validación de archivo)
  if (err.message && err.message.includes('Solo se permiten')) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Error general
  console.error('Stack:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error desconocido'
  });
});

// ----------------------
// 404
// ----------------------

app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Página no encontrada'
  });
});

// ----------------------
// Servidor
// ----------------------

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║        ✅ SERVIDOR INICIADO CORRECTAMENTE  ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║ Puerto: http://localhost:${PORT.toString().padEnd(28)}║`);
  console.log('║ 🌐 Sitio: http://localhost:3000            ║');
  console.log('║ 🔧 Admin: http://localhost:3000/admin      ║');
  console.log('║ 📁 Uploads: ./public/img/uploads           ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
});