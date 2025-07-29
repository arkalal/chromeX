/**
 * Input validation utilities for ChromeX application
 * Provides validation helpers to ensure input safety
 */

// Regular expressions for validation
const PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  safeString: /^[^<>&"'`]*$/,
  alphanumeric: /^[a-zA-Z0-9]*$/,
};

/**
 * Validates that all required fields are present
 * @param {Object} input - The input object to validate
 * @param {Array<string>} requiredFields - List of fields that must exist and not be empty
 * @returns {boolean} True if all required fields are present
 */
export function validateRequired(input, requiredFields) {
  if (!input || typeof input !== 'object') return false;
  
  return requiredFields.every(field => {
    const value = input[field];
    return value !== undefined && value !== null && value !== '';
  });
}

/**
 * Validates email format
 * @param {string} email - The email address to validate
 * @returns {boolean} True if email is valid
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return PATTERNS.email.test(email);
}

/**
 * Validates URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} True if URL is valid
 */
export function validateUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return PATTERNS.url.test(url);
}

/**
 * Sanitizes a string to prevent XSS
 * @param {string} input - The string to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (!input || typeof input !== 'string') return '';
  
  // Basic HTML entities escaping
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates that a number is within a range
 * @param {number} value - The number to validate
 * @param {number} min - Minimum allowed value (inclusive)
 * @param {number} max - Maximum allowed value (inclusive)
 * @returns {boolean} True if the value is within range
 */
export function validateRange(value, min, max) {
  const numValue = Number(value);
  if (isNaN(numValue)) return false;
  return numValue >= min && numValue <= max;
}

/**
 * Validates a MongoDB ObjectId format
 * @param {string} id - The ID to validate
 * @returns {boolean} True if the ID appears to be in valid ObjectId format
 */
export function validateObjectId(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validates request origin against allowed list
 * @param {string} origin - The origin to validate
 * @param {Array<string>} allowedOrigins - List of allowed origins
 * @returns {boolean} True if origin is allowed
 */
export function validateOrigin(origin, allowedOrigins) {
  if (!origin || !allowedOrigins || !Array.isArray(allowedOrigins)) return false;
  return allowedOrigins.some(allowed => origin === allowed || 
    (allowed.endsWith('*') && origin.startsWith(allowed.slice(0, -1))));
}

/**
 * Creates a validation result object
 * @param {boolean} valid - Whether the validation passed
 * @param {string} message - Error message if validation failed
 * @returns {Object} Validation result with valid and message properties
 */
export function validationResult(valid, message = '') {
  return { valid, message: valid ? '' : message };
}
