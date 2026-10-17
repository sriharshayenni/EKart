const ContactMessage = require('../models/ContactMessage');
const Newsletter = require('../models/Newsletter');

exports.getAbout = (req, res) => {
  res.render('pages/about', {
    pageTitle: 'About Us - eKart'
  });
};

exports.getContact = (req, res) => {
  res.render('pages/contact', {
    pageTitle: 'Contact Support - eKart',
    name: '',
    email: '',
    subject: '',
    message: ''
  });
};

exports.postContact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    req.session.errorMessage = 'Please complete all required fields.';
    return res.render('pages/contact', {
      pageTitle: 'Contact Support - eKart',
      name: name || '',
      email: email || '',
      subject: subject || '',
      message: message || '',
      errorMessage: 'Please complete all required fields.'
    });
  }

  try {
    await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim()
    });

    req.session.successMessage = 'Thank you! Your message has been received. Our team will contact you shortly.';
    res.redirect('/contact');
  } catch (error) {
    console.error('Contact message error:', error);
    req.session.errorMessage = 'Failed to submit your message. Please try again.';
    res.redirect('/contact');
  }
};

exports.getFaq = (req, res) => {
  res.render('pages/faq', {
    pageTitle: 'Frequently Asked Questions - eKart'
  });
};

exports.getPrivacy = (req, res) => {
  res.render('pages/privacy', {
    pageTitle: 'Privacy Policy - eKart'
  });
};

exports.getTerms = (req, res) => {
  res.render('pages/terms', {
    pageTitle: 'Terms & Conditions - eKart'
  });
};

exports.subscribeNewsletter = async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    req.session.errorMessage = 'Please enter a valid email address.';
    return res.redirect('back');
  }

  try {
    await Newsletter.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { email: email.trim().toLowerCase() },
      { upsert: true, new: true }
    );

    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({ success: true, message: 'Thank you for subscribing to eKart updates!' });
    }

    req.session.successMessage = 'Thank you for subscribing to eKart updates!';
    res.redirect('back');
  } catch (error) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(500).json({ success: false, message: 'Subscription failed.' });
    }
    req.session.errorMessage = 'Subscription failed. Please try again.';
    res.redirect('back');
  }
};
