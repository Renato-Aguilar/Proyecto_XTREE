const pool = require('../config/db');

// Mostrar formulario de nueva solicitud de ayuda
const getNuevaSolicitud = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Obtener pedidos del usuario para vincular (opcional)
    const [pedidos] = await pool.query(`
      SELECT id_orden, monto_total, fecha_creacion
      FROM ordenes
      WHERE id_usuario = ?
      ORDER BY fecha_creacion DESC
      LIMIT 10
    `, [userId]);

    res.render('ayuda/nueva-solicitud', {
      title: 'Nueva Solicitud de Ayuda',
      activePage: 'ayuda',
      pedidos
    });
  } catch (error) {
    console.error('Error al cargar formulario de ayuda:', error);
    req.flash('error', 'Error al cargar el formulario');
    res.redirect('/');
  }
};

// Crear nueva solicitud de ayuda
const postNuevaSolicitud = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { asunto, mensaje, prioridad, id_orden } = req.body;

    // Validaciones
    if (!asunto || !mensaje) {
      req.flash('error', 'Asunto y mensaje son obligatorios');
      return res.redirect('/ayuda/nueva');
    }

    if (asunto.length < 5) {
      req.flash('error', 'El asunto debe tener al menos 5 caracteres');
      return res.redirect('/ayuda/nueva');
    }

    if (mensaje.length < 20) {
      req.flash('error', 'El mensaje debe tener al menos 20 caracteres');
      return res.redirect('/ayuda/nueva');
    }

    // Validar prioridad
    const prioridadesValidas = ['baja', 'media', 'alta', 'urgente'];
    const prioridadFinal = prioridadesValidas.includes(prioridad) ? prioridad : 'media';

    // Validar id_orden si se proporciona
    const ordenId = id_orden && id_orden !== '' ? id_orden : null;

    // Crear solicitud
    const [result] = await pool.query(
      'INSERT INTO solicitudes_ayuda (id_usuario, asunto, mensaje, prioridad, id_orden, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, asunto, mensaje, prioridadFinal, ordenId, 'pendiente']
    );

    req.flash('success', `¡Solicitud #${result.insertId} creada! Te responderemos pronto.`);
    res.redirect('/ayuda/mis-solicitudes');
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    req.flash('error', 'Error al crear la solicitud. Intenta nuevamente.');
    res.redirect('/ayuda/nueva');
  }
};

// Ver mis solicitudes de ayuda
const getMisSolicitudes = async (req, res) => {
  try {
    const userId = req.session.userId;

    const [solicitudes] = await pool.query(`
      SELECT 
        s.*,
        a.nombre as admin_nombre,
        a.apellido as admin_apellido,
        (SELECT COUNT(*) FROM respuestas_ayuda WHERE id_solicitud = s.id_solicitud) as total_respuestas
      FROM solicitudes_ayuda s
      LEFT JOIN usuarios a ON s.atendido_por = a.id_usuario
      WHERE s.id_usuario = ?
      ORDER BY s.fecha_creacion DESC
    `, [userId]);

    res.render('ayuda/mis-solicitudes', {
      title: 'Mis Solicitudes de Ayuda',
      activePage: 'ayuda',
      solicitudes
    });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    req.flash('error', 'Error al cargar tus solicitudes');
    res.redirect('/');
  }
};

// Ver detalle de una solicitud
const getDetalleSolicitud = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    // Obtener solicitud y verificar que pertenece al usuario
    const [solicitud] = await pool.query(`
      SELECT 
        s.*,
        a.nombre as admin_nombre,
        a.apellido as admin_apellido
      FROM solicitudes_ayuda s
      LEFT JOIN usuarios a ON s.atendido_por = a.id_usuario
      WHERE s.id_solicitud = ? AND s.id_usuario = ?
    `, [id, userId]);

    if (solicitud.length === 0) {
      req.flash('error', 'Solicitud no encontrada');
      return res.redirect('/ayuda/mis-solicitudes');
    }

    // Obtener respuestas
    const [respuestas] = await pool.query(`
      SELECT 
        r.*,
        u.nombre,
        u.apellido,
        u.rol
      FROM respuestas_ayuda r
      INNER JOIN usuarios u ON r.id_usuario = u.id_usuario
      WHERE r.id_solicitud = ?
      ORDER BY r.fecha_creacion ASC
    `, [id]);

    res.render('ayuda/detalle-solicitud', {
      title: `Solicitud #${id}`,
      activePage: 'ayuda',
      solicitud: solicitud[0],
      respuestas
    });
  } catch (error) {
    console.error('Error al obtener detalle:', error);
    req.flash('error', 'Error al cargar la solicitud');
    res.redirect('/ayuda/mis-solicitudes');
  }
};

// Responder a una solicitud (cliente)
const postRespuesta = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;
    const { mensaje } = req.body;

    // Validar mensaje
    if (!mensaje || mensaje.trim().length < 10) {
      req.flash('error', 'La respuesta debe tener al menos 10 caracteres');
      return res.redirect(`/ayuda/solicitud/${id}`);
    }

    // Verificar que la solicitud pertenece al usuario
    const [solicitud] = await pool.query(
      'SELECT id_solicitud, estado FROM solicitudes_ayuda WHERE id_solicitud = ? AND id_usuario = ?',
      [id, userId]
    );

    if (solicitud.length === 0) {
      req.flash('error', 'Solicitud no encontrada');
      return res.redirect('/ayuda/mis-solicitudes');
    }

    // No permitir responder si está cerrada
    if (solicitud[0].estado === 'cerrada') {
      req.flash('error', 'No puedes responder a una solicitud cerrada');
      return res.redirect(`/ayuda/solicitud/${id}`);
    }

    // Insertar respuesta
    await pool.query(
      'INSERT INTO respuestas_ayuda (id_solicitud, id_usuario, mensaje, es_admin) VALUES (?, ?, ?, FALSE)',
      [id, userId, mensaje.trim()]
    );

    // Actualizar estado si estaba resuelta
    if (solicitud[0].estado === 'resuelta') {
      await pool.query(
        'UPDATE solicitudes_ayuda SET estado = ?, fecha_actualizacion = NOW() WHERE id_solicitud = ?',
        ['en_proceso', id]
      );
    }

    req.flash('success', 'Respuesta enviada correctamente');
    res.redirect(`/ayuda/solicitud/${id}`);
  } catch (error) {
    console.error('Error al enviar respuesta:', error);
    req.flash('error', 'Error al enviar la respuesta');
    res.redirect(`/ayuda/solicitud/${id}`);
  }
};

// Cerrar una solicitud (cliente)
const cerrarSolicitud = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    // Verificar que la solicitud pertenece al usuario
    const [solicitud] = await pool.query(
      'SELECT id_solicitud FROM solicitudes_ayuda WHERE id_solicitud = ? AND id_usuario = ?',
      [id, userId]
    );

    if (solicitud.length === 0) {
      req.flash('error', 'Solicitud no encontrada');
      return res.redirect('/ayuda/mis-solicitudes');
    }

    // Actualizar estado a cerrada
    await pool.query(
      'UPDATE solicitudes_ayuda SET estado = ?, fecha_actualizacion = NOW() WHERE id_solicitud = ?',
      ['cerrada', id]
    );

    req.flash('success', 'Solicitud cerrada correctamente');
    res.redirect('/ayuda/mis-solicitudes');
  } catch (error) {
    console.error('Error al cerrar solicitud:', error);
    req.flash('error', 'Error al cerrar la solicitud');
    res.redirect(`/ayuda/solicitud/${id}`);
  }
};

module.exports = {
  getNuevaSolicitud,
  postNuevaSolicitud,
  getMisSolicitudes,
  getDetalleSolicitud,
  postRespuesta,
  cerrarSolicitud
};