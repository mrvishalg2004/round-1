import { MongoClient, Db } from 'mongodb';
import { mockClient, mockDb, connectToMockDB } from './mock-db';

// Make sure the MongoDB URI is in the correct format
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rounds:rounds123@aiodysseyrounds.rr88p.mongodb.net/?retryWrites=true&w=majority&appName=AIODYSSEYRounds';
const MONGODB_DB = process.env.MONGODB_DB || 'https-find';

// Set this to true to force using the mock database
const FORCE_MOCK_DB = false;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// Track connection state
let isConnecting = false;
let connectionError = false;
let usingMockDb = false;

export async function connectToDatabase(): Promise<{ client: MongoClient | typeof mockClient; db: Db | typeof mockDb }> {
  // If forced to use mock DB or previously switched to mock DB
  if (FORCE_MOCK_DB || usingMockDb) {
    return connectToMockDB();
  }

  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // If we're already trying to connect, avoid multiple simultaneous connection attempts
  if (isConnecting) {
    // Wait a bit and try again
    await new Promise(resolve => setTimeout(resolve, 500));
    return connectToDatabase();
  }

  // If we previously failed to connect, switch to mock DB
  if (connectionError) {
    console.log('Using mock database due to previous connection failure');
    usingMockDb = true;
    return connectToMockDB();
  }

  if (!MONGODB_URI) {
    console.warn('No MONGODB_URI defined, using mock database');
    usingMockDb = true;
    return connectToMockDB();
  }

  if (!MONGODB_DB) {
    console.warn('No MONGODB_DB defined, using mock database');
    usingMockDb = true;
    return connectToMockDB();
  }

  try {
    isConnecting = true;
    console.log('Connecting to MongoDB...');
    
    // Create a new client with connection options
    const client = new MongoClient(MONGODB_URI, {
      // Add any specific connection options here if needed
    });
    
    // Connect with a timeout
    const connectPromise = client.connect();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), 10000);
    });
    
    await Promise.race([connectPromise, timeoutPromise]);
    
    // Get the database
    const db = client.db(MONGODB_DB);

    cachedClient = client;
    cachedDb = db;
    connectionError = false;
    console.log('Connected to MongoDB successfully');

    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    connectionError = true;
    usingMockDb = true;
    
    // Reset connection error after some time to allow retries
    setTimeout(() => {
      connectionError = false;
    }, 30000); // Try real DB again after 30 seconds
    
    return connectToMockDB();
  } finally {
    isConnecting = false;
  }
}

// Add default export
export default connectToDatabase; 