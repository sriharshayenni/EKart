const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ekart';

  try {
    // Attempt standard connection
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.warn(`[MongoDB] Primary connection failed: ${error.message}`);

    // If in development mode and local connection refused, provide fallback to in-memory MongoDB
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[MongoDB] Starting embedded MongoDB instance for seamless development/testing...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'ekart'
          },
          spawn: {
            timeout: 120000
          }
        });
        const memoryUri = memoryServer.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`[MongoDB] Connected to embedded MongoDB server at ${memoryUri}`);
        return conn.connection;
      } catch (memErr) {
        console.error('[MongoDB] Embedded MongoDB could not be started:', memErr.message);
      }
    }

    console.error('\n======================================================');
    console.error('ERROR: Could not connect to MongoDB!');
    console.error('Please configure a valid MONGODB_URI in your .env file.');
    console.error('For MongoDB Atlas (cloud): mongodb+srv://<user>:<password>@cluster.mongodb.net/ekart');
    console.error('For local MongoDB: mongodb://127.0.0.1:27017/ekart');
    console.error('======================================================\n');
    throw error;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
