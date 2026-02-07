const { body, param, query, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors for', req.path, ':', JSON.stringify(errors.array(), null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    return res.status(400).json({
      error: 'Datos inválidos',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// ============================================
// VALIDADORES DE AUTENTICACIÓN
// ============================================

const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/\d/)
    .withMessage('La contraseña debe contener al menos un número'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .escape(),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .escape(),
  body('lastName2')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El segundo apellido no puede exceder 50 caracteres')
    .escape(),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Número de teléfono inválido'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Código de país inválido'),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Estado inválido'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
  handleValidationErrors
];

// ============================================
// VALIDADORES DE PRODUCTOS
// ============================================

const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('El nombre debe tener entre 2 y 200 caracteres')
    .escape(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('La descripción no puede exceder 5000 caracteres'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero positivo'),
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('ID de categoría inválido'),
  handleValidationErrors
];

// ============================================
// VALIDADORES DE ÓRDENES
// ============================================

const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('El carrito no puede estar vacío'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('ID de producto requerido'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser al menos 1'),
  body('shipping')
    .notEmpty()
    .withMessage('La información de envío es requerida'),
  body('shipping.firstName')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido'),
  body('shipping.lastName')
    .trim()
    .notEmpty()
    .withMessage('El apellido es requerido'),
  body('shipping.email')
    .isEmail()
    .withMessage('Email inválido'),
  body('shipping.phone')
    .optional()
    .trim(),
  body('shipping.address')
    .trim()
    .notEmpty()
    .withMessage('La dirección es requerida'),
  body('shipping.city')
    .trim()
    .notEmpty()
    .withMessage('La ciudad es requerida'),
  body('shipping.state')
    .trim()
    .notEmpty()
    .withMessage('El estado es requerido'),
  body('shipping.zip')
    .trim()
    .matches(/^\d{5}$/)
    .withMessage('El código postal debe tener 5 dígitos'),
  body('paymentMethod')
    .optional()
    .isIn(['mercadopago', 'transfer', 'cash'])
    .withMessage('Método de pago inválido'),
  handleValidationErrors
];

// ============================================
// VALIDADORES DE CARRITO
// ============================================

const validateAddToCart = [
  body('productId')
    .isUUID()
    .withMessage('ID de producto inválido'),
  body('quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('La cantidad debe ser entre 1 y 99'),
  handleValidationErrors
];

const validateUpdateCart = [
  body('quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('La cantidad debe ser entre 1 y 99'),
  handleValidationErrors
];

// ============================================
// VALIDADORES DE CUPONES
// ============================================

const validateCoupon = [
  body('code')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El código debe tener entre 3 y 50 caracteres')
    .toUpperCase(),
  body('discountType')
    .isIn(['percentage', 'fixed'])
    .withMessage('Tipo de descuento inválido'),
  body('discountValue')
    .isFloat({ min: 0 })
    .withMessage('El valor del descuento debe ser positivo'),
  body('minPurchase')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La compra mínima debe ser positiva'),
  body('maxUses')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El máximo de usos debe ser al menos 1'),
  handleValidationErrors
];

// ============================================
// VALIDADORES GENÉRICOS
// ============================================

const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('ID inválido'),
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser entre 1 y 100'),
  handleValidationErrors
];

// ============================================
// VALIDADORES DE DIRECCIONES
// ============================================

const validateAddress = [
  body('street')
    .trim()
    .notEmpty()
    .withMessage('La calle es requerida')
    .isLength({ max: 200 })
    .escape(),
  body('colony')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .escape(),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('La ciudad es requerida')
    .isLength({ max: 100 })
    .escape(),
  body('state')
    .trim()
    .notEmpty()
    .withMessage('El estado es requerido')
    .isLength({ max: 100 })
    .escape(),
  body('zipCode')
    .trim()
    .matches(/^\d{5}$/)
    .withMessage('El código postal debe tener 5 dígitos'),
  body('phone')
    .optional()
    .isMobilePhone('es-MX')
    .withMessage('Teléfono inválido'),
  body('references')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .escape(),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateProduct,
  validateOrder,
  validateAddToCart,
  validateUpdateCart,
  validateCoupon,
  validateUUID,
  validatePagination,
  validateAddress
};
