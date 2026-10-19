const express = require('express');
const controller = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Mọi route đơn hàng đều cần token
router.use(authenticate);

router.post('/', controller.createOrder);
router.get('/', controller.getOrders);
router.get('/:oid', controller.getOrderById);

module.exports = router;
