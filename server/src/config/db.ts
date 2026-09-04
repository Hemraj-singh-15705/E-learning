import mongoose from 'mongoose';
import { autoSeedIfEmpty } from '../utils/autoSeed';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/elearning-platform';
    
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB connection disconnected. Retrying...');
    });

    await mongoose.connect(mongoURI);
    
    // Automatically seed default student/admin accounts if database is empty
    await autoSeedIfEmpty();
  } catch (error) {
    console.error('Failed to connect to MongoDB on startup:', error);
    process.exit(1);
  }
};
