/**
 * Security Configuration for ChromeX Application
 * 
 * Centralized security settings that can be used across the application
 * to ensure consistent security implementation.
 */

// API rate limits for different endpoints
export const RATE_LIMITS = {
  // Default API rate limits
  DEFAULT: {
    limit: 60,            // 60 requests
    windowMs: 60 * 1000,  // per minute
    message: 'Too many requests, please try again later'
  },
  
  // Stricter limits for authentication endpoints
  AUTH: {
    limit: 10,            // 10 requests
    windowMs: 60 * 1000,  // per minute
    message: 'Too many authentication attempts, please try again later'
  },
  
  // Special limits for payment endpoints
  PAYMENT: {
    limit: 15,            // 15 requests
    windowMs: 60 * 1000,  // per minute
    message: 'Too many payment attempts, please try again later'
  },
  
  // Very strict limits for webhook endpoints
  WEBHOOK: {
    limit: 120,           // 120 requests
    windowMs: 60 * 1000,  // per minute
    message: 'Webhook rate limit exceeded'
  }
};

// Content Security Policy settings
export const CSP_SETTINGS = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
  connectSrc: ["'self'", "https://api.openai.com", "https://*.dodo-payments.com"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  imgSrc: ["'self'", "data:", "https://*.googleusercontent.com"],
  frameSrc: ["'self'"]
};

// Allowed origins for CORS
export const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://chromex.vercel.app',
  // Add production domains here
];

// Security headers for the application
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)'
};

// Validation rules for common inputs
export const VALIDATION_RULES = {
  email: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: 'Please enter a valid email address'
  },
  password: {
    minLength: 8,
    message: 'Password must be at least 8 characters long'
  },
  username: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9._-]+$/,
    message: 'Username must be 3-50 characters and may contain letters, numbers, and ._-'
  },
  url: {
    pattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    message: 'Please enter a valid URL'
  }
};

// Cookie security settings
export const COOKIE_SETTINGS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Auth-related security settings
export const AUTH_SETTINGS = {
  SESSION_MAX_AGE: 24 * 60 * 60, // 24 hours in seconds
  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'dev_jwt_secret'),
  OAUTH_PROVIDERS: ['google'],
  PASSWORD_RESET_TIMEOUT: 30 * 60 * 1000 // 30 minutes
};

// Helper function to construct a full CSP header from settings
export function generateCspHeader() {
  const directives = Object.entries(CSP_SETTINGS).map(([key, values]) => {
    return `${key} ${values.join(' ')}`;
  });
  
  return directives.join('; ');
}
