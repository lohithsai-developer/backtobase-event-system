import mongoose from 'mongoose';
import { ENV } from './env';
import { logger } from '../utils/logger';
import { User } from '../models/User';
import { hashPassword } from '../utils/hash';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  try {
    let uri = ENV.MONGODB_URI;

    if (!uri) {
      uri = 'mongodb://127.0.0.1:27017/backtobase';
      logger.warn('No MONGODB_URI provided in environment. Falling back to local MongoDB uri: mongodb://127.0.0.1:27017/backtobase');
    } else {
      logger.info('Connecting to external MongoDB (Atlas/Local)...');
    }

    await mongoose.connect(uri, {
      autoIndex: true,
    });

    isConnected = true;
    logger.info('MongoDB connected successfully.');
    await initDefaultAccounts();
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected.');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error);
  }
};

/**
 * Seed initial admin credentials if not already present or updated
 */
export const initDefaultAccounts = async (): Promise<void> => {
  try {
    const adminUsernames = ['-admin', 'admin'];
    const hashedAdminPassword = await hashPassword(ENV.ADMIN_PASSWORD);

    for (const uname of adminUsernames) {
      const existing = await User.findOne({ username: uname });
      if (!existing) {
        await User.create({
          username: uname,
          passwordHash: hashedAdminPassword,
          role: 'admin',
        });
        logger.info(`Admin account initialized for username: ${uname}`);
      } else {
        existing.passwordHash = hashedAdminPassword;
        await existing.save();
        logger.info(`Admin account credentials refreshed for username: ${uname}`);
      }
    }
  } catch (err) {
    logger.error('Error initializing default accounts:', err);
  }
};
