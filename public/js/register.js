// Validación de contraseñas
const form = document.getElementById('registerForm');
const password = document.getElementById('contrasena');
const confirmPassword = document.getElementById('confirmar_contrasena');
const strengthIndicator = document.getElementById('passwordStrength');
const usernameInput = document.getElementById('nombre_usuario');

// Verificar fortaleza de contraseña
password.addEventListener('input', function() {
  const value = this.value;
  const strengthFill = strengthIndicator.querySelector('.strength-fill');
  const strengthText = strengthIndicator.querySelector('.strength-text span');
  
  let strength = 0;
  let label = '';
  let color = '';

  if (value.length >= 6) strength++;
  if (value.length >= 10) strength++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength++;
  if (/[0-9]/.test(value)) strength++;
  if (/[^a-zA-Z0-9]/.test(value)) strength++;

  switch(strength) {
    case 0:
    case 1:
      label = 'Débil';
      color = '#ff0000';
      break;
    case 2:
    case 3:
      label = 'Media';
      color = '#ffa500';
      break;
    case 4:
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

// Validar nombre de usuario (sin espacios)
usernameInput.addEventListener('input', function() {
  this.value = this.value.replace(/\s/g, '');
});

// Validar que las contraseñas coincidan
form.addEventListener('submit', function(e) {
  if (password.value !== confirmPassword.value) {
    e.preventDefault();
    alert('Las contraseñas no coinciden');
    confirmPassword.focus();
    return false;
  }

  if (usernameInput.value.length < 3) {
    e.preventDefault();
    alert('El nombre de usuario debe tener al menos 3 caracteres');
    usernameInput.focus();
    return false;
  }
});