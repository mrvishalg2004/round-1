import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    // Get team name from request
    const body = await request.json();
    const { name } = body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Team name is required' },
        { status: 400 }
      );
    }
    
    // Generate a unique ID
    const teamId = nanoid();
    
    try {
      // Connect to database and add team
      const { db } = await connectToDatabase();
      
      // Check if team name already exists
      const existingTeam = await db.collection('teams').findOne({ name: name.trim() });
      
      if (existingTeam) {
        // If team exists, just return it
        return NextResponse.json({
          success: true,
          message: 'Team already exists',
          team: {
            id: existingTeam._id,
            name: existingTeam.name,
            members: existingTeam.members || ['Player'],
            createdAt: existingTeam.createdAt,
            gameStatus: await getGameStatus()
          }
        });
      }
      
      // Create a new team
      const newTeam = {
        _id: teamId,
        name: name.trim(),
        members: ['Player'], // Default member
        completedRounds: {
          round1: false,
          round2: false,
          round3: false
        },
        score: 0,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        disqualified: false
      };
      
      await db.collection('teams').insertOne(newTeam);
      
      // Get current game status
      const gameStatus = await getGameStatus();
      
      // Return team data with game status
      return NextResponse.json({
        success: true,
        message: 'Team registered successfully',
        team: {
          id: teamId,
          name: name.trim(),
          members: ['Player'],
          createdAt: newTeam.createdAt
        },
        gameStatus
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Even if there's a DB error, we still want to return something
      // so the user can continue
      return NextResponse.json({
        success: true,
        message: 'Team registered (offline mode)',
        team: {
          id: teamId,
          name: name.trim(),
          members: ['Player'],
          createdAt: new Date().toISOString()
        },
        gameStatus: { isStarted: false }
      });
    }
  } catch (error) {
    console.error('Error registering team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register team' },
      { status: 500 }
    );
  }
}

// Helper to get current game status
async function getGameStatus() {
  try {
    const { db } = await connectToDatabase();
    const settings = await db.collection('settings').findOne({ type: 'game_status' });
    
    if (settings) {
      return {
        isStarted: settings.isStarted,
        startTime: settings.startTime
      };
    }
    
    return { isStarted: false };
  } catch (error) {
    console.error('Error fetching game status:', error);
    return { isStarted: false };
  }
} 