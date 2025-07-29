/**
 * Secure Logger for ChromeX Application
 * 
 * This utility provides secure logging functions that automatically
 * redact sensitive information in production environments.
 */

// Fields that may contain sensitive data and should be redacted in logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'secret',
  'auth',
  'jwt',
  'cookie',
  'session',
  'key',
  'credential',
  'credit_card',
  'card',
  'cvv',
  'ssn',
  'email',
  'phone'
];

/**
 * Redacts sensitive information from an object
 * @param {Object} data - The object to sanitize
 * @returns {Object} - A copy of the object with sensitive data redacted
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  // Create a copy of the object to avoid modifying the original
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    
    // Check if this is a sensitive field that should be redacted
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      if (typeof sanitized[key] === 'string') {
        // Redact the value but keep the first and last character for debugging
        const value = sanitized[key];
        if (value.length > 4) {
          sanitized[key] = `${value.substring(0, 1)}*****${value.substring(value.length - 1)}`;
        } else {
          sanitized[key] = '*****';
        }
      } else if (typeof sanitized[key] === 'number') {
        sanitized[key] = '***REDACTED***';
      }
    }
    // Recursively sanitize nested objects
    else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Secure logger that redacts sensitive information in production
 */
export const secureLogger = {
  /**
   * Log information with sensitive data redacted in production
   * @param {string} message - Log message
   * @param {Object} data - Data to log
   */
  info: (message, data = {}) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const logData = isProduction ? sanitizeData(data) : data;
    console.log(`[INFO] ${message}`, logData);
  },
  
  /**
   * Log warnings with sensitive data redacted in production
   * @param {string} message - Warning message
   * @param {Object} data - Data to log
   */
  warn: (message, data = {}) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const logData = isProduction ? sanitizeData(data) : data;
    console.warn(`[WARN] ${message}`, logData);
  },
  
  /**
   * Log errors with sensitive data redacted in production
   * @param {string} message - Error message
   * @param {Object|Error} error - Error object or data
   */
  error: (message, error = {}) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Handle Error objects specially
    if (error instanceof Error) {
      const safeError = {
        message: error.message,
        name: error.name,
        stack: isProduction ? undefined : error.stack
      };
      console.error(`[ERROR] ${message}`, safeError);
    } else {
      const logData = isProduction ? sanitizeData(error) : error;
      console.error(`[ERROR] ${message}`, logData);
    }
  },
  
  /**
   * Debug logging that is completely disabled in production
   * @param {string} message - Debug message
   * @param {Object} data - Data to log
   */
  debug: (message, data = {}) => {
    // Skip debug logs entirely in production
    if (process.env.NODE_ENV === 'production') return;
    
    console.debug(`[DEBUG] ${message}`, data);
  }
};

export default secureLogger;
