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
router.get('/register', isGuest, getRegister);
router.post('/register', isGuest, postRegister);

router.get('/login', isGuest, getLogin);
router.post('/login', isGuest, postLogin);

router.post('/logout', isAuthenticated, postLogout);

// Ruta de perfil protegida
router.get('/profile', isAuthenticated, getProfile);

module.exports = router;