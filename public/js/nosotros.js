// Intersection Observer for fade-in animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

// Observe elements
document.querySelectorAll('.team-member, .value, .project-text, .project-visual').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'all 0.6s ease-out';
  observer.observe(el);
});

// Hover effects
document.querySelectorAll('.team-member, .value, .stat').forEach(el => {
  el.addEventListener('mouseenter', () => {
    el.style.filter = 'brightness(1.1)';
  });

  el.addEventListener('mouseleave', () => {
    el.style.filter = 'brightness(1)';
  });
});

// Counter animation
const animateCounters = () => {
  const counters = document.querySelectorAll('.stat-number');
  counters.forEach(counter => {
    const target = counter.textContent;
    if (target === '∞') return;

    const targetNum = parseInt(target);
    let current = 0;
    const increment = targetNum / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetNum) {
        counter.textContent = target;
        clearInterval(timer);
      } else {
        counter.textContent = Math.floor(current) + (target.includes('%') ? '%' : '');
      }
    }, 20);
  });
};

// Trigger counter animation
const statsSection = document.querySelector('.stats');
if (statsSection) {
  observer.observe(statsSection);
  statsSection.addEventListener('animationstart', animateCounters);
}

// Delay show elements
setTimeout(() => {
  const elements = document.querySelectorAll('.team-member, .value');
  elements.forEach((el, index) => {
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, index * 100);
  });
}, 500);
