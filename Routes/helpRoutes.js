const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const {
  getNuevaSolicitud,
  postNuevaSolicitud,
  getMisSolicitudes,
  getDetalleSolicitud,
  postRespuesta,
  cerrarSolicitud
} = require('../Controllers/helpController');

// Todas las rutas requieren autenticación
router.get('/nueva', isAuthenticated, getNuevaSolicitud);
router.post('/nueva', isAuthenticated, postNuevaSolicitud);
router.get('/mis-solicitudes', isAuthenticated, getMisSolicitudes);
router.get('/solicitud/:id', isAuthenticated, getDetalleSolicitud);
router.post('/solicitud/:id/responder', isAuthenticated, postRespuesta);
router.post('/solicitud/:id/cerrar', isAuthenticated, cerrarSolicitud);

module.exports = router;