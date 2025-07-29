// Simple middleware for token verification
// This approach avoids the MongoDB Edge runtime issues

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  // No database queries in middleware - just token verification
  const token = await getToken({ req: request });
  
  // Protected routes can be added here if needed
  // For now, we're not protecting any routes to avoid Edge runtime issues
  
  return NextResponse.next();
}

// Run middleware on specific routes
export const config = {
  matcher: [
    // Path to protect would go here. Currently not protecting any paths
    // Example: "/dashboard/:path*", "/profile"
  ],
};
