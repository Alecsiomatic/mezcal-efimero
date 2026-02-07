const express = require('express');
const router = express.Router();
const bottleController = require('../controllers/bottleController');
const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Rutas públicas
router.get('/', bottleController.getAll);
router.get('/:id', bottleController.getById);

// Rutas de admin
router.get('/admin/all', authenticate, isAdmin, bottleController.adminGetAll);
router.post('/', authenticate, isAdmin, bottleController.create);
router.put('/:id', authenticate, isAdmin, bottleController.update);
router.delete('/:id', authenticate, isAdmin, bottleController.delete);
router.post('/upload', authenticate, isAdmin, upload.single('image'), bottleController.uploadImage);
router.post('/:id/convert-to-product', authenticate, isAdmin, bottleController.convertToProduct);

module.exports = router;
