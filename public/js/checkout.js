// Formatear número de tarjeta automáticamente
document.getElementById('numero_tarjeta').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
  let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
  e.target.value = formattedValue;
});

// Formatear fecha de expiración
document.getElementById('fecha_expiracion').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length >= 2) {
    value = value.slice(0, 2) + '/' + value.slice(2, 4);
  }
  e.target.value = value;
});

// Solo números en CVV
document.getElementById('cvv').addEventListener('input', function(e) {
  e.target.value = e.target.value.replace(/\D/g, '');
});