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

router.get('/carrito', isAuthenticated, getCarrito);
router.post('/carrito/agregar', isAuthenticated, addToCart);
router.post('/carrito/actualizar', isAuthenticated, updateCartQuantity); // Nueva ruta
router.post('/carrito/eliminar', isAuthenticated, removeFromCart);
router.post('/carrito/limpiar', isAuthenticated, clearCart);
router.get('/carrito/count', isAuthenticated, getCartCount);

module.exports = router;