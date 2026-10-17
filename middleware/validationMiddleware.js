const rateLimit = require('express-rate-limit');

// Rate limiter for authentication routes (login / register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    req.session.errorMessage = options.message;
    res.status(429).redirect('/login');
  }
});

// General API / Form submission rate limiter
const actionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  actionLimiter
};
