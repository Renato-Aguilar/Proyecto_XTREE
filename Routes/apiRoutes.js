const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Obtener todos los productos con sus datos completos
router.get('/productos', async (req, res) => {
  try {
    const [productos] = await pool.query(`
      SELECT 
        p.id_producto,
        p.nombre,
        p.descripcion,
        p.precio,
        p.imagen_url,
        p.color_principal,
        p.color_secundario,
        p.color_tertiary,
        s.cantidad as stock
      FROM productos p
      LEFT JOIN stock_productos s ON p.id_producto = s.id_producto
      ORDER BY p.id_producto ASC
    `);

    res.json({
      success: true,
      data: productos
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos'
    });
  }
});

// Obtener un producto específico por ID
router.get('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [producto] = await pool.query(`
      SELECT 
        p.id_producto,
        p.nombre,
        p.descripcion,
        p.precio,
        p.imagen_url,
        p.color_principal,
        p.color_secundario,
        p.color_tertiary,
        s.cantidad as stock
      FROM productos p
      LEFT JOIN stock_productos s ON p.id_producto = s.id_producto
      WHERE p.id_producto = ?
    `, [id]);

    if (producto.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: producto[0]
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener producto'
    });
  }
});

module.exports = router;