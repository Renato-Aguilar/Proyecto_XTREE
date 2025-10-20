// Validación mejorada de contraseñas con requisitos estrictos
const form = document.getElementById('registerForm');
const password = document.getElementById('contrasena');
const confirmPassword = document.getElementById('confirmar_contrasena');
const strengthIndicator = document.getElementById('passwordStrength');
const usernameInput = document.getElementById('nombre_usuario');

// Función para validar requisitos de contraseña
function validatePasswordRequirements(value) {
  return {
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[!@#$%^&*(),.?":{}|<>_\-]/.test(value)
  };
}

// Crear indicadores de requisitos
function createRequirementIndicators() {
  const container = document.createElement('div');
  container.className = 'password-requirements';
  container.innerHTML = `
    <div class="requirement" id="req-length">
      <i class="fa-solid fa-circle-xmark"></i>
      <span>Mínimo 8 caracteres</span>
    </div>
    <div class="requirement" id="req-uppercase">
      <i class="fa-solid fa-circle-xmark"></i>
      <span>Al menos una mayúscula</span>
    </div>
    <div class="requirement" id="req-lowercase">
      <i class="fa-solid fa-circle-xmark"></i>
      <span>Al menos una minúscula</span>
    </div>
    <div class="requirement" id="req-number">
      <i class="fa-solid fa-circle-xmark"></i>
      <span>Al menos un número</span>
    </div>
    <div class="requirement" id="req-special">
      <i class="fa-solid fa-circle-xmark"></i>
      <span>Al menos un carácter especial (!@#$%^&*...)</span>
    </div>
  `;
  
  // Insertar después del indicador de fortaleza
  strengthIndicator.parentNode.insertBefore(container, strengthIndicator.nextSibling);
}

// Actualizar indicadores de requisitos
function updateRequirementIndicators(requirements) {
  Object.keys(requirements).forEach(key => {
    const element = document.getElementById(`req-${key}`);
    if (element) {
      if (requirements[key]) {
        element.classList.add('met');
        element.querySelector('i').className = 'fa-solid fa-circle-check';
      } else {
        element.classList.remove('met');
        element.querySelector('i').className = 'fa-solid fa-circle-xmark';
      }
    }
  });
}

// Verificar fortaleza de contraseña
password.addEventListener('input', function() {
  const value = this.value;
  const strengthFill = strengthIndicator.querySelector('.strength-fill');
  const strengthText = strengthIndicator.querySelector('.strength-text span');
  
  // Validar requisitos
  const requirements = validatePasswordRequirements(value);
  updateRequirementIndicators(requirements);
  
  // Calcular fortaleza basada en requisitos cumplidos
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  let strength = metRequirements;
  let label = '';
  let color = '';

  switch(strength) {
    case 0:
    case 1:
    case 2:
      label = 'Débil';
      color = '#ff0000';
      break;
    case 3:
    case 4:
      label = 'Media';
      color = '#ffa500';
      break;
    case 5:
      label = 'Fuerte';
      color = '#00ff00';
      break;
  }

  strengthFill.style.width = (strength * 20) + '%';
  strengthFill.style.background = color;
  strengthText.textContent = label;
  strengthText.style.color = color;
});

// Toggle mostrar/ocultar contraseña
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

// Validar nombre de usuario (sin espacios)
usernameInput.addEventListener('input', function() {
  this.value = this.value.replace(/\s/g, '');
});

// Validar formulario al enviar
form.addEventListener('submit', function(e) {
  // Validar que las contraseñas coincidan
  if (password.value !== confirmPassword.value) {
    e.preventDefault();
    showError('Las contraseñas no coinciden');
    confirmPassword.focus();
    return false;
  }

  // Validar requisitos de contraseña
  const requirements = validatePasswordRequirements(password.value);
  const allMet = Object.values(requirements).every(Boolean);
  
  if (!allMet) {
    e.preventDefault();
    showError('La contraseña no cumple con todos los requisitos de seguridad');
    password.focus();
    return false;
  }

  // Validar nombre de usuario
  if (usernameInput.value.length < 3) {
    e.preventDefault();
    showError('El nombre de usuario debe tener al menos 3 caracteres');
    usernameInput.focus();
    return false;
  }
});

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
  // Crear indicadores de requisitos
  createRequirementIndicators();
  
  // Agregar botones de toggle a los campos de contraseña
  createPasswordToggle(password);
  createPasswordToggle(confirmPassword);
  
  // Inicializar requisitos
  updateRequirementIndicators(validatePasswordRequirements(''));
});