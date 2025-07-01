import winston from 'winston';

/**
 * Logger configuration using Winston.
 * This logger outputs messages to the console with a timestamp and colorized output.
 * The log level can be set via the LOG_LEVEL environment variable, defaulting to 'info'.
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.simple(),
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

export default logger;