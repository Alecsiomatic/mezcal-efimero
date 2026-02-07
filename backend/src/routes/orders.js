const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiter');
const { validateOrder, validateUUID } = require('../middleware/validators');
const upload = require('../middleware/upload');

// Rutas de usuario
router.get('/my-orders', authenticate, orderController.getMyOrders);
router.get('/my', authenticate, orderController.getMyOrders); // alias
router.post('/', authenticate, orderLimiter, validateOrder, orderController.create);

// Upload payment receipt (customer)
router.post('/:id/receipt', authenticate, validateUUID, upload.single('receipt'), orderController.uploadReceipt);

// Admin routes - both direct and prefixed paths for compatibility
router.get('/admin/all', authenticate, isAdmin, orderController.adminGetAll);
router.get('/admin/stats', authenticate, isAdmin, orderController.getStats);
router.get('/admin/pending-payments', authenticate, isAdmin, orderController.getPendingPayments);

// Admin routes accessed via /api/admin/orders prefix (these receive / or /:id)
router.get('/', authenticate, isAdmin, orderController.adminGetAll); // For /api/admin/orders
router.get('/stats', authenticate, isAdmin, orderController.getStats); // For /api/admin/orders/stats

router.put('/:id/status', authenticate, isAdmin, validateUUID, orderController.updateStatus);
router.put('/:id/payment-status', authenticate, isAdmin, validateUUID, orderController.updatePaymentStatus);
router.put('/:id/tracking', authenticate, isAdmin, validateUUID, orderController.updateTracking);
router.put('/:id/cancel', authenticate, isAdmin, validateUUID, orderController.cancelOrder);

// User get single order - must be after admin routes to not catch admin paths
router.get('/:id', authenticate, validateUUID, orderController.getOrder);

module.exports = router;
