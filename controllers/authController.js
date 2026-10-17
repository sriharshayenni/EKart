const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

// Helper to merge guest cart into user cart upon login
async function mergeGuestCart(oldSessionId, userId) {
  if (!oldSessionId || !userId) return;

  try {
    const guestCart = await Cart.findOne({ sessionId: oldSessionId });
    if (!guestCart || !guestCart.items || guestCart.items.length === 0) return;

    let userCart = await Cart.findOne({ user: userId });
    if (!userCart) {
      // Transfer guest cart directly to user
      guestCart.user = userId;
      guestCart.sessionId = null;
      await guestCart.save();
    } else {
      // Merge items
      for (const guestItem of guestCart.items) {
        const existingItemIndex = userCart.items.findIndex(
          item => item.product.toString() === guestItem.product.toString()
        );
        if (existingItemIndex > -1) {
          userCart.items[existingItemIndex].quantity += guestItem.quantity;
        } else {
          userCart.items.push(guestItem);
        }
      }
      await userCart.save();
      await Cart.deleteOne({ _id: guestCart._id });
    }
  } catch (err) {
    console.error('Error merging guest cart:', err);
  }
}

// GET /login
exports.getLogin = (req, res) => {
  res.render('pages/login', {
    pageTitle: 'Sign In - eKart',
    email: req.query.email || ''
  });
};

// POST /login
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.session.errorMessage = 'Please provide both email and password.';
    return res.redirect('/login');
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      req.session.errorMessage = 'Invalid email or password.';
      return res.redirect('/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.session.errorMessage = 'Invalid email or password.';
      return res.redirect('/login');
    }

    const oldSessionId = req.sessionID;
    const returnTo = req.session.returnTo || (user.role === 'admin' ? '/admin' : '/');

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate(async (err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.redirect('/login');
      }

      req.session.userId = user._id;
      req.session.successMessage = `Welcome back, ${user.name}!`;

      // Merge guest cart into user cart
      await mergeGuestCart(oldSessionId, user._id);

      req.session.save(() => {
        res.redirect(returnTo);
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    req.session.errorMessage = 'An error occurred during sign in. Please try again.';
    res.redirect('/login');
  }
};

// GET /register
exports.getRegister = (req, res) => {
  res.render('pages/register', {
    pageTitle: 'Create Account - eKart',
    name: '',
    email: ''
  });
};

// POST /register
exports.postRegister = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    req.session.errorMessage = 'All fields are required.';
    return res.render('pages/register', {
      pageTitle: 'Create Account - eKart',
      name: name || '',
      email: email || '',
      errorMessage: 'All fields are required.'
    });
  }

  if (password.length < 6) {
    return res.render('pages/register', {
      pageTitle: 'Create Account - eKart',
      name,
      email,
      errorMessage: 'Password must be at least 6 characters long.'
    });
  }

  if (password !== confirmPassword) {
    return res.render('pages/register', {
      pageTitle: 'Create Account - eKart',
      name,
      email,
      errorMessage: 'Passwords do not match.'
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.render('pages/register', {
        pageTitle: 'Create Account - eKart',
        name,
        email,
        errorMessage: 'An account with this email address already exists. Please sign in.'
      });
    }

    // Role is strictly defaulted to 'user' for public registration
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      role: 'user'
    });

    await user.save();

    const oldSessionId = req.sessionID;

    // Regenerate session and log user in immediately
    req.session.regenerate(async (err) => {
      if (err) {
        console.error('Session regeneration error on register:', err);
        return res.redirect('/login');
      }

      req.session.userId = user._id;
      req.session.successMessage = `Welcome to eKart, ${user.name}! Your account has been created.`;

      // Merge guest cart if any
      await mergeGuestCart(oldSessionId, user._id);

      req.session.save(() => {
        res.redirect('/account');
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.render('pages/register', {
      pageTitle: 'Create Account - eKart',
      name,
      email,
      errorMessage: error.message || 'Registration failed. Please try again.'
    });
  }
};

// GET /logout
exports.getLogout = (req, res) => {
  const sessionName = process.env.SESSION_NAME || 'ekart.sid';
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.clearCookie(sessionName);
    res.redirect('/');
  });
};

// GET /account
exports.getAccount = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const recentOrders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.render('pages/account', {
      pageTitle: 'My Account - eKart',
      user,
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    req.session.errorMessage = 'Could not load account details.';
    res.redirect('/');
  }
};

// POST /account/profile
exports.updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  try {
    await User.findByIdAndUpdate(req.session.userId, {
      name: name.trim(),
      phone: phone ? phone.trim() : ''
    }, { runValidators: true });

    req.session.successMessage = 'Profile updated successfully.';
    res.redirect('/account');
  } catch (error) {
    req.session.errorMessage = error.message || 'Failed to update profile.';
    res.redirect('/account');
  }
};

// POST /account/address
exports.addAddress = async (req, res) => {
  const { street, city, state, postalCode, country, isDefault } = req.body;
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect('/login');

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country ? country.trim() : 'India',
      isDefault: Boolean(isDefault) || user.addresses.length === 0
    });

    await user.save();
    req.session.successMessage = 'Address added successfully.';
    res.redirect('/account');
  } catch (error) {
    req.session.errorMessage = error.message || 'Failed to add address.';
    res.redirect('/account');
  }
};

// POST /account/address/:addressId/delete
exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect('/login');

    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== req.params.addressId
    );

    if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    req.session.successMessage = 'Address deleted successfully.';
    res.redirect('/account');
  } catch (error) {
    req.session.errorMessage = 'Failed to delete address.';
    res.redirect('/account');
  }
};
