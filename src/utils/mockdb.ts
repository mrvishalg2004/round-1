// Mock database for development/testing when MongoDB is not available
import { nanoid } from 'nanoid';

interface Team {
  _id: string;
  name: string;
  members: string[];
  createdAt: Date;
  completedRounds: {
    round1: boolean;
    round2: boolean;
    round3: boolean;
  };
  score: number;
  disqualified: boolean;
  lastActive: Date;
}

interface GameState {
  teamId: string;
  round1Attempts: number;
  round2Attempts: number;
  round3Attempts: number;
  hintsUsed: number;
  startTime: Date;
  endTime: Date | null;
}

// In-memory storage
const teams: Team[] = [];
const games: GameState[] = [];

// Mock database methods
export const mockDb = {
  collection: (name: string) => {
    switch (name) {
      case 'teams':
        return {
          findOne: (query: any) => {
            const { name } = query;
            return Promise.resolve(teams.find(team => team.name === name) || null);
          },
          insertOne: (doc: Team) => {
            teams.push(doc);
            return Promise.resolve({ insertedId: doc._id });
          },
          find: () => {
            return {
              toArray: () => Promise.resolve([...teams])
            };
          }
        };
      case 'games':
        return {
          findOne: (query: any) => {
            const { teamId } = query;
            return Promise.resolve(games.find(game => game.teamId === teamId) || null);
          },
          insertOne: (doc: GameState) => {
            games.push(doc);
            return Promise.resolve({ insertedId: doc.teamId });
          }
        };
      default:
        return {
          findOne: () => Promise.resolve(null),
          insertOne: () => Promise.resolve({ insertedId: nanoid() }),
          find: () => ({
            toArray: () => Promise.resolve([])
          })
        };
    }
  }
};

// Export mock client and db
export const mockClient = {
  close: () => Promise.resolve()
};

export default { mockDb, mockClient }; 