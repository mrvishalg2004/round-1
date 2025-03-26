import jwt from 'jsonwebtoken';

// Remove server-side imports - this is a client-side utility file
// import { cookies } from 'next/headers';

// Get secret from environment or use fallback
const JWT_SECRET = process.env.JWT_SECRET || 'default-development-secret-do-not-use-in-production';

export interface TokenPayload {
  teamId: string;
  teamName: string;
}

// Generate JWT token
export function generateToken(payload: any): string {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d' // Token expires in 7 days
    });
  } catch (error) {
    console.error('Error generating token:', error);
    // Return a dummy token for development
    return `dev-token-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Extract team ID from token
export function getTeamFromToken(token: string): string | null {
  try {
    const decoded = verifyToken(token);
    return decoded?.teamId || null;
  } catch (error) {
    return null;
  }
}

// Extract team info from cookies
export function extractTeamFromCookies(cookies: any): { id: string; name: string } | null {
  try {
    const teamCookie = cookies.get('team')?.value;
    if (!teamCookie) return null;
    
    const team = JSON.parse(teamCookie);
    return team.id && team.name ? { id: team.id, name: team.name } : null;
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function getTeamFromToken(request: Request): TeamInfo | null {
  // Extract the token from the Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  if (!token) {
    return null;
  }
  
  try {
    // For client-side, we just need to return the token info
    // The actual verification happens on the server
    return {
      id: 'client-team',
      name: 'Client Team',
      token
    };
  } catch (error) {
    console.error('Error processing token:', error);
    return null;
  }
}

// Client-side authentication utilities

interface TeamInfo {
  id: string;
  name: string;
  token?: string;
}

// Get team info from cookie
export function getTeamInfo(): TeamInfo | null {
  try {
    const cookies = document.cookie.split(';');
    const teamCookie = cookies.find(cookie => cookie.trim().startsWith('team='));
    
    if (teamCookie) {
      return JSON.parse(decodeURIComponent(teamCookie.split('=')[1]));
    }
    
    return null;
  } catch (error) {
    console.error('Error getting team info:', error);
    return null;
  }
}

// Check if the user has completed a specific round
export function hasCompletedRound(roundName: string): boolean {
  try {
    const cookies = document.cookie.split(';');
    const roundCookie = cookies.find(cookie => cookie.trim().startsWith(`${roundName}_completed=`));
    return roundCookie?.split('=')[1] === 'true';
  } catch (error) {
    console.error(`Error checking completion for ${roundName}:`, error);
    return false;
  }
} 