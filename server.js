require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/database');
const { createApp } = require('./app');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    // Auto-seed initial catalog if database is fresh
    const Category = require('./models/Category');
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('[eKart] Empty database detected. Auto-seeding initial catalog and default admin...');
      const { seedData } = require('./scripts/seedDatabase');
      await seedData();
    }

    const app = createApp();

    const server = app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 eKart Application is live!`);
      console.log(`🌐 Server running at: http://localhost:${PORT}`);
      console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📦 Database: Connected successfully`);
      console.log(`======================================================\n`);
    });

    // Graceful Shutdown
    const handleShutdown = async (signal) => {
      console.log(`\n[eKart] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('[eKart] HTTP server closed.');
        await disconnectDB();
        console.log('[eKart] Database connection terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    return server;
  } catch (error) {
    console.error('[eKart] Critical Startup Error:', error);
    process.exit(1);
  }
}

// Start server when run directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
