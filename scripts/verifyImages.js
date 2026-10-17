const http = require('http');

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function checkImage(src) {
  return new Promise((resolve) => {
    http.get('http://localhost:5500' + src, (res) => {
      resolve({ status: res.statusCode, type: res.headers['content-type'], length: res.headers['content-length'] });
    }).on('error', () => resolve({ status: 500 }));
  });
}

async function verify() {
  console.log('Testing Pages and Rendered Image Assets:');
  const pages = ['/', '/products', '/products/nova-pro-5g-flagship-smartphone'];
  let totalErrors = 0;
  
  for (const page of pages) {
    const pageRes = await fetchHtml('http://localhost:5500' + page);
    console.log(`\n======================================================`);
    console.log(`PAGE: http://localhost:5500${page} (HTTP ${pageRes.status})`);
    console.log(`======================================================`);
    
    const regex = /<img\b[\s\S]*?src=["']([^"']+)["']/gi;
    let match;
    const srcs = [];
    while ((match = regex.exec(pageRes.body)) !== null) {
      srcs.push(match[1]);
    }
    const uniqueSrcs = [...new Set(srcs)];
    console.log(`Found ${uniqueSrcs.length} unique images:`);
    
    for (const src of uniqueSrcs) {
      if (src.startsWith('/')) {
        const check = await checkImage(src);
        if (check.status === 200) {
          console.log(`  ✅ [200 OK] ${src} (${check.type}, ${check.length} bytes)`);
        } else {
          console.log(`  ❌ [${check.status}] ${src}`);
          totalErrors++;
        }
      } else {
        console.log(`  ℹ️  [External] ${src}`);
      }
    }
  }

  console.log(`\n======================================================`);
  if (totalErrors === 0) {
    console.log(`🎉 ALL IMAGES VERIFIED 100% HEALTHY! Zero broken links.`);
  } else {
    console.log(`⚠️ Encountered ${totalErrors} broken images.`);
  }
  console.log(`======================================================\n`);
}

verify().catch(console.error);
