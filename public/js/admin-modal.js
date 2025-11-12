// ==================== admin-modal.js - VERSIÓN UNIFICADA CORREGIDA ====================
// Maneja AMBOS modales: Productos y Usuarios sin conflictos

class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
    this.init();
  }

  init() {
    this.scanModals();
    this.attachGlobalListeners();
    console.log('✅ ModalManager inicializado. Modales:', Array.from(this.modals.keys()));
  }

  scanModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      if (modal.id) {
        this.modals.set(modal.id, modal);
      }
    });
  }

  open(modalId) {
    if (this.activeModal && this.activeModal !== modalId) {
      this.close(this.activeModal);
    }

    const modal = this.modals.get(modalId);
    if (!modal) {
      console.error(`❌ Modal no encontrado: ${modalId}`);
      return false;
    }

    modal.classList.add('show');
    modal.style.display = 'flex';
    this.activeModal = modalId;

    const firstInput = modal.querySelector('input:not([type="hidden"]), textarea, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }

    console.log('📖 Modal abierto:', modalId);
    return true;
  }

  close(modalId) {
    const modal = this.modals.get(modalId);
    if (!modal) return false;

    modal.classList.remove('show');
    modal.style.display = 'none';
    if (this.activeModal === modalId) {
      this.activeModal = null;
    }

    console.log('❌ Modal cerrado:', modalId);
    return true;
  }

  closeAll() {
    this.modals.forEach((modal, id) => {
      this.close(id);
    });
  }

  attachGlobalListeners() {
    // Cerrar modal al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (this.activeModal) {
        const modal = this.modals.get(this.activeModal);
        if (modal && e.target === modal) {
          this.close(this.activeModal);
        }
      }
    });

    // Cerrar modal con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close(this.activeModal);
      }
    });

    // Botones de cerrar modal
    document.querySelectorAll('.close-btn, .modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal && modal.id) {
          this.close(modal.id);
        }
      });
    });
  }
}

let modalManager = null;

document.addEventListener('DOMContentLoaded', function() {
  modalManager = new ModalManager();

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
      if (input.type === 'hidden') return;
      
      if (!input.value || !input.value.trim()) {
        errors.push(`${input.name} es obligatorio`);
        input.style.borderColor = '#ef4444';
      } else {
        input.style.borderColor = 'rgba(0, 255, 0, 0.3)';
      }

      if (input.minLength && input.value.length < input.minLength) {
        errors.push(`${input.name} debe tener al menos ${input.minLength} caracteres`);
        input.style.borderColor = '#ef4444';
      }

      if (input.maxLength && input.value.length > input.maxLength) {
        errors.push(`${input.name} no puede exceder ${input.maxLength} caracteres`);
        input.style.borderColor = '#ef4444';
      }

      if (input.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (input.value && !emailRegex.test(input.value)) {
          errors.push(`${input.name} debe ser un email válido`);
          input.style.borderColor = '#ef4444';
        }
      }

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
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const errors = validateForm(this);
      if (errors.length > 0) {
        showNotification(errors[0], 'error');
        return false;
      }

      const nombre = this.querySelector('input[name="nombre"]');
      const descripcion = this.querySelector('textarea[name="descripcion"]');
      const precio = this.querySelector('input[name="precio"]');
      const stock = this.querySelector('input[name="stock"]');

      if (nombre && nombre.value.trim().length < 3) {
        showNotification('Nombre debe tener al menos 3 caracteres', 'error');
        return false;
      }

      if (descripcion && descripcion.value.trim().length < 10) {
        showNotification('Descripción debe tener al menos 10 caracteres', 'error');
        return false;
      }

      if (precio) {
        const precioNum = parseFloat(precio.value);
        if (isNaN(precioNum) || precioNum <= 0) {
          showNotification('Precio debe ser un número válido positivo', 'error');
          return false;
        }
      }

      if (stock) {
        const stockNum = parseInt(stock.value, 10);
        if (isNaN(stockNum) || stockNum < 0) {
          showNotification('Stock debe ser un número válido no negativo', 'error');
          return false;
        }
      }

      // ✅ IMPORTANTE: Crear FormData para mantener multipart/form-data
      const formData = new FormData(this);
      const url = this.action;
      const method = document.getElementById('method')?.value || 'POST';

      console.log('📤 Enviando Producto:', {
        url,
        method,
        nombre: nombre?.value,
        archivo: this.querySelector('input[name="imagen"]')?.files[0]?.name || 'sin archivo'
      });

      disableSubmitButton(this);

      fetch(url, {
        method: method,
        body: formData
        // NO incluir Content-Type - el navegador lo establecerá automáticamente con boundary
      })
      .then(response => {
        console.log('📥 Response Status:', response.status);
        return response.json();
      })
      .then(result => {
        console.log('✅ Respuesta:', result);
        if (result.success) {
          showNotification('✅ ' + result.message, 'success');
          setTimeout(() => location.reload(), 1500);
        } else {
          showNotification('❌ Error: ' + (result.error || result.message || 'No especificado'), 'error');
          enableSubmitButton(this);
        }
      })
      .catch(err => {
        console.error('❌ Error en fetch:', err);
        showNotification('❌ Error: ' + err.message, 'error');
        enableSubmitButton(this);
      });
    });
  }

  // ==================== 4. VALIDAR FORMULARIOS DE USUARIO ====================
  const userForm = document.getElementById('formEditarUsuario');
  if (userForm) {
    userForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const errors = validateForm(this);
      if (errors.length > 0) {
        showNotification(errors[0], 'error');
        return false;
      }

      const data = {
        nombre: document.getElementById('edit_nombre')?.value,
        apellido: document.getElementById('edit_apellido')?.value,
        email: document.getElementById('edit_email')?.value,
        direccion: document.getElementById('edit_direccion')?.value,
        rol: document.getElementById('edit_rol')?.value
      };

      const url = this.action;

      console.log('📤 Enviando Usuario:', { url, ...data });

      disableSubmitButton(this);

      fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        console.log('📥 Response Status:', response.status);
        return response.json();
      })
      .then(result => {
        console.log('✅ Respuesta:', result);
        if (result.success) {
          showNotification('✅ ' + (result.message || 'Usuario actualizado'), 'success');
          setTimeout(() => location.reload(), 1500);
        } else {
          showNotification('❌ Error: ' + (result.error || result.message || 'No especificado'), 'error');
          enableSubmitButton(this);
        }
      })
      .catch(err => {
        console.error('❌ Error en fetch:', err);
        showNotification('❌ Error: ' + err.message, 'error');
        enableSubmitButton(this);
      });
    });
  }

  // ==================== 5. PREVENIR CLIC EN MODAL CONTENT ====================
  const modalContents = document.querySelectorAll('.modal-content');
  modalContents.forEach(content => {
    content.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });

  // ==================== 6. CONTADOR DE CARACTERES ====================
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

  // ==================== 7. PREVENIR ENVÍO DOBLE ====================
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

  // ==================== 8. ATAJOS DE TECLADO ====================
  document.addEventListener('keydown', function(e) {
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

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector('input[type="search"], input[name*="search"]');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });

  console.log('✅ Admin modal system inicializado');
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
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
  }
}

function enableSubmitButton(form) {
  const button = form.querySelector('button[type="submit"]');
  if (button) {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || button.innerHTML;
  }
}

function openProductModal() {
  if (!modalManager) {
    console.error('❌ ModalManager no inicializado');
    return;
  }

  modalManager.open('productModal');
  
  const form = document.getElementById('productForm');
  if (form) {
    form.reset();
    form.action = '/admin/productos';
    
    document.getElementById('productId').value = '';
    document.getElementById('method').value = 'POST';
    document.getElementById('imagen').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('colorPrincipal').value = '#00ff00';
    document.getElementById('colorSecundario').value = '#00cc00';
    document.getElementById('colorTerciario').value = '#66ff66';
    
    if (typeof updateColorPreview === 'function') {
      updateColorPreview();
    }
  }
  
  const title = document.getElementById('modalTitle');
  if (title) {
    title.textContent = 'Nuevo Producto';
  }
}

function closeProductModal() {
  if (!modalManager) return;
  modalManager.close('productModal');
}

function editarUsuario(id, nombre, apellido, email, rol) {
  if (!modalManager) {
    console.error('❌ ModalManager no inicializado');
    return;
  }

  modalManager.open('modalEditarUsuario');
  
  const form = document.getElementById('formEditarUsuario');
  if (form) {
    form.action = `/admin/usuarios/${id}`;
    
    const nameInput = document.getElementById('edit_nombre');
    const lastNameInput = document.getElementById('edit_apellido');
    const emailInput = document.getElementById('edit_email');
    const roleSelect = document.getElementById('edit_rol');
    
    if (nameInput) nameInput.value = nombre;
    if (lastNameInput) lastNameInput.value = apellido;
    if (emailInput) emailInput.value = email;
    
    if (roleSelect) {
      const isSuperAdmin = typeof window.isSuperAdmin !== 'undefined' && window.isSuperAdmin;
      
      if (isSuperAdmin) {
        const esSuperAdmin = rol === 'superadmin';
        const currentUserId = parseInt(document.querySelector('[data-user-id]')?.getAttribute('data-user-id') || 0);
        const esUsuarioActual = id === currentUserId;
        
        if (esSuperAdmin || esUsuarioActual) {
          roleSelect.disabled = true;
          roleSelect.value = rol;
          roleSelect.title = esSuperAdmin 
            ? 'No se puede cambiar el rol de un superadmin' 
            : 'No puedes cambiar tu propio rol';
        } else {
          roleSelect.disabled = false;
          roleSelect.value = rol;
        }
      }
    }
  }
}

function cerrarModal() {
  if (!modalManager) return;
  modalManager.close('modalEditarUsuario');
}

function abrirModal(modalId) {
  if (!modalManager) {
    console.error('❌ ModalManager no inicializado');
    return;
  }
  modalManager.open(modalId);
}

// ==================== ESTILOS CSS DINÁMICOS ====================
if (!document.getElementById('admin-animations')) {
  const style = document.createElement('style');
  style.id = 'admin-animations';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }

    select {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      cursor: pointer;
    }

    select option {
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

console.log('✅ Admin modal system v3.0 loaded successfully');