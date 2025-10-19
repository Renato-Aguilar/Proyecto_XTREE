const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');

const { getIndex, getNosotros, getProductos } = require('../Controllers/pageController');
const { getComprar, getProductoComprar } = require('../Controllers/productController');
const { 
  getCheckout, 
  createPayPalOrder, 
  capturePayPalOrder,
  getCheckoutSuccess,
  getCheckoutCancel
} = require('../Controllers/checkoutController');
const { getMisPedidos, getDetallePedido } = require('../Controllers/ordersController');

// Rutas públicas
router.get('/', getIndex);
router.get('/nosotros', getNosotros);
router.get('/productos', getProductos);
router.get('/comprar', getComprar);
router.get('/comprar/:id', getProductoComprar);

// Rutas protegidas - Checkout y Pedidos
router.get('/checkout', isAuthenticated, getCheckout);

// Rutas de PayPal
router.post('/api/paypal/create-order', isAuthenticated, createPayPalOrder);
router.post('/api/paypal/capture-order', isAuthenticated, capturePayPalOrder);
router.get('/checkout/success', isAuthenticated, getCheckoutSuccess);
router.get('/checkout/cancel', isAuthenticated, getCheckoutCancel);

// Pedidos
router.get('/mis-pedidos', isAuthenticated, getMisPedidos);
router.get('/pedidos/:id', isAuthenticated, getDetallePedido);

module.exports = router;