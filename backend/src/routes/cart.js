const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const { validateAddToCart, validateUpdateCart } = require('../middleware/validators');

router.get('/', authenticate, cartController.getCart);
router.post('/items', authenticate, validateAddToCart, cartController.addItem);
router.put('/items/:itemId', authenticate, validateUpdateCart, cartController.updateItem);
router.delete('/items/:itemId', authenticate, cartController.removeItem);
router.delete('/clear', authenticate, cartController.clearCart);

module.exports = router;
