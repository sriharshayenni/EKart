require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const User = require('../models/User');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace(/^--/, '');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      result[key] = value;
    }
  }
  return result;
}

async function createAdmin() {
  const args = parseArgs();

  const name = args.name || process.env.ADMIN_NAME || 'eKart Administrator';
  const email = (args.email || process.env.ADMIN_EMAIL || 'admin@ekart.com').trim().toLowerCase();
  const password = args.password || process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('\n======================================================');
    console.error('ERROR: Missing admin password!');
    console.error('Please specify a secure password via command line argument or environment variable:');
    console.error('Usage: node scripts/createAdmin.js --name "Admin Name" --email "admin@ekart.com" --password "YourStrongPassword123"');
    console.error('Or set in .env: ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD');
    console.error('======================================================\n');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('ERROR: Admin password must be at least 6 characters long.');
    process.exit(1);
  }

  try {
    console.log('[Admin Setup] Connecting to database...');
    await connectDB();

    let user = await User.findOne({ email });

    if (user) {
      console.log(`[Admin Setup] Existing account found for ${email}. Promoting to administrator...`);
      user.role = 'admin';
      user.name = name;
      user.password = password; // Pre-save hook will hash this securely with bcrypt
      await user.save();
      console.log(`✅ User ${user.email} successfully elevated to Administrator role!`);
    } else {
      console.log(`[Admin Setup] Creating new administrator account for ${email}...`);
      user = new User({
        name,
        email,
        password,
        role: 'admin'
      });
      await user.save();
      console.log(`✅ Administrator account "${user.name}" (${user.email}) created successfully!`);
    }

    console.log('\n======================================================');
    console.log('Admin Account Ready:');
    console.log(`Email: ${user.email}`);
    console.log(`Role:  ${user.role}`);
    console.log('Login at: http://localhost:' + (process.env.PORT || 5000) + '/login');
    console.log('Admin console at: http://localhost:' + (process.env.PORT || 5000) + '/admin');
    console.log('======================================================\n');
  } catch (error) {
    console.error('[Admin Setup] Error creating administrator:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };
