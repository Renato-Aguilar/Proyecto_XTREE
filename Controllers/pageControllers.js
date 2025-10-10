const getIndex = (req, res) => {
  res.render('index', { title: 'Inicio' });
};

const getNosotros = (req, res) => {
  res.render('nosotros', { title: 'Nosotros' });
};
const getProductos = (req, res) => {
  res.render('productos', { title: 'Productos' });
};
module.exports = { getIndex, getNosotros, getProductos };
