// ==================== admin-modal.js - SCRIPT ADMIN COMPLETO ====================
// Ubicación: public/js/admin-modal.js

document.addEventListener('DOMContentLoaded', function() {

  // ==================== 1. INICIALIZAR SELECTS ====================
  function initializeSelects() {
    const allSelects = document.querySelectorAll('select');
    allSelects.forEach(select => {
      select.style.color = '#ffffff';
      select.style.backgroundColor = '#1a1a1a';
      select.style.borderColor = 'rgba(0, 255, 0, 0.3)';

      const options = select.querySelectorAll('option');
      options.forEach(option => {
        option.style.color = '#ffffff';
        option.style.backgroundColor = '#1a1a1a';
      });

      select.addEventListener('change', function() {
        if (!this.value) {
          this.style.borderColor = '#ef4444';
        } else {
          this.style.borderColor = 'rgba(0, 255, 0, 0.3)';
        }
      });
    });
  }

  initializeSelects();

  // ==================== 2. VALIDAR FORMULARIOS ====================
  function validateForm(form) {
    const errors = [];
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    
    inputs.forEach(input => {
      if (!input.value || !input.value.trim()) {
        errors.push(`${input.name} es obligatorio`);
        input.style.borderColor = '#ef4444';
      } else {
        input.style.borderColor = 'rgba(0, 255, 0, 0.3)';
      }

      // Validar minlength
      if (input.minLength && input.value.length < input.minLength) {
        errors.push(`${input.name} debe tener al menos ${input.minLength} caracteres`);
        input.style.borderColor = '#ef4444';
      }

      // Validar maxlength
      if (input.maxLength && input.value.length > input.maxLength) {
        errors.push(`${input.name} no puede exceder ${input.maxLength} caracteres`);
        input.style.borderColor = '#ef4444';
      }

      // Validar email
      if (input.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
          errors.push(`${input.name} debe ser un email válido`);
          input.style.borderColor = '#ef4444';
        }
      }

      // Validar números
      if (input.type === 'number') {
        const value = parseFloat(input.value);
        if (isNaN(value)) {
          errors.push(`${input.name} debe ser un número`);
          input.style.borderColor = '#ef4444';
        }
        if (input.min && value < parseFloat(input.min)) {
          errors.push(`${input.name} debe ser mayor que ${input.min}`);
          input.style.borderColor = '#ef4444';
        }
      }
    });

    return errors;
  }

  // ==================== 3. VALIDAR FORMULARIOS DE PRODUCTOS ====================
  const productForms = document.querySelectorAll('.product-form');
  productForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const errors = validateForm(this);

      if (errors.length > 0) {
        e.preventDefault();
        showNotification(errors[0], 'error');
        return false;
      }

      const nombre = this.querySelector('input[name="nombre"]');
      const descripcion = this.querySelector('textarea[name="descripcion"]');
      const precio = this.querySelector('input[name="precio"]');
      const stock = this.querySelector('input[name="stock"]');

      if (nombre.value.trim().length < 3) {
        e.preventDefault();
        showNotification('Nombre debe tener al menos 3 caracteres', 'error');
        return false;
      }

      if (descripcion.value.trim().length < 10) {
        e.preventDefault();
        showNotification('Descripción debe tener al menos 10 caracteres', 'error');
        return false;
      }

      const precioNum = parseFloat(precio.value);
      if (isNaN(precioNum) || precioNum <= 0) {
        e.preventDefault();
        showNotification('Precio debe ser un número válido positivo', 'error');
        return false;
      }

      const stockNum = parseInt(stock.value, 10);
      if (isNaN(stockNum) || stockNum < 0) {
        e.preventDefault();
        showNotification('Stock debe ser un número válido no negativo', 'error');
        return false;
      }

      disableSubmitButton(this);
    });
  });

  // ==================== 5. VALIDAR FORMULARIOS DE USUARIO ====================
  const userForm = document.getElementById('formEditarUsuario');
  if (userForm) {
    userForm.addEventListener('submit', function(e) {
      const errors = validateForm(this);

      if (errors.length > 0) {
        e.preventDefault();
        showNotification(errors[0], 'error');
        return false;
      }

      disableSubmitButton(this);
    });
  }

  // ==================== 6. VALIDAR FORMULARIOS DE PROBLEMA EN PEDIDO ====================
  const problemForm = document.getElementById('formProblema');
  if (problemForm) {
    problemForm.addEventListener('submit', function(e) {
      const textarea = this.querySelector('textarea[name="descripcion_problema"]');

      if (!textarea || !textarea.value.trim()) {
        e.preventDefault();
        showNotification('Por favor describe el problema', 'error');
        textarea?.focus();
        return false;
      }

      if (textarea.value.trim().length < 10) {
        e.preventDefault();
        showNotification('La descripción debe tener al menos 10 caracteres', 'error');
        textarea.focus();
        return false;
      }

      if (textarea.value.length > 1000) {
        e.preventDefault();
        showNotification('La descripción no puede exceder 1000 caracteres', 'error');
        return false;
      }

      disableSubmitButton(this);
    });
  }

  // ==================== 7. CERRAR MODAL CON ESC ====================
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal[style*="display: flex"]');
      openModals.forEach(modal => {
        modal.style.display = 'none';
      });
    }
  });

  // ==================== 8. CONTADOR DE CARACTERES ====================
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    const minLength = parseInt(textarea.getAttribute('minlength')) || 10;
    const maxLength = parseInt(textarea.getAttribute('maxlength')) || Infinity;

    textarea.addEventListener('input', function() {
      const currentLength = this.value.length;
      const remaining = minLength - currentLength;

      if (currentLength === 0) {
        this.style.borderColor = '#ef4444';
      } else if (remaining > 0) {
        this.style.borderColor = '#ffc107';
      } else if (currentLength > maxLength) {
        this.style.borderColor = '#ef4444';
      } else {
        this.style.borderColor = 'rgba(0, 255, 0, 0.3)';
      }
    });

    textarea.dispatchEvent(new Event('input'));
  });

  // ==================== 9. PREVENIR CLIC EN MODAL CONTENT ====================
  const modalContents = document.querySelectorAll('.modal-content');
  modalContents.forEach(content => {
    content.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });

  // ==================== 10. SMOOTH SCROLL A ERRORES ====================
  const errorAlerts = document.querySelectorAll('.alert-error');
  if (errorAlerts.length > 0) {
    errorAlerts[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ==================== 11. CONFIRMACIONES PARA ACCIONES ====================
  const deleteButtons = document.querySelectorAll('[data-confirm]');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      const message = this.getAttribute('data-confirm') || '¿Estás seguro?';
      if (!confirm(message)) {
        e.preventDefault();
        return false;
      }
    });
  });

  // ==================== 12. PREVENIR ENVÍO DOBLE ====================
  let formSubmitting = false;
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
      if (formSubmitting) {
        e.preventDefault();
        showNotification('Espera, procesando...', 'warning');
        return false;
      }
      formSubmitting = true;

      setTimeout(() => {
        formSubmitting = false;
      }, 3000);
    });
  });

  // ==================== 13. ATAJOS DE TECLADO ====================
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter para enviar formularios
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === 'TEXTAREA') {
        const form = activeElement.closest('form');
        if (form) {
          e.preventDefault();
          form.requestSubmit();
        }
      }
    }

    // Ctrl/Cmd + K para buscar
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector('input[type="search"], input[name*="search"]');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });
});

// ==================== FUNCIONES GLOBALES ====================

function showNotification(message, type = 'info') {
  const existing = document.querySelector('.admin-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `admin-notification admin-notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 30px;
    background: rgba(0, 0, 0, 0.95);
    border: 2px solid;
    border-radius: 12px;
    padding: 15px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10001;
    animation: slideInRight 0.3s ease-out;
    min-width: 300px;
    max-width: 500px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  `;

  const icons = {
    success: 'circle-check',
    error: 'circle-exclamation',
    info: 'circle-info',
    warning: 'triangle-exclamation'
  };

  const colors = {
    success: '#00ff00',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#ffc107'
  };

  notification.style.borderColor = colors[type] || colors.info;

  notification.innerHTML = `
    <i class="fa-solid fa-${icons[type] || icons.info}" style="color: ${colors[type] || colors.info}; font-size: 1.5rem; flex-shrink: 0;"></i>
    <span style="color: #ffffff; flex: 1; font-weight: 500;">${escapeHtml(message)}</span>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #999; cursor: pointer; font-size: 1.2rem; padding: 0; flex-shrink: 0;">
      <i class="fa-solid fa-times"></i>
    </button>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

function cerrarModal() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });
}

function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    const firstInput = modal.querySelector('input, textarea, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function disableSubmitButton(form) {
  const button = form.querySelector('button[type="submit"]');
  if (button) {
    button.disabled = true;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';

    setTimeout(() => {
      if (button.disabled) {
        button.disabled = false;
        button.innerHTML = originalText;
      }
    }, 5000);
  }
}

// ==================== ESTILOS CSS DINÁMICOS ====================
if (!document.getElementById('admin-animations')) {
  const style = document.createElement('style');
  style.id = 'admin-animations';
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }

    select {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      cursor: pointer;
    }

    select option:hover,
    select option:focus,
    select option:checked {
      background: #1a1a1a !important;
      color: #00ff00 !important;
    }

    textarea {
      resize: vertical;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    input[type="text"],
    input[type="email"],
    input[type="number"],
    textarea,
    select {
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    input[type="text"]:focus,
    input[type="email"]:focus,
    input[type="number"]:focus,
    textarea:focus,
    select:focus {
      outline: none;
      box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
    }

    .modal-content::-webkit-scrollbar {
      width: 8px;
    }

    .modal-content::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.5);
      border-radius: 4px;
    }

    .modal-content::-webkit-scrollbar-thumb {
      background: rgba(0, 255, 0, 0.3);
      border-radius: 4px;
    }

    .modal-content::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 255, 0, 0.5);
    }
  `;
  document.head.appendChild(style);
}

// ==================== LOG FINAL ====================
console.log('✅ Admin modal enhancements loaded');
console.log('Available functions:');
console.log('  - abrirModal(id)');
console.log('  - cerrarModal()');
console.log('  - showNotification(msg, type)');
console.log('  - escapeHtml(text)');
  });

  // ==================== 4. VALIDAR FORMULARIOS DE AYUDA ====================
  const helpForms = document.querySelectorAll('form[action*="/ayuda/"][action*="/responder"]');
  helpForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const textarea = this.querySelector('textarea[name="mensaje"]');
      const select = this.querySelector('select[name="estado"]');

      const errors = validateForm(this);

      if (errors.length > 0) {
        e.preventDefault();
        showNotification(errors[0], 'error');
        return false;
      }

      if (!textarea || !textarea.value.trim()) {
        e.preventDefault();
        showNotification('Por favor escribe un mensaje', 'error');
        textarea?.focus();
        return false;
      }

      if (textarea.value.trim().length < 10) {
        e.preventDefault();
        showNotification('El mensaje debe tener al menos 10 caracteres', 'error');
        textarea.focus();
        return false;
      }

      if (!select || !select.value) {
        e.preventDefault();
        showNotification('Por favor selecciona un estado', 'error');
        select?.focus();
        return false;
      }

      disableSubmitButton(this);
    });