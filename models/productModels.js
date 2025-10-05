const pool = require('../config/db');

// Obtener todos los productos
const getAllProducts = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos');
    return rows;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
};

// Obtener producto por ID
const getProductById = async (id) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM productos WHERE id_producto = ?', 
      [id]
    );
    return rows[0];
  } catch (error) {
    console.error('Error al obtener producto:', error);
    throw error;
  }
};

// Verificar stock disponible
const checkStock = async (idProducto, cantidadSolicitada) => {
  try {
    const [rows] = await pool.query(
      'SELECT cantidad FROM stock_productos WHERE id_producto = ?',
      [idProducto]
    );
    
    if (rows.length === 0) {
      return false;
    }
    
    return rows[0].cantidad >= cantidadSolicitada;
  } catch (error) {
    console.error('Error al verificar stock:', error);
    throw error;
  }
};

// Obtener stock de un producto
const getStock = async (idProducto) => {
  try {
    const [rows] = await pool.query(
      'SELECT cantidad FROM stock_productos WHERE id_producto = ?',
      [idProducto]
    );
    return rows[0]?.cantidad || 0;
  } catch (error) {
    console.error('Error al obtener stock:', error);
    throw error;
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  checkStock,
  getStock
};