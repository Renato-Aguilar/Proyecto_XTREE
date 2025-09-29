// Intersection Observer for animations
const indexObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animation = entry.target.dataset.animation || 'fadeInUp 1s ease-out forwards';
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

document.querySelectorAll('.feature, .ingredient, .testimonial').forEach(el => {
  el.dataset.animation = 'fadeInUp 0.6s ease-out forwards';
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  indexObserver.observe(el);
});

// Parallax effect
window.addEventListener('scroll', () => {
  const heroImage = document.querySelector('.hero-image');
  if (!heroImage) return;

  const scrolled = window.pageYOffset;
  const rate = scrolled * -0.3;
  heroImage.style.transform = `translateY(${rate}px)`;
});

document.querySelectorAll('.btn, .feature, .testimonial').forEach(el => {
  el.addEventListener('mouseenter', () => {
    el.style.filter = 'brightness(1.1)';
  });
  
  el.addEventListener('mouseleave', () => {
    el.style.filter = 'brightness(1)';
  });
});

const subtitle = document.querySelector('.hero-subtitle');
if (subtitle) {
  const originalText = subtitle.textContent;
  subtitle.textContent = '';
  
  let i = 0;
  const typeWriter = () => {
    if (i < originalText.length) {
      subtitle.textContent += originalText.charAt(i);
      i++;
      setTimeout(typeWriter, 100);
    }
  };
  setTimeout(typeWriter, 1000);
}
