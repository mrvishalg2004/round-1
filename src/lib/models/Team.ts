import mongoose from 'mongoose';

// Define the schema for round details
interface RoundDetails {
  completed: boolean;
  score: number;
  attempts: number;
  timeSpent: number;
  hintUsed: boolean;
  completedAt: Date;
}

// Define the schema for completed rounds
interface CompletedRounds {
  round1: boolean;
  round2: boolean;
  round3: boolean;
}

// Define the interface for the Team document
export interface TeamDocument extends Document {
  name: string;
  members: string[];
  completedRounds: CompletedRounds;
  roundDetails?: {
    round1?: RoundDetails;
    round2?: RoundDetails;
    round3?: RoundDetails;
  };
  score: number;
  createdAt: Date;
  lastActive: Date;
}

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  members: [{
    type: String,
    required: true
  }],
  completedRounds: {
    round1: {
      type: Boolean,
      default: false
    }
  },
  score: {
    type: Number,
    default: 0
  },
  roundDetails: {
    round1: {
      score: Number,
      attempts: Number,
      timeSpent: Number,
      completedAt: Date
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

export const Team = mongoose.models.Team || mongoose.model('Team', teamSchema); 