// This file provides a mock database for local development without MongoDB
import { nanoid } from 'nanoid';

// In-memory storage
const teams = new Map();
const games = new Map();
const challenges = new Map();

// Mock collections
export const collections = {
  teams: {
    findOne: async (query: any) => {
      if (query._id) {
        return teams.get(query._id) || null;
      }
      if (query.name) {
        return Array.from(teams.values()).find(team => team.name === query.name) || null;
      }
      return null;
    },
    insertOne: async (doc: any) => {
      teams.set(doc._id, doc);
      return { insertedId: doc._id };
    },
    updateOne: async (query: any, update: any) => {
      if (query._id) {
        const team = teams.get(query._id);
        if (team) {
          const updatedTeam = { ...team };
          if (update.$set) {
            Object.assign(updatedTeam, update.$set);
          }
          teams.set(query._id, updatedTeam);
          return { modifiedCount: 1 };
        }
      }
      return { modifiedCount: 0 };
    },
    find: async (query: any = {}) => {
      const results = Array.from(teams.values());
      // Return object with toArray method to simulate MongoDB cursor
      return {
        toArray: async () => results
      };
    }
  },
  games: {
    findOne: async (query: any) => {
      if (query.teamId) {
        return games.get(query.teamId) || null;
      }
      return null;
    },
    insertOne: async (doc: any) => {
      games.set(doc.teamId, doc);
      return { insertedId: doc.teamId };
    },
    updateOne: async (query: any, update: any) => {
      if (query.teamId) {
        const game = games.get(query.teamId);
        if (game) {
          const updatedGame = { ...game };
          if (update.$set) {
            Object.assign(updatedGame, update.$set);
          }
          if (update.$inc) {
            Object.entries(update.$inc).forEach(([key, value]) => {
              updatedGame[key] = (updatedGame[key] || 0) + Number(value);
            });
          }
          games.set(query.teamId, updatedGame);
          return { modifiedCount: 1 };
        }
      }
      return { modifiedCount: 0 };
    }
  },
  challenges: {
    findOne: async (query: any) => {
      if (query._id) {
        return challenges.get(query._id) || null;
      }
      return null;
    },
    insertOne: async (doc: any) => {
      challenges.set(doc._id, doc);
      return { insertedId: doc._id };
    },
    find: async () => {
      const results = Array.from(challenges.values());
      return {
        toArray: async () => results
      };
    }
  }
};

// Mock database connection
export const mockDb = {
  collection: (name: string) => {
    return collections[name as keyof typeof collections] || {
      findOne: async () => null,
      insertOne: async () => ({ insertedId: nanoid() }),
      updateOne: async () => ({ modifiedCount: 0 }),
      find: async () => ({ toArray: async () => [] })
    };
  }
};

// Mock database connection function
export async function connectToMockDatabase() {
  return {
    client: null,
    db: mockDb
  };
} 