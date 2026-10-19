const express = require('express');
const controller = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, controller.getProducts);
router.get('/:pid', authenticate, controller.getProductById);

module.exports = router;
