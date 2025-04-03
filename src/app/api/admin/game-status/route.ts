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
      console.log("[Game Status] Loaded from DB:", cachedGameStatus);
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
    
    console.log("[Game Status] Created new entry in DB:", cachedGameStatus);
    return cachedGameStatus;
  } catch (error) {
    console.error('[Game Status] Error fetching from DB:', error);
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
    console.log("[Game Status] Saved to DB:", cachedGameStatus);
    return true;
  } catch (error) {
    console.error('[Game Status] Error saving to DB:', error);
    return false; // Indicate failure but don't throw
  }
}

export async function GET() {
  try {
    const gameStatus = await getGameStatusFromDB();
    return NextResponse.json(gameStatus);
  } catch (error) {
    console.error('[Game Status] Error in GET:', error);
    // Always return valid data even if DB fails
    return NextResponse.json(cachedGameStatus);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[Game Status] POST request body:", body);
    const { isStarted, startTimer, pauseTimer, resetTimer } = body;

    // Update game status
    if (typeof isStarted === 'boolean') {
      cachedGameStatus.isStarted = isStarted;
      cachedGameStatus.startTime = isStarted ? new Date().toISOString() : null;
    }

    // Simplified timer logic for better reliability
    if (startTimer) {
      cachedGameStatus.timerStartedAt = Date.now();
      cachedGameStatus.timerPausedAt = null;
      cachedGameStatus.isTimerRunning = true;
      console.log("[Game Status] Timer started:", cachedGameStatus);
    } else if (pauseTimer) {
      cachedGameStatus.timerPausedAt = Date.now();
      cachedGameStatus.isTimerRunning = false;
      console.log("[Game Status] Timer paused:", cachedGameStatus);
    } else if (resetTimer) {
      cachedGameStatus.timerStartedAt = null;
      cachedGameStatus.timerPausedAt = null;
      cachedGameStatus.isTimerRunning = false;
      console.log("[Game Status] Timer reset:", cachedGameStatus);
    }
    
    // Save to database (but don't wait for it to complete)
    saveGameStatusToDB().catch(err => console.error('[Game Status] Background save failed:', err));

    // Always return the updated status, even if DB save fails
    return NextResponse.json(cachedGameStatus);
  } catch (error) {
    console.error('[Game Status] Error in POST:', error);
    return NextResponse.json(
      { error: 'Failed to update game status' },
      { status: 500 }
    );
  }
} 