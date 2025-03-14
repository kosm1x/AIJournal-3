import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { Container } from 'typedi';
import { UserService } from './services/UserService';
import { JournalService } from './services/JournalService';
import { AIService } from './services/AIService';
import { Cache } from './utils/cache';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import rateLimiter from './middleware/rateLimiter';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter);

// Setup dependency injection
Container.set('logger', logger);
Container.set('cache', new Cache());
Container.set(AIService, new AIService());
Container.set(UserService, new UserService());
Container.set(JournalService, new JournalService(
  Container.get(AIService),
  Container.get(Cache)
));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/entries', require('./routes/entries'));
app.use('/api/analysis', require('./routes/analysis'));

// Error handling
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    logger.info('Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;