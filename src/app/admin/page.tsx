'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUsers, FaSignOutAlt, FaLock, FaPlay, FaStop, FaCheckCircle, FaTimesCircle, FaTrash, FaRedo, FaBan, FaTrophy, FaThumbsDown, FaClock, FaPause } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface GameStatus {
  isStarted: boolean;
  startTime?: string;
  timerStartedAt: number | null;
  timerPausedAt: number | null;
  isTimerRunning: boolean;
  timerDuration: number;
}

interface Team {
  id: string;
  name: string;
  members?: string[];
  completedRounds?: {
    round1: boolean;
    round2: boolean;
    round3: boolean;
  };
  score?: number;
  lastActive?: string;
  disqualified?: boolean;
  isWinner?: boolean;
  isLoser?: boolean;
}

export default function AdminPanel() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>({ isStarted: false });
  const [resetConfirm, setResetConfirm] = useState(false);
  const [disqualifyTeamId, setDisqualifyTeamId] = useState<string | null>(null);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);

  // Admin credentials
  const ADMIN_PASSWORD = 'vishal@#7798';
  
  useEffect(() => {
    // Check if admin is already logged in
    const checkAuth = () => {
      const adminAuth = localStorage.getItem('admin_auth');
      if (adminAuth === 'true') {
        setIsAuthenticated(true);
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Initial fetch of both game status and teams
      fetchGameStatus();
      fetchTeams();
      
      // Set up polling interval for game status (every 1 second for timer)
      const statusInterval = setInterval(fetchGameStatus, 1000);
      
      // Set up less frequent polling for teams
      const teamsInterval = setInterval(fetchTeams, 15000);
      
      // Cleanup intervals on component unmount
      return () => {
        clearInterval(statusInterval);
        clearInterval(teamsInterval);
      };
    }
  }, [isAuthenticated]);

  const fetchTeams = async () => {
    setTeamsLoading(true);
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchGameStatus = async () => {
    try {
      const response = await fetch('/api/admin/game-status');
      if (response.ok) {
        const data = await response.json();
        console.log("[Admin] Fetched game status:", data);
        setGameStatus(data);
      }
    } catch (error) {
      console.error('Error fetching game status:', error);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
  };

  const handleStartGame = async () => {
    try {
      const response = await fetch('/api/admin/game-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isStarted: true })
      });

      if (!response.ok) {
        throw new Error('Failed to start game');
      }

      const data = await response.json();
      setGameStatus(data);
      toast.success('Game started successfully!');
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game');
    }
  };

  const handleStopGame = async () => {
    try {
      const response = await fetch('/api/admin/game-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isStarted: false })
      });

      if (!response.ok) {
        throw new Error('Failed to stop game');
      }

      const data = await response.json();
      setGameStatus(data);
      toast.success('Game stopped successfully!');
    } catch (error) {
      console.error('Error stopping game:', error);
      toast.error('Failed to stop game');
    }
  };

  const handleResetGame = async () => {
    try {
      if (!resetConfirm) {
        setResetConfirm(true);
        return;
      }

      setResetConfirm(false);
      
      // Stop the game first
      await fetch('/api/admin/game-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isStarted: false })
      });
      
      // Reset all team progress
      const response = await fetch('/api/admin/reset-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reset game');
      }

      // Refresh team data
      const teamsResponse = await fetch('/api/teams');
      if (teamsResponse.ok) {
        const data = await teamsResponse.json();
        setTeams(data.teams || []);
      }
      
      setGameStatus({ isStarted: false });
      toast.success('Game reset successfully!');
    } catch (error) {
      console.error('Error resetting game:', error);
      toast.error('Failed to reset game');
    }
  };

  const handleDisqualifyTeam = async (teamId: string) => {
    try {
      if (disqualifyTeamId === teamId) {
        // Confirmed disqualification
        const response = await fetch('/api/admin/disqualify-team', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ teamId })
        });

        if (!response.ok) {
          throw new Error('Failed to disqualify team');
        }

        // Update local state
        setTeams(prevTeams => 
          prevTeams.map(team => 
            team.id === teamId 
              ? { ...team, disqualified: true } 
              : team
          )
        );
        
        toast.success('Team has been disqualified');
        setDisqualifyTeamId(null);
      } else {
        // Ask for confirmation
        setDisqualifyTeamId(teamId);
        // Clear any other confirmations
        setDeleteTeamId(null);
      }
    } catch (error) {
      console.error('Error disqualifying team:', error);
      toast.error('Failed to disqualify team');
      setDisqualifyTeamId(null);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      const response = await fetch(`/api/teams?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the team from local state
        setTeams(teams.filter(team => team.id !== id));
        setDeleteTeamId(null);
        toast.success('Team deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('Error deleting team:', errorData);
        toast.error(`Failed to delete team: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('An error occurred while deleting the team');
    }
  };

  const handleCancelDisqualify = () => {
    setDisqualifyTeamId(null);
  };

  const handleCancelDelete = () => {
    setDeleteTeamId(null);
  };

  const handleConfirmDelete = (id: string) => {
    setDeleteTeamId(id);
  };

  const handleCancelReset = () => {
    setResetConfirm(false);
  };

  const handleStartTimer = async () => {
    try {
      const response = await fetch('/api/admin/game-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startTimer: true })
      });

      if (!response.ok) {
        throw new Error('Failed to start timer');
      }

      const data = await response.json();
      setGameStatus(data);
      toast.success('Timer started successfully!');
    } catch (error) {
      console.error('Error starting timer:', error);
      toast.error('Failed to start timer');
    }
  };

  const handlePauseTimer = async () => {
    try {
      const response = await fetch('/api/admin/game-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pauseTimer: true })
      });

      if (!response.ok) {
        throw new Error('Failed to pause timer');
      }

      const data = await response.json();
      setGameStatus(data);
      toast.success('Timer paused successfully!');
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast.error('Failed to pause timer');
    }
  };

  const handleResetTimer = async () => {
    try {
      const response = await fetch('/api/admin/game-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetTimer: true })
      });

      if (!response.ok) {
        throw new Error('Failed to reset timer');
      }

      const data = await response.json();
      setGameStatus(data);
      toast.success('Timer reset successfully!');
    } catch (error) {
      console.error('Error resetting timer:', error);
      toast.error('Failed to reset timer');
    }
  };

  // Login page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700"
        >
          <div className="text-center mb-6">
            <FaLock className="text-blue-400 text-4xl mx-auto mb-3" />
            <h1 className="text-2xl font-bold">Admin Access</h1>
            <p className="text-gray-400 mt-2">Enter your password to access the admin panel</p>
          </div>
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="password" className="block mb-2 font-medium">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-white"
                placeholder="Enter admin password"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold"
            >
              Login
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white"
            >
              Return to Homepage
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // Simplified Admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold">HTTPS Find Admin</h1>
            <p className="text-gray-400">Manage your treasure hunt game</p>
          </motion.div>
          
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center"
          >
            <FaSignOutAlt className="mr-2" /> Logout
          </motion.button>
        </div>
        
        {/* Game Control - Now with timer controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Game Control</h2>
            
            <div className="flex space-x-3">
              {!gameStatus.isStarted ? (
                <button
                  onClick={handleStartGame}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center"
                >
                  <FaPlay className="mr-2" /> Start Game
                </button>
              ) : (
                <button
                  onClick={handleStopGame}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center"
                >
                  <FaStop className="mr-2" /> Stop Game
                </button>
              )}
              
              {resetConfirm ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleResetGame}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-bold flex items-center"
                  >
                    <FaRedo className="mr-2" /> Confirm Reset
                  </button>
                  <button
                    onClick={handleCancelReset}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg flex items-center"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleResetGame}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-bold flex items-center"
                >
                  <FaRedo className="mr-2" /> Reset Game
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Reset will clear all team progress and scores. This action cannot be undone.
          </p>
          
          {/* Timer Controls */}
          <div className="mt-6 border-t border-gray-700 pt-4">
            <h3 className="text-xl font-bold flex items-center mb-4">
              <FaClock className="mr-2 text-blue-400" /> Timer Controls
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                {!gameStatus.isTimerRunning ? (
                  <button
                    onClick={handleStartTimer}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
                  >
                    <FaPlay className="mr-2" /> Start Timer
                  </button>
                ) : (
                  <button
                    onClick={handlePauseTimer}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex items-center"
                  >
                    <FaPause className="mr-2" /> Pause Timer
                  </button>
                )}
                
                <button
                  onClick={handleResetTimer}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center"
                >
                  <FaRedo className="mr-2" /> Reset Timer
                </button>
              </div>
              
              <div className="bg-gray-900 px-4 py-2 rounded-lg font-mono text-2xl">
                {formatTimerDisplay(gameStatus)}
              </div>
            </div>
            
            <p className="text-gray-400 text-sm mt-2">
              The timer will be displayed to all players when active. Players will see a 10-minute countdown.
            </p>
          </div>
        </motion.div>
        
        {/* Team List - With disqualification and delete options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FaUsers className="text-blue-400 text-3xl mr-4" />
              <h2 className="text-2xl font-bold">Teams</h2>
            </div>
            <div className="text-gray-400">
              {teams.length} {teams.length === 1 ? 'team' : 'teams'} registered
            </div>
          </div>
          
          {teamsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(team => (
                <div 
                  key={team.id}
                  className="bg-gray-700 rounded-lg p-5 mb-4 relative"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold">
                          {team.disqualified && <span className="text-red-500 mr-2">⛔</span>}
                          {team.isWinner && <span className="text-yellow-500 mr-2">🏆</span>}
                          {team.isLoser && <span className="text-gray-500 mr-2">👎</span>}
                          {team.name}
                        </h3>
                        
                        {team.disqualified && (
                          <span className="ml-3 bg-red-900/50 text-red-300 text-xs px-2 py-0.5 rounded">
                            Disqualified
                          </span>
                        )}
                        
                        {team.isWinner && (
                          <span className="ml-3 bg-yellow-900/50 text-yellow-300 text-xs px-2 py-0.5 rounded">
                            Winner
                          </span>
                        )}
                        
                        {team.isLoser && (
                          <span className="ml-3 bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded">
                            Loser
                          </span>
                        )}
                      </div>
                      
                      {/* Score display */}
                      <div className="mt-1 text-sm text-blue-300">
                        Score: {team.score || 0} points
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {/* Status toggles */}
                      <div className="flex space-x-2 mr-4">
                        <div 
                          className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center ${team.isWinner ? 'bg-yellow-500 border-yellow-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/admin/update-team-status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ teamId: team.id, isWinner: !team.isWinner })
                              });
                              if (response.ok) {
                                toast.success(`Team ${!team.isWinner ? 'marked as winner' : 'unmarked as winner'}`);
                                // Refresh teams data after update
                                fetchTeams();
                              }
                            } catch (error) {
                              console.error('Error updating team status:', error);
                              toast.error('Failed to update team status');
                            }
                          }}
                          title="Toggle Winner Status"
                        >
                          {team.isWinner && <FaTrophy className="text-white text-xs" />}
                        </div>
                        
                        <div 
                          className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center ${team.isLoser ? 'bg-gray-500 border-gray-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/admin/update-team-status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ teamId: team.id, isLoser: !team.isLoser })
                              });
                              if (response.ok) {
                                toast.success(`Team ${!team.isLoser ? 'marked as loser' : 'unmarked as loser'}`);
                                // Refresh teams data after update
                                fetchTeams();
                              }
                            } catch (error) {
                              console.error('Error updating team status:', error);
                              toast.error('Failed to update team status');
                            }
                          }}
                          title="Toggle Loser Status"
                        >
                          {team.isLoser && <FaThumbsDown className="text-white text-xs" />}
                        </div>
                        
                        <div 
                          className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center ${team.disqualified ? 'bg-red-500 border-red-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/admin/update-team-status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ teamId: team.id, disqualified: !team.disqualified })
                              });
                              if (response.ok) {
                                toast.success(`Team ${!team.disqualified ? 'disqualified' : 'requalified'}`);
                                // Refresh teams data after update
                                fetchTeams();
                              }
                            } catch (error) {
                              console.error('Error updating team status:', error);
                              toast.error('Failed to update team status');
                            }
                          }}
                          title="Toggle Disqualification"
                        >
                          {team.disqualified && <FaBan className="text-white text-xs" />}
                        </div>
                      </div>
                      
                      {/* Disqualify button (original one) - hiding this since we have a toggle now */}
                      <div className="hidden">
                        {disqualifyTeamId === team.id ? (
                          <div className="flex space-x-1 ml-2">
                            <button 
                              onClick={() => handleDisqualifyTeam(team.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={handleCancelDisqualify}
                              className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleDisqualifyTeam(team.id)}
                            className={`text-${team.disqualified ? 'green' : 'red'}-400 hover:text-${team.disqualified ? 'green' : 'red'}-300`}
                            title={team.disqualified ? 'Requalify Team' : 'Disqualify Team'}
                          >
                            {team.disqualified ? <FaCheckCircle size={16} /> : <FaBan size={16} />}
                          </button>
                        )}
                      </div>
                      
                      {/* Delete button */}
                      {deleteTeamId === team.id ? (
                        <div className="flex space-x-1 ml-2">
                          <button 
                            onClick={() => handleDeleteTeam(team.id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                          >
                            Delete
                          </button>
                          <button 
                            onClick={handleCancelDelete}
                            className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleConfirmDelete(team.id)}
                          className="text-gray-400 hover:text-red-400 ml-2"
                          title="Delete Team"
                        >
                          <FaTrash size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Show members if available */}
                  {team.members && team.members.length > 0 && (
                    <div className="mt-3 mb-3">
                      <p className="text-gray-400 text-sm mb-1">Members:</p>
                      <div className="flex flex-wrap gap-1">
                        {team.members.map((member, index) => (
                          <span 
                            key={index}
                            className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs"
                          >
                            {member}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Show completed rounds if available */}
                  {team.completedRounds && (
                    <div className="mt-3">
                      <p className="text-gray-400 text-sm mb-1">Progress:</p>
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        <div className="flex items-center">
                          <span className="mr-1">R1:</span>
                          {team.completedRounds.round1 ? (
                            <FaCheckCircle className="text-green-500" />
                          ) : (
                            <FaTimesCircle className="text-gray-500" />
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="mr-1">R2:</span>
                          {team.completedRounds.round2 ? (
                            <FaCheckCircle className="text-green-500" />
                          ) : (
                            <FaTimesCircle className="text-gray-500" />
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="mr-1">R3:</span>
                          {team.completedRounds.round3 ? (
                            <FaCheckCircle className="text-green-500" />
                          ) : (
                            <FaTimesCircle className="text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-300 mt-3 pt-2 border-t border-gray-600">
                    <div className="flex justify-between items-center">
                      <span>ID:</span>
                      <span className="text-gray-400 truncate max-w-[120px]" title={team.id}>{team.id}</span>
                    </div>
                    
                    {/* Show last active time if available */}
                    {team.lastActive && (
                      <div className="flex justify-between items-center mt-1">
                        <span>Last active:</span>
                        <span className="text-gray-400">{new Date(team.lastActive).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-700/50 rounded-lg p-8 text-center">
              <p className="text-gray-400 text-lg mb-2">No teams registered yet.</p>
              <p className="text-gray-500 text-sm">Teams will appear here once they register.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function formatTimerDisplay(gameStatus: GameStatus) {
  // If timer not started or explicitly reset, show initial time
  if (!gameStatus.timerStartedAt) {
    const minutes = Math.floor(gameStatus.timerDuration / 60000);
    const seconds = Math.floor((gameStatus.timerDuration % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Calculate remaining time
  const currentTime = gameStatus.timerPausedAt || Date.now();
  const elapsed = currentTime - gameStatus.timerStartedAt;
  const remaining = Math.max(0, gameStatus.timerDuration - elapsed);
  
  // Format as MM:SS
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
} 