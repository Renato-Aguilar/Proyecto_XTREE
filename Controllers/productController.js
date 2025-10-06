const { getAllProducts, getProductById } = require('../models/productModel');

// Configuración de packs disponibles
const PACK_CONFIG = {
  6: { unidades: 6, descuento: 0 },
  12: { unidades: 12, descuento: 5 },    // 5% descuento
  24: { unidades: 24, descuento: 10 }    // 10% descuento
};

// Mostrar página de compra
const getComprar = async (req, res) => {
  try {
    const productos = await getAllProducts();
    
    // Agregar información de packs a cada producto
    const productosConPacks = productos.map(producto => ({
      ...producto,
      packs: Object.entries(PACK_CONFIG).map(([cantidad, config]) => ({
        cantidad: parseInt(cantidad),
        unidades: config.unidades,
        precioUnitario: producto.precio,
        precioTotal: Math.round(producto.precio * config.unidades * (1 - config.descuento / 100)),
        descuento: config.descuento,
        ahorro: config.descuento > 0 ? Math.round(producto.precio * config.unidades * config.descuento / 100) : 0
      }))
    }));

    res.render('comprar', { 
      title: 'Comprar',
      productos: productosConPacks,
      activePage: 'comprar'
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).send('Error al cargar productos');
  }
};

// Obtener detalles de un producto específico para compra
const getProductoComprar = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await getProductById(id);
    
    if (!producto) {
      return res.status(404).send('Producto no encontrado');
    }

    const productoConPacks = {
      ...producto,
      packs: Object.entries(PACK_CONFIG).map(([cantidad, config]) => ({
        cantidad: parseInt(cantidad),
        unidades: config.unidades,
        precioUnitario: producto.precio,
        precioTotal: Math.round(producto.precio * config.unidades * (1 - config.descuento / 100)),
        descuento: config.descuento
      }))
    };

    res.render('producto-comprar', { 
      title: producto.nombre,
      producto: productoConPacks,
      activePage: 'comprar'
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).send('Error al cargar producto');
  }
};

module.exports = {
  getComprar,
  getProductoComprar,
  PACK_CONFIG
};