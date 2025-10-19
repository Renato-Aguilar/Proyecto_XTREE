// test-paypal.js
// Script para verificar que la conexión con PayPal funciona correctamente
// Ejecutar con: node test-paypal.js

require('dotenv').config();
const paypal = require('@paypal/checkout-server-sdk');

// Configuración del cliente PayPal
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('❌ ERROR: Faltan credenciales de PayPal en el archivo .env');
    console.log('Asegúrate de tener:');
    console.log('  PAYPAL_CLIENT_ID=tu_client_id');
    console.log('  PAYPAL_CLIENT_SECRET=tu_secret');
    process.exit(1);
  }

  if (process.env.PAYPAL_MODE === 'sandbox') {
    console.log('🧪 Usando PayPal Sandbox (Modo de Prueba)');
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
  
  console.log('🚀 Usando PayPal Live (Producción)');
  return new paypal.core.LiveEnvironment(clientId, clientSecret);
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

// Función de prueba
async function testPayPalConnection() {
  try {
    console.log('\n🔍 Probando conexión con PayPal...\n');
    
    // Crear una orden de prueba
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: '10.00'
        },
        description: 'Test Order - XTREE Energy'
      }]
    });

    const response = await client().execute(request);
    
    console.log('✅ ¡Conexión exitosa con PayPal!\n');
    console.log('📋 Detalles de la orden de prueba:');
    console.log('   ID de Orden:', response.result.id);
    console.log('   Estado:', response.result.status);
    console.log('   Fecha:', new Date(response.result.create_time).toLocaleString('es-CL'));
    console.log('\n🎉 PayPal está configurado correctamente y listo para usar.\n');
    
    // Información adicional
    console.log('📝 Próximos pasos:');
    console.log('   1. Inicia tu aplicación: npm run dev');
    console.log('   2. Agrega productos al carrito');
    console.log('   3. Ve al checkout y prueba el botón de PayPal');
    console.log('   4. Usa las credenciales de Sandbox para pagar\n');
    
  } catch (error) {
    console.error('❌ Error al conectar con PayPal:\n');
    
    if (error.statusCode === 401) {
      console.error('🔐 Error de Autenticación:');
      console.error('   Las credenciales (Client ID o Secret) son incorrectas.');
      console.error('   Verifica en: https://developer.paypal.com/dashboard/');
    } else if (error.statusCode === 403) {
      console.error('🚫 Error de Permisos:');
      console.error('   Tu aplicación no tiene los permisos necesarios.');
    } else {
      console.error('   Código de error:', error.statusCode || 'Desconocido');
      console.error('   Mensaje:', error.message);
    }
    
    console.error('\n💡 Soluciones:');
    console.error('   1. Verifica que PAYPAL_CLIENT_ID esté correcto en .env');
    console.error('   2. Verifica que PAYPAL_CLIENT_SECRET esté correcto en .env');
    console.error('   3. Asegúrate de estar en modo Sandbox en el dashboard');
    console.error('   4. Verifica tu conexión a internet\n');
    
    process.exit(1);
  }
}

// Ejecutar prueba
console.log('╔═══════════════════════════════════════════════╗');
console.log('║   Test de Conexión PayPal - XTREE Energy   ║');
console.log('╚═══════════════════════════════════════════════╝');

testPayPalConnection();