/**
 * Application Startup Utility for ChromeX
 * 
 * This module handles initialization tasks for the application:
 * 1. Environment variable validation
 * 2. Secure configuration checks
 * 3. Logging of startup state
 */
import { validateEnvOrThrow, getRedactedEnv } from './envValidator';
import { secureLogger } from './secureLogger';

/**
 * Initializes the application with required security checks
 * Should be called during app initialization
 */
export function initializeApp() {
  try {
    // Validate environment variables are present
    validateEnvOrThrow();
    
    // Log application startup in a secure way (no sensitive data)
    const environment = process.env.NODE_ENV || 'development';
    secureLogger.info(`ChromeX application starting in ${environment} mode`, {
      environment,
      node_version: process.version,
    });
    
    // In development, provide more verbose configuration details
    if (environment === 'development') {
      const redactedEnv = getRedactedEnv();
      secureLogger.debug('Application environment variables', redactedEnv);
    }
    
    return true;
  } catch (error) {
    // Log error but don't expose sensitive details
    secureLogger.error('Application initialization failed', error);
    
    // Re-throw to prevent app from starting with invalid configuration
    throw error;
  }
}

/**
 * Registers application shutdown hooks for graceful cleanup
 */
export function registerShutdownHooks() {
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    secureLogger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    secureLogger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
  
  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error) => {
    secureLogger.error('Uncaught exception', error);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    secureLogger.error('Unhandled promise rejection', { reason });
    process.exit(1);
  });
}
