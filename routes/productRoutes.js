const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

router.get('/', productController.getHome);
router.get('/products', productController.getProducts);
router.get('/products/:slug', productController.getProductDetails);
router.post('/products/:id/review', ensureAuthenticated, productController.addReview);

module.exports = router;
