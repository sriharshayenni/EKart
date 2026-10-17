const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper to retrieve cart for current user or session
async function getCartForUserOrSession(req) {
  if (req.user) {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    return cart;
  } else {
    let cart = await Cart.findOne({ sessionId: req.sessionID }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ sessionId: req.sessionID, items: [] });
    }
    return cart;
  }
}

// GET /cart
exports.getCart = async (req, res, next) => {
  try {
    const cart = await getCartForUserOrSession(req);

    // Sanitize items (remove products that no longer exist or are inactive)
    let hasChanged = false;
    const validItems = [];
    for (const item of cart.items) {
      if (item.product && item.product.active) {
        // Adjust quantity if exceeds stock
        if (item.quantity > item.product.stock) {
          item.quantity = Math.max(1, item.product.stock);
          hasChanged = true;
        }
        validItems.push(item);
      } else {
        hasChanged = true;
      }
    }

    if (hasChanged) {
      cart.items = validItems;
      await cart.save();
    }

    // Calculations
    const subtotal = validItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const shippingFee = subtotal > 1000 || subtotal === 0 ? 0 : 50; // Free shipping over ₹1000
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal + shippingFee + tax;

    res.render('pages/cart', {
      pageTitle: 'Shopping Cart - eKart',
      cart,
      subtotal,
      shippingFee,
      tax,
      total
    });
  } catch (error) {
    next(error);
  }
};

// POST /cart/add
exports.addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const numQuantity = Math.max(1, parseInt(quantity, 10) || 1);

  try {
    const product = await Product.findById(productId);
    if (!product || !product.active) {
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(404).json({ success: false, message: 'Product not found or inactive.' });
      }
      req.session.errorMessage = 'Product not found.';
      return res.redirect('back');
    }

    if (product.stock < numQuantity) {
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} items in stock.` });
      }
      req.session.errorMessage = `Cannot add ${numQuantity}. Only ${product.stock} available.`;
      return res.redirect('back');
    }

    const cart = await getCartForUserOrSession(req);

    const existingIndex = cart.items.findIndex(
      item => item.product._id.toString() === productId
    );

    if (existingIndex > -1) {
      const newTotalQuantity = cart.items[existingIndex].quantity + numQuantity;
      if (newTotalQuantity > product.stock) {
        if (req.xhr || req.headers.accept?.includes('json')) {
          return res.status(400).json({
            success: false,
            message: `You already have ${cart.items[existingIndex].quantity} in cart. Only ${product.stock} in stock.`
          });
        }
        req.session.errorMessage = `You already have ${cart.items[existingIndex].quantity} in cart. Only ${product.stock} in stock.`;
        return res.redirect('back');
      }
      cart.items[existingIndex].quantity = newTotalQuantity;
      cart.items[existingIndex].price = product.price;
    } else {
      cart.items.push({
        product: product._id,
        quantity: numQuantity,
        price: product.price
      });
    }

    await cart.save();

    const totalCartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({
        success: true,
        message: `${product.name} added to cart!`,
        cartCount: totalCartCount
      });
    }

    req.session.successMessage = `${product.name} added to cart!`;
    res.redirect('/cart');
  } catch (error) {
    console.error('Add to cart error:', error);
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(500).json({ success: false, message: 'Server error adding to cart.' });
    }
    req.session.errorMessage = 'Could not add product to cart.';
    res.redirect('back');
  }
};

// POST /cart/update
exports.updateQuantity = async (req, res) => {
  const { itemId, quantity } = req.body;
  const newQty = parseInt(quantity, 10);

  try {
    const cart = await getCartForUserOrSession(req);
    const item = cart.items.id(itemId);

    if (!item) {
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(404).json({ success: false, message: 'Item not found in cart.' });
      }
      return res.redirect('/cart');
    }

    if (newQty <= 0) {
      cart.items.pull(itemId);
      await cart.save();
    } else {
      const product = await Product.findById(item.product._id);
      if (product.stock < newQty) {
        if (req.xhr || req.headers.accept?.includes('json')) {
          return res.status(400).json({
            success: false,
            message: `Only ${product.stock} available in stock.`
          });
        }
        req.session.errorMessage = `Only ${product.stock} available.`;
        return res.redirect('/cart');
      }
      item.quantity = newQty;
      await cart.save();
    }

    // Compute updated totals for dynamic front-end refresh
    const updatedCart = await getCartForUserOrSession(req);
    const subtotal = updatedCart.items.reduce((acc, it) => acc + (it.product.price * it.quantity), 0);
    const shippingFee = subtotal > 1000 || subtotal === 0 ? 0 : 50;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shippingFee + tax;
    const cartCount = updatedCart.items.reduce((sum, it) => sum + it.quantity, 0);

    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({
        success: true,
        cartCount,
        subtotal,
        shippingFee,
        tax,
        total,
        itemSubtotal: item ? item.quantity * item.product.price : 0
      });
    }

    res.redirect('/cart');
  } catch (error) {
    console.error('Update cart error:', error);
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(500).json({ success: false, message: 'Error updating quantity.' });
    }
    res.redirect('/cart');
  }
};

// POST /cart/remove
exports.removeItem = async (req, res) => {
  const { itemId } = req.body;

  try {
    const cart = await getCartForUserOrSession(req);
    cart.items.pull(itemId);
    await cart.save();

    const cartCount = cart.items.reduce((sum, it) => sum + it.quantity, 0);

    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({
        success: true,
        message: 'Item removed from cart.',
        cartCount
      });
    }

    req.session.successMessage = 'Item removed from cart.';
    res.redirect('/cart');
  } catch (error) {
    console.error('Remove item error:', error);
    res.redirect('/cart');
  }
};

// POST /cart/clear
exports.clearCart = async (req, res) => {
  try {
    const cart = await getCartForUserOrSession(req);
    cart.items = [];
    await cart.save();

    req.session.successMessage = 'Cart cleared.';
    res.redirect('/cart');
  } catch (error) {
    res.redirect('/cart');
  }
};
