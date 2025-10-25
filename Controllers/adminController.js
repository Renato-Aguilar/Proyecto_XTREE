// ==================== CONTROLLERS/ADMINCONTROLLER.JS - VERSIÓN COMPLETA ====================

const pool = require('../config/db');
const { logAdminAction } = require('../middleware/adminMiddleware');

// ==================== DASHBOARD ====================
const getDashboard = async (req, res) => {
  try {
    const [stats] = await pool.query('SELECT * FROM vista_estadisticas_admin');

    const [recentOrders] = await pool.query(`
      SELECT o.*, u.nombre, u.apellido, u.email
      FROM ordenes o
      INNER JOIN usuarios u ON o.id_usuario = u.id_usuario
      ORDER BY o.fecha_creacion DESC
      LIMIT 5
    `);

    const [recentHelp] = await pool.query(`
      SELECT s.*, u.nombre, u.apellido
      FROM solicitudes_ayuda s
      INNER JOIN usuarios u ON s.id_usuario = u.id_usuario
      ORDER BY s.fecha_creacion DESC
      LIMIT 5
    `);

    const [lowStock] = await pool.query(`
      SELECT p.*, s.cantidad
      FROM productos p
      INNER JOIN stock_productos s ON p.id_producto = s.id_producto
      WHERE s.cantidad < 50
      ORDER BY s.cantidad ASC
    `);

    res.render('admin/dashboard', {
      title: 'Dashboard Admin',
      activePage: 'admin',
      stats: stats[0] || {},
      recentOrders,
      recentHelp,
      lowStock
    });
  } catch (error) {
    console.error('Error al cargar dashboard:', error);
    req.flash('error', 'Error al cargar el dashboard');
    res.redirect('/');
  }
};

// ==================== GESTIÓN DE PRODUCTOS ====================
const getProductos = async (req, res) => {
  try {
    const [productos] = await pool.query(`
      SELECT p.*, s.cantidad as stock
      FROM productos p
      LEFT JOIN stock_productos s ON p.id_producto = s.id_producto
      ORDER BY p.id_producto DESC
    `);

    res.render('admin/productos', {
      title: 'Gestión de Productos',
      activePage: 'admin',
      productos
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    req.flash('error', 'Error al cargar productos');
    res.redirect('/admin/dashboard');
  }
};

const updateProducto = async (req, res) => {
  let connection;
  try {
    const { id_producto } = req.params;
    const { nombre, descripcion, precio, stock } = req.body;

    // ✅ VALIDACIONES
    if (!nombre || !descripcion || precio === undefined || stock === undefined) {
      req.flash('error', 'Todos los campos son obligatorios');
      return res.redirect('/admin/productos');
    }

    const precioNum = parseFloat(precio);
    const stockNum = parseInt(stock, 10);

    if (isNaN(precioNum) || precioNum <= 0) {
      req.flash('error', 'Precio debe ser un número válido positivo');
      return res.redirect('/admin/productos');
    }

    if (isNaN(stockNum) || stockNum < 0) {
      req.flash('error', 'Stock debe ser un número válido no negativo');
      return res.redirect('/admin/productos');
    }

    if (nombre.trim().length < 3 || nombre.length > 100) {
      req.flash('error', 'Nombre debe tener entre 3 y 100 caracteres');
      return res.redirect('/admin/productos');
    }

    if (descripcion.trim().length < 10 || descripcion.length > 5000) {
      req.flash('error', 'Descripción debe tener entre 10 y 5000 caracteres');
      return res.redirect('/admin/productos');
    }

    const [productos] = await pool.query(
      'SELECT id_producto FROM productos WHERE id_producto = ?',
      [id_producto]
    );

    if (productos.length === 0) {
      req.flash('error', 'Producto no encontrado');
      return res.redirect('/admin/productos');
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query(
      'UPDATE productos SET nombre = ?, descripcion = ?, precio = ? WHERE id_producto = ?',
      [nombre.trim(), descripcion.trim(), precioNum, id_producto]
    );

    await connection.query(
      'UPDATE stock_productos SET cantidad = ? WHERE id_producto = ?',
      [stockNum, id_producto]
    );

    await logAdminAction(
      req.session.userId,
      'Actualizar Producto',
      'productos',
      id_producto,
      `Nombre: ${nombre}, Precio: ${precioNum}, Stock: ${stockNum}`,
      req.ip
    );

    await connection.commit();

    req.flash('success', 'Producto actualizado correctamente');
    res.redirect('/admin/productos');
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al actualizar producto:', error);
    req.flash('error', 'Error al actualizar el producto');
    res.redirect('/admin/productos');
  } finally {
    if (connection) connection.release();
  }
};

// ==================== GESTIÓN DE PEDIDOS ====================
const getPedidos = async (req, res) => {
  try {
    const { filtro } = req.query;

    let query = `
      SELECT 
        o.id_orden,
        o.monto_total,
        o.fecha_creacion,
        o.tiene_problema,
        o.descripcion_problema,
        u.nombre,
        u.apellido,
        u.email,
        ep.estado
      FROM ordenes o
      INNER JOIN usuarios u ON o.id_usuario = u.id_usuario
      LEFT JOIN (
        SELECT id_orden, id_estado, fecha,
        ROW_NUMBER() OVER (PARTITION BY id_orden ORDER BY fecha DESC) as rn
        FROM seguimiento_estado
      ) se ON o.id_orden = se.id_orden AND se.rn = 1
      LEFT JOIN estado_pedido ep ON se.id_estado = ep.id_estado
    `;

    const params = [];

    if (filtro === 'problemas') {
      query += ' WHERE o.tiene_problema = TRUE';
    }

    query += ' ORDER BY o.fecha_creacion DESC';

    const [pedidos] = await pool.query(query, params);

    res.render('admin/pedidos', {
      title: 'Gestión de Pedidos',
      activePage: 'admin',
      pedidos,
      filtro: filtro || 'todos'
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    req.flash('error', 'Error al cargar pedidos');
    res.redirect('/admin/dashboard');
  }
};

const marcarProblema = async (req, res) => {
  try {
    const { id_orden } = req.params;
    const { descripcion_problema } = req.body;

    if (!id_orden || isNaN(id_orden)) {
      req.flash('error', 'ID de orden inválido');
      return res.redirect('/admin/pedidos');
    }

    if (!descripcion_problema) {
      req.flash('error', 'Orden y descripción del problema son requeridas');
      return res.redirect('/admin/pedidos');
    }

    const descripcionTrimmed = descripcion_problema.trim();

    if (descripcionTrimmed.length < 10) {
      req.flash('error', 'La descripción debe tener al menos 10 caracteres');
      return res.redirect('/admin/pedidos');
    }

    if (descripcionTrimmed.length > 1000) {
      req.flash('error', 'La descripción no puede exceder 1000 caracteres');
      return res.redirect('/admin/pedidos');
    }

    const [ordenes] = await pool.query(
      'SELECT id_orden FROM ordenes WHERE id_orden = ?',
      [id_orden]
    );

    if (ordenes.length === 0) {
      req.flash('error', 'Pedido no encontrado');
      return res.redirect('/admin/pedidos');
    }

    await pool.query(
      'UPDATE ordenes SET tiene_problema = TRUE, descripcion_problema = ? WHERE id_orden = ?',
      [descripcionTrimmed, id_orden]
    );

    await logAdminAction(
      req.session.userId,
      'Marcar Problema en Pedido',
      'ordenes',
      id_orden,
      descripcionTrimmed.substring(0, 100),
      req.ip
    );

    req.flash('success', 'Problema marcado en el pedido');
    res.redirect('/admin/pedidos');
  } catch (error) {
    console.error('Error al marcar problema:', error);
    req.flash('error', 'Error al marcar problema en pedido');
    res.redirect('/admin/pedidos');
  }
};

const resolverProblema = async (req, res) => {
  try {
    const { id_orden } = req.params;

    if (!id_orden) {
      req.flash('error', 'ID de orden requerido');
      return res.redirect('/admin/pedidos');
    }

    const [ordenes] = await pool.query(
      'SELECT id_orden, tiene_problema FROM ordenes WHERE id_orden = ?',
      [id_orden]
    );

    if (ordenes.length === 0) {
      req.flash('error', 'Pedido no encontrado');
      return res.redirect('/admin/pedidos');
    }

    if (!ordenes[0].tiene_problema) {
      req.flash('error', 'Este pedido no tiene problemas registrados');
      return res.redirect('/admin/pedidos');
    }

    await pool.query(
      'UPDATE ordenes SET tiene_problema = FALSE, descripcion_problema = NULL WHERE id_orden = ?',
      [id_orden]
    );

    await logAdminAction(
      req.session.userId,
      'Resolver Problema de Pedido',
      'ordenes',
      id_orden,
      'Problema resuelto',
      req.ip
    );

    req.flash('success', 'Problema resuelto correctamente');
    res.redirect('/admin/pedidos');
  } catch (error) {
    console.error('Error al resolver problema:', error);
    req.flash('error', 'Error al resolver problema');
    res.redirect('/admin/pedidos');
  }
};

// ==================== CENTRO DE AYUDA ====================
const getSolicitudesAyuda = async (req, res) => {
  try {
    const { estado } = req.query;

    let query = `
      SELECT s.*, u.nombre, u.apellido, u.email,
             a.nombre as admin_nombre, a.apellido as admin_apellido
      FROM solicitudes_ayuda s
      INNER JOIN usuarios u ON s.id_usuario = u.id_usuario
      LEFT JOIN usuarios a ON s.atendido_por = a.id_usuario
    `;

    const params = [];

    if (estado && estado !== 'todas') {
      const estadosValidos = ['pendiente', 'en_proceso', 'resuelta', 'cerrada'];
      if (!estadosValidos.includes(estado)) {
        req.flash('error', 'Estado inválido');
        return res.redirect('/admin/ayuda');
      }
      query += ` WHERE s.estado = ?`;
      params.push(estado);
    }

    query += ` ORDER BY s.prioridad DESC, s.fecha_creacion DESC`;

    const [solicitudes] = await pool.query(query, params);

    res.render('admin/ayuda', {
      title: 'Centro de Ayuda',
      activePage: 'admin',
      solicitudes,
      estadoFiltro: estado || 'todas'
    });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    req.flash('error', 'Error al cargar solicitudes de ayuda');
    res.redirect('/admin/dashboard');
  }
};

const getDetalleSolicitud = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      req.flash('error', 'ID de solicitud inválido');
      return res.redirect('/admin/ayuda');
    }

    const [solicitud] = await pool.query(`
      SELECT s.*, u.nombre, u.apellido, u.email, u.direccion,
             a.nombre as admin_nombre, a.apellido as admin_apellido
      FROM solicitudes_ayuda s
      INNER JOIN usuarios u ON s.id_usuario = u.id_usuario
      LEFT JOIN usuarios a ON s.atendido_por = a.id_usuario
      WHERE s.id_solicitud = ?
    `, [id]);

    if (solicitud.length === 0) {
      req.flash('error', 'Solicitud no encontrada');
      return res.redirect('/admin/ayuda');
    }

    const [respuestas] = await pool.query(`
      SELECT r.*, u.nombre, u.apellido
      FROM respuestas_ayuda r
      INNER JOIN usuarios u ON r.id_usuario = u.id_usuario
      WHERE r.id_solicitud = ?
      ORDER BY r.fecha_creacion ASC
    `, [id]);

    res.render('admin/ayuda-detalle', {
      title: 'Detalle de Solicitud',
      activePage: 'admin',
      solicitud: solicitud[0],
      respuestas
    });
  } catch (error) {
    console.error('Error al obtener detalle:', error);
    req.flash('error', 'Error al cargar solicitud');
    res.redirect('/admin/ayuda');
  }
};

const responderSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { mensaje, estado } = req.body;

    if (!id || isNaN(id)) {
      req.flash('error', 'ID de solicitud inválido');
      return res.redirect('/admin/ayuda');
    }

    if (!mensaje) {
      req.flash('error', 'El mensaje es obligatorio');
      return res.redirect(`/admin/ayuda/${id}`);
    }

    const mensajeTrimmed = mensaje.trim();

    if (mensajeTrimmed.length < 10) {
      req.flash('error', 'El mensaje debe tener al menos 10 caracteres');
      return res.redirect(`/admin/ayuda/${id}`);
    }

    if (mensajeTrimmed.length > 5000) {
      req.flash('error', 'El mensaje no puede exceder 5000 caracteres');
      return res.redirect(`/admin/ayuda/${id}`);
    }

    const estadosValidos = ['pendiente', 'en_proceso', 'resuelta', 'cerrada'];
    if (!estado || !estadosValidos.includes(estado)) {
      req.flash('error', 'Estado inválido');
      return res.redirect(`/admin/ayuda/${id}`);
    }

    const [solicitudes] = await pool.query(
      'SELECT id_solicitud FROM solicitudes_ayuda WHERE id_solicitud = ?',
      [id]
    );

    if (solicitudes.length === 0) {
      req.flash('error', 'Solicitud no encontrada');
      return res.redirect('/admin/ayuda');
    }

    await pool.query(
      'INSERT INTO respuestas_ayuda (id_solicitud, id_usuario, mensaje, es_admin) VALUES (?, ?, ?, TRUE)',
      [id, req.session.userId, mensajeTrimmed]
    );

    await pool.query(
      `UPDATE solicitudes_ayuda 
       SET estado = ?, 
           atendido_por = COALESCE(atendido_por, ?),
           fecha_actualizacion = NOW()
       WHERE id_solicitud = ?`,
      [estado, req.session.userId, id]
    );

    await logAdminAction(
      req.session.userId,
      'Responder Solicitud de Ayuda',
      'solicitudes_ayuda',
      id,
      `Estado: ${estado}, Mensaje: ${mensajeTrimmed.substring(0, 100)}...`,
      req.ip
    );

    req.flash('success', 'Respuesta enviada correctamente');
    res.redirect(`/admin/ayuda/${id}`);
  } catch (error) {
    console.error('Error al responder solicitud:', error);
    req.flash('error', 'Error al enviar respuesta');
    res.redirect(`/admin/ayuda/${id}`);
  }
};

// ==================== GESTIÓN DE USUARIOS ====================
const getUsuarios = async (req, res) => {
  try {
    const [usuarios] = await pool.query(`
      SELECT 
        u.id_usuario,
        u.nombre_usuario,
        u.nombre,
        u.apellido,
        u.email,
        u.rol,
        u.fecha_registro,
        COUNT(DISTINCT o.id_orden) as total_pedidos,
        COALESCE(SUM(o.monto_total), 0) as gasto_total
      FROM usuarios u
      LEFT JOIN ordenes o ON u.id_usuario = o.id_usuario
      WHERE u.rol != 'superadmin' OR u.id_usuario = ?
      GROUP BY u.id_usuario
      ORDER BY u.fecha_registro DESC
    `, [req.session.userId]);

    res.render('admin/usuarios', {
      title: 'Gestión de Usuarios',
      activePage: 'admin',
      usuarios,
      isSuperAdmin: req.session.userRole === 'superadmin'
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    req.flash('error', 'Error al cargar usuarios');
    res.redirect('/admin/dashboard');
  }
};

const updateUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { nombre, apellido, email, direccion, rol } = req.body;

    if (!id_usuario || isNaN(id_usuario)) {
      req.flash('error', 'ID de usuario inválido');
      return res.redirect('/admin/usuarios');
    }

    if (!nombre || !apellido || !email) {
      req.flash('error', 'Nombre, apellido y email son obligatorios');
      return res.redirect('/admin/usuarios');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      req.flash('error', 'Email inválido');
      return res.redirect('/admin/usuarios');
    }

    const [usuarios] = await pool.query(
      'SELECT id_usuario, rol FROM usuarios WHERE id_usuario = ?',
      [id_usuario]
    );

    if (usuarios.length === 0) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/admin/usuarios');
    }

    if (rol && req.session.userRole !== 'superadmin') {
      req.flash('error', 'Solo superadministradores pueden cambiar roles');
      return res.redirect('/admin/usuarios');
    }

    if (rol === 'cliente' && parseInt(id_usuario) === req.session.userId) {
      req.flash('error', 'No puedes cambiar tu propio rol a cliente');
      return res.redirect('/admin/usuarios');
    }

    const rolesValidos = ['cliente', 'admin', 'superadmin'];
    if (rol && !rolesValidos.includes(rol)) {
      req.flash('error', 'Rol inválido');
      return res.redirect('/admin/usuarios');
    }

    const [emailExistente] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario != ?',
      [email.trim(), id_usuario]
    );

    if (emailExistente.length > 0) {
      req.flash('error', 'Este email ya está registrado');
      return res.redirect('/admin/usuarios');
    }

    let query = 'UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, direccion = ?';
    let params = [nombre.trim(), apellido.trim(), email.trim(), direccion ? direccion.trim() : ''];

    if (rol && req.session.userRole === 'superadmin') {
      query += ', rol = ?';
      params.push(rol);
    }

    query += ' WHERE id_usuario = ?';
    params.push(id_usuario);

    await pool.query(query, params);

    await logAdminAction(
      req.session.userId,
      'Actualizar Usuario',
      'usuarios',
      id_usuario,
      `Email: ${email.trim()}, Rol: ${rol || 'sin cambio'}`,
      req.ip
    );

    req.flash('success', 'Usuario actualizado correctamente');
    res.redirect('/admin/usuarios');
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    req.flash('error', error.message || 'Error al actualizar usuario');
    res.redirect('/admin/usuarios');
  }
};

// ==================== EXPORTAR FUNCIONES ====================
module.exports = {
  getDashboard,
  getProductos,
  updateProducto,
  getPedidos,
  marcarProblema,
  resolverProblema,
  getSolicitudesAyuda,
  getDetalleSolicitud,
  responderSolicitud,
  getUsuarios,
  updateUsuario
};