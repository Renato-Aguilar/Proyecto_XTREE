const pool = require('../config/db');

// Función helper para iconos de estados
const getIconForStatus = (estado) => {
  const icons = {
    'PROCESANDO PAGO': 'credit-card',
    'PAGO ACEPTADO': 'check-circle',
    'PROCESANDO PEDIDO': 'box',
    'EN CAMINO': 'truck-fast',
    'ENTREGADO/RETIRADO': 'circle-check'
  };
  return icons[estado] || 'circle';
};

// Ver todos los pedidos del usuario
const getMisPedidos = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userRole = req.session.userRole;

    let orders;

    // ✅ Si es admin/superadmin, mostrar todos los pedidos
    if (userRole === 'admin' || userRole === 'superadmin') {
      const [allOrders] = await pool.query(`
        SELECT 
          o.id_orden,
          o.monto_total,
          o.fecha_creacion,
          o.id_usuario,
          u.nombre,
          u.apellido,
          u.email,
          ep.estado as estado_actual
        FROM ordenes o
        INNER JOIN usuarios u ON o.id_usuario = u.id_usuario
        LEFT JOIN (
          SELECT 
            id_orden, 
            id_estado,
            fecha,
            ROW_NUMBER() OVER (PARTITION BY id_orden ORDER BY fecha DESC) as rn
          FROM seguimiento_estado
        ) se ON o.id_orden = se.id_orden AND se.rn = 1
        LEFT JOIN estado_pedido ep ON se.id_estado = ep.id_estado
        ORDER BY o.fecha_creacion DESC
      `);
      orders = allOrders;
    } else {
      // ✅ Si es cliente, mostrar solo sus pedidos
      const [userOrders] = await pool.query(`
        SELECT 
          o.id_orden,
          o.monto_total,
          o.fecha_creacion,
          o.id_usuario,
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
      orders = userOrders;
    }

    res.render('mis-pedidos', {
      title: 'Mis Pedidos',
      activePage: 'mis-pedidos',
      orders,
      isAdmin: userRole === 'admin' || userRole === 'superadmin'
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    req.flash('error', 'Error al cargar tus pedidos');
    res.redirect('/');
  }
};

// Ver detalle de un pedido específico
// ✅ ARREGLADO: Permitir que admins vean cualquier pedido
const getDetallePedido = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userRole = req.session.userRole;
    const { id } = req.params;

    // ✅ PASO 1: Obtener el pedido
    let [orderCheck] = await pool.query(
      'SELECT * FROM ordenes WHERE id_orden = ?',
      [id]
    );

    if (orderCheck.length === 0) {
      req.flash('error', 'Pedido no encontrado');
      return res.redirect('/mis-pedidos');
    }

    const order = orderCheck[0];

    // ✅ PASO 2: Verificar permisos
    // Si es cliente, debe ser su propio pedido
    // Si es admin/superadmin, puede ver cualquier pedido
    if (userRole !== 'admin' && userRole !== 'superadmin' && order.id_usuario !== userId) {
      req.flash('error', 'No tienes permiso para ver este pedido');
      return res.redirect('/mis-pedidos');
    }

    // ✅ PASO 3: Obtener detalles del pedido
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

    // ✅ PASO 4: Obtener historial de estados
    const [tracking] = await pool.query(`
      SELECT 
        ep.estado,
        se.fecha
      FROM seguimiento_estado se
      INNER JOIN estado_pedido ep ON se.id_estado = ep.id_estado
      WHERE se.id_orden = ?
      ORDER BY se.fecha ASC
    `, [id]);

    // ✅ PASO 5: Si es admin, obtener datos del usuario también
    let clientData = null;
    if (userRole === 'admin' || userRole === 'superadmin') {
      const [userData] = await pool.query(
        'SELECT id_usuario, nombre, apellido, email, direccion FROM usuarios WHERE id_usuario = ?',
        [order.id_usuario]
      );
      clientData = userData[0] || null;
    }

    res.render('detalle-pedido', {
      title: `Pedido #${id}`,
      activePage: 'mis-pedidos',
      order,
      details,
      tracking,
      clientData,
      isAdmin: userRole === 'admin' || userRole === 'superadmin',
      getIconForStatus
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