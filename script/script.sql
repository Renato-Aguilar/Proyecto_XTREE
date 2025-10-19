CREATE DATABASE IF NOT EXISTS xtree CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE xtree;

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(100),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    direccion VARCHAR(500) NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS productos (
    id_producto INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(5000) NOT NULL,
    precio INT NOT NULL,
    imagen_url TEXT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock_productos (
    id_stock INT PRIMARY KEY AUTO_INCREMENT,
    id_producto INT NOT NULL,
    cantidad INT DEFAULT 0 CHECK (cantidad >= 0),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS ordenes (
    id_orden INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    paypal_order_id VARCHAR(100) NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    INDEX idx_paypal_order_id (paypal_order_id)
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS detalle_orden (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_orden INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_orden) REFERENCES ordenes(id_orden) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS seguimiento_estado (
    id_seguimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_orden INT NOT NULL,
    id_estado INT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_orden) REFERENCES ordenes(id_orden) ON DELETE CASCADE,
    FOREIGN KEY (id_estado) REFERENCES estado_pedido(id_estado) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO productos (nombre, descripcion, precio, imagen_url) VALUES
('XTREE Original', 'Energía natural sin límites. Para los que no frenan, los que se levantan temprano o se acuestan tarde. Con guaraná, té verde y ginseng. Sabor refrescante y natural.', 1500, '/img/lata.png'),
('XTREE Cosmos', 'Edición especial para los que buscan trascender. Energía que te conecta con tu potencial ilimitado. Fórmula premium con extractos botánicos y sabor frutal único.', 1600, '/img/lata-2.png');

-- ============================================
INSERT INTO stock_productos (id_producto, cantidad) VALUES
(1, 1000),
(2, 800);