const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Todas las rutas aquí requieren autenticación admin
router.use(authenticate, isAdmin);

// Admin routes
router.get('/', productController.adminGetAll);
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);
router.post('/upload', upload.single('image'), productController.uploadImage);
router.post('/upload-multiple', upload.array('images', 10), productController.uploadImages);

module.exports = router;
