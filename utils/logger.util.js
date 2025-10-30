// Logger Utility - Industry Standard Logging Helper
// This file provides a centralized logging system for the entire application

const fs = require('fs');
const path = require('path');

/**
 * Logger Class
 * 
 * Purpose: Centralized logging system for tracking application events, errors, and debugging
 * 
 * Why use a logger instead of console.log?
 * 1. Logs are saved to files (not lost when server restarts)
 * 2. Different log levels (info, warning, error, debug)
 * 3. Timestamps automatically added
 * 4. Easy to enable/disable logs in production
 * 5. Formatted and organized output
 */
class Logger {
  
  constructor(options = {}) {
    // Log directory - where log files will be saved
    this.logDir = options.logDir || path.join(__dirname, '../logs');
    
    // Enable/disable console output (set to false in production)
    this.enableConsole = options.enableConsole !== undefined ? options.enableConsole : true;
    
    // Enable/disable file logging
    this.enableFileLogging = options.enableFileLogging !== undefined ? options.enableFileLogging : true;
    
    // Application name (appears in logs)
    this.appName = options.appName || 'DBS-Bank-API';
    
    // Create logs directory if it doesn't exist
    this.initializeLogDirectory();
  }

  /**
   * Initialize Log Directory
   * Creates the logs folder if it doesn't exist
   */
  initializeLogDirectory() {
    if (this.enableFileLogging && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get Current Timestamp
   * Returns formatted date and time string
   * Format: 2025-10-28 14:30:45
   */
  getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Get Log File Path (not file only path)
   * Creates separate log files for each day
   * Example: logs/2025-10-28.log
   */
  getLogFilePath(level) {
    const today = new Date().toISOString().split('T')[0]; // 2025-10-28
    return path.join(this.logDir, `${level}-${today}.log`);
  }

  /**
   * Format Log Message
   * Creates a structured log message with timestamp, level, and content
   */
  formatMessage(level, message, data = null) {
    const timestamp = this.getTimestamp();
    let logMessage = `[${timestamp}] [${this.appName}] [${level.toUpperCase()}] ${message}`;
    
    // Add additional data if provided (objects, errors, etc.)
    if (data) {
      if (data instanceof Error) {  // check that it current data is error(holding)
        // For errors, include stack trace
        logMessage += `\n  Error: ${data.message}\n  Stack: ${data.stack}`;  // stack trace the function call where error appears
      } else if (typeof data === 'object') {
        // For objects, convert to readable JSON
        logMessage += `\n  Data: ${JSON.stringify(data, null, 2)}`;
      } else {
        logMessage += `\n  Data: ${data}`;
      }
    }
    
    return logMessage;
  }

  /**
   * Write to Log File
   * Appends the log message to the appropriate log file
   */
  writeToFile(level, formattedMessage) {  // level (info , success , error etc)
    if (!this.enableFileLogging) return;
    
    try {
      const logFile = this.getLogFilePath(level); //  get the correct file name(path) of log file
      fs.appendFileSync(logFile, formattedMessage + '\n', 'utf8'); // append the msg in end of file (not overwrite ,just append)
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  /**
   * Core Log Method
   * Internal method used by all log level methods
   */
  log(level, message, data = null) {
    const formattedMessage = this.formatMessage(level, message, data);
    
    // Write to console if enabled
    if (this.enableConsole) {
      // Use different console methods based on level
      switch (level) {
        case 'error':
          console.error(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'debug':
          console.debug(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    }
    
    // Write to file if enabled
    this.writeToFile(level, formattedMessage);
  }

  /**
   * INFO Level - General information
   * Use for: Normal application flow, successful operations
   * Example: User logged in, Order created, API request received
   */
  info(message, data = null) {
    this.log('info', message, data);
  }

  /**
   * WARN Level - Warning messages
   * Use for: Potential issues, deprecated features, unusual but handled situations
   * Example: High memory usage, Slow query, Missing optional field
   */
  warn(message, data = null) {
    this.log('warn', message, data);
  }

  /**
   * ERROR Level - Error messages
   * Use for: Exceptions, failures, critical issues
   * Example: Database connection failed, Payment processing error, Invalid data
   */
  error(message, data = null) {
    this.log('error', message, data);
  }

  /**
   * DEBUG Level - Detailed debugging information
   * Use for: Development debugging, variable values, function calls
   * Example: Request payload, Database query, Variable state
   * Usually disabled in production
   */
  debug(message, data = null) {
    this.log('debug', message, data);
  }

  /**
   * SUCCESS Level - Success messages
   * Use for: Successful operations that need highlighting
   * Example: Payment completed, Email sent, File uploaded
   */
  success(message, data = null) {
    this.log('success', message, data);
  }

  /**
   * HTTP Level - HTTP request/response logging
   * Use for: API requests, endpoints called, response times
   * Example: GET /api/orders - 200 OK (125ms)
   */
  http(message, data = null) {
    this.log('http', message, data);
  }
}

// Create and export a singleton instance
// This ensures the entire app uses the same logger configuration
const logger = new Logger({
  appName: 'DBS-Bank-API',
  enableConsole: true,        // Set to false in production for better performance
  enableFileLogging: true,    // Keep true to maintain log history
  logDir: path.join(__dirname, '../logs')
});

module.exports = logger;

/**
 * USAGE EXAMPLES:
 * 
 * 1. Basic usage in any file:
 *    const logger = require('../utils/logger.util');
 *    logger.info('User logged in successfully');
 * 
 * 2. With additional data:
 *    logger.info('Order created', { orderId: 12345, userId: 67890 });
 * 
 * 3. Error logging:
 *    try {
 *      // some code
 *    } catch (error) {
 *      logger.error('Failed to process order', error);
 *    }
 * 
 * 4. Debug logging:
 *    logger.debug('Request payload', req.body);
 * 
 * 5. HTTP request logging:
 *    logger.http(`${req.method} ${req.path} - ${res.statusCode}`);
 */
