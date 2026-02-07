const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');

// User profile routes (authenticated user)
router.put('/profile', authenticate, userController.updateProfile);
router.put('/password', authenticate, userController.changePassword);

// Admin only
router.get('/', authenticate, isAdmin, userController.getAll);
router.get('/stats', authenticate, isAdmin, userController.getStats);
router.get('/:id', authenticate, isAdmin, userController.getById);
router.put('/:id', authenticate, isAdmin, userController.update);
router.put('/:id/role', authenticate, isAdmin, userController.updateRole);
router.delete('/:id', authenticate, isAdmin, userController.delete);

module.exports = router;
