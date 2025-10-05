const pool = require('../config/db');

// Ver todos los pedidos del usuario
const getMisPedidos = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Obtener pedidos con su último estado
    const [orders] = await pool.query(`
      SELECT 
        o.id_orden,
        o.monto_total,
        o.fecha_creacion,
        ep.estado as estado_actual
      FROM ordenes o
      LEFT JOIN (
        SELECT 
          id_orden, 
          id_estado,
          fecha,
          ROW_NUMBER() OVER (PARTITION BY id_orden ORDER BY fecha DESC) as rn
        FROM seguimiento_estado
      ) se ON o.id_orden = se.id_orden AND se.rn = 1
      LEFT JOIN estado_pedido ep ON se.id_estado = ep.id_estado
      WHERE o.id_usuario = ?
      ORDER BY o.fecha_creacion DESC
    `, [userId]);

    res.render('mis-pedidos', {
      title: 'Mis Pedidos',
      activePage: 'mis-pedidos',
      orders
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    req.flash('error', 'Error al cargar tus pedidos');
    res.redirect('/');
  }
};

// Ver detalle de un pedido específico
const getDetallePedido = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    // Verificar que el pedido pertenezca al usuario
    const [orderCheck] = await pool.query(
      'SELECT * FROM ordenes WHERE id_orden = ? AND id_usuario = ?',
      [id, userId]
    );

    if (orderCheck.length === 0) {
      req.flash('error', 'Pedido no encontrado');
      return res.redirect('/mis-pedidos');
    }

    const order = orderCheck[0];

    // Obtener detalles del pedido
    const [details] = await pool.query(`
      SELECT 
        d.cantidad,
        d.precio_unitario,
        p.nombre,
        p.imagen_url
      FROM detalle_orden d
      INNER JOIN productos p ON d.id_producto = p.id_producto
      WHERE d.id_orden = ?
    `, [id]);

    // Obtener historial de estados
    const [tracking] = await pool.query(`
      SELECT 
        ep.estado,
        se.fecha
      FROM seguimiento_estado se
      INNER JOIN estado_pedido ep ON se.id_estado = ep.id_estado
      WHERE se.id_orden = ?
      ORDER BY se.fecha ASC
    `, [id]);

    res.render('detalle-pedido', {
      title: `Pedido #${id}`,
      activePage: 'mis-pedidos',
      order,
      details,
      tracking
    });
  } catch (error) {
    console.error('Error al obtener detalle del pedido:', error);
    req.flash('error', 'Error al cargar el detalle del pedido');
    res.redirect('/mis-pedidos');
  }
};

module.exports = {
  getMisPedidos,
  getDetallePedido
};