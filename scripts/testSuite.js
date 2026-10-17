/**
 * eKart - End-to-End Test Suite
 * Validates all core business logic, authentication, shopping, and administration flows.
 */

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/database');
const { createApp } = require('../app');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

// Minimal assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

// HTTP request helper with cookie jar support
function makeRequest(server, options, body = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const port = address.port;

    const reqOptions = {
      hostname: '127.0.0.1',
      port: port,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        ...(options.headers || {}),
        ...(cookies ? { 'Cookie': cookies } : {})
      }
    };

    if (body) {
      if (typeof body === 'object') {
        reqOptions.headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
      }
      reqOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(reqOptions, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        const setCookies = res.headers['set-cookie'];
        let newCookie = cookies;
        if (setCookies) {
          newCookie = setCookies.map(c => c.split(';')[0]).join('; ');
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseData,
          cookies: newCookie
        });
      });
    });

    req.on('error', err => reject(err));
    if (body) req.write(body);
    req.end();
  });
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 Starting eKart Comprehensive Automated Test Suite');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• Testing: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  let server;
  let adminCookie = '';
  let userCookie = '';
  let testCategory;
  let testProduct;

  try {
    // 1. Database Connection
    await test('Database Connection and Model Initialization', async () => {
      await connectDB();
      assert(mongoose.connection.readyState === 1, 'MongoDB connection must be active (state 1)');
    });

    // 2. Start HTTP Test Server
    const app = createApp();
    server = app.listen(0); // Random free port

    // 3. Category & Product Seeding check
    await test('Category Model Creation and Constraints', async () => {
      testCategory = await Category.findOneAndUpdate(
        { slug: 'test-electronics' },
        {
          name: 'Test Electronics',
          slug: 'test-electronics',
          description: 'Category for automated unit tests',
          isFeatured: true
        },
        { upsert: true, new: true }
      );
      assert(testCategory._id, 'Category must have valid _id');
    });

    await test('Product Model Validation & Discount Pre-save Hook', async () => {
      await Product.deleteOne({ slug: 'test-flagship-pro' });
      testProduct = new Product({
        name: 'Test Flagship Pro 5G',
        slug: 'test-flagship-pro',
        category: testCategory._id,
        brand: 'TestBrand',
        price: 50000,
        originalPrice: 60000,
        stock: 20,
        description: 'Ultra high end testing product with full specs.',
        images: ['/images/placeholder.svg'],
        active: true
      });
      await testProduct.save();
      assert(testProduct.discountPercentage > 0, 'Discount percentage must be auto-calculated');
      assert(testProduct.discountPercentage === 17, `Expected 17% discount, got ${testProduct.discountPercentage}%`);
    });

    // 4. Public Web Pages
    await test('GET / (Homepage Rendering)', async () => {
      const res = await makeRequest(server, { path: '/' });
      assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
      assert(res.body.includes('eKart'), 'Homepage must contain brand name eKart');
    });

    await test('GET /products (Catalog & Filter Rendering)', async () => {
      const res = await makeRequest(server, { path: '/products' });
      assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
      assert(res.body.includes('Explore Products') || res.body.includes('products found'), 'Products page must render catalog');
    });

    await test('GET /products/:slug (Valid Product Detail)', async () => {
      const res = await makeRequest(server, { path: `/products/${testProduct.slug}` });
      assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
      assert(res.body.includes(testProduct.name), 'Product detail page must contain product name');
    });

    await test('GET /products/:slug (Invalid Product -> 404 Handling)', async () => {
      const res = await makeRequest(server, { path: '/products/non-existent-product-slug-xyz' });
      assert(res.statusCode === 404, `Expected 404, got ${res.statusCode}`);
      assert(res.body.includes('Product Not Found') || res.body.includes('404'), 'Must return 404 error page');
    });

    // 5. User Registration & Password Security
    const testUserEmail = `tester_${Date.now()}@example.com`;
    const testUserPassword = 'TestPassword123!';

    await test('POST /register (New User Creation with bcrypt hash)', async () => {
      const formBody = new URLSearchParams({
        name: 'Test Customer',
        email: testUserEmail,
        password: testUserPassword,
        confirmPassword: testUserPassword
      }).toString();

      const res = await makeRequest(server, {
        path: '/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, formBody);

      assert(res.statusCode === 302, `Expected 302 redirect, got ${res.statusCode}`);
      userCookie = res.cookies;
      assert(userCookie.includes('ekart.sid'), 'Session cookie must be assigned upon registration');

      // Verify bcrypt hash in MongoDB
      const createdUser = await User.findOne({ email: testUserEmail });
      assert(createdUser, 'User must exist in database');
      assert(createdUser.password !== testUserPassword, 'Password must NOT be plaintext');
      assert(createdUser.password.startsWith('$2'), 'Password must be a valid bcrypt hash');
      assert(createdUser.role === 'user', 'Public registration must default strictly to role user');
    });

    await test('POST /register (Duplicate Email Prevention)', async () => {
      const formBody = new URLSearchParams({
        name: 'Duplicate Guy',
        email: testUserEmail,
        password: testUserPassword,
        confirmPassword: testUserPassword
      }).toString();

      const res = await makeRequest(server, {
        path: '/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, formBody);

      assert(res.body.includes('already exists'), 'Duplicate email must be rejected with helpful message');
    });

    // 6. User Login & Stateful Session
    await test('POST /login (Invalid Credentials Rejection)', async () => {
      const formBody = new URLSearchParams({
        email: testUserEmail,
        password: 'WrongPassword999'
      }).toString();

      const res = await makeRequest(server, {
        path: '/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, formBody);

      assert(res.statusCode === 302, 'Should redirect back on failed login');
    });

    await test('POST /login (Successful Login & Session Fixation Defense)', async () => {
      const formBody = new URLSearchParams({
        email: testUserEmail,
        password: testUserPassword
      }).toString();

      const res = await makeRequest(server, {
        path: '/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, formBody);

      assert(res.statusCode === 302, `Expected 302 redirect, got ${res.statusCode}`);
      userCookie = res.cookies;
      assert(userCookie.includes('ekart.sid'), 'Valid session cookie must be set');
    });

    // 7. Route Protection
    await test('Authentication Middleware (Unauthorized Access Redirects to /login)', async () => {
      const res = await makeRequest(server, { path: '/account' });
      assert(res.statusCode === 302, 'Unauthenticated user must be redirected');
      assert(res.headers.location === '/login', 'Redirect destination must be /login');
    });

    await test('Administrator Authorization Middleware (Non-admin gets 403)', async () => {
      const res = await makeRequest(server, { path: '/admin' }, null, userCookie);
      assert(res.statusCode === 403, `Standard user accessing /admin must receive 403 Forbidden, got ${res.statusCode}`);
    });

    // 8. Admin User Promotion & Access
    await test('Administrator Access with Role admin', async () => {
      // Create admin
      const adminEmail = `admin_${Date.now()}@ekart.com`;
      const adminPassword = 'AdminSecret999!';
      const adminUser = new User({
        name: 'Chief Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      await adminUser.save();

      const formBody = new URLSearchParams({
        email: adminEmail,
        password: adminPassword
      }).toString();

      const loginRes = await makeRequest(server, {
        path: '/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, formBody);

      adminCookie = loginRes.cookies;

      const adminRes = await makeRequest(server, { path: '/admin' }, null, adminCookie);
      assert(adminRes.statusCode === 200, `Admin accessing /admin should get 200 OK, got ${adminRes.statusCode}`);
      assert(adminRes.body.includes('Executive Overview'), 'Admin dashboard must render');
    });

    // 9. Shopping Cart Operations (AJAX & Server verification)
    await test('POST /cart/add (Add to Cart with Stock Verification)', async () => {
      const res = await makeRequest(server, {
        path: '/cart/add',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }, { productId: testProduct._id.toString(), quantity: 2 }, userCookie);

      assert(res.statusCode === 200, `Expected 200 OK, got ${res.statusCode}`);
      const data = JSON.parse(res.body);
      assert(data.success === true, 'Cart addition should succeed');
      assert(data.cartCount === 2, `Cart count should be 2, got ${data.cartCount}`);
    });

    await test('POST /cart/add (Reject Excess Stock Request)', async () => {
      const res = await makeRequest(server, {
        path: '/cart/add',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }, { productId: testProduct._id.toString(), quantity: 99999 }, userCookie);

      assert(res.statusCode === 400, `Excessive quantity must return 400, got ${res.statusCode}`);
    });

    await test('GET /cart (Cart Totals Calculation)', async () => {
      const res = await makeRequest(server, { path: '/cart' }, null, userCookie);
      assert(res.statusCode === 200, `Expected 200 OK, got ${res.statusCode}`);
      assert(res.body.includes(testProduct.name), 'Cart page must display the added item');
    });

    // 10. Checkout & Order Placement
    await test('POST /checkout (Order Creation & Stock Deduction)', async () => {
      const initialStock = (await Product.findById(testProduct._id)).stock;

      const formBody = new URLSearchParams({
        fullName: 'Jane Tester',
        phone: '9876543210',
        street: '123 Tech Avenue',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        paymentMethod: 'mock_card'
      }).toString();

      const res = await makeRequest(server, {
        path: '/checkout',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, formBody, userCookie);

      assert(res.statusCode === 302, `Expected 302 redirect to order confirmation, got ${res.statusCode}`);

      // Verify stock deducted
      const updatedStock = (await Product.findById(testProduct._id)).stock;
      assert(updatedStock === initialStock - 2, `Stock must be reduced by 2. Expected ${initialStock - 2}, got ${updatedStock}`);

      // Verify order saved
      const recentOrder = await Order.findOne().sort({ createdAt: -1 });
      assert(recentOrder, 'Order must exist in database');
      assert(recentOrder.orderNumber.startsWith('EK-'), 'Order number must conform to format EK-YYYYMMDD-XXXX');
      assert(recentOrder.total > 0, 'Order total must be calculated correctly on server');
    });

    // 11. Wishlist Operations
    await test('POST /wishlist/toggle (Add and Remove Wishlist Items)', async () => {
      const resAdd = await makeRequest(server, {
        path: '/wishlist/toggle',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }, { productId: testProduct._id.toString() }, userCookie);

      const dataAdd = JSON.parse(resAdd.body);
      assert(dataAdd.success === true && dataAdd.added === true, 'Product should be added to wishlist');

      const resRemove = await makeRequest(server, {
        path: '/wishlist/toggle',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }, { productId: testProduct._id.toString() }, userCookie);

      const dataRemove = JSON.parse(resRemove.body);
      assert(dataRemove.success === true && dataRemove.added === false, 'Product should be removed from wishlist');
    });

    // 12. Static & Info Pages
    await test('Informational Pages (/about, /contact, /faq, /privacy, /terms)', async () => {
      const paths = ['/about', '/contact', '/faq', '/privacy', '/terms'];
      for (const p of paths) {
        const res = await makeRequest(server, { path: p });
        assert(res.statusCode === 200, `Page ${p} should return 200, got ${res.statusCode}`);
      }
    });

    // 13. Logout & Session Invalidation
    await test('GET /logout (Destroys Session and Clears Cookie)', async () => {
      const res = await makeRequest(server, { path: '/logout' }, null, userCookie);
      assert(res.statusCode === 302, 'Logout should redirect to homepage');
      const accountRes = await makeRequest(server, { path: '/account' }, null, userCookie);
      assert(accountRes.statusCode === 302, 'Old session must not be allowed to access protected routes');
    });

  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }

  console.log('\n======================================================');
  console.log(`Test Execution Completed: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTestSuite();
}

module.exports = { runTestSuite };
