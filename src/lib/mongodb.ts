import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import { mockDb, mockClient } from '@/utils/mockdb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'https-find';

// Global variables for connection caching
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient | any; db: Db | any }> {
  // If connection exists, return it (fast path)
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // For development without MongoDB, use mock database
  if (!MONGODB_URI || MONGODB_URI.includes('username:password')) {
    console.warn('No valid MongoDB URI found. Using mock database for development.');
    // Return the mock database
    cachedClient = mockClient;
    cachedDb = mockDb as any;
    return { client: mockClient, db: mockDb };
  }

  try {
    // Connection options to speed up initial connection
    const options = {
      maxPoolSize: 10, // Increase connection pool for parallelism
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Timeout for socket operations
      connectTimeoutMS: 5000, // Timeout for initial connection
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    };

    // Connect with improved options
    const client = await MongoClient.connect(MONGODB_URI, options);
    const db = client.db(MONGODB_DB);

    // Cache for future reuse across serverless invocations
    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB database:', error);
    
    // Fall back to mock database if MongoDB connection fails
    console.warn('Falling back to mock database due to connection error.');
    cachedClient = mockClient;
    cachedDb = mockDb as any;
    return { client: mockClient, db: mockDb };
  }
}

// Add default export
export default connectToDatabase; 