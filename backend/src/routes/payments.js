const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// Preference-based payment (redirect)
router.post('/preference', authenticate, paymentController.createPreference);
router.post('/create-preference', authenticate, paymentController.createPreference);

// Card payment (inline - no redirect)
router.post('/process-card', authenticate, paymentController.processCard);

// Webhooks and verification
router.post('/webhook', paymentController.webhook);
router.get('/verify', paymentController.verify);
router.get('/status/:orderId', authenticate, paymentController.getStatus);

module.exports = router;
