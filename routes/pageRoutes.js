const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { actionLimiter } = require('../middleware/validationMiddleware');

router.get('/about', pageController.getAbout);
router.get('/contact', pageController.getContact);
router.post('/contact', actionLimiter, pageController.postContact);
router.get('/faq', pageController.getFaq);
router.get('/privacy', pageController.getPrivacy);
router.get('/terms', pageController.getTerms);
router.post('/newsletter/subscribe', actionLimiter, pageController.subscribeNewsletter);

module.exports = router;
