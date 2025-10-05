const { getProductById, checkStock } = require('../models/productModels');
const { PACK_CONFIG } = require('./productController');
const pool = require('../config/db');

// Obtener carrito del usuario desde la BD
const getCarrito = async (req, res) => {
  try {
    const userId = req.session.userId;

    const [cartItems] = await pool.query(`
      SELECT 
        c.id_carrito,
        c.id_producto,
        c.cantidad,
        c.pack_size,
        p.nombre,
        p.precio,
        p.imagen_url
      FROM carritos c
      INNER JOIN productos p ON c.id_producto = p.id_producto
      WHERE c.id_usuario = ?
    `, [userId]);

    const processedItems = cartItems.map(item => {
      const cantidadPacks = item.cantidad || 1;
      const packSize = item.pack_size || 6;
      const packConfig = PACK_CONFIG[packSize] || { unidades: packSize, descuento: 0 };
      
      const precioSinDescuento = item.precio * packConfig.unidades;
      const descuentoMonto = Math.round(precioSinDescuento * (packConfig.descuento / 100));
      const precioFinal = precioSinDescuento - descuentoMonto;

      return {
        id_carrito: item.id_carrito,
        producto_id: item.id_producto,
        nombre: item.nombre,
        imagen: item.imagen_url,
        pack_size: packSize,
        cantidad: cantidadPacks,
        precioUnitario: item.precio,
        precioPorPack: precioFinal,
        precioTotal: precioFinal * cantidadPacks,
        descuento: packConfig.descuento,
        ahorro: descuentoMonto * cantidadPacks
      };
    });

    const subtotal = processedItems.reduce((sum, item) => sum + item.precioTotal, 0);
    const totalPacks = processedItems.reduce((sum, item) => sum + item.cantidad, 0);

    res.render('carrito', {
      title: 'Carrito de Compras',
      activePage: 'carrito',
      cartItems: processedItems,
      subtotal,
      totalPacks
    });
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    req.flash('error', 'Error al cargar el carrito');
    res.redirect('/');
  }
};

// Agregar producto al carrito
const addToCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { producto_id, pack_size } = req.body;

    if (!producto_id || !pack_size) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos incompletos' 
      });
    }

    const packSizeNum = parseInt(pack_size);

    if (!PACK_CONFIG[packSizeNum]) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tamaño de pack inválido' 
      });
    }

    const producto = await getProductById(producto_id);
    if (!producto) {
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado' 
      });
    }

    // Verificar si ya existe este pack específico
    const [existing] = await pool.query(
      'SELECT id_carrito, cantidad FROM carritos WHERE id_usuario = ? AND id_producto = ? AND pack_size = ?',
      [userId, producto_id, packSizeNum]
    );

    const unidadesPorPack = PACK_CONFIG[packSizeNum].unidades;

    if (existing.length > 0) {
      // Si existe, incrementar cantidad
      const nuevaCantidad = existing[0].cantidad + 1;
      const unidadesTotales = nuevaCantidad * unidadesPorPack;

      // Verificar stock
      const hayStock = await checkStock(producto_id, unidadesTotales);
      if (!hayStock) {
        return res.status(400).json({ 
          success: false, 
          message: 'Stock insuficiente' 
        });
      }

      await pool.query(
        'UPDATE carritos SET cantidad = ? WHERE id_carrito = ?',
        [nuevaCantidad, existing[0].id_carrito]
      );

      const [count] = await pool.query(
        'SELECT SUM(cantidad) as total FROM carritos WHERE id_usuario = ?',
        [userId]
      );

      return res.json({ 
        success: true, 
        message: `Pack agregado (ahora tienes ${nuevaCantidad})`,
        cartCount: count[0].total || 0
      });
    }

    // Si no existe, crear nuevo
    const hayStock = await checkStock(producto_id, unidadesPorPack);
    if (!hayStock) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock insuficiente' 
      });
    }

    await pool.query(
      'INSERT INTO carritos (id_usuario, id_producto, cantidad, pack_size) VALUES (?, ?, 1, ?)',
      [userId, producto_id, packSizeNum]
    );

    const [count] = await pool.query(
      'SELECT SUM(cantidad) as total FROM carritos WHERE id_usuario = ?',
      [userId]
    );

    res.json({ 
      success: true, 
      message: `Pack de ${packSizeNum} latas agregado al carrito`,
      cartCount: count[0].total || 0
    });
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al agregar producto al carrito' 
    });
  }
};

// Actualizar cantidad de un item
const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id_carrito, action } = req.body;

    if (!id_carrito || !action) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos incompletos' 
      });
    }

    // Obtener item actual
    const [cartItems] = await pool.query(
      'SELECT * FROM carritos WHERE id_carrito = ? AND id_usuario = ?',
      [id_carrito, userId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item no encontrado' 
      });
    }

    const currentItem = cartItems[0];
    let nuevaCantidad = currentItem.cantidad;

    if (action === 'increase') {
      nuevaCantidad += 1;
      
      const unidadesTotales = nuevaCantidad * PACK_CONFIG[currentItem.pack_size].unidades;
      const hayStock = await checkStock(currentItem.id_producto, unidadesTotales);
      
      if (!hayStock) {
        return res.status(400).json({ 
          success: false, 
          message: 'Stock insuficiente' 
        });
      }
    } else if (action === 'decrease') {
      nuevaCantidad -= 1;
      
      if (nuevaCantidad <= 0) {
        await pool.query(
          'DELETE FROM carritos WHERE id_carrito = ?',
          [id_carrito]
        );

        const [count] = await pool.query(
          'SELECT SUM(cantidad) as total FROM carritos WHERE id_usuario = ?',
          [userId]
        );

        return res.json({ 
          success: true, 
          message: 'Producto eliminado del carrito',
          cartCount: count[0].total || 0,
          removed: true
        });
      }
    }

    await pool.query(
      'UPDATE carritos SET cantidad = ? WHERE id_carrito = ?',
      [nuevaCantidad, id_carrito]
    );

    const [count] = await pool.query(
      'SELECT SUM(cantidad) as total FROM carritos WHERE id_usuario = ?',
      [userId]
    );

    // Obtener información actualizada para calcular precio
    const [updatedItems] = await pool.query(`
      SELECT c.*, p.precio 
      FROM carritos c 
      JOIN productos p ON c.id_producto = p.id_producto 
      WHERE c.id_carrito = ?
    `, [id_carrito]);

    const itemData = updatedItems[0];
    const packConfig = PACK_CONFIG[itemData.pack_size];
    const precioSinDescuento = itemData.precio * packConfig.unidades;
    const descuentoMonto = Math.round(precioSinDescuento * (packConfig.descuento / 100));
    const precioFinal = precioSinDescuento - descuentoMonto;
    const precioTotal = precioFinal * itemData.cantidad;

    res.json({ 
      success: true, 
      message: 'Cantidad actualizada',
      cartCount: count[0].total || 0,
      newQuantity: nuevaCantidad,
      precioTotal: precioTotal
    });
  } catch (error) {
    console.error('Error al actualizar cantidad:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar cantidad' 
    });
  }
};

// Eliminar item del carrito
const removeFromCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id_carrito } = req.body;

    if (!id_carrito) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de carrito no proporcionado' 
      });
    }

    const [result] = await pool.query(
      'DELETE FROM carritos WHERE id_carrito = ? AND id_usuario = ?',
      [id_carrito, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item no encontrado en el carrito' 
      });
    }

    const [count] = await pool.query(
      'SELECT SUM(cantidad) as total FROM carritos WHERE id_usuario = ?',
      [userId]
    );

    res.json({ 
      success: true, 
      message: 'Producto eliminado del carrito',
      cartCount: count[0].total || 0
    });
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar producto' 
    });
  }
};

// Limpiar carrito completo
const clearCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    await pool.query(
      'DELETE FROM carritos WHERE id_usuario = ?',
      [userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Carrito vaciado',
      cartCount: 0
    });
  } catch (error) {
    console.error('Error al limpiar carrito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al limpiar carrito' 
    });
  }
};

// Obtener cantidad de items en carrito
const getCartCount = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const [count] = await pool.query(
      'SELECT SUM(cantidad) as total FROM carritos WHERE id_usuario = ?',
      [userId]
    );
    
    res.json({ 
      success: true, 
      count: count[0].total || 0
    });
  } catch (error) {
    console.error('Error al obtener contador:', error);
    res.json({ success: false, count: 0 });
  }
};

module.exports = {
  getCarrito,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartCount
};