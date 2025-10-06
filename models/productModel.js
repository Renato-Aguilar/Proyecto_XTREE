const pool = require('../config/db');

// Obtener lista completa de productos desde la BD
const getAllProducts = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos');
    return rows; // Retorna array de productos
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error; // Propagar error al controller
  }
};

// Buscar un producto específico por su ID
const getProductById = async (id) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM productos WHERE id_producto = ?', 
      [id] // Parámetro parametrizado para prevenir SQL injection
    );
    return rows[0]; // Retorna un solo producto o undefined
  } catch (error) {
    console.error('Error al obtener producto:', error);
    throw error;
  }
};

// Verificar si hay suficiente stock para una compra
const checkStock = async (idProducto, cantidadSolicitada) => {
  try {
    const [rows] = await pool.query(
      'SELECT cantidad FROM stock_productos WHERE id_producto = ?',
      [idProducto]
    );
    
    // Si no existe registro de stock, retornar false
    if (rows.length === 0) {
      return false;
    }
    
    // Comparar stock disponible vs cantidad solicitada
    return rows[0].cantidad >= cantidadSolicitada;
  } catch (error) {
    console.error('Error al verificar stock:', error);
    throw error;
  }
};

// Obtener la cantidad exacta de stock disponible
const getStock = async (idProducto) => {
  try {
    const [rows] = await pool.query(
      'SELECT cantidad FROM stock_productos WHERE id_producto = ?',
      [idProducto]
    );
    // Usar optional chaining para evitar errores si no existe
    return rows[0]?.cantidad || 0;
  } catch (error) {
    console.error('Error al obtener stock:', error);
    throw error;
  }
};

module.exports = {
  getAllProducts,   // Listar todos los productos
  getProductById,   // Obtener un producto específico
  checkStock,       // Validar disponibilidad (retorna boolean)
  getStock          // Obtener cantidad exacta
};