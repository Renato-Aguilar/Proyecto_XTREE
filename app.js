// Importamos las dependencias principales
const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');
const flash = require('connect-flash');

// Cargamos las variables de entorno
dotenv.config();

// Creamos la aplicación de Express
const app = express();

// Definimos el puerto del servidor
const PORT = process.env.PORT || 3000;

// ----------------------
// Middlewares
// ----------------------

// Para parsear datos de formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
app.set('views', __dirname + '/views');

// ----------------------
// Archivos estáticos
// ----------------------

app.use(express.static('public'));

// ----------------------
// Rutas
// ----------------------

const pageRoutes = require('./Routes/pageRoutes');
const authRoutes = require('./Routes/authRoutes');
const cartRoutes = require('./Routes/cartRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const helpRoutes = require('./Routes/helpRoutes'); // NUEVA RUTA

// Montar rutas
app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/', cartRoutes);
app.use('/admin', adminRoutes);
app.use('/ayuda', helpRoutes); // RUTAS DE AYUDA CLIENTE

// ----------------------
// Servidor
// ----------------------

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔐 Panel Admin disponible en http://localhost:${PORT}/admin/dashboard`);
});