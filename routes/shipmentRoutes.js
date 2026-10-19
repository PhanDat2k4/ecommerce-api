const express = require('express');
const controller = require('../controllers/shipmentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:shipid', authenticate, controller.getShipmentById);
router.patch(
  '/:shipid/status',
  authenticate,
  authorize('admin', 'staff'),
  controller.updateShipmentStatus
);

module.exports = router;
