require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const db = require('./models');
const { generalLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const adminProductRoutes = require('./routes/adminProducts');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const paymentRoutes = require('./routes/payments');
const couponRoutes = require('./routes/coupons');
const settingsRoutes = require('./routes/settings');
const userRoutes = require('./routes/users');
const addressRoutes = require('./routes/addresses');
const bottleRoutes = require('./routes/bottles');

const app = express();

// Trust proxy (needed for rate limiter behind nginx)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan('combined'));

// Rate limiting global
app.use('/api', generalLimiter);

// CORS - permite frontend y admin
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.ADMIN_URL || 'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3000'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin?.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir en desarrollo
    }
  },
  credentials: true
}));

// Body parsers con charset UTF-8
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Asegurar UTF-8 en todas las respuestas JSON
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/bottles', bottleRoutes);

// Admin Routes (same as API but with /api/admin prefix for admin panel)
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/products', adminProductRoutes);  // Usa rutas admin separadas
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/admin/orders', orderRoutes);
app.use('/api/admin/coupons', couponRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/bottles', bottleRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3001;

// Start server
async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected');
    
    // Sync models - use force: false to avoid recreating tables
    // In production, use migrations instead
    await db.sequelize.sync({ force: false });
    console.log('Models synchronized');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
