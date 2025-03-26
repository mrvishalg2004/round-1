'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUsers, FaSignOutAlt, FaLock, FaPlay, FaStop, FaCheckCircle, FaTimesCircle, FaTrash, FaRedo, FaBan } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface GameStatus {
  isStarted: boolean;
  startTime?: string;
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
      // Fetch game status
      const fetchGameStatus = async () => {
        try {
          const response = await fetch('/api/admin/game-status');
          if (response.ok) {
            const data = await response.json();
            setGameStatus(data);
          }
        } catch (error) {
          console.error('Error fetching game status:', error);
        }
      };

      // Fetch teams
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

      fetchGameStatus();
      fetchTeams();
    }
  }, [isAuthenticated]);

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

  const handleDeleteTeam = async (teamId: string) => {
    try {
      if (deleteTeamId === teamId) {
        // Confirmed deletion
        const response = await fetch(`/api/teams?id=${teamId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete team');
        }

        // Remove from local state
        setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
        
        toast.success('Team deleted successfully');
        setDeleteTeamId(null);
      } else {
        // Ask for confirmation
        setDeleteTeamId(teamId);
        // Clear any other confirmations
        setDisqualifyTeamId(null);
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
      setDeleteTeamId(null);
    }
  };

  const handleCancelDisqualify = () => {
    setDisqualifyTeamId(null);
  };

  const handleCancelDelete = () => {
    setDeleteTeamId(null);
  };

  const handleCancelReset = () => {
    setResetConfirm(false);
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
        
        {/* Game Control - Now with reset game button */}
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
          <p className="text-gray-400 text-sm">
            Reset will clear all team progress and scores. This action cannot be undone.
          </p>
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
                  className={`bg-gray-700 p-5 rounded-lg hover:bg-gray-600 transition-colors border ${team.disqualified ? 'border-red-600' : 'border-gray-600'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-medium text-xl ${team.disqualified ? 'text-red-300 line-through' : 'text-blue-300'}`}>
                      {team.name}
                    </h3>
                    <div className="flex space-x-2">
                      {/* Disqualify button */}
                      {team.disqualified ? (
                        <span className="bg-red-900 text-red-200 text-xs px-2 py-1 rounded-full">Disqualified</span>
                      ) : disqualifyTeamId === team.id ? (
                        <div className="flex space-x-1">
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
                          className="text-gray-400 hover:text-red-400"
                          title="Disqualify Team"
                        >
                          <FaBan size={16} />
                        </button>
                      )}
                      
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
                          onClick={() => handleDeleteTeam(team.id)}
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