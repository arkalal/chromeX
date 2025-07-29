import { NextResponse } from "next/server";
import { SECURITY_HEADERS, generateCspHeader, RATE_LIMITS, ALLOWED_ORIGINS } from "./utils/securityConfig";
import { rateLimit, getRateLimitHeaders } from "./utils/rateLimiter";

/**
 * Security middleware for ChromeX application
 * Adds essential security headers, rate limiting, and CORS protection to all responses
 */
export function middleware(request) {
  // Apply rate limiting based on route
  const path = request.nextUrl.pathname;
  let rateLimitResult = null;
  
  // Apply stricter rate limits for sensitive endpoints
  if (path.startsWith('/api/auth')) {
    const identifier = request.ip || 'anonymous';
    rateLimitResult = rateLimit(identifier, RATE_LIMITS.AUTH.limit, RATE_LIMITS.AUTH.windowMs);
  } 
  else if (path.startsWith('/api/payments')) {
    const identifier = request.ip || 'anonymous';
    rateLimitResult = rateLimit(identifier, RATE_LIMITS.PAYMENT.limit, RATE_LIMITS.PAYMENT.windowMs);
  }
  else if (path.startsWith('/api/')) {
    const identifier = request.ip || 'anonymous';
    rateLimitResult = rateLimit(identifier, RATE_LIMITS.DEFAULT.limit, RATE_LIMITS.DEFAULT.windowMs);
  }
  
  // Check if rate limited
  if (rateLimitResult && rateLimitResult.limited) {
    return new NextResponse(JSON.stringify({ 
      error: 'Too many requests, please try again later.',
      retryAfter: rateLimitResult.reset
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': rateLimitResult.reset.toString(),
        ...getRateLimitHeaders(rateLimitResult)
      },
    });
  }
  
  // Handle CORS for API routes
  if (path.startsWith('/api/')) {
    // Check if origin is allowed
    const origin = request.headers.get('origin');
    const isAllowedOrigin = !origin || ALLOWED_ORIGINS.includes(origin) || 
                           (process.env.NODE_ENV !== 'production' && origin?.includes('localhost'));
    
    if (request.method === 'OPTIONS') {
      // Handle preflight requests
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
  }

  // Get the incoming response
  const response = NextResponse.next();

  // Add security headers
  const headers = response.headers;

  // Apply CSP header from configuration
  headers.set("Content-Security-Policy", generateCspHeader());

  // Apply all security headers from configuration
  Object.entries(SECURITY_HEADERS).forEach(([name, value]) => {
    headers.set(name, value);
  });
  
  // Add rate limit headers if applicable
  if (rateLimitResult) {
    Object.entries(getRateLimitHeaders(rateLimitResult)).forEach(([name, value]) => {
      headers.set(name, value);
    });
  }

  return response;
}

// Configuration for which paths this middleware applies to
export const config = {
  // Apply to all API and app routes
  matcher: [
    '/api/:path*',
    '/((?!_next/static|favicon.ico|robots.txt).*)',
  ],
};
