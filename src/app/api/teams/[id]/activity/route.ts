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
    
    // Transform the team data 
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
      createdAt: team.createdAt || new Date().toISOString(),
      rounds: team.rounds || {
        round1: {
          status: team.completedRounds?.round1 ? 'completed' : 'not-started',
          startTime: team.roundStartTimes?.round1 || null,
          endTime: team.roundEndTimes?.round1 || null,
          score: team.roundScores?.round1 || 0,
          attempts: team.roundAttempts?.round1 || 0,
          hints: team.roundHints?.round1 || 0
        },
        round2: {
          status: team.completedRounds?.round2 ? 'completed' : (team.completedRounds?.round1 ? 'not-started' : 'locked'),
          startTime: team.roundStartTimes?.round2 || null,
          endTime: team.roundEndTimes?.round2 || null,
          score: team.roundScores?.round2 || 0,
          attempts: team.roundAttempts?.round2 || 0,
          hints: team.roundHints?.round2 || 0
        },
        round3: {
          status: team.completedRounds?.round3 ? 'completed' : (team.completedRounds?.round2 ? 'not-started' : 'locked'),
          startTime: team.roundStartTimes?.round3 || null,
          endTime: team.roundEndTimes?.round3 || null,
          score: team.roundScores?.round3 || 0,
          attempts: team.roundAttempts?.round3 || 0,
          hints: team.roundHints?.round3 || 0
        }
      }
    };
    
    // Get team activities
    const activities = await db.collection('activities')
      .find({ teamId: id })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    
    // Transform activities
    const transformedActivities = activities.map(activity => ({
      id: activity._id.toString(),
      teamId: activity.teamId,
      round: activity.round,
      action: activity.action,
      timestamp: activity.timestamp,
      details: activity.details || null,
      score: activity.score || null
    }));
    
    // If no activities found, return mock data for demo purposes
    if (transformedActivities.length === 0) {
      // Generate some mock activities based on team's progress
      const mockActivities = generateMockActivities(transformedTeam);
      return NextResponse.json({ 
        team: transformedTeam,
        activities: mockActivities
      });
    }
    
    return NextResponse.json({ 
      team: transformedTeam,
      activities: transformedActivities
    });
  } catch (error) {
    console.error('Error fetching team activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team activity', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Helper function to generate mock activities for demo purposes
function generateMockActivities(team: any) {
  const activities = [];
  const now = new Date();
  
  // For each completed round, add activities
  if (team.completedRounds.round1) {
    activities.push({
      id: `mock-${Date.now()}-1`,
      teamId: team.id,
      round: 1,
      action: 'started',
      timestamp: new Date(now.getTime() - 3600000).toISOString(),
      details: 'Round 1 started'
    });
    
    activities.push({
      id: `mock-${Date.now()}-2`,
      teamId: team.id,
      round: 1,
      action: 'hint-used',
      timestamp: new Date(now.getTime() - 3300000).toISOString(),
      details: 'Used hint for challenge'
    });
    
    activities.push({
      id: `mock-${Date.now()}-3`,
      teamId: team.id,
      round: 1,
      action: 'completed',
      timestamp: new Date(now.getTime() - 3000000).toISOString(),
      details: 'Round 1 completed successfully',
      score: 250
    });
  }
  
  if (team.completedRounds.round2) {
    activities.push({
      id: `mock-${Date.now()}-4`,
      teamId: team.id,
      round: 2,
      action: 'started',
      timestamp: new Date(now.getTime() - 2500000).toISOString(),
      details: 'Round 2 started'
    });
    
    activities.push({
      id: `mock-${Date.now()}-5`,
      teamId: team.id,
      round: 2,
      action: 'wrong-answer',
      timestamp: new Date(now.getTime() - 2300000).toISOString(),
      details: 'Submitted incorrect solution'
    });
    
    activities.push({
      id: `mock-${Date.now()}-6`,
      teamId: team.id,
      round: 2,
      action: 'completed',
      timestamp: new Date(now.getTime() - 2000000).toISOString(),
      details: 'Round 2 completed successfully',
      score: 300
    });
  }
  
  if (team.completedRounds.round3) {
    activities.push({
      id: `mock-${Date.now()}-7`,
      teamId: team.id,
      round: 3,
      action: 'started',
      timestamp: new Date(now.getTime() - 1500000).toISOString(),
      details: 'Round 3 started'
    });
    
    activities.push({
      id: `mock-${Date.now()}-8`,
      teamId: team.id,
      round: 3,
      action: 'completed',
      timestamp: new Date(now.getTime() - 1000000).toISOString(),
      details: 'Round 3 completed successfully',
      score: 400
    });
  }
  
  return activities;
} 