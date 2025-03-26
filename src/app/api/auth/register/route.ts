import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { generateToken } from '@/utils/auth';
import { nanoid } from 'nanoid';

// Get JWT secret from environment or use a default (in a real app, never hardcode this)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamName, members } = body;
    
    if (!teamName || !members || !Array.isArray(members) || members.length !== 2) {
      return NextResponse.json(
        { error: 'Team name and exactly two members are required' },
        { status: 400 }
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Check if team name already exists
    const existingTeam = await db.collection('teams').findOne({ name: teamName });
    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team name already exists' },
        { status: 400 }
      );
    }
    
    // Create team
    const teamId = nanoid();
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
    
    await db.collection('teams').insertOne(team);
    
    // Create game state for the team
    const gameState = {
      teamId,
      round1Attempts: 0,
      round2Attempts: 0,
      round3Attempts: 0,
      hintsUsed: 0,
      startTime: new Date(),
      endTime: null
    };
    
    await db.collection('games').insertOne(gameState);
    
    // Generate JWT
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
    
    // Also store team info in a cookie for client-side access
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
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register team' },
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