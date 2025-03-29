import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// In-memory cache of game status
let cachedGameStatus = {
  isStarted: false,
  startTime: null,
  timerStartedAt: null,
  timerPausedAt: null,
  isTimerRunning: false,
  timerDuration: 10 * 60 * 1000 // 10 minutes in milliseconds
};

// Function to get game status (first from database, fallback to in-memory)
async function getGameStatusFromDB() {
  try {
    const { db } = await connectToDatabase();
    const settings = await db.collection('settings').findOne({ type: 'game_status' });
    
    if (settings) {
      cachedGameStatus = {
        isStarted: settings.isStarted,
        startTime: settings.startTime,
        timerStartedAt: settings.timerStartedAt,
        timerPausedAt: settings.timerPausedAt,
        isTimerRunning: settings.isTimerRunning || false,
        timerDuration: settings.timerDuration || (10 * 60 * 1000)
      };
      return cachedGameStatus;
    }
    
    // If not found in DB, save current cache to DB
    await db.collection('settings').updateOne(
      { type: 'game_status' },
      { $set: { 
          isStarted: cachedGameStatus.isStarted, 
          startTime: cachedGameStatus.startTime, 
          timerStartedAt: cachedGameStatus.timerStartedAt,
          timerPausedAt: cachedGameStatus.timerPausedAt,
          isTimerRunning: cachedGameStatus.isTimerRunning,
          timerDuration: cachedGameStatus.timerDuration,
          type: 'game_status' 
        } 
      },
      { upsert: true }
    );
    
    return cachedGameStatus;
  } catch (error) {
    console.error('Error fetching game status from DB:', error);
    return cachedGameStatus; // Fallback to cached
  }
}

// Function to save game status to DB (with error handling)
async function saveGameStatusToDB() {
  try {
    const { db } = await connectToDatabase();
    await db.collection('settings').updateOne(
      { type: 'game_status' },
      { $set: { 
          isStarted: cachedGameStatus.isStarted, 
          startTime: cachedGameStatus.startTime, 
          timerStartedAt: cachedGameStatus.timerStartedAt,
          timerPausedAt: cachedGameStatus.timerPausedAt,
          isTimerRunning: cachedGameStatus.isTimerRunning,
          timerDuration: cachedGameStatus.timerDuration,
          type: 'game_status' 
        } 
      },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error('Error saving game status to DB:', error);
    return false; // Indicate failure but don't throw
  }
}

export async function GET() {
  try {
    const gameStatus = await getGameStatusFromDB();
    return NextResponse.json(gameStatus);
  } catch (error) {
    console.error('Error fetching game status:', error);
    // Always return valid data even if DB fails
    return NextResponse.json(cachedGameStatus);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { isStarted, startTimer, pauseTimer, resetTimer } = body;

    // Update game status
    if (typeof isStarted === 'boolean') {
      cachedGameStatus.isStarted = isStarted;
      cachedGameStatus.startTime = isStarted ? new Date().toISOString() : null;
    }

    // Handle timer actions
    if (startTimer) {
      const now = Date.now();
      // If timer was paused, we need to adjust the start time to account for the pause duration
      if (cachedGameStatus.timerPausedAt && !cachedGameStatus.isTimerRunning) {
        const pauseDuration = now - cachedGameStatus.timerPausedAt;
        if (cachedGameStatus.timerStartedAt) {
          cachedGameStatus.timerStartedAt = cachedGameStatus.timerStartedAt + pauseDuration;
        } else {
          cachedGameStatus.timerStartedAt = now;
        }
      } else if (!cachedGameStatus.timerStartedAt) {
        // If timer was never started
        cachedGameStatus.timerStartedAt = now;
      }
      cachedGameStatus.timerPausedAt = null;
      cachedGameStatus.isTimerRunning = true;
    } else if (pauseTimer) {
      cachedGameStatus.timerPausedAt = Date.now();
      cachedGameStatus.isTimerRunning = false;
    } else if (resetTimer) {
      cachedGameStatus.timerStartedAt = null;
      cachedGameStatus.timerPausedAt = null;
      cachedGameStatus.isTimerRunning = false;
    }
    
    // Save to database (but don't wait for it to complete)
    saveGameStatusToDB().catch(err => console.error('Background save failed:', err));

    // Always return the updated status, even if DB save fails
    return NextResponse.json(cachedGameStatus);
  } catch (error) {
    console.error('Error updating game status:', error);
    return NextResponse.json(
      { error: 'Failed to update game status' },
      { status: 500 }
    );
  }
} 