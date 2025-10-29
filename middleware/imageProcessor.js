const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Procesar imagen después de subirla
const processImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(); // No hay imagen, continuar
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;
    
    console.log('📸 Procesando imagen:', fileName);

    // Optimizar imagen con Sharp
    await sharp(filePath)
      .resize(800, 1000, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toFile(filePath.replace(/\.\w+$/, '.webp'));

    // Eliminar archivo original si es diferente al webp
    if (!fileName.endsWith('.webp')) {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.log('No se pudo eliminar archivo original');
      }
    }

    // Actualizar nombre del archivo en req
    const newFileName = fileName.replace(/\.\w+$/, '.webp');
    req.file.filename = newFileName;
    req.file.path = filePath.replace(/\.\w+$/, '.webp');
    
    // Guardar ruta relativa para BD
    req.file.imagePath = `/img/uploads/${newFileName}`;

    console.log('✅ Imagen procesada:', req.file.imagePath);

    next();
  } catch (error) {
    console.error('❌ Error procesando imagen:', error);
    // No fallar completamente, continuar sin procesar
    if (req.file) {
      req.file.imagePath = `/img/uploads/${req.file.filename}`;
    }
    next();
  }
};

module.exports = processImage;