import mongoose from 'mongoose';
import { MongoClient } from "mongodb";

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

// Ensure we connect to the 'browzpot' database specifically
const MONGODB_URI = `${process.env.MONGODB_URI}browzpot`;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

// Initialize mongoose connection
mongoose.set('strictQuery', false);

// Handle mongoose connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Connect mongoose
let mongooseConnected = false;

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached.promise = MongoClient.connect(MONGODB_URI, opts).then((client) => {
      return {
        client,
      };
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Create a client for native MongoDB operations
const client = new MongoClient(MONGODB_URI);

// Export a module-scoped MongoClient
export default client;

// Database connection function
export async function connectToDatabase() {
  try {
    // If mongoose is already connected, just return the database
    if (mongooseConnected && mongoose.connection.readyState === 1) {
      console.log('Reusing existing mongoose connection');
      return client.db();
    }
    
    // Connect mongoose if not already connected
    // Remove deprecated options (useNewUrlParser and useUnifiedTopology are no longer needed)
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    mongooseConnected = true;
    console.log('New mongoose connection established');
    
    // Also connect the native client if needed
    await client.connect();
    
    return client.db();
  } catch (error) {
    console.error('Failed to connect to the database', error);
    mongooseConnected = false;
    throw error;
  }
}
