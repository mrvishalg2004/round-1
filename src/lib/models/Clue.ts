import mongoose, { Schema } from 'mongoose';

interface ClueDocument extends mongoose.Document {
  round: number;
  order: number;
  title: string;
  description: string;
  hint?: string;
  imagePath?: string;
  linkPath: string;
  isAnswer: boolean;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

const clueSchema = new Schema({
  round: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  hint: {
    type: String,
    trim: true
  },
  imagePath: {
    type: String,
    trim: true
  },
  linkPath: {
    type: String,
    required: true,
    trim: true
  },
  isAnswer: {
    type: Boolean,
    default: false
  },
  points: {
    type: Number,
    default: 10,
    min: 0
  }
}, {
  timestamps: true
});

// Create a compound index for round and order for faster queries
clueSchema.index({ round: 1, order: 1 }, { unique: true });

// Use mongoose.models to prevent model recompilation error in development
const Clue = mongoose.models.Clue || mongoose.model<ClueDocument>('Clue', clueSchema);

export default Clue; 