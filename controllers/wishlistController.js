const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

// GET /wishlist
exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    const products = user.wishlist.filter(item => item && item.active);

    res.render('pages/wishlist', {
      pageTitle: 'My Wishlist - eKart',
      products
    });
  } catch (error) {
    next(error);
  }
};

// POST /wishlist/toggle or /wishlist/add
exports.toggleWishlist = async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID is required.' });
  }

  try {
    const user = await User.findById(req.user._id);
    const index = user.wishlist.indexOf(productId);
    let added = false;

    if (index > -1) {
      user.wishlist.splice(index, 1);
      added = false;
    } else {
      user.wishlist.push(productId);
      added = true;
    }

    await user.save();

    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({
        success: true,
        added,
        message: added ? 'Added to your wishlist!' : 'Removed from wishlist.',
        wishlistCount: user.wishlist.length
      });
    }

    req.session.successMessage = added ? 'Added to your wishlist!' : 'Removed from wishlist.';
    res.redirect('back');
  } catch (error) {
    console.error('Wishlist error:', error);
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(500).json({ success: false, message: 'Server error updating wishlist.' });
    }
    res.redirect('back');
  }
};

// POST /wishlist/move-to-cart
exports.moveToCart = async (req, res) => {
  const { productId } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product || product.stock < 1) {
      req.session.errorMessage = 'Product is currently out of stock.';
      return res.redirect('/wishlist');
    }

    // Add to cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(it => it.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += 1;
    } else {
      cart.items.push({ product: productId, quantity: 1, price: product.price });
    }
    await cart.save();

    // Remove from wishlist
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { wishlist: productId }
    });

    req.session.successMessage = 'Moved item to your cart!';
    res.redirect('/cart');
  } catch (error) {
    console.error('Move to cart error:', error);
    req.session.errorMessage = 'Could not move item to cart.';
    res.redirect('/wishlist');
  }
};
