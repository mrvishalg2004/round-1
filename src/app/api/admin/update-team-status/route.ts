import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    // Get request body for team status update
    const body = await req.json();
    const { teamId, isWinner, isLoser, isDisqualified } = body;
    
    console.log('Team status update request:', { teamId, isWinner, isLoser, isDisqualified });
    
    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Create update object with only the fields we're changing
    const updateFields: any = {
      lastActive: new Date().toISOString()
    };
    
    // Only include the fields that were provided in the request
    if (typeof isWinner === 'boolean') updateFields.isWinner = isWinner;
    if (typeof isLoser === 'boolean') updateFields.isLoser = isLoser;
    if (typeof isDisqualified === 'boolean') updateFields.disqualified = isDisqualified;
    
    console.log('Updating team with fields:', updateFields);
    
    // Update the team with new status
    const updateResult = await db.collection('teams').updateOne(
      { _id: teamId },
      { $set: updateFields }
    );
    
    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }
    
    // Get the updated team data
    const updatedTeam = await db.collection('teams').findOne({ _id: teamId });
    
    console.log('Updated team:', updatedTeam);
    
    // Return success response with updated team data
    return NextResponse.json({
      success: true,
      message: 'Team status updated successfully',
      team: {
        id: updatedTeam._id,
        name: updatedTeam.name,
        members: updatedTeam.members || [],
        completedRounds: updatedTeam.completedRounds || {
          round1: false,
          round2: false,
          round3: false
        },
        isWinner: updatedTeam.isWinner || false,
        isLoser: updatedTeam.isLoser || false,
        disqualified: updatedTeam.disqualified || false,
        score: updatedTeam.score || 0,
        lastActive: updatedTeam.lastActive
      }
    });
  } catch (error) {
    console.error('Error updating team status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update team status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 