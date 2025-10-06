const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');

const { getIndex, getNosotros, getProductos } = require('../Controllers/pageController');
const { getComprar, getProductoComprar } = require('../Controllers/productController');
const { getCheckout, processPayment } = require('../Controllers/checkoutController');
const { getMisPedidos, getDetallePedido } = require('../Controllers/ordersController');

// Rutas públicas
router.get('/', getIndex); // Página principal
router.get('/nosotros', getNosotros); // Página sobre nosotros
router.get('/productos', getProductos); // Catálogo de productos
router.get('/comprar', getComprar); // Página de compra general
router.get('/comprar/:id', getProductoComprar); // Detalle de producto específico

// Rutas protegidas - Checkout y Pedidos
router.get('/checkout', isAuthenticated, getCheckout); // Página de pago
router.post('/checkout/process', isAuthenticated, processPayment); // Procesa el pago
router.get('/mis-pedidos', isAuthenticated, getMisPedidos); // Lista de pedidos del usuario
router.get('/pedidos/:id', isAuthenticated, getDetallePedido); // Detalle de pedido específico

module.exports = router;