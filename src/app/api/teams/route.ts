import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    console.log('Connected to database');
    
    // Get teams with all necessary details
    const teams = await db.collection('teams').find({}).toArray();
    
    console.log('Raw teams data:', JSON.stringify(teams, null, 2));
    
    // Transform the data to match the expected format
    const transformedTeams = teams.map(team => ({
      id: team._id.toString(),
      name: team.teamName || team.name,
      members: team.members || [],
      completedRounds: team.completedRounds || team.progress?.completedRounds || {
        round1: false,
        round2: false,
        round3: false
      },
      score: team.score || 0,
      createdAt: team.createdAt || new Date().toISOString(),
      lastActive: team.lastActive || new Date().toISOString(),
      disqualified: team.disqualified || false,
      isWinner: team.isWinner || false,
      isLoser: team.isLoser || false
    }));
    
    console.log('Transformed teams:', JSON.stringify(transformedTeams, null, 2));
    
    return NextResponse.json({ teams: transformedTeams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get team ID from the URL
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Delete the team from the database
    const result = await db.collection('teams').deleteOne({ _id: id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Team not found or could not be deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get request body
    const body = await req.json();
    const { name, members } = body;
    
    // Validate required fields
    if (!name || !members || !Array.isArray(members) || members.length < 2) {
      return NextResponse.json(
        { error: 'Name and at least 2 members are required' },
        { status: 400 }
      );
    }
    
    // Generate a unique team ID (in a production app, this would be handled by the database)
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Check if team name already exists
    const existingTeam = await db.collection('teams').findOne({ name: name });
    
    if (existingTeam) {
      return NextResponse.json(
        { error: 'A team with this name already exists' },
        { status: 400 }
      );
    }
    
    // Create team in database
    const newTeam = {
      _id: teamId,
      name: name,
      members: members,
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
    
    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      team: {
        id: teamId,
        name: name,
        members: members,
        completedRounds: {
          round1: false,
          round2: false,
          round3: false
        },
        score: 0,
        createdAt: newTeam.createdAt,
        disqualified: false
      }
    });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 