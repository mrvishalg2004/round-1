import { MongoClient, Db, ServerApiVersion } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/https-find';
const MONGODB_DB = process.env.MONGODB_DB || 'https-find';

// Global variables for connection caching
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // If connection exists, return it (fast path)
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (!MONGODB_DB) {
    throw new Error('Please define the MONGODB_DB environment variable');
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
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

// Add default export
export default connectToDatabase; 