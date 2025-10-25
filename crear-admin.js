// Ejecutar con: node crear-admin.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function crearAdmin() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log('✅ Conectado a la base de datos\n');

    // Datos del administrador
    const adminData = {
      nombre_usuario: 'admin',
      nombre: 'Administrador',
      apellido: 'Sistema',
      email: 'admin@xtree.com',
      contrasena: 'Admin123!',
      direccion: 'Oficina Central XTREE',
      rol: 'superadmin'
    };

    // Hashear la contraseña
    console.log('🔐 Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash(adminData.contrasena, 10);
    console.log('✅ Contraseña hasheada correctamente\n');

    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.query(
      'SELECT id_usuario FROM usuarios WHERE email = ? OR nombre_usuario = ?',
      [adminData.email, adminData.nombre_usuario]
    );

    if (existingUsers.length > 0) {
      console.log('⚠️  El usuario ya existe. Actualizando...\n');
      
      // Actualizar usuario existente
      await connection.query(
        'UPDATE usuarios SET nombre_usuario = ?, nombre = ?, apellido = ?, contrasena = ?, direccion = ?, rol = ? WHERE email = ?',
        [
          adminData.nombre_usuario,
          adminData.nombre,
          adminData.apellido,
          hashedPassword,
          adminData.direccion,
          adminData.rol,
          adminData.email
        ]
      );

      console.log('✅ Usuario administrador actualizado correctamente\n');
    } else {
      // Crear nuevo usuario
      await connection.query(
        'INSERT INTO usuarios (nombre_usuario, nombre, apellido, email, contrasena, direccion, rol, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [
          adminData.nombre_usuario,
          adminData.nombre,
          adminData.apellido,
          adminData.email,
          hashedPassword,
          adminData.direccion,
          adminData.rol
        ]
      );

      console.log('✅ Usuario administrador creado correctamente\n');
    }

    // Mostrar credenciales
    console.log('═══════════════════════════════════════════════');
    console.log('📋 CREDENCIALES DE ACCESO');
    console.log('═══════════════════════════════════════════════');
    console.log(`Email:      ${adminData.email}`);
    console.log(`Contraseña: ${adminData.contrasena}`);
    console.log(`Rol:        ${adminData.rol.toUpperCase()}`);
    console.log('═══════════════════════════════════════════════\n');

    console.log('⚠️  IMPORTANTE: Cambia esta contraseña después del primer inicio de sesión\n');
    console.log('🚀 Ya puedes iniciar sesión en: http://localhost:3000/login\n');

    // Verificar que el usuario fue creado correctamente
    const [verifyUser] = await connection.query(
      'SELECT id_usuario, nombre_usuario, email, rol FROM usuarios WHERE email = ?',
      [adminData.email]
    );

    if (verifyUser.length > 0) {
      console.log('✅ Verificación exitosa:');
      console.log(`   ID: ${verifyUser[0].id_usuario}`);
      console.log(`   Usuario: ${verifyUser[0].nombre_usuario}`);
      console.log(`   Email: ${verifyUser[0].email}`);
      console.log(`   Rol: ${verifyUser[0].rol}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
console.log('\n🔧 Creando usuario administrador...\n');
crearAdmin();