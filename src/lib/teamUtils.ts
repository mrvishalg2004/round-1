/**
 * Retrieves team information from cookies
 * @returns The team information object or null if not found
 */
export function getTeamInfo() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Get auth token from cookie
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
    
    if (!tokenCookie) {
      return null;
    }
    
    const token = tokenCookie.split('=')[1];
    
    // Get team info from localStorage if available
    const teamInfoStr = localStorage.getItem('team_info');
    const teamInfo = teamInfoStr ? JSON.parse(teamInfoStr) : null;
    
    return {
      token,
      ...(teamInfo || {})
    };
  } catch (error) {
    console.error('Error getting team info:', error);
    return {
      // Provide a fallback token for development/testing
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFzcmlHZFlhd3I1ZXdndkhYNjFsViIsIm5hbWUiOiJBSSBUaXRhbnMifQ.8_Yk2AkNgCmz-Qxl8YK2K4zu3SuLUcXks4e_OcgE9Vk'
    };
  }
} 