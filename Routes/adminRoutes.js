const express = require('express');
const router = express.Router();

// Middlewares
const { isAdmin } = require('../middleware/adminMiddleware');
const upload = require('../config/multer');
const processImage = require('../middleware/imageProcessor');
const extractColors = require('../middleware/colorExtractor');

// Controladores
const {
  getDashboard,
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  getPedidos,
  marcarProblema,
  resolverProblema,
  getSolicitudesAyuda,
  getDetalleSolicitud,
  responderSolicitud,
  getUsuarios,
  updateUsuario
} = require('../Controllers/adminController');

// ==================== PROTEGER TODAS LAS RUTAS ====================
router.use(isAdmin);

// ==================== DASHBOARD ====================
router.get('/dashboard', getDashboard);

// ==================== GESTIÓN DE PRODUCTOS ====================
router.get('/productos', getProductos);

// ✅ CREAR PRODUCTO (POST con imagen)
router.post('/productos', 
  (req, res, next) => {
    upload.single('imagen')(req, res, (err) => {
      if (err) {
        console.error('❌ Error en Multer:', err.message);
        return res.status(400).json({ 
          success: false, 
          error: err.message 
        });
      }
      next();
    });
  },
  processImage,
  extractColors,
  createProducto
);

// ✅ ACTUALIZAR PRODUCTO (PUT con imagen opcional)
router.put('/productos/:id', 
  (req, res, next) => {
    upload.single('imagen')(req, res, (err) => {
      if (err) {
        console.error('❌ Error en Multer:', err.message);
        return res.status(400).json({ 
          success: false, 
          error: err.message 
        });
      }
      next();
    });
  },
  processImage,
  extractColors,
  updateProducto
);

// ✅ ELIMINAR PRODUCTO
router.delete('/productos/:id', deleteProducto);

// ==================== GESTIÓN DE PEDIDOS ====================
router.get('/pedidos', getPedidos);
router.post('/pedidos/:id_orden/marcar-problema', marcarProblema);
router.post('/pedidos/:id_orden/resolver-problema', resolverProblema);

// ==================== CENTRO DE AYUDA ====================
router.get('/ayuda', getSolicitudesAyuda);
router.get('/ayuda/:id', getDetalleSolicitud);
router.post('/ayuda/:id/responder', responderSolicitud);

// ==================== GESTIÓN DE USUARIOS ====================
router.get('/usuarios', getUsuarios);
router.put('/usuarios/:id_usuario', updateUsuario);

module.exports = router;