'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaAward, FaClock, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { PageProps } from '@/types/next-page-types';

interface TeamActivity {
  id: string;
  teamId: string;
  round: number;
  action: string;
  timestamp: string;
  details?: string;
  score?: number;
}

interface RoundDetail {
  status: 'completed' | 'in-progress' | 'not-started' | 'failed';
  startTime?: string;
  endTime?: string;
  score?: number;
  attempts?: number;
  hints?: number;
}

interface Team {
  id: string;
  name: string;
  members: string[];
  completedRounds: {
    round1: boolean;
    round2: boolean;
    round3: boolean;
  };
  score: number;
  createdAt: string;
  rounds?: {
    round1: RoundDetail;
    round2: RoundDetail;
    round3: RoundDetail;
  };
}

type TeamActivityPageProps = {
  params: {
    id: string;
  };
};

export default function TeamActivity({ params }: TeamActivityPageProps) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Check if admin is authenticated
    const adminAuth = localStorage.getItem('admin_auth');
    if (adminAuth !== 'true') {
      router.push('/admin');
      return;
    }

    // Fetch team data and activity
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teams/${id}/activity`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch team activity');
        }
        
        const data = await response.json();
        
        if (data.team) {
          setTeam(data.team);
        } else {
          setError('Team data not found');
        }
        
        if (data.activities && Array.isArray(data.activities)) {
          setActivities(data.activities);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error('Error fetching team activity:', error);
        setError('Failed to load team activity data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamData();
  }, [id, router]);

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Calculate duration between two timestamps
  const calculateDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMinutes = Math.floor((endTime - startTime) / (60 * 1000));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return `${hours}h ${mins}m`;
    }
  };

  // Get icon for activity action
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'start':
        return <FaClock className="text-blue-400" />;
      case 'complete':
        return <FaCheck className="text-green-400" />;
      case 'attempt':
        return <FaTimes className="text-red-400" />;
      case 'hint':
        return <FaExclamationTriangle className="text-yellow-400" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading team activity...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-6 py-4 rounded-lg">
            <h2 className="text-xl mb-2">Error</h2>
            <p>{error || 'Team not found'}</p>
            <button
              onClick={() => router.push('/admin/teams')}
              className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Back to Teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/admin/teams')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center mr-4"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <div>
            <h1 className="text-3xl font-bold">{team.name} - Activity</h1>
            <p className="text-gray-400">Team Members: {team.members.join(', ')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Round 1 Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Round 1</h2>
              {team.rounds?.round1.status === 'completed' && (
                <div className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs font-medium">
                  Completed
                </div>
              )}
              {team.rounds?.round1.status === 'in-progress' && (
                <div className="bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded text-xs font-medium">
                  In Progress
                </div>
              )}
              {team.rounds?.round1.status === 'not-started' && (
                <div className="bg-gray-700 text-gray-400 px-2 py-1 rounded text-xs font-medium">
                  Not Started
                </div>
              )}
            </div>
            
            {team.rounds?.round1.status !== 'not-started' && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Started:</span>
                  <span>{formatTime(team.rounds?.round1.startTime || '')}</span>
                </div>
                
                {team.rounds?.round1.status === 'completed' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Completed:</span>
                      <span>{formatTime(team.rounds?.round1.endTime || '')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Duration:</span>
                      <span>{calculateDuration(team.rounds?.round1.startTime || '', team.rounds?.round1.endTime || '')}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Attempts:</span>
                  <span>{team.rounds?.round1.attempts}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Hints Used:</span>
                  <span>{team.rounds?.round1.hints}</span>
                </div>
                
                {team.rounds?.round1.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                    <span className="font-medium">Score:</span>
                    <span className="text-xl font-bold text-green-400">{team.rounds?.round1.score} pts</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
          
          {/* Round 2 Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Round 2</h2>
              {team.rounds?.round2.status === 'completed' && (
                <div className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs font-medium">
                  Completed
                </div>
              )}
              {team.rounds?.round2.status === 'in-progress' && (
                <div className="bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded text-xs font-medium">
                  In Progress
                </div>
              )}
              {team.rounds?.round2.status === 'not-started' && (
                <div className="bg-gray-700 text-gray-400 px-2 py-1 rounded text-xs font-medium">
                  Not Started
                </div>
              )}
            </div>
            
            {team.rounds?.round2.status !== 'not-started' && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Started:</span>
                  <span>{formatTime(team.rounds?.round2.startTime || '')}</span>
                </div>
                
                {team.rounds?.round2.status === 'completed' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Completed:</span>
                      <span>{formatTime(team.rounds?.round2.endTime || '')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Duration:</span>
                      <span>{calculateDuration(team.rounds?.round2.startTime || '', team.rounds?.round2.endTime || '')}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Attempts:</span>
                  <span>{team.rounds?.round2.attempts}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Hints Used:</span>
                  <span>{team.rounds?.round2.hints}</span>
                </div>
                
                {team.rounds?.round2.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                    <span className="font-medium">Score:</span>
                    <span className="text-xl font-bold text-green-400">{team.rounds?.round2.score} pts</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
          
          {/* Round 3 Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Round 3</h2>
              {team.rounds?.round3.status === 'completed' && (
                <div className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs font-medium">
                  Completed
                </div>
              )}
              {team.rounds?.round3.status === 'in-progress' && (
                <div className="bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded text-xs font-medium">
                  In Progress
                </div>
              )}
              {team.rounds?.round3.status === 'not-started' && (
                <div className="bg-gray-700 text-gray-400 px-2 py-1 rounded text-xs font-medium">
                  Not Started
                </div>
              )}
            </div>
            
            {team.rounds?.round3.status !== 'not-started' && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Started:</span>
                  <span>{formatTime(team.rounds?.round3.startTime || '')}</span>
                </div>
                
                {team.rounds?.round3.status === 'completed' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Completed:</span>
                      <span>{formatTime(team.rounds?.round3.endTime || '')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Duration:</span>
                      <span>{calculateDuration(team.rounds?.round3.startTime || '', team.rounds?.round3.endTime || '')}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Attempts:</span>
                  <span>{team.rounds?.round3.attempts}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Hints Used:</span>
                  <span>{team.rounds?.round3.hints}</span>
                </div>
                
                {team.rounds?.round3.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                    <span className="font-medium">Score:</span>
                    <span className="text-xl font-bold text-green-400">{team.rounds?.round3.score} pts</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Total Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mb-8"
        >
          <div className="flex items-center">
            <FaAward className="text-yellow-400 text-4xl mr-4" />
            <div>
              <h2 className="text-2xl font-bold">Total Score</h2>
              <p className="text-gray-400">Combined score from all completed rounds</p>
            </div>
            <div className="ml-auto text-4xl font-bold text-yellow-400">{team.score} pts</div>
          </div>
        </motion.div>
        
        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
        >
          <h2 className="text-2xl font-bold mb-6">Activity Timeline</h2>
          
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-700"></div>
            
            {activities.map((activity, index) => (
              <div key={activity.id} className="mb-6 ml-10 relative">
                {/* Timeline dot */}
                <div className="absolute left-[-21px] top-1 w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center z-10">
                  {getActionIcon(activity.action)}
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center mb-1">
                  <div className="font-semibold text-base mr-4">
                    {activity.action === 'start' && `Started Round ${activity.round}`}
                    {activity.action === 'complete' && `Completed Round ${activity.round}`}
                    {activity.action === 'attempt' && `Attempted Round ${activity.round}`}
                    {activity.action === 'hint' && `Requested Hint for Round ${activity.round}`}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {formatDate(activity.timestamp)} at {formatTime(activity.timestamp)}
                  </div>
                </div>
                
                {activity.details && (
                  <div className="text-gray-300 mt-1">{activity.details}</div>
                )}
                
                {activity.score && (
                  <div className="text-green-400 font-medium mt-1">Scored {activity.score} points</div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 