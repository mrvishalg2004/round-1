import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { cookies } from 'next/headers';
import { generateToken } from '@/utils/auth';
import { nanoid } from 'nanoid';

// Set a timeout for this function to ensure it doesn't run too long
const FUNCTION_TIMEOUT = 8000; // 8 seconds (less than Vercel's limit)

export async function POST(req: NextRequest) {
  // Create a timeout promise that rejects after the specified time
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Function execution timed out'));
    }, FUNCTION_TIMEOUT);
  });

  try {
    // Parse request body with timeout protection
    const body = await req.json();
    const { teamName, members } = body;
    
    if (!teamName || !members || !Array.isArray(members) || members.length !== 2) {
      return NextResponse.json(
        { error: 'Team name and exactly two members are required' },
        { status: 400 }
      );
    }
    
    // Create a database operations promise
    const dbOperationsPromise = async () => {
      // Connect to database - this uses connection pooling/caching
      const { db } = await connectToDatabase();
      
      // Check if team name already exists - do this first as it's a quick operation
      const existingTeam = await db.collection('teams').findOne(
        { name: teamName },
        { projection: { _id: 1 } } // Only return the ID field for efficiency
      );
      
      if (existingTeam) {
        return NextResponse.json(
          { error: 'Team name already exists' },
          { status: 400 }
        );
      }
      
      // Generate a short ID for better performance
      const teamId = nanoid(12); // Shorter ID is sufficient and faster
      
      // Create team document
      const team = {
        _id: teamId,
        name: teamName,
        members,
        createdAt: new Date(),
        completedRounds: {
          round1: false,
          round2: false,
          round3: false
        },
        score: 0,
        disqualified: false,
        lastActive: new Date()
      };
      
      // Create game state document
      const gameState = {
        teamId,
        round1Attempts: 0,
        round2Attempts: 0,
        round3Attempts: 0,
        hintsUsed: 0,
        startTime: new Date(),
        endTime: null
      };
      
      // Run database operations in parallel for better performance
      await Promise.all([
        db.collection('teams').insertOne(team),
        db.collection('games').insertOne(gameState)
      ]);
      
      // Generate JWT token
      const token = generateToken({ teamId, teamName });
      
      // Set token in cookie
      const cookieStore = cookies();
      cookieStore.set('token', token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
      });
      
      // Store minimal team info in a cookie for client-side access
      cookieStore.set('team', JSON.stringify({
        id: teamId,
        name: teamName,
        token
      }), {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
      });
      
      return NextResponse.json({
        success: true,
        token,
        team: {
          id: teamId,
          name: teamName,
          members,
          completedRounds: team.completedRounds,
          score: team.score,
          disqualified: team.disqualified
        }
      });
    };
    
    // Race between the DB operations and timeout
    return await Promise.race([dbOperationsPromise(), timeoutPromise]);
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message === 'Function execution timed out') {
      return NextResponse.json(
        { error: 'Registration timeout. Please try again.' },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to register team. Please try again.' },
      { status: 500 }
    );
  }
}

// Generate a random ID
function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let id = '';
  for (let i = 0; i < 22; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
} 