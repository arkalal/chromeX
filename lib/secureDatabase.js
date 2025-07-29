/**
 * Secure Database Operations for ChromeX Application
 * 
 * This module provides enhanced security for database operations including:
 * - Input sanitization before database queries
 * - Secure query construction to prevent injection
 * - Output sanitization to prevent data leakage
 */
import { validateObjectId } from '../utils/validation';
import { secureLogger } from '../utils/secureLogger';

/**
 * Securely handles MongoDB operations with proper error handling and validation
 * @param {Function} dbOperation - Async function performing the database operation
 * @param {Object} options - Options for the secure operation
 * @returns {Promise<Object>} Result of the database operation
 */
export async function secureDbOperation(dbOperation, options = {}) {
  const { 
    operationName = 'Database Operation',
    logSuccess = false,
    sanitizeOutput = true
  } = options;
  
  try {
    // Execute the database operation
    const result = await dbOperation();
    
    // Log success if enabled (avoid for read operations to reduce log volume)
    if (logSuccess) {
      secureLogger.debug(`${operationName} completed successfully`, { 
        success: true,
        hasResult: !!result
      });
    }
    
    // Return sanitized result if enabled
    return sanitizeOutput ? sanitizeDbResult(result) : result;
  } catch (error) {
    // Log database errors without exposing sensitive details
    secureLogger.error(`${operationName} failed`, error);
    
    // Throw a sanitized error to avoid exposing internal details
    const sanitizedError = new Error(`Database operation failed: ${error.message}`);
    sanitizedError.code = error.code;
    sanitizedError.status = error.status || 500;
    throw sanitizedError;
  }
}

/**
 * Sanitizes MongoDB query parameters to prevent injection attacks
 * @param {Object} params - Query parameters to sanitize
 * @returns {Object} Sanitized parameters
 */
export function sanitizeQueryParams(params) {
  if (!params || typeof params !== 'object') {
    return {};
  }
  
  const sanitized = { ...params };
  
  // Handle _id field specifically - ensure it's a valid ObjectId
  if (sanitized._id && typeof sanitized._id === 'string') {
    if (!validateObjectId(sanitized._id)) {
      throw new Error('Invalid MongoDB ObjectID format');
    }
  }
  
  // Remove any $ operators in field names at the top level (prevent injection)
  Object.keys(sanitized).forEach(key => {
    if (key.startsWith('$') && !['$or', '$and', '$not', '$nor'].includes(key)) {
      delete sanitized[key];
    }
  });
  
  return sanitized;
}

/**
 * Sanitizes database results before returning to clients
 * @param {Object} result - Database result to sanitize
 * @returns {Object} Sanitized result
 */
function sanitizeDbResult(result) {
  if (!result) {
    return result;
  }
  
  // Handle arrays
  if (Array.isArray(result)) {
    return result.map(item => sanitizeDbResult(item));
  }
  
  // Handle objects (including Mongoose documents)
  if (typeof result === 'object') {
    // Convert to plain object if it's a Mongoose document
    const plainObject = result.toObject ? result.toObject() : { ...result };
    
    // Fields that should be removed from responses
    const sensitiveFields = [
      'password', 'passwordHash', 'salt', 'verificationToken', 
      'resetToken', 'resetTokenExpiry', '__v'
    ];
    
    // Remove sensitive fields
    sensitiveFields.forEach(field => {
      if (field in plainObject) {
        delete plainObject[field];
      }
    });
    
    // Recursively sanitize nested objects
    Object.keys(plainObject).forEach(key => {
      if (typeof plainObject[key] === 'object' && plainObject[key] !== null) {
        plainObject[key] = sanitizeDbResult(plainObject[key]);
      }
    });
    
    return plainObject;
  }
  
  return result;
}

/**
 * Secure wrapper for finding a document by ID
 * @param {Model} model - Mongoose model
 * @param {string} id - Document ID
 * @returns {Promise<Object>} Found document or null
 */
export async function findByIdSecure(model, id) {
  if (!validateObjectId(id)) {
    throw new Error('Invalid document ID format');
  }
  
  return secureDbOperation(async () => {
    return model.findById(id);
  }, { operationName: `Find ${model.modelName} by ID` });
}

/**
 * Secure wrapper for finding documents
 * @param {Model} model - Mongoose model
 * @param {Object} query - Query object
 * @param {Object} options - Find options (projection, sort, limit, etc.)
 * @returns {Promise<Array>} Array of documents
 */
export async function findSecure(model, query = {}, options = {}) {
  const sanitizedQuery = sanitizeQueryParams(query);
  
  return secureDbOperation(async () => {
    return model.find(sanitizedQuery, options.projection, options);
  }, { operationName: `Find ${model.modelName} documents` });
}

/**
 * Secure wrapper for updating a document
 * @param {Model} model - Mongoose model
 * @param {string} id - Document ID
 * @param {Object} updates - Update data
 * @returns {Promise<Object>} Updated document
 */
export async function updateByIdSecure(model, id, updates) {
  if (!validateObjectId(id)) {
    throw new Error('Invalid document ID format');
  }
  
  // Remove any potentially harmful operations from updates
  const sanitizedUpdates = sanitizeQueryParams(updates);
  
  return secureDbOperation(async () => {
    return model.findByIdAndUpdate(id, sanitizedUpdates, { 
      new: true,
      runValidators: true
    });
  }, { 
    operationName: `Update ${model.modelName} by ID`,
    logSuccess: true
  });
}

/**
 * Secure wrapper for creating a new document
 * @param {Model} model - Mongoose model
 * @param {Object} data - Document data
 * @returns {Promise<Object>} Created document
 */
export async function createSecure(model, data) {
  return secureDbOperation(async () => {
    return model.create(data);
  }, { 
    operationName: `Create ${model.modelName}`,
    logSuccess: true
  });
}

/**
 * Secure wrapper for deleting a document
 * @param {Model} model - Mongoose model
 * @param {string} id - Document ID
 * @returns {Promise<Object>} Deleted document or null
 */
export async function deleteByIdSecure(model, id) {
  if (!validateObjectId(id)) {
    throw new Error('Invalid document ID format');
  }
  
  return secureDbOperation(async () => {
    return model.findByIdAndDelete(id);
  }, { 
    operationName: `Delete ${model.modelName} by ID`,
    logSuccess: true
  });
}
