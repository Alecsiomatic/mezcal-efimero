const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/', categoryController.getAll);
router.get('/:slug', categoryController.getBySlug);

// Admin
router.get('/admin/all', authenticate, isAdmin, categoryController.adminGetAll);
router.post('/', authenticate, isAdmin, categoryController.create);
router.put('/:id', authenticate, isAdmin, categoryController.update);
router.delete('/:id', authenticate, isAdmin, categoryController.delete);

module.exports = router;
