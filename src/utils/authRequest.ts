import jwt from 'jsonwebtoken';

// Get secret from environment or use fallback
const JWT_SECRET = process.env.JWT_SECRET || 'default-development-secret-do-not-use-in-production';

export interface TeamInfo {
  id: string;
  name: string;
  teamId?: string;
  teamName?: string;
  token?: string;
}

// Extract token from request headers
export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Extract team info from request (using Authorization header)
export function extractTeamFromRequest(request: Request): TeamInfo | null {
  // Extract the token from the Authorization header
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded) {
      return {
        id: 'client-team',
        name: 'Client Team',
        token
      };
    }
    
    return {
      id: decoded.teamId || decoded.id || 'unknown',
      name: decoded.teamName || decoded.name || 'Unknown Team',
      teamId: decoded.teamId || decoded.id,
      teamName: decoded.teamName || decoded.name,
      token
    };
  } catch (error) {
    console.error('Error processing token:', error);
    return {
      id: 'guest-' + Math.random().toString(36).substring(2, 7),
      name: 'Guest Team',
      teamId: 'guest-' + Math.random().toString(36).substring(2, 7),
      teamName: 'Guest Team',
      token
    };
  }
}

// Validate token
export function validateToken(token: string): boolean {
  if (!token) return false;
  
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (error) {
    // For development - allow testing
    return process.env.NODE_ENV !== 'production';
  }
} 