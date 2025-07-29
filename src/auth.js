import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "../lib/mongodb";
import { AUTH_SETTINGS } from "../utils/securityConfig";
import { secureLogger } from "../utils/secureLogger";

/**
 * This file contains the full NextAuth configuration with MongoDB
 * It should ONLY be imported in server components or API routes
 * DO NOT IMPORT this in middleware.js or any Edge Runtime code
 * 
 * Enhanced with security best practices:
 * - JWT session with short lifetime
 * - MongoDB adapter with secure session storage
 * - Secure cookie settings
 * - Advanced security event logging
 */

// Create provider configuration
const providers = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
];

// Complete NextAuth configuration with Node.js dependencies
const authOptions = {
  adapter: MongoDBAdapter(client),
  providers,
  // Use JWT strategy with enhanced security settings
  session: { 
    strategy: "jwt",
    maxAge: AUTH_SETTINGS.SESSION_MAX_AGE, // Short-lived sessions (24 hours)
  },
  pages: {
    signIn: '/', // Keep users on the main page for sign-in
    error: '/auth/error', // Custom error page
  },
  // Secure cookie settings
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  // Debug mode only in development
  debug: process.env.NODE_ENV === 'development',
  // Log security events
  events: {
    async signIn(message) { 
      secureLogger.info('User signed in', { userId: message.user.id, provider: message.account?.provider })
    },
    async signOut(message) {
      secureLogger.info('User signed out', { userId: message.token?.sub })
    },
    async createUser(message) {
      secureLogger.info('New user created', { userId: message.user.id })
    },
    async linkAccount(message) {
      secureLogger.info('Account linked', { userId: message.user.id, provider: message.account.provider })
    },
  },
  callbacks: {
    // Enhance JWT with user information
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    // Add user information to session
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    },
  },
};

// Export Auth.js utilities
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
