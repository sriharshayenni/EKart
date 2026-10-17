const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');

// GET / - Homepage
exports.getHome = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ isFeatured: -1, name: 1 });
    
    // Featured products
    const featuredProducts = await Product.find({ active: true, isFeatured: true })
      .populate('category')
      .limit(8);

    // Trending products
    const trendingProducts = await Product.find({ active: true, isTrending: true })
      .populate('category')
      .limit(8);

    // New Arrivals
    const newArrivals = await Product.find({ active: true, isNewArrival: true })
      .populate('category')
      .sort({ createdAt: -1 })
      .limit(8);

    // Best Deals / Discounted products
    const bestDeals = await Product.find({ active: true, discountPercentage: { $gt: 10 } })
      .populate('category')
      .sort({ discountPercentage: -1 })
      .limit(8);

    res.render('pages/home', {
      pageTitle: 'eKart - Premium Online Shopping Platform',
      categories,
      featuredProducts,
      trendingProducts,
      newArrivals,
      bestDeals
    });
  } catch (error) {
    next(error);
  }
};

// GET /products - Product Listing with Search, Filter, Sort, Pagination
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category: categorySlug,
      minPrice,
      maxPrice,
      inStock,
      rating,
      sort,
      page = 1
    } = req.query;

    const limit = 12;
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const filter = { active: true };

    // Search query
    if (search && search.trim()) {
      const cleanSearch = search.trim();
      filter.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { description: { $regex: cleanSearch, $options: 'i' } },
        { brand: { $regex: cleanSearch, $options: 'i' } },
        { tags: { $regex: cleanSearch, $options: 'i' } }
      ];
    }

    // Category filter
    let selectedCategory = null;
    if (categorySlug && categorySlug !== 'all') {
      selectedCategory = await Category.findOne({ slug: categorySlug });
      if (selectedCategory) {
        filter.category = selectedCategory._id;
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice && !isNaN(minPrice)) filter.price.$gte = Number(minPrice);
      if (maxPrice && !isNaN(maxPrice)) filter.price.$lte = Number(maxPrice);
    }

    // In stock filter
    if (inStock === 'true' || inStock === '1') {
      filter.stock = { $gt: 0 };
    }

    // Rating filter
    if (rating && !isNaN(rating)) {
      filter['rating.average'] = { $gte: Number(rating) };
    }

    // Sorting options
    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { 'rating.average': -1 };
    else if (sort === 'popular') sortOption = { isTrending: -1, 'rating.count': -1 };
    else if (sort === 'discount') sortOption = { discountPercentage: -1 };

    // Execute paginated query
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    const skip = (currentPage - 1) * limit;

    const products = await Product.find(filter)
      .populate('category')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    // Fetch all categories for sidebar filter
    const categories = await Category.find().sort({ name: 1 });

    res.render('pages/products', {
      pageTitle: selectedCategory ? `${selectedCategory.name} - eKart` : 'Explore Products - eKart',
      products,
      categories,
      selectedCategory,
      totalProducts,
      totalPages,
      currentPage,
      query: req.query
    });
  } catch (error) {
    next(error);
  }
};

// GET /products/:slug - Product Detail Page
exports.getProductDetails = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Support both slug and ObjectId
    let product;
    if (slug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(slug).populate('category');
    } else {
      product = await Product.findOne({ slug, active: true }).populate('category');
    }

    if (!product) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Product Not Found - eKart',
        customMessage: 'The product you are looking for does not exist or is no longer available.'
      });
    }

    // Fetch related products
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      active: true
    }).limit(4);

    // Fetch product reviews
    const reviews = await Review.find({ product: product._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Check if current user has already reviewed
    let userHasReviewed = false;
    if (req.user) {
      userHasReviewed = reviews.some(
        r => r.user && r.user._id && r.user._id.toString() === req.user._id.toString()
      );
    }

    res.render('pages/product-details', {
      pageTitle: `${product.name} - eKart`,
      product,
      relatedProducts,
      reviews,
      userHasReviewed
    });
  } catch (error) {
    next(error);
  }
};

// POST /products/:id/review - Add Product Review
exports.addReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    const productId = req.params.id;

    if (!rating || !comment) {
      req.session.errorMessage = 'Please provide a rating and review text.';
      return res.redirect('back');
    }

    const numericRating = Math.min(5, Math.max(1, parseInt(rating, 10)));

    // Upsert or create review
    await Review.findOneAndUpdate(
      { user: req.user._id, product: productId },
      {
        rating: numericRating,
        title: title ? title.trim() : '',
        comment: comment.trim(),
        verifiedPurchase: true
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Recalculate product rating
    const allReviews = await Review.find({ product: productId });
    const count = allReviews.length;
    const average = (allReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1);

    await Product.findByIdAndUpdate(productId, {
      'rating.average': Number(average),
      'rating.count': count
    });

    req.session.successMessage = 'Your review has been submitted. Thank you for your feedback!';
    res.redirect('back');
  } catch (error) {
    console.error('Review submission error:', error);
    req.session.errorMessage = 'Failed to submit review.';
    res.redirect('back');
  }
};
