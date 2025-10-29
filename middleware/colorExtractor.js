const Vibrant = require('node-vibrant/node');

const extractColorsFromImage = async (req, res, next) => {
  try {
    // Solo extraer si hay archivo
    if (!req.file) {
      console.log('⚠️ No hay archivo para extraer colores');
      return next();
    }

    const imagePath = req.file.path;
    
    console.log('🎨 Extrayendo colores de:', imagePath);

    // Extraer paleta de colores
    const palette = await Vibrant.from(imagePath).getPalette();

    console.log('📊 Paleta obtenida:', palette);

    // Mapear colores de Vibrant a nuestras variables
    const colors = {
      color_principal: palette.Vibrant?.hex || '#00ff00',
      color_secundario: palette.Muted?.hex || '#00cc00',
      color_tertiary: palette.LightVibrant?.hex || '#66ff66'
    };

    // Guardar colores en request para que el controller los use
    req.extractedColors = colors;

    console.log('✅ Colores extraídos:', colors);
    next();

  } catch (error) {
    console.error('❌ Error extrayendo colores:', error.message);
    // No fallar si hay error, solo continuar sin colores automáticos
    req.extractedColors = null;
    next();
  }
};

module.exports = extractColorsFromImage;