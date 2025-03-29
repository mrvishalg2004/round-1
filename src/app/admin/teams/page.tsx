'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaEdit, FaTrophy, FaTrash, FaSearch, FaFilter, FaUserPlus, FaThumbsDown, FaBan } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface Team {
  id: string;
  name: string;
  members: Array<{ name: string; email: string; } | string>;
  completedRounds: {
    round1: boolean;
    round2: boolean;
    round3: boolean;
  };
  score: number;
  createdAt: string;
  lastActive?: string;
  disqualified?: boolean;
  isWinner?: boolean;
  isLoser?: boolean;
}

export default function TeamsAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingTeam, setUpdatingTeam] = useState<string | null>(null);

  useEffect(() => {
    // Check if admin is authenticated
    const adminAuth = localStorage.getItem('admin_auth');
    if (adminAuth !== 'true') {
      router.push('/admin');
      return;
    }

    // Fetch teams data
    fetchTeams();
  }, [router]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teams');
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.teams && Array.isArray(data.teams)) {
        setTeams(data.teams);
      } else {
        console.log('No teams data in response or invalid format');
        setTeams([]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter teams based on search term and filter status
  const filteredTeams = teams.filter(team => {
    console.log('Team status:', team.id, { 
      isWinner: team.isWinner, 
      isLoser: team.isLoser, 
      disqualified: team.disqualified 
    });
    
    const matchesSearch = 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      team.members.some(member => {
        if (typeof member === 'string') {
          return member.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return member.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    
    if (filterStatus === 'all') {
      return matchesSearch;
    } else if (filterStatus === 'completed') {
      return matchesSearch && team.completedRounds.round3;
    } else if (filterStatus === 'in-progress') {
      return matchesSearch && (team.completedRounds.round1 || team.completedRounds.round2) && !team.completedRounds.round3;
    } else if (filterStatus === 'not-started') {
      return matchesSearch && !team.completedRounds.round1;
    }
    
    return matchesSearch;
  });

  // Handle team status updates
  const handleStatusChange = async (teamId: string, field: 'isWinner' | 'isLoser' | 'disqualified', value: boolean) => {
    // Don't allow multiple concurrent updates for the same team
    if (updatingTeam === teamId) return;
    
    console.log(`Changing ${field} to ${value} for team ${teamId}`);
    
    // Optimistically update the UI
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === teamId 
          ? { ...team, [field]: value } 
          : field === 'isWinner' && value && team.isWinner 
            ? { ...team, isWinner: false } // If setting a new winner, unset other winners
            : team
      )
    );
    
    setUpdatingTeam(teamId);
    try {
      // Create update data based on the field being changed
      const updateData: any = {
        teamId,
      };
      
      updateData[field] = value;
      
      console.log('Sending update data:', updateData);
      
      // Send the status update
      const response = await fetch('/api/admin/update-team-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      const result = await response.json();
      console.log('Update result:', result);
      
      if (result.success) {
        toast.success(`Team ${value ? 'marked' : 'unmarked'} as ${field === 'isWinner' ? 'winner' : field === 'isLoser' ? 'loser' : 'disqualified'}`);
        // Update the specific team with the returned data
        if (result.team) {
          setTeams(prevTeams => 
            prevTeams.map(team => 
              team.id === teamId ? { ...team, ...result.team } : team
            )
          );
        } else {
          // Refresh all teams if no specific team data returned
          fetchTeams();
        }
      } else {
        // Revert optimistic update on error
        fetchTeams();
        toast.error(`Failed to update team status: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating team status:', error);
      // Revert optimistic update on error
      fetchTeams();
      toast.error('Failed to update team status');
    } finally {
      setUpdatingTeam(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center mr-4"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <h1 className="text-3xl font-bold">Manage Teams</h1>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="relative w-full md:w-1/3 mb-4 md:mb-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded pl-10 pr-4 py-2 w-full text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <FaFilter className="text-gray-400 mr-2" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Teams</option>
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="not-started">Not Started</option>
                </select>
              </div>
              
              <button
                onClick={() => router.push('/admin/teams/new')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
              >
                <FaUserPlus className="mr-2" /> Add Team
              </button>
            </div>
          </div>
          
          {filteredTeams.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No teams found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-700 text-left">
                    <th className="px-4 py-3 rounded-tl-lg">Team Name</th>
                    <th className="px-4 py-3">Members</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team, index) => (
                    <motion.tr
                      key={team.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`border-t border-gray-700 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}`}
                    >
                      <td className="px-4 py-3 font-semibold">
                        {team.disqualified && <span className="text-red-500 mr-2">⛔</span>}
                        {team.isWinner && <span className="text-yellow-500 mr-2">🏆</span>}
                        {team.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {team.members.map((member, i) => (
                            <span 
                              key={i} 
                              className="bg-gray-700 px-2 py-1 rounded text-xs"
                            >
                              {typeof member === 'string' ? member : member.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-600 rounded-full h-2.5">
                            <div 
                              className="bg-blue-500 h-2.5 rounded-full" 
                              style={{ 
                                width: `${(Object.values(team.completedRounds).filter(Boolean).length / 3) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs">
                            {Object.values(team.completedRounds).filter(Boolean).length}/3
                          </span>
                        </div>
                        <div className="flex space-x-1 mt-2">
                          <div className={`h-2 w-2 rounded-full ${team.completedRounds.round1 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                          <div className={`h-2 w-2 rounded-full ${team.completedRounds.round2 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                          <div className={`h-2 w-2 rounded-full ${team.completedRounds.round3 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">{team.score} pts</td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(team.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center">
                            <div 
                              className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center mr-2 ${team.isWinner ? 'bg-yellow-500 border-yellow-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                              onClick={() => handleStatusChange(team.id, 'isWinner', !team.isWinner)}
                            >
                              {team.isWinner && <FaTrophy className="text-white text-xs" />}
                            </div>
                            <span className="text-sm flex items-center">
                              <FaTrophy className="text-yellow-500 mr-1" /> Winner
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <div 
                              className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center mr-2 ${team.isLoser ? 'bg-gray-500 border-gray-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                              onClick={() => handleStatusChange(team.id, 'isLoser', !team.isLoser)}
                            >
                              {team.isLoser && <FaThumbsDown className="text-white text-xs" />}
                            </div>
                            <span className="text-sm flex items-center">
                              <FaThumbsDown className="text-gray-500 mr-1" /> Loser
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <div 
                              className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center mr-2 ${team.disqualified ? 'bg-red-500 border-red-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                              onClick={() => handleStatusChange(team.id, 'disqualified', !team.disqualified)}
                            >
                              {team.disqualified && <FaBan className="text-white text-xs" />}
                            </div>
                            <span className="text-sm flex items-center">
                              <FaBan className="text-red-500 mr-1" /> Disqualify
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => router.push(`/admin/teams/edit/${team.id}`)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                          title="Edit Team"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this team?')) {
                              fetch(`/api/teams?id=${team.id}`, { method: 'DELETE' })
                                .then(res => res.json())
                                .then(data => {
                                  if (data.success) {
                                    fetchTeams();
                                    toast.success('Team deleted successfully');
                                  } else {
                                    toast.error('Failed to delete team');
                                  }
                                });
                            }
                          }}
                          className="text-red-400 hover:text-red-300"
                          title="Delete Team"
                        >
                          <FaTrash size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
        >
          <h2 className="text-xl font-bold mb-4">Team Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-xl font-bold text-blue-400">{teams.length}</div>
              <div className="text-sm text-gray-400">Total Teams</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-xl font-bold text-green-400">{teams.filter(team => team.completedRounds.round3).length}</div>
              <div className="text-sm text-gray-400">Completed All Rounds</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-xl font-bold text-yellow-400">{teams.filter(team => team.completedRounds.round1 || team.completedRounds.round2).length}</div>
              <div className="text-sm text-gray-400">In Progress</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-xl font-bold text-purple-400">{Math.max(...teams.map(team => team.score))}</div>
              <div className="text-sm text-gray-400">Highest Score</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 