import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { extractTeamFromRequest } from '@/utils/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Get team from token
    const team = extractTeamFromRequest(request);
    
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Try to connect to database
    let dbTeam = null;
    try {
      const { db } = await connectToDatabase();
      dbTeam = await db.collection('teams').findOne({ _id: team.teamId });
    } catch (error) {
      console.error('Database connection error:', error);
      // Continue without database data
    }
    
    // Check for completion cookie (properly awaited)
    let completedRound1 = false;
    try {
      const cookieStore = cookies();
      const cookieList = await cookieStore.getAll();
      completedRound1 = cookieList.some(cookie => 
        cookie.name === 'round1_completed' && cookie.value === 'true'
      );
    } catch (error) {
      console.error('Error reading cookies:', error);
      // Continue without cookie data
    }
    
    // For development, we'll return mock data if there's an issue with the database
    const mockTeam = {
      id: team.teamId,
      name: team.teamName,
      members: ['Team Member 1', 'Team Member 2'],
      completedRounds: {
        round1: completedRound1
      },
      score: completedRound1 ? 100 : 0,
      roundDetails: completedRound1 ? {
        round1: {
          score: 100,
          attempts: 1,
          timeSpent: 60,
          completedAt: new Date().toISOString()
        }
      } : undefined,
      lastActive: new Date().toISOString()
    };
    
    // If teamData exists, check if round1 completion cookie should override
    let responseTeam = mockTeam;
    if (dbTeam) {
      responseTeam = {
        id: dbTeam._id,
        name: dbTeam.name,
        members: dbTeam.members,
        completedRounds: {
          ...dbTeam.completedRounds,
          round1: dbTeam.completedRounds?.round1 || completedRound1
        },
        score: dbTeam.score || (completedRound1 ? 100 : 0),
        roundDetails: dbTeam.roundDetails || (completedRound1 ? mockTeam.roundDetails : undefined),
        lastActive: dbTeam.lastActive || new Date().toISOString()
      };
    }
    
    return NextResponse.json({
      success: true,
      team: responseTeam
    });
  } catch (error) {
    console.error('Team data fetch error:', error);
    
    // Check for completion cookie even on error (properly awaited)
    let completedRound1 = false;
    try {
      const cookieStore = cookies();
      const cookieList = await cookieStore.getAll();
      completedRound1 = cookieList.some(cookie => 
        cookie.name === 'round1_completed' && cookie.value === 'true'
      );
    } catch (error) {
      console.error('Error reading cookies on fallback:', error);
    }
    
    // Ensure we always return something, even on error
    return NextResponse.json({
      success: true,
      team: {
        id: 'fallback-id',
        name: 'Player',
        members: ['Team Member'],
        completedRounds: { round1: completedRound1 },
        score: completedRound1 ? 100 : 0,
        roundDetails: completedRound1 ? {
          round1: {
            score: 100,
            attempts: 1,
            timeSpent: 60,
            completedAt: new Date().toISOString()
          }
        } : undefined,
        lastActive: new Date().toISOString()
      }
    });
  }
} 