const rateLimit = require('express-rate-limit');

// Rate limiter general para todas las rutas
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana por IP
  message: {
    error: 'Demasiadas solicitudes, por favor intenta de nuevo más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter estricto para autenticación (login/registro)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos de login por ventana
  message: {
    error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No cuenta los requests exitosos
});

// Rate limiter para creación de órdenes/pagos
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 órdenes por hora
  message: {
    error: 'Has alcanzado el límite de órdenes. Intenta de nuevo más tarde.',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para APIs públicas (productos, categorías)
const publicApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // 60 requests por minuto
  message: {
    error: 'Demasiadas solicitudes. Por favor espera un momento.',
    retryAfter: '1 minuto'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  orderLimiter,
  publicApiLimiter
};
