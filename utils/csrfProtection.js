/**
 * CSRF Protection utility for ChromeX application
 * Provides utilities to generate, validate, and use CSRF tokens
 */
import crypto from 'crypto';
import { cookies } from 'next/headers';

// CSRF token configuration
const CSRF_COOKIE_NAME = 'chromex_csrf';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_FORM_FIELD = '_csrf';
const TOKEN_BYTE_SIZE = 32;
const EXPIRY_TIME_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a cryptographically secure CSRF token
 * @returns {string} The generated token as hex string
 */
export function generateToken() {
  return crypto.randomBytes(TOKEN_BYTE_SIZE).toString('hex');
}

/**
 * Set a CSRF token in cookies and return the token
 * @param {Object} options Configuration options
 * @returns {string} The generated CSRF token
 */
export function setCsrfCookie(options = {}) {
  const cookieStore = cookies();
  const token = generateToken();
  const secure = process.env.NODE_ENV === 'production';
  
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: secure,
    sameSite: 'strict',
    path: '/',
    maxAge: EXPIRY_TIME_MS / 1000, // Convert to seconds
    ...options
  });
  
  return token;
}

/**
 * Get the CSRF token from cookies
 * @returns {string|null} The CSRF token or null if not found
 */
export function getCsrfToken() {
  const cookieStore = cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Create an HTML input element with the CSRF token
 * @returns {string} HTML for a hidden input field with the CSRF token
 */
export function createCsrfInput() {
  const token = getCsrfToken() || setCsrfCookie();
  return `<input type="hidden" name="${CSRF_FORM_FIELD}" value="${token}" />`;
}

/**
 * Verify a CSRF token from a request
 * @param {Request} request The incoming request
 * @returns {boolean} Whether the token is valid
 */
export function verifyToken(request) {
  try {
    const storedToken = getCsrfToken();
    if (!storedToken) {
      return false;
    }
    
    // Check for token in headers first (API requests)
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    
    // Check form data for form submissions
    const formData = request.formData ? request.formData() : null;
    const formToken = formData ? formData.get(CSRF_FORM_FIELD) : null;
    
    // Use header token or form token
    const providedToken = headerToken || formToken;
    
    // Compare tokens using constant-time comparison to prevent timing attacks
    return providedToken && crypto.timingSafeEqual(
      Buffer.from(storedToken, 'utf8'),
      Buffer.from(providedToken, 'utf8')
    );
  } catch (error) {
    console.error('CSRF token verification error:', error);
    return false;
  }
}

/**
 * CSRF protection middleware for API routes
 * @param {Function} handler The route handler
 * @returns {Function} Middleware-wrapped handler
 */
export function withCsrfProtection(handler) {
  return async function csrfProtectedHandler(request, ...args) {
    // Skip CSRF check for GET, HEAD, OPTIONS requests
    const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    
    if (!safeMethod && !verifyToken(request)) {
      return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate a new token for the response
    const newToken = setCsrfCookie();
    
    // Call the original handler
    const response = await handler(request, ...args);
    
    // Add CSRF token to response headers for XHR requests
    response.headers.append(CSRF_HEADER_NAME, newToken);
    
    return response;
  };
}
