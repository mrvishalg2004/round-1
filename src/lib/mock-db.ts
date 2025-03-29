/**
 * Mock MongoDB implementation for fallback when database is unavailable
 */

// In-memory collections
const collections: Record<string, any[]> = {};

// Fake MongoDB client and db
export const mockClient = {
  isConnected: () => true,
  close: () => Promise.resolve()
};

export const mockDb = {
  collection: (name: string) => {
    // Create collection if it doesn't exist
    if (!collections[name]) {
      collections[name] = [];
    }
    
    return {
      // Find one document
      findOne: async (query: any) => {
        return collections[name].find(doc => {
          for (const key in query) {
            if (doc[key] !== query[key]) {
              return false;
            }
          }
          return true;
        }) || null;
      },
      
      // Find multiple documents
      find: () => ({
        toArray: async () => {
          return [...collections[name]];
        }
      }),
      
      // Insert a document
      insertOne: async (doc: any) => {
        // Add _id if not present
        if (!doc._id) {
          doc._id = Math.random().toString(36).substring(2, 15);
        }
        collections[name].push(doc);
        return { insertedId: doc._id, acknowledged: true };
      },
      
      // Update a document
      updateOne: async (query: any, update: any, options: any = {}) => {
        const index = collections[name].findIndex(doc => {
          for (const key in query) {
            if (doc[key] !== query[key]) {
              return false;
            }
          }
          return true;
        });
        
        if (index === -1) {
          if (options.upsert) {
            // Create new document
            const newDoc = { ...query };
            if (update.$set) {
              Object.assign(newDoc, update.$set);
            }
            return mockDb.collection(name).insertOne(newDoc);
          }
          return { matchedCount: 0, modifiedCount: 0, acknowledged: true };
        }
        
        // Update existing document
        if (update.$set) {
          collections[name][index] = {
            ...collections[name][index],
            ...update.$set
          };
        }
        
        return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
      },
      
      // Delete a document
      deleteOne: async (query: any) => {
        const initialLength = collections[name].length;
        collections[name] = collections[name].filter(doc => {
          for (const key in query) {
            if (doc[key] === query[key]) {
              return false;
            }
          }
          return true;
        });
        
        return {
          deletedCount: initialLength - collections[name].length,
          acknowledged: true
        };
      }
    };
  }
};

// Mock connection function
export async function connectToMockDB() {
  return {
    client: mockClient,
    db: mockDb
  };
} 