// Importar mysql2 con soporte para Promises para usar async/await
const mysql = require('mysql2/promise');

// Crear un pool de conexiones a la base de datos MySQL para mejorar el rendimiento
const pool = mysql.createPool({
    host: process.env.DB_HOST, // Dirección del servidor MySQL
    user: process.env.DB_USER, // Usuario de la base de datos
    password: process.env.DB_PASSWORD, // Contraseña del usuario
    port: process.env.DB_PORT, // Puerto de MySQL (por defecto 3306)
    database: process.env.DB_NAME, // Nombre de la base de datos
    waitForConnections: true, // Cola las conexiones si el pool está lleno
    connectionLimit: 10, // Límite de conexiones simultáneas
    queueLimit: 0 // Número máximo de solicitudes en cola (0 = sin límite)
});

// Exportar el pool para usarlo en otros archivos
module.exports = pool;
