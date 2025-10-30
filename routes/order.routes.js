const express = require('express');
const router = express.Router();
const { createOrderController } = require('../controllers/orderController');
const authMiddleware = require('../middlewares/auth.middleware');

// Create order route - requires authentication
router.post('/create', authMiddleware, createOrderController);

module.exports = router;