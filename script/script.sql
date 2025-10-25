-- Crear base de datos
CREATE DATABASE IF NOT EXISTS xtree CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE xtree;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(100),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    direccion VARCHAR(500) NOT NULL,
    rol ENUM('cliente', 'admin', 'superadmin') DEFAULT 'cliente',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_rol ON usuarios(rol);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id_producto INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(5000) NOT NULL,
    precio INT NOT NULL,
    imagen_url TEXT NULL
) ENGINE=InnoDB;

-- Tabla de stock
CREATE TABLE IF NOT EXISTS stock_productos (
    id_stock INT PRIMARY KEY AUTO_INCREMENT,
    id_producto INT NOT NULL,
    cantidad INT DEFAULT 0 CHECK (cantidad >= 0),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_producto_stock ON stock_productos(id_producto, cantidad);

-- Tabla de carritos
CREATE TABLE IF NOT EXISTS carritos (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT DEFAULT 1 CHECK (cantidad > 0),
    pack_size INT DEFAULT 6,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de órdenes
CREATE TABLE IF NOT EXISTS ordenes (
    id_orden INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    paypal_order_id VARCHAR(100) NULL,
    tiene_problema BOOLEAN DEFAULT FALSE,
    descripcion_problema TEXT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    INDEX idx_paypal_order_id (paypal_order_id),
    INDEX idx_fecha_creacion (fecha_creacion),
    INDEX idx_tiene_problema (tiene_problema)
) ENGINE=InnoDB;

-- Tabla de estados de pedido
CREATE TABLE IF NOT EXISTS estado_pedido (
    id_estado INT AUTO_INCREMENT PRIMARY KEY,
    estado VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

INSERT INTO estado_pedido (estado) VALUES
    ('POR PAGAR'),
    ('PAGO RECHAZADO'),
    ('PAGO ACEPTADO'),
    ('PROCESANDO PAGO'),
    ('PROCESANDO PEDIDO'),
    ('PEDIDO PROCESADO'),
    ('PREPARANDO PEDIDO'),
    ('LISTO PARA ENTREGAR O DESPACHAR'),
    ('EN CAMINO'),
    ('ENTREGADO/RETIRADO'),
    ('RECIBIDO');

-- Tabla de detalle de orden
CREATE TABLE IF NOT EXISTS detalle_orden (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_orden INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_orden) REFERENCES ordenes(id_orden) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de seguimiento de estado
CREATE TABLE IF NOT EXISTS seguimiento_estado (
    id_seguimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_orden INT NOT NULL,
    id_estado INT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_orden) REFERENCES ordenes(id_orden) ON DELETE CASCADE,
    FOREIGN KEY (id_estado) REFERENCES estado_pedido(id_estado) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de solicitudes de ayuda
CREATE TABLE IF NOT EXISTS solicitudes_ayuda (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    asunto VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    estado ENUM('pendiente', 'en_proceso', 'resuelta', 'cerrada') DEFAULT 'pendiente',
    prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
    id_orden INT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    notas_admin TEXT NULL,
    atendido_por INT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_orden) REFERENCES ordenes(id_orden) ON DELETE SET NULL,
    FOREIGN KEY (atendido_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    INDEX idx_estado (estado),
    INDEX idx_prioridad (prioridad),
    INDEX idx_fecha (fecha_creacion)
) ENGINE=InnoDB;

-- Tabla de respuestas a solicitudes de ayuda
CREATE TABLE IF NOT EXISTS respuestas_ayuda (
    id_respuesta INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    id_usuario INT NOT NULL,
    mensaje TEXT NOT NULL,
    es_admin BOOLEAN DEFAULT FALSE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes_ayuda(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    INDEX idx_solicitud (id_solicitud)
) ENGINE=InnoDB;

-- Tabla de logs administrativos
CREATE TABLE IF NOT EXISTS logs_admin (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_admin INT NOT NULL,
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    id_registro INT NULL,
    detalles TEXT NULL,
    ip_address VARCHAR(45) NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_admin) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    INDEX idx_fecha (fecha),
    INDEX idx_admin (id_admin)
) ENGINE=InnoDB;

-- Vista de estadísticas para panel admin
CREATE OR REPLACE VIEW vista_estadisticas_admin AS
SELECT 
    (SELECT COUNT(*) FROM usuarios WHERE rol = 'cliente') AS total_clientes,
    (SELECT COUNT(*) FROM ordenes) AS total_ordenes,
    (SELECT COALESCE(SUM(monto_total), 0) FROM ordenes) AS ventas_totales,
    (SELECT COUNT(*) FROM ordenes WHERE DATE(fecha_creacion) = CURDATE()) AS ordenes_hoy,
    (SELECT COUNT(*) FROM solicitudes_ayuda WHERE estado = 'pendiente') AS ayudas_pendientes,
    (SELECT COUNT(*) FROM ordenes WHERE tiene_problema = TRUE) AS ordenes_con_problema,
    (SELECT COUNT(*) FROM productos) AS total_productos,
    (SELECT COALESCE(SUM(cantidad), 0) FROM stock_productos) AS stock_total;

-- Insertar productos
INSERT INTO productos (nombre, descripcion, precio, imagen_url) VALUES
('XTREE Original', 'Energía natural sin límites. Para los que no frenan, los que se levantan temprano o se acuestan tarde. Con guaraná, té verde y ginseng. Sabor refrescante y natural.', 1500, '/img/lata.png'),
('XTREE Cosmos', 'Edición especial para los que buscan trascender. Energía que te conecta con tu potencial ilimitado. Fórmula premium con extractos botánicos y sabor frutal único.', 1600, '/img/lata-2.png');

-- Insertar stock
INSERT INTO stock_productos (id_producto, cantidad) VALUES
(1, 1000),
(2, 800);

-- Insertar superadmin por defecto (recuerda cambiar la contraseña luego)
/*
INSERT INTO usuarios (nombre_usuario, nombre, apellido, email, contrasena, direccion, rol) 
VALUES (
    'admin', 
    'Administrador', 
    'Sistema', 
    'admin@xtree.com',
    'Admin123!',
    'Oficina Central XTREE',
    'superadmin'
) ON DUPLICATE KEY UPDATE rol = 'superadmin';
*/

-- Insertar solicitudes de ayuda de ejemplo
INSERT INTO solicitudes_ayuda (id_usuario, asunto, mensaje, prioridad) VALUES
(1, 'Problema con mi pedido', 'No he recibido mi pedido y ya pasó una semana', 'alta'),
(1, 'Consulta sobre producto', '¿Cuándo volverá a estar disponible XTREE Cosmos?', 'media');

COMMIT;
select * from usuarios;
-- drop database xtree;