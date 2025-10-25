// JavaScript mejorado para página de login con toggle de contraseña

const form = document.querySelector('.auth-form');
const passwordInput = document.getElementById('contrasena');

// Función para crear botón de toggle para mostrar/ocultar contraseña
function createPasswordToggle(inputElement) {
  const wrapper = inputElement.parentElement;
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'password-toggle';
  toggleBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
  toggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
  
  toggleBtn.addEventListener('click', function() {
    const type = inputElement.type === 'password' ? 'text' : 'password';
    inputElement.type = type;
    
    const icon = this.querySelector('i');
    if (type === 'password') {
      icon.className = 'fa-solid fa-eye';
      this.setAttribute('aria-label', 'Mostrar contraseña');
    } else {
      icon.className = 'fa-solid fa-eye-slash';
      this.setAttribute('aria-label', 'Ocultar contraseña');
    }
  });
  
  wrapper.style.position = 'relative';
  wrapper.appendChild(toggleBtn);
}

// Validar formulario antes de enviar
if (form) {
  form.addEventListener('submit', function(e) {
    const email = document.getElementById('email');
    const password = document.getElementById('contrasena');
    
    // Validar que los campos no estén vacíos
    if (!email.value.trim()) {
      e.preventDefault();
      showError('Por favor ingresa tu email');
      email.focus();
      return false;
    }
    
    if (!password.value) {
      e.preventDefault();
      showError('Por favor ingresa tu contraseña');
      password.focus();
      return false;
    }
    
    // Validar formato de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.value)) {
      e.preventDefault();
      showError('Por favor ingresa un email válido');
      email.focus();
      return false;
    }
  });
}

// Función para mostrar errores
function showError(message) {
  // Buscar si ya existe un alert de error
  const existingAlert = document.querySelector('.alert-error');
  if (existingAlert) {
    existingAlert.remove();
  }

  // Crear nuevo alert
  const alert = document.createElement('div');
  alert.className = 'alert alert-error';
  alert.innerHTML = `
    <i class="fa-solid fa-circle-exclamation"></i>
    ${message}
  `;

  // Insertar al inicio del formulario
  const authHeader = document.querySelector('.auth-header');
  authHeader.parentNode.insertBefore(alert, authHeader.nextSibling);

  // Auto-eliminar después de 5 segundos
  setTimeout(() => {
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 300);
  }, 5000);
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  // Agregar botón de toggle al campo de contraseña
  if (passwordInput) {
    createPasswordToggle(passwordInput);
  }
  
  // Focus automático en el primer campo
  const emailInput = document.getElementById('email');
  if (emailInput && !emailInput.value) {
    emailInput.focus();
  }
});

// Efecto visual al escribir en los inputs
document.querySelectorAll('.auth-form input').forEach(input => {
  input.addEventListener('focus', function() {
    this.parentElement.style.transform = 'scale(1.02)';
    this.parentElement.style.transition = 'transform 0.2s ease';
  });
  
  input.addEventListener('blur', function() {
    this.parentElement.style.transform = 'scale(1)';
  });
});