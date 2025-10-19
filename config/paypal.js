const paypal = require('@paypal/checkout-server-sdk');

// Configuración del entorno (Sandbox o Production)
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Faltan credenciales de PayPal en el archivo .env');
  }

  // Usar sandbox para desarrollo
  if (process.env.PAYPAL_MODE === 'sandbox') {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
  
  // Para producción (cuando vayas a lanzar el proyecto real)
  return new paypal.core.LiveEnvironment(clientId, clientSecret);
}

// Cliente de PayPal
function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

module.exports = { client, paypal };