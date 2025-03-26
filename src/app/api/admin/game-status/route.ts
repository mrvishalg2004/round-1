import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

let gameStatus = {
  isStarted: false,
  startTime: null
};

export async function GET() {
  try {
    return NextResponse.json(gameStatus);
  } catch (error) {
    console.error('Error fetching game status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { isStarted } = body;

    gameStatus = {
      isStarted,
      startTime: isStarted ? new Date().toISOString() : null
    };

    return NextResponse.json(gameStatus);
  } catch (error) {
    console.error('Error updating game status:', error);
    return NextResponse.json(
      { error: 'Failed to update game status' },
      { status: 500 }
    );
  }
} 