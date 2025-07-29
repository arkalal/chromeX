/**
 * Rate limiter utility for ChromeX API routes
 * Uses in-memory store for development and can be extended to use Redis in production
 */

// Simple in-memory store (will reset on server restart)
// For production, consider using Redis or another persistent store
const ipRequestCounts = new Map();
const userRequestCounts = new Map();

/**
 * Simple rate limiter for API routes
 * @param {string} identifier - IP address or user ID to track
 * @param {number} limit - Maximum number of requests allowed in the window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} - Object with limited flag and remaining requests
 */
export function rateLimit(identifier, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const key = `${identifier}`;
  
  // Get or initialize rate limiting data for this identifier
  let data = ipRequestCounts.get(key) || { 
    count: 0, 
    resetAt: now + windowMs
  };
  
  // Reset counter if the window has passed
  if (now > data.resetAt) {
    data = { 
      count: 0, 
      resetAt: now + windowMs
    };
  }
  
  // Increment request count
  data.count += 1;
  ipRequestCounts.set(key, data);
  
  // Check if limit is exceeded
  const limited = data.count > limit;
  const remaining = Math.max(0, limit - data.count);
  const reset = Math.ceil((data.resetAt - now) / 1000); // seconds until reset
  
  return {
    limited,
    remaining,
    reset,
    limit
  };
}

/**
 * Rate limiter middleware for API routes
 * @param {Object} options - Rate limiting options
 * @returns {Function} - Middleware function
 */
export function withRateLimit(options = {}) {
  const {
    limit = 60,           // Default: 60 requests per window
    windowMs = 60 * 1000, // Default: 1 minute
    keyGenerator = req => req.ip || 'anonymous',
    handler = null,       // Custom handler for rate limit exceeded
    skipIfAuthenticated = false // Skip rate limiting for authenticated users
  } = options;
  
  return async function rateLimit(request) {
    const session = request.session; // Assumes auth session is attached to request
    
    // Skip rate limiting for authenticated users if option is enabled
    if (skipIfAuthenticated && session && session.user) {
      return null; // No rate limiting
    }
    
    // Generate key for rate limiting (IP or user ID)
    const key = keyGenerator(request);
    
    // Apply rate limiting
    const result = rateLimit(key, limit, windowMs);
    
    // If limit exceeded and custom handler provided, use it
    if (result.limited && handler) {
      return handler(request, result);
    }
    
    // Return result for middleware to use
    return result;
  };
}

/**
 * Creates headers for rate limiting response
 * @param {Object} rateLimitResult - Result from rateLimit function
 * @returns {Object} - Headers object
 */
export function getRateLimitHeaders(rateLimitResult) {
  if (!rateLimitResult) return {};
  
  return {
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': rateLimitResult.reset.toString()
  };
}
