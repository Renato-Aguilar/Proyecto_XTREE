const { body, param, query, validationResult } = require('express-validator');

// ==================== VALIDACIONES DE AUTENTICACIÓN ====================

const registerValidation = [
  body('nombre_usuario')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos')
    .custom(value => !/\s/.test(value))
    .withMessage('El nombre de usuario no puede contener espacios'),
  
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-Záéíóúñ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
  
  body('apellido')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-Záéíóúñ\s]+$/)
    .withMessage('El apellido solo puede contener letras y espacios'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Por favor ingresa un email válido')
    .normalizeEmail(),
  
  body('contrasena')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe contener al menos una mayúscula')
    .matches(/[a-z]/)
    .withMessage('La contraseña debe contener al menos una minúscula')
    .matches(/[0-9]/)
    .withMessage('La contraseña debe contener al menos un número')
    .matches(/[!@#$%^&*(),.?":{}|<>_\-]/)
    .withMessage('La contraseña debe contener al menos un carácter especial'),
  
  body('confirmar_contrasena')
    .custom((value, { req }) => value === req.body.contrasena)
    .withMessage('Las contraseñas no coinciden'),
  
  body('direccion')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('La dirección debe tener entre 10 y 500 caracteres')
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Por favor ingresa un email válido')
    .normalizeEmail(),
  
  body('contrasena')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
];

const changePasswordValidation = [
  body('contrasena_actual')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  
  body('contrasena_nueva')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe contener al menos una mayúscula')
    .matches(/[a-z]/)
    .withMessage('La contraseña debe contener al menos una minúscula')
    .matches(/[0-9]/)
    .withMessage('La contraseña debe contener al menos un número')
    .matches(/[!@#$%^&*(),.?":{}|<>_\-]/)
    .withMessage('La contraseña debe contener al menos un carácter especial'),
  
  body('confirmar_contrasena')
    .custom((value, { req }) => value === req.body.contrasena_nueva)
    .withMessage('Las contraseñas nuevas no coinciden')
];

const editProfileValidation = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('apellido')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  
  body('direccion')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('La dirección debe tener entre 10 y 500 caracteres')
];

// ==================== VALIDACIONES DE CARRITO ====================

const addToCartValidation = [
  body('producto_id')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  
  body('pack_size')
    .isInt({ min: 1 })
    .withMessage('Tamaño de pack inválido')
    .custom(value => [6, 12, 24].includes(value))
    .withMessage('El tamaño de pack debe ser 6, 12 o 24')
];

const updateCartValidation = [
  body('id_carrito')
    .isInt({ min: 1 })
    .withMessage('ID de carrito inválido'),
  
  body('action')
    .isIn(['increase', 'decrease'])
    .withMessage('Acción inválida')
];

const removeFromCartValidation = [
  body('id_carrito')
    .isInt({ min: 1 })
    .withMessage('ID de carrito inválido')
];

// ==================== VALIDACIONES DE ADMIN ====================

const updateProductoValidation = [
  param('id_producto')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  
  body('nombre')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Nombre debe tener entre 3 y 100 caracteres'),
  
  body('descripcion')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Descripción debe tener entre 10 y 5000 caracteres'),
  
  body('precio')
    .isFloat({ min: 0.01 })
    .withMessage('Precio debe ser un número válido positivo'),
  
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock debe ser un número válido no negativo')
];

const marcarProblemaValidation = [
  param('id_orden')
    .isInt({ min: 1 })
    .withMessage('ID de orden inválido'),
  
  body('descripcion_problema')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('La descripción debe tener entre 10 y 1000 caracteres')
];

const responderSolicitudValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de solicitud inválido'),
  
  body('mensaje')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('El mensaje debe tener entre 10 y 5000 caracteres'),
  
  body('estado')
    .isIn(['pendiente', 'en_proceso', 'resuelta', 'cerrada'])
    .withMessage('Estado inválido')
];

const updateUsuarioValidation = [
  param('id_usuario')
    .isInt({ min: 1 })
    .withMessage('ID de usuario inválido'),
  
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('apellido')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Por favor ingresa un email válido')
    .normalizeEmail(),
  
  body('rol')
    .optional()
    .isIn(['cliente', 'admin', 'superadmin'])
    .withMessage('Rol inválido')
];

// ==================== VALIDACIONES DE AYUDA ====================

const nuevaSolicitudValidation = [
  body('asunto')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('El asunto debe tener entre 5 y 200 caracteres'),
  
  body('mensaje')
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('El mensaje debe tener entre 20 y 5000 caracteres'),
  
  body('prioridad')
    .optional()
    .isIn(['baja', 'media', 'alta', 'urgente'])
    .withMessage('Prioridad inválida'),
  
  body('id_orden')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de orden inválido')
];

// ==================== MIDDLEWARE PARA MANEJAR ERRORES ====================

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    
    // Para peticiones AJAX/JSON
    if (req.accepts('json')) {
      return res.status(400).json({
        success: false,
        message: firstError.msg,
        errors: errors.array()
      });
    }
    
    // Para formularios tradicionales
    req.flash('error', firstError.msg);
    return res.redirect(req.header('Referer') || '/');
  }
  
  next();
};

// ==================== EXPORTAR VALIDACIONES ====================

module.exports = {
  // Auth
  registerValidation,
  loginValidation,
  changePasswordValidation,
  editProfileValidation,
  
  // Cart
  addToCartValidation,
  updateCartValidation,
  removeFromCartValidation,
  
  // Admin
  updateProductoValidation,
  marcarProblemaValidation,
  responderSolicitudValidation,
  updateUsuarioValidation,
  
  // Help
  nuevaSolicitudValidation,
  
  // Middleware
  handleValidationErrors,
  validationResult
};