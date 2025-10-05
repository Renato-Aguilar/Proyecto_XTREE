// Función para actualizar cantidad en el carrito
async function updateQuantity(idCarrito, action) {
  const qtyElement = document.getElementById(`qty-${idCarrito}`);
  const cartItem = document.querySelector(`[data-id-carrito="${idCarrito}"]`);
  
  try {
    const response = await fetch('/carrito/actualizar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        id_carrito: idCarrito,
        action: action
      })
    });

    const data = await response.json();

    if (data.success) {
      if (data.removed) {
        // Animar eliminación del item
        cartItem.style.opacity = '0';
        cartItem.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
          cartItem.remove();
          
          // Verificar si el carrito está vacío
          const remainingItems = document.querySelectorAll('.cart-item');
          if (remainingItems.length === 0) {
            window.location.reload();
          } else {
            recalcularTotales();
          }
        }, 300);
        
        showNotification(data.message, 'success');
      } else {
        // Actualizar cantidad en pantalla
        qtyElement.textContent = data.newQuantity;
        
        // Actualizar precio total del item
        if (data.precioTotal) {
          const priceElement = cartItem.querySelector('.price-value');
          priceElement.textContent = '$' + data.precioTotal.toLocaleString('es-CL');
        }
        
        // Actualizar unidades totales
        const qtyInfoElement = cartItem.querySelector('.qty-info');
        const packSize = parseInt(cartItem.querySelector('.item-pack').textContent.match(/\d+/)[0]);
        qtyInfoElement.textContent = `${packSize * data.newQuantity} unidades en total`;
        
        // Recalcular totales
        recalcularTotales();
      }
      
      // Actualizar contador del navbar
      if (typeof window.updateCartCount === 'function') {
        window.updateCartCount(data.cartCount);
      }
    } else {
      showNotification(data.message, 'error');
    }
  } catch (error) {
    console.error('Error al actualizar cantidad:', error);
    showNotification('Error al actualizar cantidad', 'error');
  }
}

// Función para recalcular totales sin recargar
function recalcularTotales() {
  const cartItems = document.querySelectorAll('.cart-item');
  let subtotal = 0;
  let totalPacks = 0;
  
  cartItems.forEach(item => {
    const precioElement = item.querySelector('.price-value');
    const precioTexto = precioElement.textContent.replace(/[$.]/g, '').trim();
    const precio = parseInt(precioTexto);
    
    const qtyElement = item.querySelector('.qty-number');
    const cantidad = parseInt(qtyElement.textContent);
    
    subtotal += precio;
    totalPacks += cantidad;
  });
  
  // Actualizar subtotal en el resumen
  const subtotalElements = document.querySelectorAll('.summary-row:first-child span:last-child, .total-price');
  subtotalElements.forEach(el => {
    el.textContent = '$' + subtotal.toLocaleString('es-CL');
  });
  
  // Actualizar cantidad de packs
  const packsElement = document.querySelector('.summary-row:first-child span:first-child');
  if (packsElement) {
    packsElement.textContent = `Subtotal (${totalPacks} packs)`;
  }
}

// Función para agregar al carrito
async function addToCart(productoId, packSize) {
  try {
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
      showNotification(data.message, 'success');
      
      if (typeof window.updateCartCount === 'function') {
        window.updateCartCount(data.cartCount);
      }
    } else {
      showNotification(data.message, 'error');
    }
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    showNotification('Error al agregar al carrito', 'error');
  }
}

// Función para eliminar del carrito
async function removeFromCart(idCarrito) {
  const cartItem = document.querySelector(`[data-id-carrito="${idCarrito}"]`);
  
  if (!confirm('¿Estás seguro de eliminar este producto del carrito?')) {
    return;
  }
  
  try {
    const response = await fetch('/carrito/eliminar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_carrito: idCarrito })
    });

    const data = await response.json();

    if (data.success) {
      showNotification(data.message, 'success');
      
      // Animar eliminación
      cartItem.style.opacity = '0';
      cartItem.style.transform = 'translateX(-100%)';
      
      setTimeout(() => {
        cartItem.remove();
        
        // Verificar si el carrito está vacío
        const remainingItems = document.querySelectorAll('.cart-item');
        if (remainingItems.length === 0) {
          window.location.reload();
        } else {
          recalcularTotales();
        }
      }, 300);
      
      if (typeof window.updateCartCount === 'function') {
        window.updateCartCount(data.cartCount);
      }
    } else {
      showNotification(data.message, 'error');
    }
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    showNotification('Error al eliminar del carrito', 'error');
  }
}

// Función para proceder al checkout
function proceedToCheckout() {
  window.location.href = '/checkout';
}

// Sistema de notificaciones
function showNotification(message, type = 'info') {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fa-solid fa-${getIconForType(type)}"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

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