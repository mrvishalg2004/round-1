import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Check if teams already exist
    const existingTeams = await db.collection('teams').find({}).toArray();
    if (existingTeams.length > 0) {
      return NextResponse.json({ 
        message: `Found ${existingTeams.length} existing teams.`, 
        count: existingTeams.length,
        existingTeams: existingTeams.map(team => team._id)
      });
    }

    // Sample teams data
    const sampleTeams = [
      {
        name: 'Team Alpha',
        members: ['John Doe', 'Jane Smith'],
        scores: [100, 85, 120],
        completedRounds: 3,
        createdAt: new Date()
      },
      {
        name: 'Team Beta',
        members: ['Alice Johnson', 'Bob Brown'],
        scores: [95, 75, 0],
        completedRounds: 2,
        createdAt: new Date()
      },
      {
        name: 'Team Gamma',
        members: ['Eva Green', 'Michael Scott'],
        scores: [110, 0, 0],
        completedRounds: 1,
        createdAt: new Date()
      }
    ];

    // Insert teams into database
    const result = await db.collection('teams').insertMany(sampleTeams);

    return NextResponse.json({ 
      message: `Successfully seeded ${result.insertedCount} teams.`,
      count: result.insertedCount,
      insertedIds: result.insertedIds
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
} 