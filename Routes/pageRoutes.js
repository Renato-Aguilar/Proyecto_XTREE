const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');

const { getIndex, getNosotros, getProductos } = require('../Controllers/pageControllers');
const { getComprar, getProductoComprar } = require('../Controllers/productController');
const { getCheckout, processPayment } = require('../Controllers/checkoutController');
const { getMisPedidos, getDetallePedido } = require('../Controllers/ordersController');

// Rutas públicas
router.get('/', getIndex);
router.get('/nosotros', getNosotros);
router.get('/productos', getProductos);
router.get('/comprar', getComprar);
router.get('/comprar/:id', getProductoComprar);

// Rutas protegidas - Checkout y Pedidos
router.get('/checkout', isAuthenticated, getCheckout);
router.post('/checkout/process', isAuthenticated, processPayment);
router.get('/mis-pedidos', isAuthenticated, getMisPedidos);
router.get('/pedidos/:id', isAuthenticated, getDetallePedido);

module.exports = router;