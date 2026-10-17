const notFoundHandler = (req, res, next) => {
  res.status(404).render('pages/404', {
    pageTitle: 'Page Not Found - eKart',
    customMessage: `The page you requested (${req.originalUrl}) could not be found.`
  });
};

const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    return res.status(404).render('pages/404', {
      pageTitle: 'Resource Not Found - eKart',
      customMessage: 'The requested item or product ID could not be found.'
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    req.session.errorMessage = messages.join(', ');
    return res.redirect('back');
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `An entry with this ${field} already exists.`;
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(400).json({ success: false, message });
    }
    req.session.errorMessage = message;
    return res.redirect('back');
  }

  const statusCode = err.status || 500;
  res.status(statusCode).render('pages/500', {
    pageTitle: 'Server Error - eKart',
    errorMessage: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong on our servers. Our team has been notified.',
    errorStack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
};

module.exports = { notFoundHandler, errorHandler };
