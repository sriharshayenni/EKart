const ensureAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  if (!req.user) {
    req.session.returnTo = req.originalUrl;
    req.session.errorMessage = 'Administrative access requires sign-in.';
    return res.redirect('/login');
  }

  res.status(403).render('pages/404', {
    pageTitle: '403 - Forbidden Access',
    customMessage: 'Access denied: You do not have administrative privileges to view this section.'
  });
};

module.exports = { ensureAdmin };
