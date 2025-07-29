/**
 * Authentication middleware for ChromeX application
 * 
 * This middleware focuses only on authentication protection for private routes
 * and works alongside the root middleware that handles security headers and rate limiting.
 * 
 * This approach avoids MongoDB Edge runtime issues by using JWT verification
 * without database queries.
 */

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  // Get the path being requested
  const path = request.nextUrl.pathname;
  
  // Only run auth checks on protected routes
  if (!isProtectedRoute(path)) {
    return NextResponse.next();
  }
  
  // Verify authentication token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // If no valid token, redirect to login
  if (!token) {
    const url = new URL('/login', request.url);
    // Add the original URL as a query parameter to redirect back after login
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // User is authenticated, continue
  return NextResponse.next();
}

/**
 * Determines if a route should be protected by authentication
 * @param {string} path - The URL path to check
 * @returns {boolean} - Whether the route is protected
 */
function isProtectedRoute(path) {
  // List of path prefixes that require authentication
  const protectedPrefixes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/notes', 
    '/billing'
  ];
  
  // Check if path starts with any protected prefix
  return protectedPrefixes.some(prefix => path.startsWith(prefix));
}

// Run middleware only on these routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/notes/:path*',
    '/billing/:path*'
  ],
};
