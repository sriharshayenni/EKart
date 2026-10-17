# eKart — Full-Stack E-Commerce Web Application

![eKart Banner](/images/banners/hero_banner.jpg)

**eKart** is a modern, full-stack, commercial-grade e-commerce web application built strictly with **Node.js, Express.js, EJS templates, Plain CSS, Vanilla JavaScript, and MongoDB with Mongoose**.

It features an end-to-end shopping experience inspired by leading online stores, with stateful MongoDB-backed session authentication, guest cart merging, server-side stock and price validation, complete checkout, customer order management, product review mechanisms, and a role-protected administrator dashboard.

---

## 🚀 Key Features

### 🛒 Consumer Shopping Experience
- **Interactive Sticky Header**: Dynamic announcement banner, search input with instant query submission, category shortcuts, live cart badge counter, live wishlist badge counter, and authenticated user dropdown.
- **Dynamic Homepage (`/`)**: Rich hero banner, trust proposition strip (Express delivery, 100% genuine, 7-day returns, 24/7 care), handpicked category showcase, trending products, promotional mini-banners, new arrivals, and limited-time deals of the day.
- **Product Catalog & Filters (`/products`)**:
  - Live search across product names, descriptions, brands, and tags.
  - Multi-faceted sidebar filtering by category, numeric price ranges (min & max), in-stock availability, and customer star ratings.
  - Sorting options: Price (Low to High / High to Low), Customer Rating, Most Popular, Newest Arrivals, and Discount Percentage.
  - Server-side pagination with sanitized query parameters and empty states.
- **Product Details (`/products/:slug`)**:
  - Multi-angle thumbnail image gallery with instant interactive switcher.
  - Live stock indicators (In Stock / Low Stock / Out of Stock).
  - Quantity selector stepper (+ / -).
  - AJAX-powered "Add to Cart" and "Add to Wishlist" with animated toast notifications.
  - Product specifications table and full description tabs.
  - Customer review submission form and verified reviews listing.
  - Related products recommendation carousel/grid.
- **Persistent Shopping Cart (`/cart`)**:
  - Supports both **guest sessions** (via `sessionId`) and **authenticated users** (via `User` reference).
  - Guest carts seamlessly merge into user carts upon login or registration.
  - Real-time quantity increment/decrement with instant subtotal and tax updates.
  - Server-side stock verification preventing purchase of sold-out quantities.
  - Free shipping progress threshold indicator (e.g., Free delivery over ₹1,000).
- **Checkout & Order Placement (`/checkout`)**:
  - Shipping address form with optional single-click address book saving.
  - Mock payment methods: Credit / Debit Card (Simulation), UPI / QR Code (Simulation), and Cash on Delivery (COD).
  - **Server-Side Price & Stock Re-Validation**: Prices and stock are re-queried directly from MongoDB at checkout time, completely ignoring client-submitted numbers to prevent manipulation.
  - Stock auto-deduction upon successful checkout.
  - Generation of unique, formatted order numbers (`EK-YYYYMMDD-XXXX`).
- **Customer Order Management (`/orders`, `/orders/:id`)**:
  - Full order history with order dates, totals, and fulfillment status pills.
  - Detailed receipt with purchase-time price snapshots and delivery addresses.
  - Visual 4-stage delivery timeline tracker (Pending &rarr; Processing &rarr; Shipped &rarr; Delivered).
  - One-click customer order cancellation for Pending orders (automatically restores inventory).
  - Strict backend ownership validation preventing unauthorized access to other customers' orders.
- **Wishlist (`/wishlist`)**:
  - Persistent favorite items stored in MongoDB.
  - Single-click "Move to Cart" button.
- **Static & Informational Pages**:
  - About Us (`/about`), Contact Us (`/contact` with validated message storage), FAQs (`/faq`), Privacy Policy (`/privacy`), Terms of Service (`/terms`), custom branded 404 and 500 error templates.

---

### 🛡️ Administrative Console (`/admin`)
Accessible only to authenticated users with `role: 'admin'`:
- **Executive Dashboard**: Real-time sales metrics (Total Revenue, Total Orders, Total Live Products, Total Registered Users), low stock inventory alerts, and recent orders.
- **Product Management (`/admin/products`)**: Filter by category/search, create new products with specifications, edit prices/inventory, toggle active status, and delete products.
- **Category Management (`/admin/categories`)**: Add, edit, or delete categories with active product count safeguards.
- **Order Management (`/admin/orders`)**: View all orders, filter by status, update fulfillment state (Pending &rarr; Processing &rarr; Shipped &rarr; Delivered &rarr; Cancelled), and append administrative status logs.
- **User Directory (`/admin/users`)**: Search user records, inspect roles, and promote/demote users with protection against self-demotion.

---

### 🔒 Application Security & Stateful Sessions
- **Session-Based Authentication**: Built with `express-session` and `connect-mongo`, storing active sessions securely in MongoDB collections.
- **Session Fixation Defense**: Calls `req.session.regenerate()` upon successful authentication to invalidate prior guest session identifiers.
- **Password Security**: Passwords are encrypted with `bcryptjs` using a salted work factor (configurable via `BCRYPT_ROUNDS=12`) in Mongoose pre-save hooks. Raw passwords are never returned in JSON or EJS views.
- **Role-Based Access Control (RBAC)**: Enforced via `ensureAuthenticated` and `ensureAdmin` middleware at the route level. Public registration strictly defaults to `role: 'user'`.
- **Security Headers & Sanitization**: Configured with `helmet` for CSP, XSS protection, MIME-type sniffing defense, and frameguard protection.
- **Rate Limiting**: `express-rate-limit` guards login, registration, and form submission endpoints against brute-force attacks.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Runtime** | Node.js (v18.0.0+) |
| **Backend Framework** | Express.js (v4.x) |
| **View Engine** | EJS (Embedded JavaScript Templates) |
| **Styling** | Vanilla Plain CSS (Custom Design System in `public/css/style.css`, `responsive.css`, `admin.css`) |
| **Client Interactivity** | Vanilla JavaScript (`main.js`, `cart.js`, `product.js`) |
| **Database** | MongoDB with Mongoose ODM (v8.x) |
| **Session Store** | `connect-mongo` (MongoDB-backed server sessions) |
| **Security & Auth** | `express-session`, `bcryptjs`, `helmet`, `express-rate-limit` |
| **Environment Config** | `dotenv` |

---

## 📂 Project Architecture

```
ekart/
├── config/
│   └── database.js               # Mongoose connection with resilient dev/test fallback
├── controllers/
│   ├── authController.js         # Register, Login, Logout, Profile, Addresses, Cart Merge
│   ├── productController.js      # Catalog listing, Search, Filters, Detail view, Reviews
│   ├── cartController.js         # Guest & User Cart operations, AJAX updates, stock checks
│   ├── orderController.js        # Checkout, Stock validation, Order creation & tracking
│   ├── wishlistController.js     # User wishlist persistence and move-to-cart
│   ├── pageController.js         # About, Contact, FAQ, Policies, Newsletter
│   └── adminController.js        # Admin metrics, Product/Category CRUD, Order status
├── middleware/
│   ├── authMiddleware.js         # Session validation & global res.locals view variables
│   ├── adminMiddleware.js        # Strict role === 'admin' authorization check
│   ├── validationMiddleware.js   # Rate limiting & form input validation
│   └── errorMiddleware.js        # 404 Not Found & centralized 500 error handler
├── models/
│   ├── User.js                   # Name, Email, Bcrypt password, Role, Addresses, Wishlist
│   ├── Product.js                # Specs, Prices, Auto-discount, Stock, Rating, Category ref
│   ├── Category.js               # Name, Slug, Description, Image, Featured status
│   ├── Cart.js                   # User/Session Cart items with quantity & product ref
│   ├── Order.js                  # Order number, item snapshot, delivery, payment, status
│   ├── Review.js                 # User, Product, Star rating (1-5), comments
│   ├── ContactMessage.js         # Submitted contact form messages
│   └── Newsletter.js             # Email newsletter subscriptions
├── routes/
│   ├── authRoutes.js             # /login, /register, /logout, /account
│   ├── productRoutes.js          # /, /products, /products/:slug, /products/:id/review
│   ├── cartRoutes.js             # /cart, /cart/add, /cart/update, /cart/remove, /cart/clear
│   ├── orderRoutes.js            # /checkout, /orders, /orders/:id, /orders/:id/cancel
│   ├── wishlistRoutes.js         # /wishlist, /wishlist/toggle, /wishlist/move-to-cart
│   ├── pageRoutes.js             # /about, /contact, /faq, /privacy, /terms, /newsletter
│   └── adminRoutes.js            # /admin, /admin/products, /admin/categories, /admin/orders, /admin/users
├── utils/
│   └── generateOrderNumber.js    # Unique commercial order number generator (EK-YYYYMMDD-XXXX)
├── views/
│   ├── partials/
│   │   ├── header.ejs            # Head meta, fonts, stylesheets
│   │   ├── navbar.ejs            # Announcement bar, logo, search, cart/wishlist counters
│   │   ├── footer.ejs            # 4-column footer, newsletter, copyright, scripts
│   │   └── product-card.ejs      # Reusable product card component
│   ├── pages/
│   │   ├── home.ejs              # Hero banner, categories, trending, deals, new arrivals
│   │   ├── products.ejs          # Catalog with sidebar filters, sorting, and pagination
│   │   ├── product-details.ejs   # Gallery, specs, reviews, add-to-cart, related items
│   │   ├── cart.ejs              # Itemized cart, quantity stepper, price breakdown
│   │   ├── checkout.ejs          # Address selection, payment simulation, place order
│   │   ├── orders.ejs            # User order history
│   │   ├── order-details.ejs     # Order receipt, tracking timeline, cancellation
│   │   ├── wishlist.ejs          # Saved items grid
│   │   ├── login.ejs             # User login form with show/hide password
│   │   ├── register.ejs          # User registration form with validation
│   │   ├── account.ejs           # Profile editing & address book manager
│   │   ├── about.ejs             # Company profile & architecture
│   │   ├── contact.ejs           # Contact form & support channels
│   │   ├── faq.ejs               # Frequently asked questions
│   │   ├── privacy.ejs           # Privacy policy
│   │   ├── terms.ejs             # Terms and conditions
│   │   ├── 404.ejs               # Branded 404 page
│   │   └── 500.ejs               # Branded 500 error page
│   └── admin/
│       ├── sidebar.ejs           # Admin navigation sidebar
│       ├── dashboard.ejs         # Overview metrics, low stock, recent orders
│       ├── products.ejs          # Products table with filters & pagination
│       ├── product-form.ejs      # Create & Edit product form with specs rows
│       ├── categories.ejs        # Categories list & creation form
│       ├── orders.ejs            # Order management & status filter
│       ├── order-details.ejs     # Detailed order inspector & status updater
│       └── users.ejs             # User directory & role promotion/demotion
├── public/
│   ├── css/
│   │   ├── style.css             # Core design system tokens, typography, components
│   │   ├── responsive.css        # Responsive layouts for mobile, tablet, and desktop
│   │   └── admin.css             # Admin dashboard tables, stat cards, and sidebar
│   ├── js/
│   │   ├── main.js               # Global toast alerts, password toggle, newsletter
│   │   ├── cart.js               # AJAX quantity updates, line subtotal recalculation
│   │   └── product.js            # Image gallery switcher, tabs, wishlist toggle
│   └── images/
│       ├── placeholder.svg       # Clean SVG image fallback
│       ├── banners/              # Hero banners and promotional imagery
│       └── categories/           # Category illustrations
├── scripts/
│   ├── seedDatabase.js           # Idempotent database seeder (7 categories, 17+ products)
│   ├── createAdmin.js            # Secure CLI script to create/promote admin accounts
│   └── testSuite.js              # 21 automated integration & end-to-end tests
├── .env.example                  # Environment variable reference
├── .gitignore                    # Excludes node_modules, .env, and logs
├── app.js                        # Express app factory with Helmet, sessions, routes
├── server.js                     # HTTP server startup with auto-seed and graceful shutdown
└── package.json                  # Scripts and dependencies
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- **Node.js**: Version 18.0.0 or higher (`node -v`)
- **npm**: Version 9.0.0 or higher (`npm -v`)
- **MongoDB**: Either a local MongoDB instance running on `mongodb://127.0.0.1:27017` OR a MongoDB Atlas cloud URI. *(If running locally without MongoDB installed, an embedded in-memory MongoDB will automatically start up in development mode).*

### 2. Clone and Install Dependencies
```bash
git clone <repository-url>
cd ekart
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Review or edit your `.env` settings:
```env
PORT=5000
NODE_ENV=development

# MongoDB Connection String (Atlas or Local)
MONGODB_URI=mongodb://127.0.0.1:27017/ekart

# Session Security
SESSION_SECRET=your_super_secret_session_key_minimum_32_characters
SESSION_NAME=ekart.sid
SESSION_MAX_AGE=86400000

# Password Hash Work Factor
BCRYPT_ROUNDS=12
```

---

## 📦 Database Seeding & Administrator Setup

### Seed Initial Categories and Products
Populate the database with 7 realistic categories, 17 commercial products with specifications, prices, discounts, and initial reviews:
```bash
npm run seed
```

### Create or Promote an Administrator
To create a dedicated administrator or promote an existing account, run the CLI utility:
```bash
node scripts/createAdmin.js --name "Admin Name" --email "admin@ekart.com" --password "YourStrongPassword123"
```
Or use environment variables:
```bash
ADMIN_NAME="Site Administrator" ADMIN_EMAIL="admin@ekart.com" ADMIN_PASSWORD="Password123" npm run create-admin
```

> **Default Seed Administrator**: When `server.js` first boots an empty database, it creates a default administrator:
> - **Email**: `admin@ekart.com`
> - **Password**: `Admin@123456`

---

## 🏃 Running the Application

### Start Development Server
```bash
npm start
```
Or with auto-reload:
```bash
npm run dev
```

The application will be live at:
- **Storefront**: [http://localhost:5000](http://localhost:5000)
- **User Login**: [http://localhost:5000/login](http://localhost:5000/login)
- **Admin Console**: [http://localhost:5000/admin](http://localhost:5000/admin)

---

## 🧪 Running the Automated Test Suite

The project includes an end-to-end integration and unit test suite covering 21 comprehensive test scenarios:
```bash
npm test
```

### Test Coverage Highlights
1. **Database & Models**: Mongoose connection, embedded fallback, model constraints, and discount pre-validate calculation.
2. **Catalog & Search**: Homepage rendering, catalog search, category filtering, sorting, pagination, and product detail views.
3. **Authentication & Security**: Registration, duplicate email rejection, bcrypt hash verification, login with invalid password rejection, session fixation defense, and session invalidation on logout.
4. **Access Control**: Unauthenticated redirects to `/login`, non-admin 403 Forbidden on `/admin`, and administrator access verification.
5. **Cart Operations**: Adding items, stock limit validation, rejecting excess quantities, and cart total calculation.
6. **Checkout & Business Logic**: Server-side price recalculation, order creation with unique order numbers, stock inventory reduction, and customer order history.
7. **Wishlist**: Toggling items in/out of the user's wishlist in MongoDB.
8. **Informational & Error Pages**: `/about`, `/contact`, `/faq`, `/privacy`, `/terms`, and 404 handlers.

---

## 🚀 Production Deployment Considerations

When deploying eKart to production (e.g., Render, Railway, AWS EC2, or DigitalOcean):
1. **Set `NODE_ENV=production`**:
   - Enables `cookie.secure: true` (ensuring session cookies only transmit via HTTPS).
   - Suppresses error stack traces on 500 error pages.
2. **Provide a Production `MONGODB_URI`**:
   - Connect to MongoDB Atlas with TLS enabled.
3. **Use a Strong `SESSION_SECRET`**:
   - Generate a random 64-character hex string.
4. **Reverse Proxy (Nginx / Cloudflare)**:
   - Configure `app.set('trust proxy', 1)` in `app.js` if running behind an SSL-terminating reverse proxy.
5. **Asset Caching**:
   - Serve static assets in `public/` through a CDN or configure `Cache-Control` headers.

---

## 📄 License
This project is licensed under the MIT License.
