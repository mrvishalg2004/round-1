import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    // Update all teams to reset their progress
    const updateResult = await db.collection('teams').updateMany(
      {}, // Match all teams
      { 
        $set: { 
          completedRounds: {
            round1: false,
            round2: false,
            round3: false
          },
          score: 0,
          lastActive: new Date().toISOString() 
        } 
      }
    );
    
    console.log(`Reset game: Updated ${updateResult.modifiedCount} teams`);
    
    return NextResponse.json({
      success: true,
      message: 'Game reset successful',
      teamsUpdated: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('Error resetting game:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset game',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 