'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowRight, FaUnlock, FaLock, FaTrophy, FaRocket } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { hasCompletedRound } from '@/utils/auth';

interface TeamData {
  id: string;
  name: string;
  members: string[];
  completedRounds: {
    round1: boolean;
  };
  score: number;
  roundDetails?: {
    round1?: {
      score: number;
      attempts: number;
      timeSpent: number;
      completedAt: string;
    }
  };
  lastActive: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  
  // For Round 1 specific view state
  const [showRound1Details, setShowRound1Details] = useState(false);

  useEffect(() => {
    // Check if round 1 is completed via cookie
    const round1Completed = hasCompletedRound('round1');
    
    const fetchTeamData = async () => {
      setLoading(true);
      try {
        // Fetch team data
        const response = await fetch('/api/team');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.team) {
            // Override with cookie data if available
            if (round1Completed && data.team) {
              data.team.completedRounds = {
                ...data.team.completedRounds,
                round1: true
              };
            }
            setTeam(data.team);
            console.log('Team data:', data.team);
          } else {
            console.error('Failed to fetch team data:', data.error);
            
            // Use fallback data based on cookies
            setTeam({
              id: 'guest-id',
              name: 'Guest Team',
              members: ['Guest'],
              completedRounds: { round1: round1Completed },
              score: round1Completed ? 100 : 0,
              lastActive: new Date().toISOString()
            });
          }
        } else {
          console.error('Failed to fetch team data, using fallback');
          
          // Use fallback data based on cookies
          setTeam({
            id: 'guest-id',
            name: 'Guest Team',
            members: ['Guest'],
            completedRounds: { round1: round1Completed },
            score: round1Completed ? 100 : 0,
            lastActive: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
        
        // Use fallback data based on cookies
        setTeam({
          id: 'guest-id',
          name: 'Guest Team',
          members: ['Guest'],
          completedRounds: { round1: round1Completed },
          score: round1Completed ? 100 : 0,
          lastActive: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamData();
  }, [router]);
  
  const startRound = () => {
    router.push('/rounds/round1');
  };
  
  // Toggle Round 1 details
  const toggleRound1Details = () => {
    setShowRound1Details(!showRound1Details);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-2">Team Dashboard</h1>
          <p className="text-xl text-gray-300">Welcome, {team?.name || 'Guest'}</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700"
          >
            <h2 className="text-2xl font-bold mb-6">Your Progress</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <div>
                  <h3 className="font-bold text-lg">Round 1: Hidden Link Hunt</h3>
                  <p className="text-gray-300 text-sm">
                    {team?.completedRounds.round1 ? 'Completed' : 'Not completed'}
                  </p>
                </div>
                <div className="flex items-center">
                  {team?.completedRounds.round1 ? (
                    <FaUnlock className="text-green-500 mr-3" size={20} />
                  ) : (
                    <FaLock className="text-yellow-500 mr-3" size={20} />
                  )}
                  <button
                    onClick={team?.completedRounds.round1 ? toggleRound1Details : startRound}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                  >
                    {team?.completedRounds.round1 ? (showRound1Details ? 'Hide Details' : 'View Details') : 'Start Round'} <FaArrowRight className="ml-2" />
                  </button>
                </div>
              </div>
              
              {/* Round 1 Details Section */}
              {showRound1Details && team?.completedRounds.round1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="p-4 bg-gray-700/30 rounded-lg border border-gray-600 ml-6"
                >
                  <h4 className="font-semibold text-blue-300 mb-3">Round 1 Performance</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Attempts:</span>
                      <span className="font-medium">
                        {team.roundDetails?.round1?.attempts || 1}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Time Spent:</span>
                      <span className="font-medium">
                        {team.roundDetails?.round1?.timeSpent 
                          ? `${Math.floor((team.roundDetails.round1.timeSpent || 0) / 60)}m ${(team.roundDetails.round1.timeSpent || 0) % 60}s`
                          : '1m 0s'
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Completed On:</span>
                      <span className="font-medium">
                        {team.roundDetails?.round1?.completedAt 
                          ? new Date(team.roundDetails.round1.completedAt).toLocaleDateString()
                          : new Date().toLocaleDateString()
                        }
                      </span>
                    </div>
                    
                    <div className="pt-3 mt-3 border-t border-gray-600">
                      <button
                        onClick={startRound}
                        className="w-full bg-green-600 hover:bg-green-700 transition-colors px-4 py-2 rounded-md flex items-center justify-center"
                      >
                        Replay Round <FaRocket className="ml-2" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
          >
            <h2 className="text-2xl font-bold mb-4">Team Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Rounds Completed:</span>
                <span className="font-bold">{team?.completedRounds.round1 ? '1/1' : '0/1'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Members:</span>
                <span className="font-bold">
                  {team?.members ? team.members.join(', ') : 'No members'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Last Active:</span>
                <span className="font-bold">
                  {team?.lastActive ? new Date(team.lastActive).toLocaleDateString() : 'Never'}
                </span>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <FaTrophy className="text-yellow-500 mr-2" /> Team Achievements
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
                    <div className="font-semibold text-yellow-300 mb-1">Hidden Link Hunter</div>
                    <div className="text-sm text-gray-300">
                      {team?.completedRounds.round1 
                        ? 'Successfully completed Round 1 - Found the hidden link!'
                        : 'Complete Round 1 to unlock this achievement'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 