// Carrusel dinámico que se conecta a la BD
class ProductosCarrusel {
  constructor() {
    this.productos = [];
    this.currentIndex = 0;
    this.init();
  }

  async init() {
    try {
      console.log('🔄 Cargando productos de la base de datos...');
      
      // Obtener productos del API
      const response = await fetch('/api/productos');
      const result = await response.json();

      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error('No hay productos disponibles');
      }

      this.productos = result.data;
      console.log('✅ Productos cargados:', this.productos);

      // Renderizar carrusel
      this.render();
      this.attachEventListeners();

    } catch (error) {
      console.error('❌ Error al inicializar carrusel:', error);
    }
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 255, b: 0 };
  }

  render() {
    const container = document.querySelector('.carrusel-container');
    if (!container) return;

    container.innerHTML = '';

    // Renderizar cada producto como slide
    this.productos.forEach((producto, index) => {
      const rgb = this.hexToRgb(producto.color_principal);
      
      const slide = document.createElement('div');
      slide.className = `carrusel-slide ${index === this.currentIndex ? 'active' : ''}`;
      slide.style.cssText = `
        --color-principal: ${producto.color_principal || '#00ff00'};
        --color-secundario: ${producto.color_secundario || '#00cc00'};
        --color-tertiary: ${producto.color_tertiary || '#66ff66'};
        --color-r: ${rgb.r};
        --color-g: ${rgb.g};
        --color-b: ${rgb.b};
      `;

      slide.innerHTML = `
        <div class="slide-content">
          <div class="slide-image">
            <img src="${producto.imagen_url || '/img/producto-default.png'}" 
                 alt="${producto.nombre}"
                 onerror="this.src='/img/producto-default.png'">
          </div>
          
          <div class="slide-info">
            <h2 class="slide-title">${producto.nombre}</h2>
            <p class="slide-description">${producto.descripcion}</p>
            
            <div class="slide-buttons">
              <button class="btn-descubre" onclick="window.location.href='/productos'">
                <i class="fa-solid fa-magnifying-glass"></i>
                Descubre Más
              </button>
              <button class="btn-compra" onclick="window.location.href='/comprar'">
                <i class="fa-solid fa-shopping-cart"></i>
                Ir a Comprar
              </button>
            </div>
          </div>
        </div>
      `;

      container.appendChild(slide);
    });

    // Renderizar dots
    this.renderDots();
  }

  renderDots() {
    const dotsContainer = document.querySelector('.carrusel-dots');
    if (!dotsContainer) return;
    
    dotsContainer.innerHTML = '';
    
    this.productos.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.className = `carrusel-dot ${index === this.currentIndex ? 'active' : ''}`;
      dot.addEventListener('click', () => this.goToSlide(index));
      dotsContainer.appendChild(dot);
    });
  }

  attachEventListeners() {
    const prevBtn = document.querySelector('.carrusel-prev');
    const nextBtn = document.querySelector('.carrusel-next');

    if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
    if (nextBtn) nextBtn.addEventListener('click', () => this.next());

    // Auto-avance cada 8 segundos
    setInterval(() => this.next(), 8000);

    // Soporte para teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.productos.length) % this.productos.length;
    this.updateSlides();
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.productos.length;
    this.updateSlides();
  }

  goToSlide(index) {
    this.currentIndex = index;
    this.updateSlides();
  }

  updateSlides() {
    const slides = document.querySelectorAll('.carrusel-slide');
    const dots = document.querySelectorAll('.carrusel-dot');

    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === this.currentIndex);
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentIndex);
    });
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new ProductosCarrusel();
});