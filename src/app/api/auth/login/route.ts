import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { generateToken } from '@/utils/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamName } = body;
    
    if (!teamName) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Find team in database
    const team = await db.collection('teams').findOne({ 
      name: teamName 
    });
    
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    
    // Check if team is disqualified
    if (team.disqualified) {
      return NextResponse.json(
        { error: 'Your team has been disqualified from the game' },
        { status: 403 }
      );
    }
    
    // Update last active
    await db.collection('teams').updateOne(
      { _id: team._id },
      { $set: { lastActive: new Date() } }
    );
    
    // Generate JWT token
    const token = generateToken({ 
      teamId: team._id.toString(), 
      teamName: team.name 
    });
    
    return NextResponse.json({
      success: true,
      token,
      team: {
        id: team._id.toString(),
        name: team.name,
        members: team.members,
        completedRounds: team.completedRounds,
        score: team.score
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to log in' },
      { status: 500 }
    );
  }
} 