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
const {
  getEditProfile,
  postEditProfile,
  getChangePassword,
  postChangePassword
} = require('../Controllers/profileController');

// ✅ Importar validaciones
const {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  editProfileValidation,
  handleValidationErrors
} = require('../middleware/validationRules');

// ==================== AUTENTICACIÓN ====================
router.get('/register', isGuest, getRegister);
router.post('/register', isGuest, registerValidation, handleValidationErrors, postRegister);

router.get('/login', isGuest, getLogin);
router.post('/login', isGuest, loginValidation, handleValidationErrors, postLogin);

router.post('/logout', isAuthenticated, postLogout);

// ==================== PERFIL ====================
router.get('/profile', isAuthenticated, getProfile);

router.get('/profile/edit', isAuthenticated, getEditProfile);
router.post('/profile/edit', isAuthenticated, editProfileValidation, handleValidationErrors, postEditProfile);

router.get('/profile/change-password', isAuthenticated, getChangePassword);
router.post('/profile/change-password', isAuthenticated, changePasswordValidation, handleValidationErrors, postChangePassword);

module.exports = router;