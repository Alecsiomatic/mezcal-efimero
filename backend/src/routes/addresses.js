const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', addressController.getAll);
router.get('/:id', addressController.getById);
router.post('/', addressController.create);
router.put('/:id', addressController.update);
router.delete('/:id', addressController.delete);
router.put('/:id/default', addressController.setDefault);

module.exports = router;
