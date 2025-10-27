const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const {
  getCarrito,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartCount
} = require('../Controllers/cartController');

// ✅ Importar validaciones
const {
  addToCartValidation,
  updateCartValidation,
  removeFromCartValidation,
  handleValidationErrors
} = require('../middleware/validationRules');

router.get('/carrito', isAuthenticated, getCarrito);
router.post('/carrito/agregar', isAuthenticated, addToCartValidation, handleValidationErrors, addToCart);
router.post('/carrito/actualizar', isAuthenticated, updateCartValidation, handleValidationErrors, updateCartQuantity);
router.post('/carrito/eliminar', isAuthenticated, removeFromCartValidation, handleValidationErrors, removeFromCart);
router.post('/carrito/limpiar', isAuthenticated, clearCart);
router.get('/carrito/count', isAuthenticated, getCartCount);

module.exports = router;