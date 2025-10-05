document.addEventListener('DOMContentLoaded', () => {
  const botonesAgregar = document.querySelectorAll('.btn-agregar-carrito');
  
  botonesAgregar.forEach(boton => {
    boton.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const productoId = btn.dataset.productoId;
      const packSize = parseInt(btn.dataset.cantidad); // Este es el pack_size (6, 12, 24)
      
      // Deshabilitar botón durante la petición
      btn.disabled = true;
      btn.style.transform = 'scale(0.95)';
      const textoOriginal = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Agregando...';
      
      try {
        // Llamada REAL al backend
        const response = await fetch('/carrito/agregar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            producto_id: productoId,
            pack_size: packSize
          })
        });

        const data = await response.json();

        if (data.success) {
          // Actualizar contador del carrito
          if (typeof window.updateCartCount === 'function') {
            window.updateCartCount(data.cartCount);
          }
          
          // Mostrar notificación de éxito
          showNotification(data.message, 'success');
          
          // Feedback visual en el botón
          btn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Agregado!';
          btn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
          
          setTimeout(() => {
            btn.innerHTML = textoOriginal;
            btn.style.background = '';
            btn.style.transform = 'scale(1)';
            btn.disabled = false;
          }, 2000);
        } else {
          // Error del servidor
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

// Sistema de notificaciones
function showNotification(message, type = 'info') {
  // Remover notificación anterior si existe
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Crear notificación
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fa-solid fa-${getIconForType(type)}"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  // Mostrar notificación
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  // Ocultar y eliminar después de 3 segundos
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

function getIconForType(type) {
  const icons = {
    success: 'circle-check',
    error: 'circle-exclamation',
    info: 'circle-info',
    warning: 'triangle-exclamation'
  };
  return icons[type] || 'circle-info';
}