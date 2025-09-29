// Importamos las dependencias principales
const express = require('express'); // Framework para levantar el servidor web
const dotenv = require('dotenv');   // Permite manejar variables de entorno desde un archivo .env

// Cargamos las variables de entorno definidas en el archivo .env
dotenv.config();

// Creamos la aplicación de Express
const app = express();

// Definimos el puerto del servidor: si hay PORT en .env lo usa, sino por defecto será 3000
const PORT = process.env.PORT || 3000;

// ----------------------
// Configuración de Vistas
// ----------------------

// Definimos EJS como el motor de plantillas para renderizar vistas dinámicas
app.set('view engine', 'ejs');

// Indicamos dónde estarán las vistas (.ejs). 
// Al no usar "path", se busca directamente la carpeta "Views" en la raíz del proyecto.
app.set('views', __dirname + '/Views');

// ----------------------
// Archivos estáticos
// ----------------------

// Con esta línea todo lo que esté dentro de "public" será accesible en el navegador.
// Ejemplo: "public/css/style.css" → "http://localhost:3000/css/style.css"
app.use(express.static('public'));

// ----------------------
// Rutas
// ----------------------

// Importamos las rutas definidas en "Routes/pageRoutes.js"
const pageRoutes = require('./Routes/pageRoutes');

// Montamos esas rutas en la raíz "/".
// Ejemplo: "/" → index.ejs | "/nosotros" → nosotros.ejs | "/productos" → productos.ejs
app.use('/', pageRoutes);

// ----------------------
// Servidor
// ----------------------

// Iniciamos el servidor escuchando en el puerto definido
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
