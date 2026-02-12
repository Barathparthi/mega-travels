import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  // Check if already connected
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If connection is in progress, wait for it
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      if (mongoose.connection.readyState === 1) {
        return cached.conn;
      }
    } catch (e) {
      cached.promise = null;
      // Fall through to reconnect
    }
  }

  // Create new connection
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
    
    // Verify connection state
    if (mongoose.connection.readyState !== 1) {
      const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      console.error(`❌ MongoDB connection state: ${states[mongoose.connection.readyState]}`);
      cached.promise = null;
      cached.conn = null;
      throw new Error(`Database connection failed. State: ${states[mongoose.connection.readyState]}`);
    }
    
    console.log('✅ MongoDB connected successfully');
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
