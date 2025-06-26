import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "../lib/mongodb";

/**
 * This file contains the full NextAuth configuration with MongoDB
 * It should ONLY be imported in server components or API routes
 * DO NOT IMPORT this in middleware.js or any Edge Runtime code
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
  session: { strategy: "jwt" },
  pages: {
    signIn: '/', // Keep users on the main page for sign-in
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
