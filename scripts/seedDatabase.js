require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/database');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');
const User = require('../models/User');

const categoriesData = [
  {
    name: 'Smartphones & Electronics',
    slug: 'smartphones-electronics',
    description: 'Flagship mobile devices, 5G smartphones, wireless audio, and wearables.',
    image: '/images/categories/smartphones.jpg',
    icon: 'mobile-screen-button',
    isFeatured: true
  },
  {
    name: 'Laptops & Accessories',
    slug: 'laptops-accessories',
    description: 'Ultra-thin notebooks, high-performance creator workstations, and gaming rigs.',
    image: '/images/categories/laptops.jpg',
    icon: 'laptop',
    isFeatured: true
  },
  {
    name: 'Fashion & Clothing',
    slug: 'fashion-clothing',
    description: 'Contemporary menswear, womenswear, activewear, and seasonal wardrobe essentials.',
    image: '/images/categories/fashion.jpg',
    icon: 'shirt',
    isFeatured: true
  },
  {
    name: 'Shoes & Lifestyle',
    slug: 'shoes-lifestyle',
    description: 'Performance running sneakers, casual leather footwear, and everyday slip-ons.',
    image: '/images/categories/shoes.jpg',
    icon: 'shoe-prints',
    isFeatured: true
  },
  {
    name: 'Home Appliances',
    slug: 'home-appliances',
    description: 'Smart air purifiers, robotic vacuums, espresso machines, and kitchen gadgets.',
    image: '/images/categories/appliances.jpg',
    icon: 'blender',
    isFeatured: true
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    description: 'Premium skincare formulas, organic hair care serums, and personal grooming sets.',
    image: '/images/categories/beauty.jpg',
    icon: 'wand-magic-sparkles',
    isFeatured: true
  },
  {
    name: 'Home Decor & Essentials',
    slug: 'home-decor-essentials',
    description: 'Minimalist ambient lamps, ergonomic home office setups, and cozy throws.',
    image: '/images/categories/homedecor.jpg',
    icon: 'couch',
    isFeatured: true
  }
];

const productsData = [
  // 1. Smartphones & Electronics
  {
    name: 'Nova Pro 5G Flagship Smartphone',
    slug: 'nova-pro-5g-flagship-smartphone',
    categorySlug: 'smartphones-electronics',
    brand: 'NovaTech',
    price: 64999,
    originalPrice: 74999,
    stock: 28,
    images: ['/images/products/phone_nova.jpg', '/images/categories/smartphones.jpg'],
    shortDescription: '6.8-inch Dynamic AMOLED 120Hz display with 200MP Quad Camera & 5000mAh battery.',
    description: 'The Nova Pro 5G delivers unparalleled flagship processing power driven by the latest 4nm octa-core architecture. Featuring a breathtaking 6.8-inch Dynamic AMOLED curved display with peak 2600 nits brightness and ultra-fast 100W HyperCharge.',
    specifications: [
      { key: 'Processor', value: 'Snapdragon 8 Gen 3 (4nm)' },
      { key: 'Display', value: '6.8" Quad HD+ 120Hz AMOLED' },
      { key: 'Rear Camera', value: '200MP + 50MP + 12MP + 10MP' },
      { key: 'Battery', value: '5000 mAh with 100W Fast Charge' },
      { key: 'RAM & Storage', value: '12GB LPDDR5X / 256GB UFS 4.0' }
    ],
    rating: { average: 4.8, count: 142 },
    tags: ['smartphone', '5g', 'flagship', 'amoled', 'camera phone'],
    isFeatured: true,
    isTrending: true,
    isNewArrival: true,
    active: true
  },
  {
    name: 'SonicPulse Studio Wireless ANC Headphones',
    slug: 'sonicpulse-studio-wireless-anc-headphones',
    categorySlug: 'smartphones-electronics',
    brand: 'SonicPulse',
    price: 18999,
    originalPrice: 24999,
    stock: 45,
    images: ['/images/products/headphones_sonic.jpg', '/images/banners/hero_banner.jpg'],
    shortDescription: 'Hybrid Active Noise Cancellation with Hi-Res spatial audio and 40-hour battery life.',
    description: 'Immerse yourself in concert-hall precision with SonicPulse Studio. Featuring bespoke 40mm titanium drivers, adaptive active noise cancellation that cancels 98% of ambient noise, and plush memory foam earcups.',
    specifications: [
      { key: 'Driver Size', value: '40mm Custom Titanium' },
      { key: 'Battery Runtime', value: 'Up to 40 Hours with ANC on' },
      { key: 'Connectivity', value: 'Bluetooth 5.3 & LDAC support' },
      { key: 'Microphones', value: '4 Beamforming mics with AI call clarity' }
    ],
    rating: { average: 4.7, count: 89 },
    tags: ['audio', 'headphones', 'anc', 'wireless', 'music'],
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    active: true
  },
  {
    name: 'AeroWatch Ultra Smartwatch & GPS Tracker',
    slug: 'aerowatch-ultra-smartwatch-gps-tracker',
    categorySlug: 'smartphones-electronics',
    brand: 'Aero',
    price: 12499,
    originalPrice: 16999,
    stock: 35,
    images: ['/images/products/smartwatch_aero.jpg'],
    shortDescription: 'Titanium bezel, dual-frequency GPS, ECG, and 14-day battery life.',
    description: 'Engineered for endurance and performance athletes. Features always-on sapphire glass AMOLED screen, continuous SpO2 and optical heart tracking, military-standard shock resistance, and 50m water resistance.',
    specifications: [
      { key: 'Case Material', value: 'Aerospace Grade Titanium' },
      { key: 'Water Resistance', value: '5 ATM (50 meters)' },
      { key: 'Battery Life', value: '14 Days Typical Use' },
      { key: 'Sensors', value: 'ECG, Optical HR, SpO2, Barometer' }
    ],
    rating: { average: 4.6, count: 64 },
    tags: ['smartwatch', 'fitness', 'gps', 'wearable'],
    isFeatured: false,
    isTrending: true,
    isNewArrival: true,
    active: true
  },

  // 2. Laptops & Accessories
  {
    name: 'ApexBook Slim 14-inch OLED Ultrabook',
    slug: 'apexbook-slim-14-inch-oled-ultrabook',
    categorySlug: 'laptops-accessories',
    brand: 'Apex',
    price: 89990,
    originalPrice: 104990,
    stock: 19,
    images: ['/images/products/laptop_apex.jpg', '/images/categories/laptops.jpg'],
    shortDescription: 'Intel Core Ultra 7 processor, 2.8K 120Hz OLED screen, 16GB RAM, 1TB SSD.',
    description: 'Weighing just 1.18 kg, the ApexBook Slim combines featherlight portability with blazing multicore responsiveness. The factory-calibrated 2.8K OLED display produces 100% DCI-P3 color gamut for creative professionals and coders.',
    specifications: [
      { key: 'Processor', value: 'Intel Core Ultra 7 155H' },
      { key: 'Memory', value: '16GB LPDDR5X 7467MHz' },
      { key: 'Storage', value: '1TB PCIe Gen4 M.2 NVMe SSD' },
      { key: 'Display', value: '14" 2.8K (2880x1800) 120Hz OLED' },
      { key: 'Weight', value: '1.18 kg' }
    ],
    rating: { average: 4.9, count: 52 },
    tags: ['laptop', 'ultrabook', 'oled', 'intel', 'lightweight'],
    isFeatured: true,
    isTrending: true,
    isNewArrival: true,
    active: true
  },
  {
    name: 'QuantumKey Pro Mechanical Wireless Keyboard',
    slug: 'quantumkey-pro-mechanical-wireless-keyboard',
    categorySlug: 'laptops-accessories',
    brand: 'Quantum',
    price: 6499,
    originalPrice: 8999,
    stock: 40,
    images: ['/images/products/keyboard_quantum.jpg'],
    shortDescription: 'Hot-swappable tactile switches, gasket mounted, RGB backlighting, tri-mode connection.',
    description: 'Engineered for typing enthusiasts and developers. Features CNC machined aluminum frame, pre-lubed mechanical switches, custom PBT doubleshot keycaps, and multi-device Bluetooth, 2.4G, and USB-C connectivity.',
    specifications: [
      { key: 'Layout', value: '75% Compact (84 Keys)' },
      { key: 'Switch Type', value: 'Gateron Pro Brown (Hot-swap)' },
      { key: 'Battery', value: '4000 mAh rechargeable' },
      { key: 'Mounting', value: 'Poron Gasket Mount structure' }
    ],
    rating: { average: 4.7, count: 95 },
    tags: ['keyboard', 'mechanical', 'wireless', 'accessories'],
    isFeatured: false,
    isTrending: false,
    isNewArrival: true,
    active: true
  },
  {
    name: 'GlideMaster Precision Wireless Ergonomic Mouse',
    slug: 'glidemaster-precision-wireless-ergonomic-mouse',
    categorySlug: 'laptops-accessories',
    brand: 'Glide',
    price: 3499,
    originalPrice: 4499,
    stock: 55,
    images: ['/images/products/mouse_glide.jpg'],
    shortDescription: 'Sculpted ergonomic grip, 4000 DPI Darkfield sensor, silent clicks.',
    description: 'Designed to conform to your palm for all-day comfort. Tracks smoothly on any surface including glass, with customizable gesture buttons and ultra-quiet switches.',
    specifications: [
      { key: 'DPI Sensor', value: 'Up to 4000 DPI adjustable' },
      { key: 'Buttons', value: '6 Programmable Buttons' },
      { key: 'Battery Life', value: 'Up to 70 days per charge' }
    ],
    rating: { average: 4.5, count: 77 },
    tags: ['mouse', 'ergonomic', 'accessories', 'laptop'],
    isFeatured: false,
    isTrending: false,
    isNewArrival: false,
    active: true
  },

  // 3. Fashion & Clothing
  {
    name: 'Merino Wool Minimalist Crewneck Sweater',
    slug: 'merino-wool-minimalist-crewneck-sweater',
    categorySlug: 'fashion-clothing',
    brand: 'Aura Label',
    price: 2999,
    originalPrice: 4299,
    stock: 32,
    images: ['/images/products/sweater_merino.jpg', '/images/categories/fashion.jpg'],
    shortDescription: '100% pure extra-fine Merino wool with natural thermal regulation.',
    description: 'Spun from sustainably harvested Australian extra-fine Merino wool, this modern crewneck sweater offers lightweight warmth, incredible softness against the skin, and natural odor resistance.',
    specifications: [
      { key: 'Fabric Material', value: '100% Extra-fine Merino Wool' },
      { key: 'Fit', value: 'Regular Contemporary Fit' },
      { key: 'Care Instructions', value: 'Hand wash or dry clean recommended' }
    ],
    rating: { average: 4.8, count: 48 },
    tags: ['fashion', 'sweater', 'wool', 'menswear', 'winter'],
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    active: true
  },
  {
    name: 'UrbanFlex All-Day Chino Trousers',
    slug: 'urbanflex-all-day-chino-trousers',
    categorySlug: 'fashion-clothing',
    brand: 'Aura Label',
    price: 1899,
    originalPrice: 2599,
    stock: 45,
    images: ['/images/products/chinos_urban.jpg'],
    shortDescription: '4-way stretch water-repellent performance cotton blend chinos.',
    description: 'Versatile trousers tailored for both smart-casual office days and weekend getaways. Crafted with breathable elastane-cotton twill that retains its shape all day.',
    specifications: [
      { key: 'Material', value: '97% Organic Cotton, 3% Elastane' },
      { key: 'Pockets', value: '4 Pockets + Hidden Zip Passport Pocket' },
      { key: 'Rise', value: 'Mid Rise Slim Tapered' }
    ],
    rating: { average: 4.6, count: 83 },
    tags: ['chinos', 'trousers', 'fashion', 'casual'],
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    active: true
  },
  {
    name: 'Elements Waterproof Windbreaker Parka',
    slug: 'elements-waterproof-windbreaker-parka',
    categorySlug: 'fashion-clothing',
    brand: 'OutVentures',
    price: 4499,
    originalPrice: 5999,
    stock: 24,
    images: ['/images/products/jacket_parka.jpg'],
    shortDescription: 'Seam-sealed storm-proof hooded jacket with breathable mesh lining.',
    description: 'Shield yourself against wind, rain, and sudden drops in temperature. Features YKK waterproof front zippers, adjustable storm hood, and packable pocket pouch.',
    specifications: [
      { key: 'Waterproof Rating', value: '10,000mm hydrostatic head' },
      { key: 'Lining', value: 'Breathable ventilation mesh' },
      { key: 'Weight', value: '380 grams packable' }
    ],
    rating: { average: 4.7, count: 39 },
    tags: ['jacket', 'waterproof', 'outerwear', 'fashion'],
    isFeatured: false,
    isTrending: false,
    isNewArrival: true,
    active: true
  },

  // 4. Shoes & Lifestyle
  {
    name: 'CloudStride Zero-Gravity Running Shoes',
    slug: 'cloudstride-zero-gravity-running-shoes',
    categorySlug: 'shoes-lifestyle',
    brand: 'StrideCo',
    price: 4999,
    originalPrice: 6999,
    stock: 50,
    images: ['/images/products/shoes_cloudstride.jpg', '/images/categories/shoes.jpg'],
    shortDescription: 'Nitrogen-infused foam midsole with breathable circular knit upper.',
    description: 'Experience effortless energy return with every stride. The CloudStride combines a dual-density nitrogen foam sole with anatomical arch reinforcement for smooth road running and gym workouts.',
    specifications: [
      { key: 'Midsole', value: 'Nitrogen Supercritical Foam' },
      { key: 'Drop', value: '8mm Heel-to-Toe Drop' },
      { key: 'Weight', value: '235 grams (Men US 9)' },
      { key: 'Outsole', value: 'High-traction Continental Rubber' }
    ],
    rating: { average: 4.9, count: 112 },
    tags: ['shoes', 'sneakers', 'running', 'footwear', 'sports'],
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    active: true
  },
  {
    name: 'Artisan Heritage Handcrafted Leather Loafers',
    slug: 'artisan-heritage-handcrafted-leather-loafers',
    categorySlug: 'shoes-lifestyle',
    brand: 'Vanguard Shoes',
    price: 5499,
    originalPrice: 7999,
    stock: 18,
    images: ['/images/products/loafers_leather.jpg'],
    shortDescription: 'Full-grain Italian calfskin leather with Blake stitched leather sole.',
    description: 'Handcrafted by master cobblers, these timeless penny loafers feature vegetable-tanned full-grain leather that develops a rich, unique patina over years of wear.',
    specifications: [
      { key: 'Upper Material', value: 'Full-Grain Italian Calfskin' },
      { key: 'Sole Construction', value: 'Blake Stitched Leather with Rubber Heel Tap' },
      { key: 'Insole', value: 'Orthopedic memory foam footbed' }
    ],
    rating: { average: 4.8, count: 37 },
    tags: ['shoes', 'leather', 'loafers', 'formal', 'footwear'],
    isFeatured: false,
    isTrending: false,
    isNewArrival: true,
    active: true
  },

  // 5. Home Appliances
  {
    name: 'PureBreeze Smart HEPA Air Purifier Pro',
    slug: 'purebreeze-smart-hepa-air-purifier-pro',
    categorySlug: 'home-appliances',
    brand: 'PureBreeze',
    price: 11999,
    originalPrice: 15999,
    stock: 22,
    images: ['/images/products/air_purifier.jpg', '/images/categories/appliances.jpg'],
    shortDescription: 'True HEPA H13 filtration removes 99.97% of airborne PM2.5, pet dander, and odors.',
    description: 'Keep your indoor air crisp and allergen-free. Features laser particulate air quality sensor with real-time numeric display, whisper-quiet 24dB sleep mode, and WiFi app monitoring.',
    specifications: [
      { key: 'Coverage Area', value: 'Up to 550 sq. ft.' },
      { key: 'Filtration Type', value: 'Pre-filter + H13 True HEPA + Activated Carbon' },
      { key: 'CADR Rating', value: '400 m³/h' },
      { key: 'Noise Level', value: '24 dB - 52 dB' }
    ],
    rating: { average: 4.8, count: 68 },
    tags: ['appliances', 'air purifier', 'home', 'hepa', 'health'],
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    active: true
  },
  {
    name: 'BaristaExpress 15-Bar Espresso & Cappuccino Maker',
    slug: 'baristaexpress-15-bar-espresso-cappuccino-maker',
    categorySlug: 'home-appliances',
    brand: 'Cafetiere',
    price: 14999,
    originalPrice: 19999,
    stock: 15,
    images: ['/images/products/espresso_maker.jpg'],
    shortDescription: 'Commercial 15-bar Italian pump with high-pressure stainless steam wand for silky microfoam.',
    description: 'Brew cafe-quality espresso shots, velvety flat whites, and rich cappuccinos from your kitchen counter. Fast thermoblock heating achieves optimal brewing temperature in under 45 seconds.',
    specifications: [
      { key: 'Pump Pressure', value: '15-Bar Italian Ulka Pump' },
      { key: 'Water Tank', value: '1.8L Removable Transparent Tank' },
      { key: 'Heating System', value: '1350W ThermoBlock Fast Heating' }
    ],
    rating: { average: 4.7, count: 42 },
    tags: ['coffee', 'espresso', 'kitchen', 'appliances'],
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    active: true
  },

  // 6. Beauty & Personal Care
  {
    name: 'Radiance Botanical Hydrating Facial Serum',
    slug: 'radiance-botanical-hydrating-facial-serum',
    categorySlug: 'beauty-personal-care',
    brand: 'Lumiere Organics',
    price: 1299,
    originalPrice: 1899,
    stock: 65,
    images: ['/images/products/serum_radiance.jpg', '/images/categories/beauty.jpg'],
    shortDescription: 'Multi-molecular Hyaluronic Acid & Vitamin C for dewy, glowing barrier support.',
    description: 'Formulated with cold-pressed botanical extracts and niacinamide, this lightweight, fast-absorbing serum restores deep moisture levels and boosts natural skin illumination.',
    specifications: [
      { key: 'Skin Type', value: 'All skin types (Dermatologist Tested)' },
      { key: 'Volume', value: '30 ml / 1.0 fl. oz.' },
      { key: 'Cruelty-Free', value: '100% Vegan & Leaping Bunny Certified' }
    ],
    rating: { average: 4.9, count: 124 },
    tags: ['skincare', 'serum', 'beauty', 'glow', 'organic'],
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    active: true
  },
  {
    name: 'ProGroom Titanium Beard & Hair Trimmer Kit',
    slug: 'progroom-titanium-beard-hair-trimmer-kit',
    categorySlug: 'beauty-personal-care',
    brand: 'ProGroom',
    price: 2499,
    originalPrice: 3499,
    stock: 42,
    images: ['/images/products/trimmer_progroom.jpg'],
    shortDescription: 'Self-sharpening titanium blades with 40 length settings and 120-min cordless runtime.',
    description: 'Master your grooming style with precision dial controls from 0.5mm to 20mm. 100% waterproof design allows effortless cleaning under running water.',
    specifications: [
      { key: 'Blades', value: 'Self-sharpening Titanium Ceramic' },
      { key: 'Runtime', value: '120 mins Li-ion battery' },
      { key: 'Waterproof', value: 'IPX7 fully washable' }
    ],
    rating: { average: 4.6, count: 88 },
    tags: ['grooming', 'trimmer', 'shaver', 'menscare'],
    isFeatured: false,
    isTrending: false,
    isNewArrival: true,
    active: true
  },

  // 7. Home Decor & Everyday Essentials
  {
    name: 'AuraGlow Minimalist Smart Ambient Desk Lamp',
    slug: 'auraglow-minimalist-smart-ambient-desk-lamp',
    categorySlug: 'home-decor-essentials',
    brand: 'AuraHome',
    price: 3299,
    originalPrice: 4499,
    stock: 25,
    images: ['/images/products/lamp_auraglow.jpg', '/images/categories/homedecor.jpg'],
    shortDescription: 'Stepless dimming, 16 million RGB colors, wireless phone charging base.',
    description: 'Elevate your workspace or bedside table. Features aircraft aluminum stem, flicker-free eye-caring illumination, touch slide control, and 15W Qi wireless phone charging pad integrated into the base.',
    specifications: [
      { key: 'Color Temp', value: '2700K Warm White to 6500K Cool White' },
      { key: 'Wireless Charging', value: '15W Fast Qi Wireless' },
      { key: 'Control', value: 'Touch Slide & Companion App Support' }
    ],
    rating: { average: 4.8, count: 59 },
    tags: ['lamp', 'homedecor', 'lighting', 'smart home'],
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    active: true
  },
  {
    name: 'ErgoComfort Memory Foam Lumbar Support Cushion',
    slug: 'ergocomfort-memory-foam-lumbar-support-cushion',
    categorySlug: 'home-decor-essentials',
    brand: 'ErgoLife',
    price: 1499,
    originalPrice: 1999,
    stock: 70,
    images: ['/images/products/cushion_ergo.jpg'],
    shortDescription: 'Orthopedic contoured memory foam for office chairs and car seats.',
    description: 'Alleviate back stiffness and improve posture during long work hours. Made with 100% high-density responsive memory foam and breathable 3D mesh cover.',
    specifications: [
      { key: 'Core', value: '100% Pure Therapeutic Memory Foam' },
      { key: 'Cover', value: 'Removable Machine-Washable Breathable Mesh' },
      { key: 'Straps', value: 'Dual Adjustable Elastic Securing Straps' }
    ],
    rating: { average: 4.5, count: 91 },
    tags: ['ergonomic', 'office', 'cushion', 'comfort'],
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    active: true
  }
];

async function seedData() {
  console.log('[Seed] Seeding product categories...');
  const categoryMap = {};

  for (const catData of categoriesData) {
    const category = await Category.findOneAndUpdate(
      { slug: catData.slug },
      catData,
      { upsert: true, new: true, runValidators: true }
    );
    categoryMap[category.slug] = category._id;
    console.log(`  + Category: ${category.name} (${category.slug})`);
  }

  console.log('\n[Seed] Seeding product catalog...');
  for (const prodData of productsData) {
    const categoryId = categoryMap[prodData.categorySlug];
    if (!categoryId) {
      console.warn(`  ! Category not found for slug ${prodData.categorySlug}`);
      continue;
    }

    const { categorySlug, ...rest } = prodData;
    const productPayload = {
      ...rest,
      category: categoryId
    };

    const product = await Product.findOneAndUpdate(
      { slug: prodData.slug },
      productPayload,
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`  + Product: ${product.name} (₹${product.price})`);
  }

  // Seed default admin if no admin exists
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    const adminUser = new User({
      name: 'eKart Admin',
      email: 'admin@ekart.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin'
    });
    await adminUser.save();
    console.log('\n  + Default Administrator created: admin@ekart.com (password: Admin@123456)');
  }

  console.log('\n======================================================');
  console.log('✅ Database seeded successfully!');
  console.log(`📁 Categories created/updated: ${categoriesData.length}`);
  console.log(`📦 Products created/updated: ${productsData.length}`);
  console.log('======================================================\n');
}

async function seedDatabase() {
  console.log('[Seed] Starting database seed process...');
  try {
    await connectDB();
    await seedData();
  } catch (error) {
    console.error('[Seed] Database seeding failed:', error);
  } finally {
    await disconnectDB();
    console.log('[Seed] Process terminated.');
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, seedData, categoriesData, productsData };
