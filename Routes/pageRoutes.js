// Importamos Express
const express = require('express');

// Creamos un enrutador (Router) que maneja las rutas específicas de este módulo
const router = express.Router();

// Importamos los controladores que renderizan las vistas
const { getIndex, getNosotros, getProductos } = require('../Controllers/pageControllers');

// Definimos las rutas y qué función se ejecuta en cada una
// Cuando un usuario entre a "/" se ejecuta getIndex
router.get('/', getIndex);

// Cuando un usuario entre a "/nosotros" se ejecuta getNosotros
router.get('/nosotros', getNosotros);

// Cuando un usuario entre a "/productos" se ejecuta getProductos
router.get('/productos', getProductos);

// Exportamos el router para poder usarlo en app.js
module.exports = router;
