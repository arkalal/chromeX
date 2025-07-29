/**
 * ChromeX Security Setup and Configuration
 * 
 * This module centralizes and initializes security features for the application.
 * It handles initialization of security components and provides helpers for secure coding.
 */
import { initializeApp, registerShutdownHooks } from '../utils/appStartup';
import { secureLogger } from '../utils/secureLogger';
import { validateEnvOrThrow } from '../utils/envValidator';

/**
 * Initialize all security components for the application
 * Should be called during application startup
 */
export function initializeSecurity() {
  try {
    // Initialize core application with environment checks
    initializeApp();
    
    // Register graceful shutdown hooks
    registerShutdownHooks();
    
    // Log successful initialization
    secureLogger.info('Security components initialized successfully');
    
    return true;
  } catch (error) {
    secureLogger.error('Security initialization failed', error);
    throw error;
  }
}

/**
 * Helper function to securely sanitize data for API responses
 * Prevents accidental leakage of sensitive information
 * 
 * @param {Object} data - The data object to sanitize
 * @returns {Object} - Sanitized data safe for API responses
 */
export function sanitizeApiResponse(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // Create a copy to avoid modifying the original
  const sanitized = Array.isArray(data) 
    ? [...data] 
    : { ...data };
    
  // Fields that should never be returned in API responses
  const sensitiveFields = [
    'password', 'hashedPassword', 'salt', 'secret', 'token', 'apiKey',
    'refreshToken', 'verificationToken', 'resetToken', 'sessionToken'
  ];
  
  // Remove sensitive fields from the response
  if (!Array.isArray(sanitized)) {
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });
    
    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeApiResponse(sanitized[key]);
      }
    });
  } else {
    // Handle arrays of objects
    for (let i = 0; i < sanitized.length; i++) {
      if (typeof sanitized[i] === 'object' && sanitized[i] !== null) {
        sanitized[i] = sanitizeApiResponse(sanitized[i]);
      }
    }
  }
  
  return sanitized;
}

/**
 * Helper function to wrap API handlers with standardized security checks
 * 
 * @param {Function} handler - The API route handler function
 * @returns {Function} - Enhanced handler with security checks
 */
export function withSecureApi(handler) {
  return async function secureApiHandler(req, res) {
    try {
      // Apply security checks before calling handler
      // You can add authentication checks, CSRF validation, etc. here
      
      // Call the original handler
      return await handler(req, res);
    } catch (error) {
      // Log the error securely
      secureLogger.error('API error', error);
      
      // Return a sanitized error response
      const status = error.status || 500;
      const message = process.env.NODE_ENV === 'production'
        ? 'An error occurred while processing your request'
        : error.message;
      
      return res.status(status).json({ error: message });
    }
  };
}
