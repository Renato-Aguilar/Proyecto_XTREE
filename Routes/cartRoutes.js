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

router.get('/carrito', isAuthenticated, getCarrito); // Muestra el carrito de compras
router.post('/carrito/agregar', isAuthenticated, addToCart); // Agrega producto al carrito
router.post('/carrito/actualizar', isAuthenticated, updateCartQuantity); // Actualiza cantidad de producto
router.post('/carrito/eliminar', isAuthenticated, removeFromCart); // Elimina producto del carrito
router.post('/carrito/limpiar', isAuthenticated, clearCart); // Vacía todo el carrito
router.get('/carrito/count', isAuthenticated, getCartCount); // Obtiene número de items en carrito

module.exports = router;