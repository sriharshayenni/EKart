const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const methodOverride = require('method-override');

const { setUserLocals } = require('./middleware/authMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const pageRoutes = require('./routes/pageRoutes');
const adminRoutes = require('./routes/adminRoutes');

function createApp() {
  const app = express();

  // Template engine setup
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // Security Headers (Helmet) with Google Fonts & local assets allowed
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
          imgSrc: ["'self'", "data:", "https:", "http:"],
          connectSrc: ["'self'"]
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );

  // Request logger
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride('_method'));

  // Static Assets
  app.use(express.static(path.join(__dirname, 'public')));

  // Session configuration with connect-mongo
  const sessionSecret = process.env.SESSION_SECRET || 'ekart-fallback-secret-key-32-chars-long!';
  const sessionName = process.env.SESSION_NAME || 'ekart.sid';
  const sessionMaxAge = parseInt(process.env.SESSION_MAX_AGE, 10) || 24 * 60 * 60 * 1000;

  // Use active mongoose connection client for MongoStore
  const store = MongoStore.create({
    client: mongoose.connection.getClient(),
    collectionName: 'sessions',
    ttl: sessionMaxAge / 1000,
    autoRemove: 'native'
  });

  app.use(
    session({
      name: sessionName,
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: store,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: sessionMaxAge
      }
    })
  );

  // Global locals middleware (currentUser, cartCount, wishlistCount, etc.)
  app.use(setUserLocals);

  // Mount Application Routes
  app.use('/', productRoutes);
  app.use('/', authRoutes);
  app.use('/', cartRoutes);
  app.use('/', orderRoutes);
  app.use('/', wishlistRoutes);
  app.use('/', pageRoutes);
  app.use('/admin', adminRoutes);

  // Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
