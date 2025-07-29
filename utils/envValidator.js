/**
 * Environment Variable Validator for ChromeX Application
 * 
 * This utility validates that all required environment variables are present
 * and properly formatted, providing clear error messages when they're not.
 */

// List of required environment variables by environment
const requiredEnvVars = {
  // Required in all environments
  all: [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'MONGODB_URI',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ],
  
  // Additional variables required in production only
  production: [
    'DODO_PAYMENTS_API_KEY',
    'DODO_WEBHOOK_KEY',
    'NEXT_PUBLIC_BASE_URL'
  ]
};

/**
 * Validates that all required environment variables are present
 * @returns {Object} Result with success flag and missing variables if any
 */
export function validateEnv() {
  const environment = process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';
  
  // Determine which variables to check based on environment
  const varsToCheck = [...requiredEnvVars.all];
  if (isProduction) {
    varsToCheck.push(...requiredEnvVars.production);
  }
  
  // Check for missing variables
  const missing = [];
  for (const envVar of varsToCheck) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  // Return validation result
  return {
    success: missing.length === 0,
    missing,
    environment
  };
}

/**
 * Validates environment variables and throws an error if any are missing
 * @throws {Error} If any required environment variables are missing
 */
export function validateEnvOrThrow() {
  const result = validateEnv();
  
  if (!result.success) {
    const missingVars = result.missing.join(', ');
    throw new Error(`Missing required environment variables: ${missingVars}`);
  }
  
  return true;
}

/**
 * Gets a redacted version of environment variables suitable for logging
 * @returns {Object} Redacted environment variables
 */
export function getRedactedEnv() {
  const redacted = {};
  
  // Get all environment variable names
  const envVarNames = Object.keys(process.env);
  
  // Process each environment variable
  for (const name of envVarNames) {
    const value = process.env[name];
    
    // Skip if no value
    if (!value) {
      redacted[name] = undefined;
      continue;
    }
    
    // Redact sensitive values
    const isSensitive = /key|token|secret|password|credential|auth|private|cert/i.test(name);
    
    if (isSensitive) {
      // Show limited info for sensitive values
      redacted[name] = `${value.substring(0, 1)}***${value.substring(value.length - 1)}`;
    } else {
      redacted[name] = value;
    }
  }
  
  return redacted;
}

/**
 * Checks if we're in development mode
 * @returns {boolean} True if in development mode
 */
export function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Checks if we're in production mode
 * @returns {boolean} True if in production mode
 */
export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Checks if we're in test mode
 * @returns {boolean} True if in test mode
 */
export function isTest() {
  return process.env.NODE_ENV === 'test';
}
