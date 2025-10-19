const pool = require('../config/db');
const { PACK_CONFIG } = require('./productController');
const paypal = require('@paypal/checkout-server-sdk');
const { client: paypalClient } = require('../config/paypal');

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
      userAddress: req.session.userAddress || '',
      paypalClientId: process.env.PAYPAL_CLIENT_ID // Pasar Client ID a la vista
    });
  } catch (error) {
    console.error('Error en checkout:', error);
    req.flash('error', 'Error al procesar el checkout');
    res.redirect('/carrito');
  }
};

// Crear orden de PayPal
const createPayPalOrder = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Obtener items del carrito
    const [cartItems] = await pool.query(`
      SELECT 
        c.id_producto,
        c.cantidad,
        c.pack_size,
        p.nombre,
        p.precio
      FROM carritos c
      INNER JOIN productos p ON c.id_producto = p.id_producto
      WHERE c.id_usuario = ?
    `, [userId]);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío' });
    }

    // Calcular total
    let total = 0;
    const items = cartItems.map(item => {
      const packSize = item.pack_size;
      const packConfig = PACK_CONFIG[packSize] || { unidades: packSize, descuento: 0 };
      
      const precioSinDescuento = item.precio * packConfig.unidades;
      const precioFinal = Math.round(precioSinDescuento * (1 - packConfig.descuento / 100));
      const precioTotalLinea = precioFinal * item.cantidad;
      
      total += precioTotalLinea;

      return {
        name: `${item.nombre} - Pack x${packSize}`,
        unit_amount: {
          currency_code: 'USD',
          value: precioFinal.toString()
        },
        quantity: item.cantidad.toString()
      };
    });

    // Crear orden en PayPal
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: total.toString(),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: total.toString()
            }
          }
        },
        items: items
      }],
      application_context: {
        brand_name: 'XTREE Energy',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${req.protocol}://${req.get('host')}/checkout/success`,
        cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`
      }
    });

    const order = await paypalClient().execute(request);
    
    res.json({ id: order.result.id });
  } catch (error) {
    console.error('Error al crear orden PayPal:', error);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
};

// Capturar pago de PayPal
const capturePayPalOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.session.userId;
    const { orderID } = req.body;

    // Capturar el pago en PayPal
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    const capture = await paypalClient().execute(request);

    // Verificar que el pago fue exitoso
    if (capture.result.status !== 'COMPLETED') {
      throw new Error('El pago no se completó correctamente');
    }

    // Obtener items del carrito
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
        cantidad: packSize * item.cantidad,
        precio_unitario: item.precio,
        precio_total: precioTotalLinea
      });
    }

    // Crear orden en la BD
    const [orderResult] = await connection.query(
      'INSERT INTO ordenes (id_usuario, monto_total, paypal_order_id, fecha_creacion) VALUES (?, ?, ?, NOW())',
      [userId, total, orderID]
    );

    const orderId = orderResult.insertId;

    // Insertar detalles de la orden
    for (const detail of orderDetails) {
      await connection.query(
        'INSERT INTO detalle_orden (id_orden, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [orderId, detail.id_producto, detail.cantidad, detail.precio_unitario]
      );
    }

    // Crear seguimiento del pedido
    await connection.query(
      'INSERT INTO seguimiento_estado (id_orden, id_estado, fecha) VALUES (?, 3, NOW())',
      [orderId]
    );

    // Vaciar el carrito
    await connection.query('DELETE FROM carritos WHERE id_usuario = ?', [userId]);

    await connection.commit();

    res.json({ 
      success: true, 
      orderId: orderId,
      message: `¡Pago exitoso! Tu pedido #${orderId} está en camino.`
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al capturar pago:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Error al procesar el pago' 
    });
  } finally {
    connection.release();
  }
};

// Página de éxito
const getCheckoutSuccess = (req, res) => {
  req.flash('success', '¡Pago procesado exitosamente! Tu pedido está en camino.');
  res.redirect('/mis-pedidos');
};

// Página de cancelación
const getCheckoutCancel = (req, res) => {
  req.flash('error', 'Pago cancelado. Puedes intentar nuevamente cuando estés listo.');
  res.redirect('/checkout');
};

module.exports = {
  getCheckout,
  createPayPalOrder,
  capturePayPalOrder,
  getCheckoutSuccess,
  getCheckoutCancel
};