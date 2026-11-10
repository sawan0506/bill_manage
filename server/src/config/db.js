import mongoose from 'mongoose';
import { logger } from './logger.js';

let memoryServer = null;

export const connectDB = async () => {
  console.log("hello : " ,process.env.MONGODB_URI);
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hardware_billing';
  console.log("hello : " ,uri);
  try {
    console.log("hello : " ,uri);
    logger.info(`Attempting MongoDB connection to: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      autoIndex: true
    });
    logger.info('Connected to MongoDB successfully.');
  } catch (err) {
    logger.warn(`Could not connect to external MongoDB: ${err.message}`);

    if (process.env.NODE_ENV !== 'production') {
      try {
        logger.info('Starting fallback embedded in-memory MongoDB server for development...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        await mongoose.connect(memUri, {
          autoIndex: true
        });
        logger.info(`Connected to embedded MongoDB at: ${memUri}`);
      } catch (memErr) {
        logger.error(`Embedded MongoDB failed to start: ${memErr.message}`);
        throw memErr;
      }
    } else {
      throw err;
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    logger.info('Disconnected from MongoDB.');
  } catch (err) {
    logger.error(`Error disconnecting MongoDB: ${err.message}`);
  }
};
