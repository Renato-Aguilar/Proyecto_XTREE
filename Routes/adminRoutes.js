// ==================== routes/adminRoutes.js ====================
const express = require('express');
const router = express.Router();

// ✅ IMPORTAR CONTROLADORES
const adminController = require('../Controllers/adminController');
const helpController = require('../Controllers/helpController');

// ✅ IMPORTAR MIDDLEWARE
const { isAdmin, isSuperAdmin } = require('../middleware/adminMiddleware');

// ==================== DASHBOARD ====================
router.get('/dashboard', isAdmin, adminController.getDashboard);

// ==================== GESTIÓN DE PRODUCTOS ====================
router.get('/productos', isAdmin, adminController.getProductos);
router.post('/productos/:id_producto', isAdmin, adminController.updateProducto);

// ==================== GESTIÓN DE PEDIDOS ====================
router.get('/pedidos', isAdmin, adminController.getPedidos);
router.post('/pedidos/:id_orden/problema', isAdmin, adminController.marcarProblema);
router.post('/pedidos/:id_orden/resolver', isAdmin, adminController.resolverProblema);

// ==================== CENTRO DE AYUDA ====================
router.get('/ayuda', isAdmin, adminController.getSolicitudesAyuda);
router.get('/ayuda/:id', isAdmin, adminController.getDetalleSolicitud);
router.post('/ayuda/:id/responder', isAdmin, adminController.responderSolicitud);

// ==================== GESTIÓN DE USUARIOS ====================
router.get('/usuarios', isAdmin, adminController.getUsuarios);
router.post('/usuarios/:id_usuario', isAdmin, adminController.updateUsuario);

module.exports = router;