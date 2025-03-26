import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    // Parse request body to get team ID
    const body = await req.json();
    const { teamId } = body;
    
    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Update the team to mark it as disqualified
    const updateResult = await db.collection('teams').updateOne(
      { _id: teamId },
      { $set: { disqualified: true, lastActive: new Date().toISOString() } }
    );
    
    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }
    
    console.log(`Disqualified team: ${teamId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Team disqualified successfully',
      teamId
    });
  } catch (error) {
    console.error('Error disqualifying team:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to disqualify team',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 