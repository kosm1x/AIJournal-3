const winston = require('winston');
require('winston-daily-rotate-file');
const { v4: uuidv4 } = require('uuid');

// Custom format for structured logging
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Environment-specific configurations
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  const logLevels = {
    development: 'debug',
    test: 'debug',
    production: 'info'
  };
  return logLevels[env] || 'info';
};

// Configure rotating file transport
const rotatingFileTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: customFormat
});

// Create the logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  format: customFormat,
  transports: [
    rotatingFileTransport,
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: customFormat
    })
  ]
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Error handling helper
const logError = (error, req) => {
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    requestId: req.requestId,
    path: req.path,
    method: req.method,
    userId: req.user?.userId
  });
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  // Add correlation ID
  req.requestId = uuidv4();
  
  // Capture request start time
  const startTime = Date.now();
  
  // Log request
  logger.info({
    event: 'request_received',
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      event: 'request_completed',
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.userId
    });
  });

  // Handle errors
  res.on('error', (error) => {
    logError(error, req);
  });

  next();
};

// Error logger middleware
const errorLogger = (err, req, res, next) => {
  logError(err, req);
  next(err);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger
};