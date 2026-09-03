import dotenv from 'dotenv';
import path from 'path';

// Handle uncaught exceptions globally
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down server...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Configure environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import app and database helper after config load
import app from './app';
import { connectDB } from './config/db';

const startServer = async () => {
  // Connect to database
  await connectDB();

  const port = process.env.PORT || 5000;
  
  const server = app.listen(port, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
  });

  // Handle unhandled rejections globally
  process.on('unhandledRejection', (err: any) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down server gracefully...');
    console.error(err?.name, err?.message);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle SIGTERM signal (process termination)
  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down server gracefully...');
    server.close(async () => {
      const mongoose = await import('mongoose');
      await mongoose.connection.close();
      console.log('💥 MongoDB connection closed and process terminated!');
      process.exit(0);
    });
  });

  // Handle SIGINT signal (e.g. Ctrl+C)
  process.on('SIGINT', () => {
    console.log('👋 SIGINT RECEIVED. Shutting down server gracefully...');
    server.close(async () => {
      const mongoose = await import('mongoose');
      await mongoose.connection.close();
      console.log('💥 MongoDB connection closed and process terminated!');
      process.exit(0);
    });
  });
};

startServer();
