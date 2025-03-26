import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Get team data
    const team = await db.collection('teams').findOne({ _id: id });
    
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    
    // Transform the data to match the expected format
    const transformedTeam = {
      id: team._id.toString(),
      name: team.teamName || team.name,
      members: team.members || [],
      completedRounds: team.completedRounds || team.progress?.completedRounds || {
        round1: false,
        round2: false,
        round3: false
      },
      score: team.score || 0,
      createdAt: team.createdAt || new Date().toISOString()
    };
    
    return NextResponse.json({ team: transformedTeam });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { name, members, completedRounds, score } = body;
    
    // Validate required fields
    if (!name || !members || !Array.isArray(members) || members.length < 2) {
      return NextResponse.json(
        { error: 'Name and at least 2 members are required' },
        { status: 400 }
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Update team in database
    const result = await db.collection('teams').updateOne(
      { _id: id },
      { 
        $set: {
          name: name,
          members: members,
          completedRounds: completedRounds,
          score: score
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Team updated successfully',
      team: {
        id,
        name,
        members,
        completedRounds,
        score
      }
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 