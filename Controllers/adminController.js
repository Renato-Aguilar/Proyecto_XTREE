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

//  CREAR PRODUCTO
const createProducto = async (req, res) => {
  let connection;
  try {
    const { 
      nombre, 
      descripcion, 
      precio, 
      stock,
      color_principal,
      color_secundario,
      color_tertiary
    } = req.body;

    console.log('📝 Datos recibidos:', { nombre, precio, stock });
    console.log('📸 Archivo:', req.file ? `${req.file.filename} (${req.file.size} bytes)` : 'NO HAY ARCHIVO');
    console.log('🎨 Colores extraídos:', req.extractedColors);

    //  VALIDACIONES
    if (!nombre || !descripcion || !precio || stock === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, descripción, precio y stock son obligatorios'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'La imagen es obligatoria'
      });
    }

    const precioNum = parseFloat(precio);
    const stockNum = parseInt(stock, 10);

    if (isNaN(precioNum) || precioNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Precio debe ser un número válido positivo'
      });
    }

    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({
        success: false,
        error: 'Stock debe ser un número válido no negativo'
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const imagenUrl = req.file.imagePath || `/img/uploads/${req.file.filename}`;

    // Usar colores extraídos o manuales
    let colores = {
      color_principal: color_principal || '#00ff00',
      color_secundario: color_secundario || '#00cc00',
      color_tertiary: color_tertiary || '#66ff66'
    };

    if (req.extractedColors) {
      colores = req.extractedColors;
      console.log(' Usando colores automáticos extraídos');
    } else {
      console.log('📝 Usando colores manuales ingresados');
    }

    console.log('💾 Guardando producto en BD:', { imagenUrl, colores });

    // Insertar producto
    const [resultado] = await connection.query(
      `INSERT INTO productos 
      (nombre, descripcion, precio, imagen_url, color_principal, color_secundario, color_tertiary) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        descripcion.trim(),
        precioNum,
        imagenUrl,
        colores.color_principal,
        colores.color_secundario,
        colores.color_tertiary
      ]
    );

    const idProducto = resultado.insertId;

    // Insertar stock
    await connection.query(
      'INSERT INTO stock_productos (id_producto, cantidad) VALUES (?, ?)',
      [idProducto, stockNum]
    );

    // Registrar acción
    await logAdminAction(
      req.session.userId,
      'Crear Producto',
      'productos',
      idProducto,
      `${nombre} - Imagen: ${imagenUrl}`,
      req.ip
    );

    await connection.commit();

    console.log(' Producto creado exitosamente - ID:', idProducto);

    return res.json({
      success: true,
      message: ' Producto creado correctamente',
      productId: idProducto
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error al crear producto:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Error al crear producto: ' + error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

//  ACTUALIZAR PRODUCTO
const updateProducto = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { 
      nombre, 
      descripcion, 
      precio,
      stock,
      color_principal,
      color_secundario,
      color_tertiary
    } = req.body;

    console.log('📝 Actualizando producto:', { id, nombre, precio, stock });

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de producto inválido'
      });
    }

    if (!nombre || !descripcion || !precio) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, descripción y precio son obligatorios'
      });
    }

    const precioNum = parseFloat(precio);

    if (isNaN(precioNum) || precioNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Precio debe ser un número válido positivo'
      });
    }

    // Verificar que el producto existe
    const [productos] = await pool.query(
      'SELECT id_producto FROM productos WHERE id_producto = ?',
      [id]
    );

    if (productos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    let updateData = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: precioNum
    };

    // Usar colores extraídos o manuales
    if (req.extractedColors) {
      updateData.color_principal = req.extractedColors.color_principal;
      updateData.color_secundario = req.extractedColors.color_secundario;
      updateData.color_tertiary = req.extractedColors.color_tertiary;
    } else {
      if (color_principal) updateData.color_principal = color_principal;
      if (color_secundario) updateData.color_secundario = color_secundario;
      if (color_tertiary) updateData.color_tertiary = color_tertiary;
    }

    // Si se subió una imagen
    if (req.file) {
      updateData.imagen_url = req.file.imagePath || `/img/uploads/${req.file.filename}`;
    }

    // Construir query dinámico
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const query = `UPDATE productos SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id_producto = ?`;
    
    await connection.query(query, [...values, id]);

    // Actualizar stock si se proporciona
    if (stock !== undefined) {
      const stockNum = parseInt(stock, 10);
      if (!isNaN(stockNum) && stockNum >= 0) {
        await connection.query(
          'UPDATE stock_productos SET cantidad = ? WHERE id_producto = ?',
          [stockNum, id]
        );
        console.log('📦 Stock actualizado:', stockNum);
      }
    }

    // Registrar acción
    await logAdminAction(
      req.session.userId,
      'Actualizar Producto',
      'productos',
      id,
      `${nombre} - Precio: ${precioNum} - Stock: ${stock || 'sin cambio'}`,
      req.ip
    );

    await connection.commit();

    console.log(' Producto actualizado exitosamente');

    return res.json({
      success: true,
      message: ' Producto actualizado correctamente'
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error al actualizar producto:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar producto: ' + error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

//  ELIMINAR PRODUCTO
const deleteProducto = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de producto inválido'
      });
    }

    const [productos] = await pool.query(
      'SELECT id_producto FROM productos WHERE id_producto = ?',
      [id]
    );

    if (productos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Eliminar relaciones primero
    await connection.query('DELETE FROM stock_productos WHERE id_producto = ?', [id]);
    await connection.query('DELETE FROM productos WHERE id_producto = ?', [id]);

    await logAdminAction(
      req.session.userId,
      'Eliminar Producto',
      'productos',
      id,
      'Producto eliminado',
      req.ip
    );

    await connection.commit();

    return res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al eliminar producto:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar producto'
    });
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

// Reemplaza la función updateUsuario en adminController.js

const updateUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { nombre, apellido, email, direccion, rol } = req.body;

    console.log('🔍 UpdateUsuario recibido:');
    console.log('📍 ID Usuario:', id_usuario);
    console.log('📍 Req.body:', req.body);
    console.log('📍 Content-Type:', req.headers['content-type']);

    // ✅ Verificar que id_usuario es válido
    if (!id_usuario || isNaN(id_usuario)) {
      const errorMsg = 'ID de usuario inválido';
      
      // Si es AJAX, devolver JSON
      if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
        return res.status(400).json({ success: false, error: errorMsg });
      }
      
      req.flash('error', errorMsg);
      return res.redirect('/admin/usuarios');
    }

    // ✅ Al menos algún campo debe tener valor
    if (!nombre && !apellido && !email && !rol && !direccion) {
      const errorMsg = 'Debes modificar al menos un campo';
      
      if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
        return res.status(400).json({ success: false, error: errorMsg });
      }
      
      req.flash('error', errorMsg);
      return res.redirect('/admin/usuarios');
    }

    // ✅ Si se proporciona email, validar formato
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        const errorMsg = 'Email inválido';
        
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
          return res.status(400).json({ success: false, error: errorMsg });
        }
        
        req.flash('error', errorMsg);
        return res.redirect('/admin/usuarios');
      }
    }

    // ✅ Obtener usuario actual
    const [usuarios] = await pool.query(
      'SELECT id_usuario, rol FROM usuarios WHERE id_usuario = ?',
      [id_usuario]
    );

    if (usuarios.length === 0) {
      const errorMsg = 'Usuario no encontrado';
      
      if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
        return res.status(404).json({ success: false, error: errorMsg });
      }
      
      req.flash('error', errorMsg);
      return res.redirect('/admin/usuarios');
    }

    const usuarioActual = usuarios[0];

    // ✅ RESTRICCIÓN: Solo superadmin puede cambiar roles
    if (rol && req.session.userRole !== 'superadmin') {
      const errorMsg = 'Solo superadministradores pueden cambiar roles';
      
      if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
        return res.status(403).json({ success: false, error: errorMsg });
      }
      
      req.flash('error', errorMsg);
      return res.redirect('/admin/usuarios');
    }

    // ✅ RESTRICCIÓN: No cambiar propio rol
    if (rol && parseInt(id_usuario) === req.session.userId) {
      if (rol !== usuarioActual.rol) {
        const errorMsg = 'No puedes cambiar tu propio rol';
        
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
          return res.status(403).json({ success: false, error: errorMsg });
        }
        
        req.flash('error', errorMsg);
        return res.redirect('/admin/usuarios');
      }
    }

    // ✅ RESTRICCIÓN: No permitir rol superadmin
    if (rol === 'superadmin') {
      const errorMsg = 'El rol de superadmin no se puede asignar desde la interfaz';
      
      if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
        return res.status(403).json({ success: false, error: errorMsg });
      }
      
      req.flash('error', errorMsg);
      return res.redirect('/admin/usuarios');
    }

    // ✅ RESTRICCIÓN: No degradar superadmin
    if (usuarioActual.rol === 'superadmin' && rol && rol !== 'superadmin') {
      const errorMsg = 'No se puede cambiar el rol de un superadmin';
      
      if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
        return res.status(403).json({ success: false, error: errorMsg });
      }
      
      req.flash('error', errorMsg);
      return res.redirect('/admin/usuarios');
    }

    // ✅ RESTRICCIÓN: Solo roles permitidos
    if (rol) {
      const rolesPermitidos = ['cliente', 'admin'];
      if (!rolesPermitidos.includes(rol)) {
        const errorMsg = 'Rol no permitido. Solo "cliente" o "admin"';
        
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
          return res.status(400).json({ success: false, error: errorMsg });
        }
        
        req.flash('error', errorMsg);
        return res.redirect('/admin/usuarios');
      }
    }

    // ✅ Verificar email duplicado
    if (email && email.trim()) {
      const [emailExistente] = await pool.query(
        'SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario != ?',
        [email.trim(), id_usuario]
      );

      if (emailExistente.length > 0) {
        const errorMsg = 'Este email ya está registrado';
        
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
          return res.status(400).json({ success: false, error: errorMsg });
        }
        
        req.flash('error', errorMsg);
        return res.redirect('/admin/usuarios');
      }
    }

    // ✅ Construir query dinámico
    let query = 'UPDATE usuarios SET ';
    let params = [];
    let fields = [];

    if (nombre && nombre.trim()) {
      fields.push('nombre = ?');
      params.push(nombre.trim());
    }

    if (apellido && apellido.trim()) {
      fields.push('apellido = ?');
      params.push(apellido.trim());
    }

    if (email && email.trim()) {
      fields.push('email = ?');
      params.push(email.trim());
    }

    if (direccion !== undefined) {
      fields.push('direccion = ?');
      params.push(direccion ? direccion.trim() : '');
    }

    // Solo cambiar rol si es superadmin y el rol es diferente
    if (rol && req.session.userRole === 'superadmin' && rol !== usuarioActual.rol) {
      fields.push('rol = ?');
      params.push(rol);
    }

    // Si no hay campos para actualizar
    if (fields.length === 0) {
      const errorMsg = 'No hay cambios para guardar';
      
      if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
        return res.status(400).json({ success: false, error: errorMsg });
      }
      
      req.flash('error', errorMsg);
      return res.redirect('/admin/usuarios');
    }

    query += fields.join(', ') + ' WHERE id_usuario = ?';
    params.push(id_usuario);

    console.log('💾 Ejecutando query:', query);
    console.log('📋 Con parámetros:', params);

    await pool.query(query, params);

    await logAdminAction(
      req.session.userId,
      'Actualizar Usuario',
      'usuarios',
      id_usuario,
      `Email: ${email || 'sin cambio'}, Rol: ${rol || 'sin cambio'}`,
      req.ip
    );

    // ✅ Si es AJAX, devolver JSON
    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.json({
        success: true,
        message: 'Usuario actualizado correctamente'
      });
    }

    // Si no es AJAX, redirigir con flash
    req.flash('success', 'Usuario actualizado correctamente');
    res.redirect('/admin/usuarios');

  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    
    // Si es AJAX, devolver JSON
    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar usuario'
      });
    }

    req.flash('error', error.message || 'Error al actualizar usuario');
    res.redirect('/admin/usuarios');
  }
};


// ==================== EXPORTAR FUNCIONES ====================
module.exports = {
  getDashboard,
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  getPedidos,
  marcarProblema,
  resolverProblema,
  getSolicitudesAyuda,
  getDetalleSolicitud,
  responderSolicitud,
  getUsuarios,
  updateUsuario
};