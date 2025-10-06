// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  // Seleccionar todos los botones "Agregar al Carrito"
  const botonesAgregar = document.querySelectorAll('.btn-agregar-carrito');
  
  botonesAgregar.forEach(boton => {
    boton.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      // Extraer datos del botón (data-producto-id, data-cantidad)
      const productoId = btn.dataset.productoId;
      const packSize = parseInt(btn.dataset.cantidad);
      
      // UI: Deshabilitar botón y mostrar loading
      btn.disabled = true;
      btn.style.transform = 'scale(0.95)';
      const textoOriginal = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Agregando...';
      
      try {
        // Petición POST al backend para agregar al carrito
        const response = await fetch('/carrito/agregar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ producto_id: productoId, pack_size: packSize })
        });

        const data = await response.json();

        if (data.success) {
          // Actualizar contador del navbar
          if (typeof window.updateCartCount === 'function') {
            window.updateCartCount(data.cartCount);
          }
          
          showNotification(data.message, 'success');
          
          // Feedback visual temporal (botón verde con check)
          btn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Agregado!';
          btn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
          
          // Restaurar botón después de 2 segundos
          setTimeout(() => {
            btn.innerHTML = textoOriginal;
            btn.style.background = '';
            btn.style.transform = 'scale(1)';
            btn.disabled = false;
          }, 2000);
        } else {
          // Mostrar error del servidor
          showNotification(data.message, 'error');
          btn.innerHTML = textoOriginal;
          btn.style.transform = 'scale(1)';
          btn.disabled = false;
        }
        
      } catch (error) {
        console.error('Error al agregar al carrito:', error);
        showNotification('Error de conexión. Intenta nuevamente.', 'error');
        btn.innerHTML = textoOriginal;
        btn.style.transform = 'scale(1)';
        btn.disabled = false;
      }
    });
  });
});

// Sistema de notificaciones toast (esquina superior derecha)
function showNotification(message, type = 'info') {
  // Eliminar notificación anterior si existe
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) existingNotification.remove();

  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fa-solid fa-${getIconForType(type)}"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  // Animación de entrada
  setTimeout(() => notification.classList.add('show'), 100);

  // Auto-ocultar después de 3 segundos
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Mapeo de iconos según tipo de notificación
function getIconForType(type) {
  const icons = {
    success: 'circle-check',
    error: 'circle-exclamation',
    info: 'circle-info',
    warning: 'triangle-exclamation'
  };
  return icons[type] || 'circle-info';
}