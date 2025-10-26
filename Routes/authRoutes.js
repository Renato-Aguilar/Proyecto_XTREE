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

// Importar nuevo controller de perfil
const {
  getEditProfile,
  postEditProfile,
  getChangePassword,
  postChangePassword
} = require('../Controllers/profileController');

// ==================== AUTENTICACIÓN ====================
router.get('/register', isGuest, getRegister);
router.post('/register', isGuest, postRegister);

router.get('/login', isGuest, getLogin);
router.post('/login', isGuest, postLogin);

router.post('/logout', isAuthenticated, postLogout);

// ==================== PERFIL ====================
router.get('/profile', isAuthenticated, getProfile);

// ==================== EDITAR PERFIL ====================
router.get('/profile/edit', isAuthenticated, getEditProfile);
router.post('/profile/edit', isAuthenticated, postEditProfile);

// ==================== CAMBIAR CONTRASEÑA ====================
router.get('/profile/change-password', isAuthenticated, getChangePassword);
router.post('/profile/change-password', isAuthenticated, postChangePassword);

module.exports = router;