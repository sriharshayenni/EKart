const User = require('../models/User');
const Cart = require('../models/Cart');

const setUserLocals = async (req, res, next) => {
  res.locals.currentUser = null;
  res.locals.cartCount = 0;
  res.locals.wishlistCount = 0;
  res.locals.currentPath = req.path;
  res.locals.query = req.query || {};
  res.locals.appName = process.env.APP_NAME || 'eKart';
  res.locals.successMessage = req.session.successMessage || null;
  res.locals.errorMessage = req.session.errorMessage || null;
  delete req.session.successMessage;
  delete req.session.errorMessage;

  try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId).select('-password');
      if (user) {
        req.user = user;
        res.locals.currentUser = user;
        res.locals.wishlistCount = (user.wishlist && user.wishlist.length) || 0;

        // Fetch user's cart count
        const cart = await Cart.findOne({ user: user._id });
        if (cart && cart.items) {
          res.locals.cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
        }
      } else {
        // Stale session
        delete req.session.userId;
      }
    } else {
      // Guest user cart count
      if (req.sessionID) {
        const cart = await Cart.findOne({ sessionId: req.sessionID });
        if (cart && cart.items) {
          res.locals.cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
        }
      }
    }
  } catch (err) {
    console.error('Error in setUserLocals middleware:', err);
  }

  next();
};

const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  req.session.errorMessage = 'Please sign in to access this page.';
  res.redirect('/login');
};

const ensureGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/account');
  }
  next();
};

module.exports = {
  setUserLocals,
  ensureAuthenticated,
  ensureGuest
};
