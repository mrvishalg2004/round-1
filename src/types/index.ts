export interface TeamProgress {
  currentRound: number;
  round1Completed: boolean;
  round2Completed: boolean;
  round3Completed: boolean;
  attempts: {
    round1: number;
    round2: number;
    round3: number;
  };
  scores: {
    round1: number;
    round2: number;
    round3: number;
  };
  stats: {
    round1?: {
      timeSpent: number;
      hintUsed: boolean;
      completedAt: Date;
    };
    round2?: {
      timeSpent: number;
      hintUsed: boolean;
      completedAt: Date;
    };
    round3?: {
      timeSpent: number;
      hintUsed: boolean;
      completedAt: Date;
    };
  };
  roundStartTimes: {
    round1?: Date;
    round2?: Date;
    round3?: Date;
  };
  roundCompletionTimes: {
    round1?: Date;
    round2?: Date;
    round3?: Date;
  };
}

export interface TeamMember {
  name: string;
  email: string;
}

export interface ITeam extends Document {
  teamName: string;
  members: TeamMember[];
  progress: TeamProgress;
  createdAt: Date;
  totalScore?: number;
}

export interface IGame extends Document {
  currentRound: number;
  round1: {
    active: boolean;
    startTime: Date;
    endTime?: Date;
    qualifiedTeams: number;
    maxQualifyingTeams: number;
  };
  round2: {
    active: boolean;
    startTime?: Date;
    endTime?: Date;
    qualifiedTeams: number;
    maxQualifyingTeams: number;
    challengeQuote: string;
    codeSnippet?: string;
  };
  round3: {
    active: boolean;
    startTime?: Date;
    endTime?: Date;
    qualifiedTeams: number;
    maxQualifyingTeams: number;
    encryptionMethod: 'caesar' | 'base64' | 'aes';
  };
  gameCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
} 