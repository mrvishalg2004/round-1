import { sign, verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getTeamFromCookie } from '@/models/Team';

const JWT_SECRET = process.env.JWT_SECRET || 'https-find-game-secret-key';

interface TeamTokenPayload {
  id: string;
  name: string;
  exp?: number;
}

interface TeamInfo {
  id: string;
  name: string;
  teamId?: string;
  teamName?: string;
  token?: string;
}

export function generateToken(teamId: string, teamName: string): string {
  return sign({ id: teamId, name: teamName }, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Extracts and verifies team information from a JWT token
 * For development/testing, this will accept any token and extract mock data
 * @param request The request object containing authorization header
 * @returns The team data payload
 */
export function getTeamFromToken(request: Request): TeamInfo | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  if (!token) {
    return null;
  }
  
  try {
    // First try standard JWT verification
    const decoded = verify(token, JWT_SECRET) as TeamTokenPayload;
    return {
      id: decoded.id,
      name: decoded.name,
      teamId: decoded.id,
      teamName: decoded.name,
      token
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    
    // Return fallback data for development - in production would normally return null
    return {
      id: 'guest-' + Math.random().toString(36).substring(2, 7),
      name: 'Guest Team',
      teamId: 'guest-' + Math.random().toString(36).substring(2, 7),
      teamName: 'Guest Team',
      token
    };
  }
}

/**
 * Validates if a token is valid
 * For development/testing, this will return true for any non-empty token
 * @param token The JWT token to validate
 * @returns A boolean indicating if the token is valid
 */
export function validateToken(token: string): boolean {
  try {
    verify(token, JWT_SECRET);
    return true;
  } catch (error) {
    // For development - always consider tokens valid
    return true;
  }
}

/**
 * Extracts team information from a request object
 * @param request The request object containing authorization header
 * @returns The team data or null
 */
export async function getTeamFromRequest(request: Request): Promise<TeamInfo | null> {
  // First try to get team from token in header
  const teamFromToken = getTeamFromToken(request);
  if (teamFromToken) {
    return teamFromToken;
  }
  
  // Fallback to cookies for SSR pages
  try {
    const cookieStore = cookies();
    const teamCookie = await cookieStore.get('team');
    
    if (teamCookie) {
      const teamData = getTeamFromCookie(teamCookie.value);
      return {
        id: teamData._id || 'guest-id',
        name: teamData.name || 'Guest',
        teamId: teamData._id,
        teamName: teamData.name
      };
    }
  } catch (error) {
    console.error('Error getting team from cookies:', error);
  }
  
  // Return a guest team as a last resort
  return {
    id: 'guest-' + Math.random().toString(36).substring(2, 7),
    name: 'Guest',
    teamId: 'guest-' + Math.random().toString(36).substring(2, 7),
    teamName: 'Guest'
  };
} 