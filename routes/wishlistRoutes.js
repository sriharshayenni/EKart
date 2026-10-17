const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

router.get('/wishlist', ensureAuthenticated, wishlistController.getWishlist);
router.post('/wishlist/toggle', ensureAuthenticated, wishlistController.toggleWishlist);
router.post('/wishlist/move-to-cart', ensureAuthenticated, wishlistController.moveToCart);

module.exports = router;
