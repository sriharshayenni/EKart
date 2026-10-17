const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { ensureAdmin } = require('../middleware/adminMiddleware');

// Enforce both authentication and administrator privileges for all /admin routes
router.use(ensureAuthenticated, ensureAdmin);

// Dashboard
router.get('/', adminController.getDashboard);

// Products
router.get('/products', adminController.getProducts);
router.get('/products/new', adminController.getNewProductForm);
router.post('/products', adminController.createProduct);
router.get('/products/:id/edit', adminController.getEditProductForm);
router.post('/products/:id', adminController.updateProduct);
router.post('/products/:id/delete', adminController.deleteProduct);

// Categories
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.post('/categories/:id', adminController.updateCategory);
router.post('/categories/:id/delete', adminController.deleteCategory);

// Orders
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderDetails);
router.post('/orders/:id/status', adminController.updateOrderStatus);

// Users
router.get('/users', adminController.getUsers);
router.post('/users/:id/role', adminController.toggleUserRole);

module.exports = router;
