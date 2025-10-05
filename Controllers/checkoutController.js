const pool = require('../config/db');
const { PACK_CONFIG } = require('./productController');

// Mostrar página de checkout
const getCheckout = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Obtener items del carrito CON pack_size
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

    if (cartItems.length === 0) {
      req.flash('error', 'Tu carrito está vacío');
      return res.redirect('/carrito');
    }

    // Procesar items para calcular totales
    const processedItems = cartItems.map(item => {
      const packSize = item.pack_size;
      const cantidadPacks = item.cantidad;
      const packConfig = PACK_CONFIG[packSize] || { unidades: packSize, descuento: 0 };
      
      const precioSinDescuento = item.precio * packConfig.unidades;
      const descuentoMonto = Math.round(precioSinDescuento * (packConfig.descuento / 100));
      const precioFinal = precioSinDescuento - descuentoMonto;

      return {
        id_producto: item.id_producto,
        nombre: `${item.nombre} - Pack de ${packSize} latas`,
        pack_size: packSize,
        cantidad: cantidadPacks,
        unidades_totales: packSize * cantidadPacks,
        precio_por_pack: precioFinal,
        precio: precioFinal * cantidadPacks,
        descuento: packConfig.descuento
      };
    });

    const total = processedItems.reduce((sum, item) => sum + item.precio, 0);

    res.render('checkout', {
      title: 'Checkout',
      activePage: 'checkout',
      cartItems: processedItems,
      total,
      userAddress: req.session.userAddress || ''
    });
  } catch (error) {
    console.error('Error en checkout:', error);
    req.flash('error', 'Error al procesar el checkout');
    res.redirect('/carrito');
  }
};

// Procesar pago (simulado para proyecto estudiantil)
const processPayment = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.session.userId;
    const { 
      titular, 
      numero_tarjeta, 
      cvv, 
      fecha_expiracion,
      direccion_envio 
    } = req.body;

    // Validaciones básicas
    if (!titular || !numero_tarjeta || !cvv || !fecha_expiracion || !direccion_envio) {
      throw new Error('Todos los campos son obligatorios');
    }

    // Obtener items del carrito CON pack_size
    const [cartItems] = await connection.query(`
      SELECT 
        c.id_producto,
        c.cantidad,
        c.pack_size,
        p.precio
      FROM carritos c
      INNER JOIN productos p ON c.id_producto = p.id_producto
      WHERE c.id_usuario = ?
    `, [userId]);

    if (cartItems.length === 0) {
      throw new Error('El carrito está vacío');
    }

    // Calcular total y preparar detalles de orden
    let total = 0;
    const orderDetails = [];

    for (const item of cartItems) {
      const packSize = item.pack_size;
      const packConfig = PACK_CONFIG[packSize] || { unidades: packSize, descuento: 0 };
      
      const precioSinDescuento = item.precio * packConfig.unidades;
      const precioFinal = Math.round(precioSinDescuento * (1 - packConfig.descuento / 100));
      const precioTotalLinea = precioFinal * item.cantidad;
      
      total += precioTotalLinea;
      
      orderDetails.push({
        id_producto: item.id_producto,
        cantidad: packSize * item.cantidad, // Total de unidades (latas)
        precio_unitario: item.precio,
        precio_total: precioTotalLinea
      });
    }

    // Crear orden
    const [orderResult] = await connection.query(
      'INSERT INTO ordenes (id_usuario, monto_total, fecha_creacion) VALUES (?, ?, NOW())',
      [userId, total]
    );

    const orderId = orderResult.insertId;

    // Insertar detalles de la orden
    for (const detail of orderDetails) {
      await connection.query(
        'INSERT INTO detalle_orden (id_orden, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [orderId, detail.id_producto, detail.cantidad, detail.precio_unitario]
      );
    }

    // Crear seguimiento del pedido - Estado inicial: "PROCESANDO PAGO"
    await connection.query(
      'INSERT INTO seguimiento_estado (id_orden, id_estado, fecha) VALUES (?, 4, NOW())',
      [orderId]
    );

    // Simular procesamiento de pago exitoso
    await connection.query(
      'INSERT INTO seguimiento_estado (id_orden, id_estado, fecha) VALUES (?, 3, NOW())',
      [orderId]
    );

    // Vaciar el carrito
    await connection.query('DELETE FROM carritos WHERE id_usuario = ?', [userId]);

    await connection.commit();

    req.flash('success', `¡Pago procesado exitosamente! Tu pedido #${orderId} está en camino.`);
    res.redirect('/mis-pedidos');

  } catch (error) {
    await connection.rollback();
    console.error('Error al procesar pago:', error);
    req.flash('error', error.message || 'Error al procesar el pago');
    res.redirect('/checkout');
  } finally {
    connection.release();
  }
};

module.exports = {
  getCheckout,
  processPayment
};