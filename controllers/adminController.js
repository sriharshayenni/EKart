const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');

// Slug generation helper
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// GET /admin - Overview Dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();

    // Calculate total revenue from non-cancelled orders
    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Low stock alerts
    const lowStockProducts = await Product.find({ stock: { $lte: 5 }, active: true })
      .populate('category')
      .limit(6);

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(6);

    // Status breakdown
    const orderStatusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.render('admin/dashboard', {
      pageTitle: 'Admin Dashboard - eKart',
      activeTab: 'dashboard',
      stats: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalUsers
      },
      lowStockProducts,
      recentOrders,
      orderStatusCounts
    });
  } catch (error) {
    next(error);
  }
};

// GET /admin/products - Product Listing
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, page = 1 } = req.query;
    const limit = 15;
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const filter = {};

    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(filter)
      .populate('category')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit);

    const categories = await Category.find().sort({ name: 1 });

    res.render('admin/products', {
      pageTitle: 'Manage Products - eKart Admin',
      activeTab: 'products',
      products,
      categories,
      totalProducts,
      totalPages,
      currentPage,
      query: req.query
    });
  } catch (error) {
    next(error);
  }
};

// GET /admin/products/new - New Product Form
exports.getNewProductForm = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.render('admin/product-form', {
      pageTitle: 'Create Product - eKart Admin',
      activeTab: 'products',
      categories,
      product: null
    });
  } catch (error) {
    next(error);
  }
};

// POST /admin/products - Create Product
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      category,
      brand,
      price,
      originalPrice,
      stock,
      description,
      shortDescription,
      images,
      specKeys,
      specValues,
      tags,
      isFeatured,
      isTrending,
      isNewArrival,
      active
    } = req.body;

    let slug = generateSlug(name);
    // Ensure slug uniqueness
    const existing = await Product.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Parse image URLs (one per line or comma-separated)
    let imageList = [];
    if (images) {
      imageList = images.split(/[\n,]/).map(url => url.trim()).filter(Boolean);
    }
    if (imageList.length === 0) {
      imageList = ['/images/products/placeholder.jpg'];
    }

    // Parse specifications
    const specifications = [];
    if (specKeys && specValues) {
      const keys = Array.isArray(specKeys) ? specKeys : [specKeys];
      const values = Array.isArray(specValues) ? specValues : [specValues];
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].trim() && values[i].trim()) {
          specifications.push({ key: keys[i].trim(), value: values[i].trim() });
        }
      }
    }

    // Parse tags
    let tagList = [];
    if (tags) {
      tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const newProduct = new Product({
      name: name.trim(),
      slug,
      category,
      brand: brand ? brand.trim() : '',
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : Number(price),
      stock: Math.max(0, parseInt(stock, 10) || 0),
      description: description.trim(),
      shortDescription: shortDescription ? shortDescription.trim() : '',
      images: imageList,
      specifications,
      tags: tagList,
      isFeatured: isFeatured === 'on' || isFeatured === true,
      isTrending: isTrending === 'on' || isTrending === true,
      isNewArrival: isNewArrival === 'on' || isNewArrival === true,
      active: active === 'on' || active === true || active === 'true'
    });

    await newProduct.save();
    req.session.successMessage = `Product "${newProduct.name}" created successfully!`;
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Error creating product:', error);
    req.session.errorMessage = error.message || 'Failed to create product.';
    res.redirect('/admin/products/new');
  }
};

// GET /admin/products/:id/edit - Edit Product Form
exports.getEditProductForm = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.session.errorMessage = 'Product not found.';
      return res.redirect('/admin/products');
    }

    const categories = await Category.find().sort({ name: 1 });
    res.render('admin/product-form', {
      pageTitle: `Edit: ${product.name} - eKart Admin`,
      activeTab: 'products',
      categories,
      product
    });
  } catch (error) {
    next(error);
  }
};

// POST /admin/products/:id - Update Product
exports.updateProduct = async (req, res, next) => {
  try {
    const {
      name,
      category,
      brand,
      price,
      originalPrice,
      stock,
      description,
      shortDescription,
      images,
      specKeys,
      specValues,
      tags,
      isFeatured,
      isTrending,
      isNewArrival,
      active
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      req.session.errorMessage = 'Product not found.';
      return res.redirect('/admin/products');
    }

    let imageList = [];
    if (images) {
      imageList = images.split(/[\n,]/).map(url => url.trim()).filter(Boolean);
    }
    if (imageList.length === 0) {
      imageList = product.images;
    }

    const specifications = [];
    if (specKeys && specValues) {
      const keys = Array.isArray(specKeys) ? specKeys : [specKeys];
      const values = Array.isArray(specValues) ? specValues : [specValues];
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].trim() && values[i].trim()) {
          specifications.push({ key: keys[i].trim(), value: values[i].trim() });
        }
      }
    }

    let tagList = [];
    if (tags) {
      tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    product.name = name.trim();
    product.category = category;
    product.brand = brand ? brand.trim() : '';
    product.price = Number(price);
    product.originalPrice = originalPrice ? Number(originalPrice) : Number(price);
    product.stock = Math.max(0, parseInt(stock, 10) || 0);
    product.description = description.trim();
    product.shortDescription = shortDescription ? shortDescription.trim() : '';
    product.images = imageList;
    product.specifications = specifications;
    product.tags = tagList;
    product.isFeatured = isFeatured === 'on' || isFeatured === true;
    product.isTrending = isTrending === 'on' || isTrending === true;
    product.isNewArrival = isNewArrival === 'on' || isNewArrival === true;
    product.active = active === 'on' || active === true || active === 'true';

    await product.save();

    req.session.successMessage = `Product "${product.name}" updated successfully!`;
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Error updating product:', error);
    req.session.errorMessage = error.message || 'Failed to update product.';
    res.redirect(`/admin/products/${req.params.id}/edit`);
  }
};

// POST /admin/products/:id/delete - Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      req.session.errorMessage = 'Product not found.';
    } else {
      req.session.successMessage = `Product "${product.name}" deleted.`;
    }
    res.redirect('/admin/products');
  } catch (error) {
    req.session.errorMessage = 'Failed to delete product.';
    res.redirect('/admin/products');
  }
};

// GET /admin/categories - Category Management
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    // Fetch product counts for each category
    const categoryCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    categoryCounts.forEach(c => {
      countMap[c._id.toString()] = c.count;
    });

    res.render('admin/categories', {
      pageTitle: 'Manage Categories - eKart Admin',
      activeTab: 'categories',
      categories,
      countMap
    });
  } catch (error) {
    next(error);
  }
};

// POST /admin/categories - Create Category
exports.createCategory = async (req, res) => {
  const { name, description, image, icon, isFeatured } = req.body;
  try {
    let slug = generateSlug(name);
    const existing = await Category.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    await Category.create({
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      image: image ? image.trim() : '/images/categories/placeholder.jpg',
      icon: icon ? icon.trim() : 'tag',
      isFeatured: isFeatured === 'on' || isFeatured === true
    });

    req.session.successMessage = `Category "${name}" created.`;
    res.redirect('/admin/categories');
  } catch (error) {
    req.session.errorMessage = error.message || 'Failed to create category.';
    res.redirect('/admin/categories');
  }
};

// POST /admin/categories/:id - Update Category
exports.updateCategory = async (req, res) => {
  const { name, description, image, icon, isFeatured } = req.body;
  try {
    await Category.findByIdAndUpdate(req.params.id, {
      name: name.trim(),
      description: description ? description.trim() : '',
      image: image ? image.trim() : '/images/categories/placeholder.jpg',
      icon: icon ? icon.trim() : 'tag',
      isFeatured: isFeatured === 'on' || isFeatured === true
    });

    req.session.successMessage = 'Category updated successfully.';
    res.redirect('/admin/categories');
  } catch (error) {
    req.session.errorMessage = error.message || 'Failed to update category.';
    res.redirect('/admin/categories');
  }
};

// POST /admin/categories/:id/delete - Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    // Check if category has associated products
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      req.session.errorMessage = `Cannot delete category: ${productCount} products are assigned to it. Reassign products first.`;
      return res.redirect('/admin/categories');
    }

    await Category.findByIdAndDelete(req.params.id);
    req.session.successMessage = 'Category removed successfully.';
    res.redirect('/admin/categories');
  } catch (error) {
    req.session.errorMessage = 'Failed to delete category.';
    res.redirect('/admin/categories');
  }
};

// GET /admin/orders - Order Management
exports.getOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1 } = req.query;
    const limit = 15;
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && search.trim()) {
      filter.orderNumber = { $regex: search.trim(), $options: 'i' };
    }

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit);

    res.render('admin/orders', {
      pageTitle: 'Manage Orders - eKart Admin',
      activeTab: 'orders',
      orders,
      totalOrders,
      totalPages,
      currentPage,
      query: req.query
    });
  } catch (error) {
    next(error);
  }
};

// GET /admin/orders/:id - Admin Order Details
exports.getOrderDetails = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) {
      req.session.errorMessage = 'Order not found.';
      return res.redirect('/admin/orders');
    }

    res.render('admin/order-details', {
      pageTitle: `Admin Order #${order.orderNumber}`,
      activeTab: 'orders',
      order
    });
  } catch (error) {
    next(error);
  }
};

// POST /admin/orders/:id/status - Update Order Status
exports.updateOrderStatus = async (req, res) => {
  const { status, note } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      req.session.errorMessage = 'Order not found.';
      return res.redirect('/admin/orders');
    }

    const oldStatus = order.status;
    order.status = status;

    // If order was not cancelled previously and is now being cancelled, restore stock
    if (oldStatus !== 'Cancelled' && status === 'Cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    // Append tracking record
    order.trackingNotes.push({
      status,
      message: note ? note.trim() : `Order status changed from ${oldStatus} to ${status} by administrator.`
    });

    await order.save();
    req.session.successMessage = `Order status updated to ${status}.`;
    res.redirect(`/admin/orders/${order._id}`);
  } catch (error) {
    console.error('Update order status error:', error);
    req.session.errorMessage = 'Failed to update order status.';
    res.redirect(`/admin/orders/${req.params.id}`);
  }
};

// GET /admin/users - User Management
exports.getUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1 } = req.query;
    const limit = 20;
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const filter = {};

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      filter.role = role;
    }

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit);

    res.render('admin/users', {
      pageTitle: 'User Directory - eKart Admin',
      activeTab: 'users',
      users,
      totalUsers,
      totalPages,
      currentPage,
      query: req.query
    });
  } catch (error) {
    next(error);
  }
};

// POST /admin/users/:id/role - Toggle Admin / User Role
exports.toggleUserRole = async (req, res) => {
  try {
    const targetUserId = req.params.id;

    // Prevent demoting current active admin
    if (targetUserId === req.user._id.toString()) {
      req.session.errorMessage = 'You cannot modify your own administrator permissions.';
      return res.redirect('/admin/users');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      req.session.errorMessage = 'User not found.';
      return res.redirect('/admin/users');
    }

    targetUser.role = targetUser.role === 'admin' ? 'user' : 'admin';
    await targetUser.save();

    req.session.successMessage = `User "${targetUser.name}" role updated to ${targetUser.role.toUpperCase()}.`;
    res.redirect('/admin/users');
  } catch (error) {
    req.session.errorMessage = 'Failed to update user role.';
    res.redirect('/admin/users');
  }
};
