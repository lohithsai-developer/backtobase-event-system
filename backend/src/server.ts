import { createApp } from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    await connectDB();
    const app = createApp();

    const PORT = parseInt(ENV.PORT, 10) || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 BacktoBase Server running on http://localhost:${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/api/health`);
      logger.info(`Environment: ${ENV.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
