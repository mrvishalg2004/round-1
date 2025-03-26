// This is a simplified Team model that doesn't require a database connection

export interface TeamMember {
  name: string;
  email?: string;
}

export interface RoundCompletion {
  score: number;
  attempts: number;
  timeSpent: number;
  completedAt: string;
}

export interface RoundDetails {
  round1?: RoundCompletion;
}

export interface CompletedRounds {
  round1?: boolean;
}

export interface Team {
  _id: string;
  name: string;
  members: string[];
  completedRounds: CompletedRounds;
  score: number;
  roundDetails?: RoundDetails;
  createdAt: string;
  lastActive: string;
}

export const createTeam = (data: Partial<Team>): Team => {
  return {
    _id: data._id || `team_${Date.now()}`,
    name: data.name || 'Guest Team',
    members: data.members || [],
    completedRounds: data.completedRounds || { round1: false },
    score: data.score || 0,
    roundDetails: data.roundDetails,
    createdAt: data.createdAt || new Date().toISOString(),
    lastActive: data.lastActive || new Date().toISOString()
  };
};

// Get team from cookie data
export const getTeamFromCookie = (cookieData: string): Partial<Team> => {
  try {
    const teamData = JSON.parse(decodeURIComponent(cookieData));
    return {
      _id: teamData.id,
      name: teamData.name
    };
  } catch (error) {
    console.error('Error parsing team cookie data:', error);
    return {
      _id: `guest_${Date.now()}`,
      name: 'Guest'
    };
  }
}; 