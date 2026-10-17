require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

const categoriesToDownload = [
  {
    slug: 'smartphones-electronics',
    name: 'Smartphones & Electronics',
    fileName: 'smartphones.jpg',
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80'
  },
  {
    slug: 'laptops-accessories',
    name: 'Laptops & Accessories',
    fileName: 'laptops.jpg',
    url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80'
  },
  {
    slug: 'fashion-clothing',
    name: 'Fashion & Clothing',
    fileName: 'fashion.jpg',
    url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80'
  },
  {
    slug: 'shoes-lifestyle',
    name: 'Shoes & Lifestyle',
    fileName: 'shoes.jpg',
    url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80'
  },
  {
    slug: 'home-appliances',
    name: 'Home Appliances',
    fileName: 'appliances.jpg',
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80'
  },
  {
    slug: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    fileName: 'beauty.jpg',
    url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80'
  },
  {
    slug: 'home-decor-essentials',
    name: 'Home Decor & Essentials',
    fileName: 'homedecor.jpg',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80'
  }
];

const productsToDownload = [
  {
    slug: 'nova-pro-5g-flagship-smartphone',
    fileName: 'phone_nova.jpg',
    url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'sonicpulse-studio-wireless-anc-headphones',
    fileName: 'headphones_sonic.jpg',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'aerowatch-ultra-smartwatch-gps-tracker',
    fileName: 'smartwatch_aero.jpg',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'apexbook-slim-14-inch-oled-ultrabook',
    fileName: 'laptop_apex.jpg',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'quantumkey-pro-mechanical-wireless-keyboard',
    fileName: 'keyboard_quantum.jpg',
    url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'glidemaster-precision-wireless-ergonomic-mouse',
    fileName: 'mouse_glide.jpg',
    url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'merino-wool-minimalist-crewneck sweater',
    slugAlt: 'merino-wool-minimalist-crewneck-sweater',
    fileName: 'sweater_merino.jpg',
    url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'urbanflex-all-day-chino-trousers',
    fileName: 'chinos_urban.jpg',
    url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'elements-waterproof-windbreaker-parka',
    fileName: 'jacket_parka.jpg',
    url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'cloudstride-zero-gravity-running-shoes',
    fileName: 'shoes_cloudstride.jpg',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'artisan-heritage-handcrafted-leather-loafers',
    fileName: 'loafers_leather.jpg',
    url: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'purebreeze-smart-hepa-air-purifier-pro',
    fileName: 'air_purifier.jpg',
    url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'baristaexpress-15-bar-espresso-cappuccino-maker',
    fileName: 'espresso_maker.jpg',
    url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'radiance-botanical-hydrating-facial-serum',
    fileName: 'serum_radiance.jpg',
    url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'progroom-titanium-beard-hair-trimmer-kit',
    fileName: 'trimmer_progroom.jpg',
    url: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'auraglow-minimalist-smart-ambient-desk-lamp',
    fileName: 'lamp_auraglow.jpg',
    url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700&auto=format&fit=crop&q=80'
  },
  {
    slug: 'ergocomfort-memory-foam-lumbar-support-cushion',
    fileName: 'cushion_ergo.jpg',
    url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=700&auto=format&fit=crop&q=80'
  }
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log('--- Step 1: Downloading Category Images ---');
  const catDir = path.join(__dirname, '../public/images/categories');
  fs.mkdirSync(catDir, { recursive: true });

  for (const cat of categoriesToDownload) {
    const dest = path.join(catDir, cat.fileName);
    process.stdout.write(`Downloading ${cat.fileName}... `);
    try {
      await downloadFile(cat.url, dest);
      console.log(`✓ (${fs.statSync(dest).size} bytes)`);
    } catch (e) {
      console.log(`Failed: ${e.message}`);
    }
  }

  console.log('\n--- Step 2: Downloading Product Images ---');
  const prodDir = path.join(__dirname, '../public/images/products');
  fs.mkdirSync(prodDir, { recursive: true });

  for (const prod of productsToDownload) {
    const dest = path.join(prodDir, prod.fileName);
    process.stdout.write(`Downloading ${prod.fileName}... `);
    try {
      await downloadFile(prod.url, dest);
      console.log(`✓ (${fs.statSync(dest).size} bytes)`);
    } catch (e) {
      console.log(`Failed: ${e.message}`);
    }
  }

  console.log('\n--- Step 3: Updating MongoDB Database ---');
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ekart';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  // Update categories
  for (const cat of categoriesToDownload) {
    const imagePath = `/images/categories/${cat.fileName}`;
    const res = await Category.updateOne(
      { slug: cat.slug },
      { $set: { image: imagePath } }
    );
    console.log(`Category [${cat.slug}]: set image to ${imagePath} (modified: ${res.modifiedCount})`);
  }

  // Update products
  for (const prod of productsToDownload) {
    const primaryImage = `/images/products/${prod.fileName}`;
    const slugQuery = prod.slugAlt 
      ? { $or: [{ slug: prod.slug }, { slug: prod.slugAlt }] } 
      : { slug: prod.slug };

    const res = await Product.updateOne(
      slugQuery,
      { $set: { images: [primaryImage] } }
    );
    console.log(`Product [${prod.slug}]: set images to [${primaryImage}] (matched: ${res.matchedCount}, modified: ${res.modifiedCount})`);
  }

  // Verify
  console.log('\n--- Step 4: Verification ---');
  const allCats = await Category.find({}, 'name slug image');
  console.log('Categories in DB:');
  allCats.forEach(c => console.log(`  ${c.slug} -> ${c.image}`));

  const allProds = await Product.find({}, 'name slug images');
  console.log('\nProducts in DB:');
  allProds.forEach(p => console.log(`  ${p.slug} -> ${p.images && p.images[0]}`));

  await mongoose.disconnect();
  console.log('\nDone! All images saved and linked in MongoDB.');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
