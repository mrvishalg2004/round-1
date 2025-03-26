import mongoose, { Schema } from 'mongoose';

interface RoundConfig {
  active: boolean;
  startTime: Date;
  endTime?: Date;
  maxQualifyingTeams: number;
  qualifiedTeams: number;
  settings?: {
    timeLimit?: number;
    attempts?: number;
    hints?: boolean;
  };
}

interface GameDocument extends mongoose.Document {
  currentRound: number;
  round1: RoundConfig;
  round2: RoundConfig;
  round3: RoundConfig;
  createdAt: Date;
  updatedAt: Date;
}

const roundConfigSchema = new Schema({
  active: { type: Boolean, default: false },
  startTime: { type: Date },
  endTime: { type: Date },
  maxQualifyingTeams: { type: Number, default: 50 },
  qualifiedTeams: { type: Number, default: 0 },
  settings: {
    timeLimit: { type: Number }, // in minutes
    attempts: { type: Number },
    hints: { type: Boolean, default: true }
  }
});

const gameSchema = new Schema({
  currentRound: { 
    type: Number, 
    required: true,
    default: 1,
    min: 1,
    max: 3
  },
  round1: { 
    type: roundConfigSchema,
    default: () => ({
      active: true,
      startTime: new Date(),
      maxQualifyingTeams: 50,
      qualifiedTeams: 0
    })
  },
  round2: { 
    type: roundConfigSchema,
    default: () => ({
      active: false,
      maxQualifyingTeams: 30,
      qualifiedTeams: 0
    })
  },
  round3: { 
    type: roundConfigSchema,
    default: () => ({
      active: false,
      maxQualifyingTeams: 10,
      qualifiedTeams: 0
    })
  }
}, {
  timestamps: true
});

// Create a singleton game instance if none exists
gameSchema.statics.initialize = async function() {
  const count = await this.countDocuments();
  if (count === 0) {
    await this.create({
      currentRound: 1,
      round1: {
        active: true,
        startTime: new Date(),
        maxQualifyingTeams: 50,
        qualifiedTeams: 0
      }
    });
    console.log('Game instance initialized');
  }
};

// Use mongoose.models to prevent model recompilation error in development
const Game = mongoose.models.Game || mongoose.model<GameDocument>('Game', gameSchema);

export default Game; 