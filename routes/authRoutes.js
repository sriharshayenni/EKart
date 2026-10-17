const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ensureAuthenticated, ensureGuest } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/validationMiddleware');

router.get('/login', ensureGuest, authController.getLogin);
router.post('/login', ensureGuest, authLimiter, authController.postLogin);

router.get('/register', ensureGuest, authController.getRegister);
router.post('/register', ensureGuest, authLimiter, authController.postRegister);

router.get('/logout', authController.getLogout);

// Account pages (auth protected)
router.get('/account', ensureAuthenticated, authController.getAccount);
router.post('/account/profile', ensureAuthenticated, authController.updateProfile);
router.post('/account/address', ensureAuthenticated, authController.addAddress);
router.post('/account/address/:addressId/delete', ensureAuthenticated, authController.deleteAddress);

module.exports = router;
