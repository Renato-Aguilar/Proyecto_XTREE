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

// ==================== RUTAS PÚBLICAS ====================
router.get('/', getIndex);
router.get('/nosotros', getNosotros);
router.get('/productos', getProductos);
router.get('/comprar', getComprar);
router.get('/comprar/:id', getProductoComprar);

// ==================== RUTAS PROTEGIDAS - CHECKOUT Y PEDIDOS ====================
router.get('/checkout', isAuthenticated, getCheckout);

// ==================== RUTAS DE PAYPAL ====================
router.post('/api/paypal/create-order', isAuthenticated, createPayPalOrder);
router.post('/api/paypal/capture-order', isAuthenticated, capturePayPalOrder);
router.get('/checkout/success', isAuthenticated, getCheckoutSuccess);
router.get('/checkout/cancel', isAuthenticated, getCheckoutCancel);

// ==================== RUTAS DE PEDIDOS ====================
// ✅ AGREGADA PROTECCIÓN A DETALLES DE PEDIDO CON isAuthenticated
router.get('/mis-pedidos', isAuthenticated, getMisPedidos);
router.get('/pedidos/:id', isAuthenticated, getDetallePedido);

module.exports = router;  