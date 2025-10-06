const express = require('express');
const router = express.Router();
const { isAuthenticated, isGuest } = require('../middleware/authMiddleware');
const {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  postLogout,
  getProfile
} = require('../Controllers/authController');

// Rutas de autenticación
router.get('/register', isGuest, getRegister); // Muestra formulario de registro
router.post('/register', isGuest, postRegister); // Procesa registro de usuario

router.get('/login', isGuest, getLogin); // Muestra formulario de login
router.post('/login', isGuest, postLogin); // Procesa inicio de sesión

router.post('/logout', isAuthenticated, postLogout); // Cierra sesión del usuario

// Ruta de perfil protegida
router.get('/profile', isAuthenticated, getProfile); // Muestra perfil del usuario autenticado

module.exports = router;