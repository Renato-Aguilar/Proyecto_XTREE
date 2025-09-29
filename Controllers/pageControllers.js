// Controlador para la página de inicio
const getIndex = (req, res) => {
  // Renderiza la vista "index.ejs" y le pasa un objeto con una variable "title"
  res.render('index', { title: 'Inicio' });
};

// Controlador para la página "Nosotros"
const getNosotros = (req, res) => {
  // Renderiza la vista "nosotros.ejs" con una variable "title"
  res.render('nosotros', { title: 'Nosotros' });
};

// Controlador para la página "Productos"
const getProductos = (req, res) => {
  // Renderiza la vista "productos.ejs" con una variable "title"
  res.render('productos', { title: 'Productos' });
};

// Exportamos los controladores para poder usarlos en las rutas
module.exports = { getIndex, getNosotros, getProductos };
