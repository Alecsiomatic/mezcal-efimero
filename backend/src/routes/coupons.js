const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.post('/validate', couponController.validate);

// Admin
router.get('/', authenticate, isAdmin, couponController.getAll);
router.post('/', authenticate, isAdmin, couponController.create);
router.put('/:id', authenticate, isAdmin, couponController.update);
router.delete('/:id', authenticate, isAdmin, couponController.delete);

module.exports = router;
