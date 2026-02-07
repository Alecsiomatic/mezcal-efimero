const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', productController.getAll);
router.get('/featured', productController.getFeatured);

// Admin routes con prefijo /admin/ (para /api/products/admin/...)
router.get('/admin/all', authenticate, isAdmin, productController.adminGetAll);
router.post('/admin', authenticate, isAdmin, productController.create);
router.put('/admin/:id', authenticate, isAdmin, productController.update);
router.delete('/admin/:id', authenticate, isAdmin, productController.delete);
router.post('/admin/upload', authenticate, isAdmin, upload.single('image'), productController.uploadImage);
router.post('/admin/upload-multiple', authenticate, isAdmin, upload.array('images', 10), productController.uploadImages);

// Public route with slug - AL FINAL para evitar conflictos
router.get('/:slug', productController.getBySlug);

module.exports = router;
