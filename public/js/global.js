// Animación de brillo pulsante en el logo
const logo = document.querySelector(".logo");
let glowIntensity = 0;
let growing = true;

setInterval(() => {
  if (!logo) return;
  // Cambiar entre 0.3 y 1
  if (growing) {
    glowIntensity += 0.1;
    if (glowIntensity >= 1) growing = false;
  } else {
    glowIntensity -= 0.1;
    if (glowIntensity <= 0.3) growing = true;
  }
  // Aplicar sombra verde dinámica
  logo.style.textShadow = `0 0 ${20 + glowIntensity * 20}px #00ff00`;
}, 100);

// Scroll suave para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Header más opaco al hacer scroll
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (!header) return;

  if (window.scrollY > 100) {
    header.style.background = 'rgba(0, 0, 0, 0.95)';
    header.style.backdropFilter = 'blur(15px)';
  } else {
    header.style.background = 'rgba(0, 0, 0, 0.9)';
    header.style.backdropFilter = 'blur(10px)';
  }
});