const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

router.get('/checkout', ensureAuthenticated, orderController.getCheckout);
router.post('/checkout', ensureAuthenticated, orderController.placeOrder);

router.get('/orders', ensureAuthenticated, orderController.getOrders);
router.get('/orders/:id', ensureAuthenticated, orderController.getOrderDetails);
router.post('/orders/:id/cancel', ensureAuthenticated, orderController.cancelOrder);

module.exports = router;
