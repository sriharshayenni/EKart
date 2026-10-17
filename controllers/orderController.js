const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { generateOrderNumber } = require('../utils/generateOrderNumber');

// GET /checkout
exports.getCheckout = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || !cart.items || cart.items.length === 0) {
      req.session.errorMessage = 'Your cart is empty. Add products before checking out.';
      return res.redirect('/cart');
    }

    // Filter valid items and verify stock
    const validItems = [];
    for (const item of cart.items) {
      if (!item.product || !item.product.active) {
        req.session.errorMessage = 'Some products in your cart are no longer available.';
        return res.redirect('/cart');
      }
      if (item.quantity > item.product.stock) {
        req.session.errorMessage = `Item "${item.product.name}" only has ${item.product.stock} left in stock. Please adjust quantity.`;
        return res.redirect('/cart');
      }
      validItems.push(item);
    }

    const subtotal = validItems.reduce((acc, it) => acc + (it.product.price * it.quantity), 0);
    const shippingFee = subtotal > 1000 ? 0 : 50;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shippingFee + tax;

    const user = await User.findById(req.user._id);

    res.render('pages/checkout', {
      pageTitle: 'Checkout - eKart',
      cart,
      items: validItems,
      subtotal,
      shippingFee,
      tax,
      total,
      addresses: user.addresses || []
    });
  } catch (error) {
    next(error);
  }
};

// POST /checkout - Place Order
exports.placeOrder = async (req, res, next) => {
  try {
    const {
      fullName,
      phone,
      street,
      city,
      state,
      postalCode,
      country = 'India',
      paymentMethod = 'mock_card',
      saveAddress
    } = req.body;

    // Validate shipping details
    if (!fullName || !phone || !street || !city || !state || !postalCode) {
      req.session.errorMessage = 'Please complete all required shipping fields.';
      return res.redirect('/checkout');
    }

    // Retrieve active cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || !cart.items || cart.items.length === 0) {
      req.session.errorMessage = 'Your cart is empty.';
      return res.redirect('/cart');
    }

    // Critical Server-side Stock and Price Verification
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      // Re-fetch product from DB to ensure freshest price and stock
      const product = await Product.findById(item.product._id);
      if (!product || !product.active) {
        req.session.errorMessage = `Product "${item.product.name}" is no longer available.`;
        return res.redirect('/cart');
      }

      if (product.stock < item.quantity) {
        req.session.errorMessage = `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}.`;
        return res.redirect('/cart');
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || '/images/products/placeholder.jpg',
        subtotal: itemSubtotal
      });
    }

    // Calculate official totals on server
    const shippingFee = subtotal > 1000 ? 0 : 50;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shippingFee + tax;

    // Deduct stock safely
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity }
      });
    }

    const orderNumber = generateOrderNumber();

    // Determine payment status
    let paymentStatus = 'Completed';
    let transactionId = 'MOCK-TXN-' + Date.now();
    if (paymentMethod === 'cod') {
      paymentStatus = 'Pending';
      transactionId = 'COD-' + Date.now();
    }

    // Create Order
    const order = new Order({
      orderNumber,
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim()
      },
      payment: {
        method: paymentMethod,
        status: paymentStatus,
        transactionId
      },
      subtotal,
      shippingFee,
      tax,
      total,
      status: 'Pending',
      trackingNotes: [{
        status: 'Pending',
        message: 'Order placed successfully. Awaiting fulfillment.'
      }]
    });

    await order.save();

    // Optionally save shipping address to user's profile
    if (saveAddress) {
      const user = await User.findById(req.user._id);
      user.addresses.push({
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        isDefault: user.addresses.length === 0
      });
      await user.save();
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    req.session.successMessage = `Order ${orderNumber} placed successfully!`;
    res.redirect(`/orders/${order._id}?success=true`);
  } catch (error) {
    console.error('Order placement error:', error);
    next(error);
  }
};

// GET /orders - User's Orders
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.render('pages/orders', {
      pageTitle: 'My Orders - eKart',
      orders
    });
  } catch (error) {
    next(error);
  }
};

// GET /orders/:id - Order Details with ownership verification
exports.getOrderDetails = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Order Not Found',
        customMessage: 'The requested order could not be located.'
      });
    }

    // Strict ownership verification
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).render('pages/404', {
        pageTitle: 'Access Denied',
        customMessage: 'You do not have permission to view this order.'
      });
    }

    const isNewOrder = req.query.success === 'true';

    res.render('pages/order-details', {
      pageTitle: `Order #${order.orderNumber} - eKart`,
      order,
      isNewOrder
    });
  } catch (error) {
    next(error);
  }
};

// POST /orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      req.session.errorMessage = 'Order not found.';
      return res.redirect('/orders');
    }

    // Ownership check
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      req.session.errorMessage = 'Permission denied.';
      return res.redirect('/orders');
    }

    // Cancellation check
    if (order.status !== 'Pending') {
      req.session.errorMessage = `Cannot cancel order that is already ${order.status.toLowerCase()}.`;
      return res.redirect(`/orders/${order._id}`);
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    order.status = 'Cancelled';
    order.trackingNotes.push({
      status: 'Cancelled',
      message: 'Order was cancelled by the customer.'
    });

    await order.save();

    req.session.successMessage = 'Order has been cancelled and stock restored.';
    res.redirect(`/orders/${order._id}`);
  } catch (error) {
    console.error('Order cancellation error:', error);
    req.session.errorMessage = 'Failed to cancel order.';
    res.redirect('/orders');
  }
};
